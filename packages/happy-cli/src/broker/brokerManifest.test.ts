import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  getBrokerInstancesDir,
  loadBrokerManifestConnections,
  toBrokerUrl,
} from './brokerManifest';

describe('brokerManifest', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it('loads all per-instance manifests from the vscode instances directory', async () => {
    const happyHomeDir = await mkdtemp(join(tmpdir(), 'happy-broker-manifest-'));
    tempDirs.push(happyHomeDir);
    const instancesDir = getBrokerInstancesDir(happyHomeDir);
    await mkdir(instancesDir, { recursive: true });

    await writeFile(
      join(instancesDir, 'instance-1.json'),
      JSON.stringify({
        installationId: 'install-1',
        instanceId: 'instance-1',
        logicalWindowKey: 'window-1',
        windowLabel: 'api',
        workspaceFolders: ['/workspace/api'],
        runtimeKind: 'ssh',
        runtimeLabel: 'ssh:gpu-1',
        bridgeHostIps: ['10.0.0.2'],
        providerKinds: ['codex'],
        brokerEndpoint: 'ws://127.0.0.1:7001',
        brokerAuthToken: 'token-1',
        pid: 1,
        startedAt: 1,
        lastHeartbeatAt: 2,
        ttlMs: 10_000,
      }),
      'utf8',
    );
    await writeFile(
      join(instancesDir, 'instance-2.json'),
      JSON.stringify({
        installationId: 'install-2',
        instanceId: 'instance-2',
        logicalWindowKey: 'window-2',
        windowLabel: 'web',
        workspaceFolders: ['/workspace/web'],
        runtimeKind: 'local',
        runtimeLabel: 'local',
        bridgeHostIps: ['192.168.1.30'],
        providerKinds: ['claude'],
        brokerEndpoint: 'ws://127.0.0.1:7002',
        brokerAuthToken: 'token-2',
        pid: 2,
        startedAt: 1,
        lastHeartbeatAt: 2,
        ttlMs: 10_000,
      }),
      'utf8',
    );

    const connections = await loadBrokerManifestConnections(happyHomeDir);

    expect(connections).toHaveLength(2);
    expect(connections.map((item) => item.manifest.instanceId).sort()).toEqual([
      'instance-1',
      'instance-2',
    ]);
    expect(connections[0]?.brokerUrl).toContain('?token=');
  });

  it('builds a broker url from endpoint and auth token', () => {
    expect(
      toBrokerUrl({
        brokerEndpoint: 'ws://127.0.0.1:7777',
        brokerAuthToken: 'secret',
      }),
    ).toBe('ws://127.0.0.1:7777?token=secret');
  });
});
