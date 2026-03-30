import { describe, expect, it } from 'vitest';
import { BrokerManifestStore } from './BrokerManifestStore';
import { join } from 'path';
import { tmpdir } from 'os';
import { access, mkdtemp, rm } from 'fs/promises';

describe('BrokerManifestStore', () => {
  it('writes and reads a per-instance broker manifest', async () => {
    const root = await mkdtemp(join(tmpdir(), 'happy-vscode-bridge-store-'));
    const store = BrokerManifestStore.forInstance('instance-1', {
      happyHomeDir: root,
    });
    const manifest = {
      installationId: 'install-1',
      instanceId: 'instance-1',
      logicalWindowKey: 'window-1',
      editorSessionId: 'editor-1',
      windowLabel: 'api',
      workspaceFolders: ['/workspace/api'],
      runtimeKind: 'ssh' as const,
      runtimeLabel: 'ssh:gpu-1',
      bridgeHostIps: ['10.0.0.2'],
      preferredHostIp: '10.0.0.2',
      runtimeIp: '10.0.0.2',
      providerKinds: ['codex'] as const,
      brokerEndpoint: 'ws://127.0.0.1:40123',
      brokerAuthToken: 'secret',
      pid: 1234,
      startedAt: 1,
      lastHeartbeatAt: 2,
      ttlMs: 10_000,
    };
    await store.write(manifest);
    await expect(store.read()).resolves.toMatchObject({
      instanceId: 'instance-1',
      brokerEndpoint: 'ws://127.0.0.1:40123',
      brokerAuthToken: 'secret',
    });
    expect(store.getPath()).toBe(
      join(root, 'bridges', 'vscode', 'instances', 'instance-1.json'),
    );
    await rm(root, { recursive: true, force: true });
  });

  it('resolves to undefined when manifest does not exist', async () => {
    const root = await mkdtemp(join(tmpdir(), 'happy-vscode-bridge-store-'));
    const store = BrokerManifestStore.forInstance('missing-instance', {
      happyHomeDir: root,
    });
    await expect(store.read()).resolves.toBeUndefined();
    await rm(root, { recursive: true, force: true });
  });

  it('removes the manifest file on delete', async () => {
    const root = await mkdtemp(join(tmpdir(), 'happy-vscode-bridge-store-'));
    const store = BrokerManifestStore.forInstance('instance-1', {
      happyHomeDir: root,
    });
    await store.write({
      installationId: 'install-1',
      instanceId: 'instance-1',
      logicalWindowKey: 'window-1',
      windowLabel: 'api',
      workspaceFolders: ['/workspace/api'],
      runtimeKind: 'local',
      runtimeLabel: 'local',
      bridgeHostIps: [],
      providerKinds: ['claude'],
      brokerEndpoint: 'ws://127.0.0.1:40123',
      brokerAuthToken: 'secret',
      pid: 1234,
      startedAt: 1,
      lastHeartbeatAt: 2,
      ttlMs: 10_000,
    });

    await store.delete();

    await expect(access(store.getPath())).rejects.toThrow();
    await rm(root, { recursive: true, force: true });
  });
});
