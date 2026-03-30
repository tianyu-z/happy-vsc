import { describe, expect, it, vi } from 'vitest';

import { BrokerInventoryManager } from './BrokerInventoryManager';
import type { BrokerDiscoveredSession } from './brokerTypes';
import type { BrokerManifestConnection } from './brokerManifest';
import type { BrokerInstanceManifest } from '../../../happy-wire/src/brokerProtocol';

function makeRuntimeMetadata() {
  return {
    desiredMode: 'runtime_preferred' as const,
    effectiveMode: 'runtime' as const,
    modeReason: 'runtime_ready',
    compatibility: 'supported' as const,
    providerExtension: {
      id: 'openai.chatgpt',
      version: '1.0.0',
    },
    probeHealth: {
      runtime: 'ready' as const,
      storage: 'ready' as const,
    },
  };
}

function makeManifest(overrides: Partial<{
  installationId: string;
  instanceId: string;
  logicalWindowKey: string;
  windowLabel: string;
  workspaceFolders: string[];
  runtimeKind: 'local' | 'ssh';
  runtimeLabel: string;
  bridgeHostIps: string[];
  brokerEndpoint: string;
  brokerAuthToken: string;
  pid: number;
  startedAt: number;
  lastHeartbeatAt: number;
  ttlMs: number;
}> = {}): BrokerInstanceManifest {
  return {
    installationId: overrides.installationId ?? 'install-1',
    instanceId: overrides.instanceId ?? 'instance-1',
    logicalWindowKey: overrides.logicalWindowKey ?? 'window-1',
    windowLabel: overrides.windowLabel ?? 'api',
    workspaceFolders: overrides.workspaceFolders ?? ['/workspace/api'],
    runtimeKind: overrides.runtimeKind ?? 'ssh',
    runtimeLabel: overrides.runtimeLabel ?? 'ssh:gpu-1',
    bridgeHostIps: overrides.bridgeHostIps ?? ['10.0.0.2'],
    providerKinds: ['codex'],
    brokerEndpoint: overrides.brokerEndpoint ?? 'ws://127.0.0.1:7001',
    brokerAuthToken: overrides.brokerAuthToken ?? 'token-1',
    pid: overrides.pid ?? 1234,
    startedAt: overrides.startedAt ?? 1,
    lastHeartbeatAt: overrides.lastHeartbeatAt ?? 19_000,
    ttlMs: overrides.ttlMs ?? 10_000,
  };
}

function makeConnection(overrides: Parameters<typeof makeManifest>[0] = {}): BrokerManifestConnection {
  const manifest = makeManifest(overrides);
  return {
    manifestPath: `/tmp/${manifest.instanceId}.json`,
    manifest,
    brokerUrl: `${manifest.brokerEndpoint}?token=${manifest.brokerAuthToken}`,
  };
}

function makeDiscoveredSession(
  overrides: Partial<BrokerDiscoveredSession> = {},
): BrokerDiscoveredSession {
  return {
    brokerSessionId: overrides.brokerSessionId ?? 'sess-1',
    provider: overrides.provider ?? 'codex',
    title: overrides.title ?? 'Fix API',
    attachability: overrides.attachability ?? 'attachable',
    capabilities: overrides.capabilities ?? ['sendUserMessage'],
    degradedFlags: overrides.degradedFlags ?? [],
    ...makeRuntimeMetadata(),
    ...overrides,
  };
}

describe('BrokerInventoryManager', () => {
  it('marks older duplicate windows as shadowed and keeps only the freshest sessions active', async () => {
    const discoverSessions = vi
      .fn()
      .mockResolvedValueOnce([makeDiscoveredSession()]);

    const manager = new BrokerInventoryManager({
      machineId: 'machine-1',
      now: () => 20_000,
      loadConnections: async () => [
        makeConnection({
          instanceId: 'instance-new',
          lastHeartbeatAt: 19_500,
          brokerEndpoint: 'ws://127.0.0.1:7001',
        }),
        makeConnection({
          instanceId: 'instance-old',
          lastHeartbeatAt: 19_000,
          brokerEndpoint: 'ws://127.0.0.1:7002',
        }),
      ],
      createClient: () => ({
        discoverSessions,
      }),
    });

    const summary = await manager.buildSummary();

    expect(summary.instances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instanceId: 'instance-new',
          status: 'online',
        }),
        expect.objectContaining({
          instanceId: 'instance-old',
          status: 'shadowed',
        }),
      ]),
    );
    expect(summary.sessions).toEqual([
      expect.objectContaining({
        canonicalSessionKey: 'machine-1:instance-new:sess-1',
        instanceId: 'instance-new',
        brokerSessionId: 'sess-1',
      }),
    ]);
    expect(discoverSessions).toHaveBeenCalledTimes(1);
  });

  it('best-effort cleans manifests that have been stale for too long', async () => {
    const deleteManifest = vi.fn(async () => {});

    const manager = new BrokerInventoryManager({
      machineId: 'machine-1',
      now: () => 70_500,
      loadConnections: async () => [
        makeConnection({
          instanceId: 'stale-instance',
          lastHeartbeatAt: 1_000,
          brokerEndpoint: 'ws://127.0.0.1:7001',
        }),
      ],
      createClient: () => ({
        discoverSessions: vi.fn(),
      }),
      deleteManifest,
    });

    const summary = await manager.buildSummary();

    expect(deleteManifest).toHaveBeenCalledWith('/tmp/stale-instance.json');
    expect(summary.instances).toEqual([]);
    expect(summary.sessions).toEqual([]);
  });

  it('resolves attach routing for a selected broker session', async () => {
    const manager = new BrokerInventoryManager({
      machineId: 'machine-1',
      now: () => 20_000,
      loadConnections: async () => [
        makeConnection({
          instanceId: 'instance-new',
          lastHeartbeatAt: 19_500,
        }),
      ],
      createClient: () => ({
        discoverSessions: vi.fn(async () => [makeDiscoveredSession()]),
      }),
    });

    const target = await manager.resolveAttachTarget({
      instanceId: 'instance-new',
      brokerSessionId: 'sess-1',
    });

    expect(target).toMatchObject({
      canonicalSessionKey: 'machine-1:instance-new:sess-1',
      brokerUrl: 'ws://127.0.0.1:7001?token=token-1',
      instanceId: 'instance-new',
      brokerSessionId: 'sess-1',
    });
  });
});
