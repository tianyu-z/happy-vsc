import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { BrokerDiscoveredSession } from './brokerTypes';
import {
  loadBrokerManifest,
  loadBrokerManifests,
  type BrokerManifestConnection,
} from './brokerManifest';
import {
  discoverBrokerSessionCatalog,
  resolveBrokerSessionAttachTarget,
} from './brokerSessionCatalog';

function makeSession(id: string): BrokerDiscoveredSession {
  return {
    brokerSessionId: id,
    provider: 'claude',
    title: `Session ${id}`,
    attachability: 'attachable',
    capabilities: ['sendUserMessage'],
    degradedFlags: [],
    desiredMode: 'runtime_preferred',
    effectiveMode: 'runtime',
    modeReason: 'runtime_ready',
    compatibility: 'supported',
    providerExtension: {
      id: 'anthropic.claude-code',
      version: '1.0.0',
    },
    probeHealth: {
      runtime: 'ready',
      storage: 'ready',
    },
  };
}

describe('brokerSessionCatalog', () => {
  it('loads manifests from broker/instances first', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'happy-broker-manifests-'));
    await mkdir(join(rootDir, 'broker', 'instances'), { recursive: true });
    await writeFile(
      join(rootDir, 'broker', 'instance.json'),
      JSON.stringify({ port: 40200, token: 'legacy-token' }),
      'utf8',
    );
    await writeFile(
      join(rootDir, 'broker', 'instances', 'window-a.json'),
      JSON.stringify({
        port: 40101,
        token: 'token-a',
        windowInstanceId: 'window-a',
        windowLabel: 'Window A',
        workspaceLabel: 'Workspace A',
        workspacePath: '/workspace-a',
        isActiveWindow: true,
        windowLastActiveAt: '2026-03-22T00:00:00.000Z',
      }),
      'utf8',
    );

    const manifests = await loadBrokerManifests(rootDir);

    expect(manifests).toHaveLength(1);
    expect(manifests[0]).toMatchObject({
      port: 40101,
      windowInstanceId: 'window-a',
    });

    await rm(rootDir, { recursive: true, force: true });
  });

  it('falls back to broker/instance.json when instances directory does not exist', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'happy-broker-manifests-'));
    await mkdir(join(rootDir, 'broker'), { recursive: true });
    await writeFile(
      join(rootDir, 'broker', 'instance.json'),
      JSON.stringify({ port: 40200, token: 'legacy-token' }),
      'utf8',
    );

    const manifests = await loadBrokerManifests(rootDir);

    expect(manifests).toHaveLength(1);
    expect(manifests[0]).toMatchObject({
      port: 40200,
      token: 'legacy-token',
      windowInstanceId: 'default-window',
      workspaceLabel: 'No Workspace',
    });

    await rm(rootDir, { recursive: true, force: true });
  });

  it('loadBrokerManifest keeps compatibility alias semantics', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'happy-broker-manifests-'));
    await mkdir(join(rootDir, 'broker', 'instances'), { recursive: true });
    await writeFile(
      join(rootDir, 'broker', 'instance.json'),
      JSON.stringify({ port: 40200, token: 'legacy-token' }),
      'utf8',
    );
    await writeFile(
      join(rootDir, 'broker', 'instances', 'window-a.json'),
      JSON.stringify({
        port: 40101,
        token: 'token-a',
        windowInstanceId: 'window-a',
        windowLabel: 'Window A',
        workspaceLabel: 'Workspace A',
        workspacePath: '/workspace-a',
        isActiveWindow: true,
        windowLastActiveAt: '2026-03-22T00:00:00.000Z',
      }),
      'utf8',
    );

    const manifest = await loadBrokerManifest(rootDir);

    expect(manifest).toMatchObject({
      port: 40200,
      token: 'legacy-token',
      windowInstanceId: 'default-window',
    });

    await rm(rootDir, { recursive: true, force: true });
  });

  it('discovers sessions from every broker manifest and assigns window ordinal', async () => {
    const manifests: BrokerManifestConnection[] = [
      {
        port: 40101,
        token: 'token-a',
        url: 'ws://127.0.0.1:40101?token=token-a',
        windowInstanceId: 'window-a',
        windowLabel: 'Zulu',
        workspaceLabel: 'Workspace Z',
        workspacePath: '/workspace-z',
        isActiveWindow: false,
        windowLastActiveAt: '2026-03-20T00:00:00.000Z',
      },
      {
        port: 40102,
        token: 'token-b',
        url: 'ws://127.0.0.1:40102?token=token-b',
        windowInstanceId: 'window-b',
        windowLabel: 'Alpha',
        workspaceLabel: 'Workspace A',
        workspacePath: '/workspace-a',
        isActiveWindow: true,
        windowLastActiveAt: '2026-03-22T00:00:00.000Z',
      },
    ];
    const discoverByUrl = new Map<string, BrokerDiscoveredSession[]>([
      [manifests[0].url, [makeSession('sess-1')]],
      [manifests[1].url, [makeSession('sess-2')]],
    ]);

    const result = await discoverBrokerSessionCatalog('/broker-root', {
      loadManifests: vi.fn().mockResolvedValue(manifests),
      createBrokerClient: (url) => ({
        discoverSessions: vi.fn().mockResolvedValue(discoverByUrl.get(url) ?? []),
      }),
    });

    expect(result.sessions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          brokerSessionId: 'sess-2',
          brokerUrl: manifests[1].url,
          windowInstanceId: 'window-b',
          windowLabel: 'Alpha',
          workspaceLabel: 'Workspace A',
          windowOrdinal: 1,
        }),
        expect.objectContaining({
          brokerSessionId: 'sess-1',
          brokerUrl: manifests[0].url,
          windowInstanceId: 'window-a',
          windowLabel: 'Zulu',
          workspaceLabel: 'Workspace Z',
          windowOrdinal: 2,
        }),
      ]),
    );
  });

  it('skips unreachable broker manifests and keeps sessions from reachable windows', async () => {
    const manifests: BrokerManifestConnection[] = [
      {
        port: 40101,
        token: 'token-dead',
        url: 'ws://127.0.0.1:40101?token=token-dead',
        windowInstanceId: 'window-dead',
        windowLabel: 'Dead Window',
        workspaceLabel: 'Workspace Dead',
        workspacePath: '/workspace-dead',
        isActiveWindow: true,
        windowLastActiveAt: '2026-03-22T00:00:00.000Z',
      },
      {
        port: 40102,
        token: 'token-live',
        url: 'ws://127.0.0.1:40102?token=token-live',
        windowInstanceId: 'window-live',
        windowLabel: 'Live Window',
        workspaceLabel: 'Workspace Live',
        workspacePath: '/workspace-live',
        isActiveWindow: false,
        windowLastActiveAt: '2026-03-21T00:00:00.000Z',
      },
    ];

    const result = await discoverBrokerSessionCatalog('/broker-root', {
      loadManifests: vi.fn().mockResolvedValue(manifests),
      createBrokerClient: (url) => ({
        discoverSessions:
          url === manifests[0].url
            ? vi.fn().mockRejectedValue(Object.assign(new Error('connect ECONNREFUSED'), {
                code: 'ECONNREFUSED',
              }))
            : vi.fn().mockResolvedValue([makeSession('sess-live')]),
      }),
    });

    expect(result.sessions).toEqual([
      expect.objectContaining({
        brokerSessionId: 'sess-live',
        brokerUrl: manifests[1].url,
        windowInstanceId: 'window-live',
        windowOrdinal: 1,
      }),
    ]);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.manifest.windowInstanceId).toBe('window-live');
  });

  it('resolves a unique attach target', async () => {
    const manifest: BrokerManifestConnection = {
      port: 40101,
      token: 'token-a',
      url: 'ws://127.0.0.1:40101?token=token-a',
      windowInstanceId: 'window-a',
      windowLabel: 'Main',
      workspaceLabel: 'Workspace',
      workspacePath: '/workspace',
      isActiveWindow: true,
      windowLastActiveAt: '2026-03-22T00:00:00.000Z',
    };

    const catalog = await discoverBrokerSessionCatalog('/broker-root', {
      loadManifests: vi.fn().mockResolvedValue([manifest]),
      createBrokerClient: () => ({
        discoverSessions: vi.fn().mockResolvedValue([makeSession('sess-1')]),
      }),
    });

    const target = resolveBrokerSessionAttachTarget(catalog, 'sess-1');

    expect(target).toMatchObject({
      brokerUrl: manifest.url,
      brokerRootDir: '/broker-root',
      session: expect.objectContaining({ brokerSessionId: 'sess-1' }),
      manifest: expect.objectContaining({ windowInstanceId: 'window-a' }),
    });
  });

  it('fails attach resolution when duplicate broker session ids exist across windows', async () => {
    const manifests: BrokerManifestConnection[] = [
      {
        port: 40101,
        token: 'token-a',
        url: 'ws://127.0.0.1:40101?token=token-a',
        windowInstanceId: 'window-a',
        windowLabel: 'Main',
        workspaceLabel: 'Workspace A',
        workspacePath: '/workspace-a',
        isActiveWindow: true,
        windowLastActiveAt: '2026-03-22T00:00:00.000Z',
      },
      {
        port: 40102,
        token: 'token-b',
        url: 'ws://127.0.0.1:40102?token=token-b',
        windowInstanceId: 'window-b',
        windowLabel: 'Secondary',
        workspaceLabel: 'Workspace B',
        workspacePath: '/workspace-b',
        isActiveWindow: false,
        windowLastActiveAt: '2026-03-21T00:00:00.000Z',
      },
    ];

    const catalog = await discoverBrokerSessionCatalog('/broker-root', {
      loadManifests: vi.fn().mockResolvedValue(manifests),
      createBrokerClient: () => ({
        discoverSessions: vi.fn().mockResolvedValue([makeSession('duplicate-sess')]),
      }),
    });

    expect(() => resolveBrokerSessionAttachTarget(catalog, 'duplicate-sess')).toThrow(
      'Duplicate brokerSessionId "duplicate-sess" found across broker windows',
    );
  });
});
