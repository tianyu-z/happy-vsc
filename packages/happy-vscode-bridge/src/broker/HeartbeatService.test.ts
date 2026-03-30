import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HeartbeatService } from './HeartbeatService';

describe('HeartbeatService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes an initial heartbeat and refreshes the manifest on schedule', async () => {
    const writes: number[] = [];
    const manifestStore = {
      write: vi.fn(async (manifest: { lastHeartbeatAt: number }) => {
        writes.push(manifest.lastHeartbeatAt);
      }),
      delete: vi.fn(async () => {}),
    };

    let now = 1_000;
    const heartbeat = new HeartbeatService({
      intervalMs: 2_000,
      now: () => now,
      manifestStore,
      buildManifest: (lastHeartbeatAt) => ({
        installationId: 'install-1',
        instanceId: 'instance-1',
        logicalWindowKey: 'window-1',
        windowLabel: 'api',
        workspaceFolders: ['/workspace/api'],
        runtimeKind: 'local' as const,
        runtimeLabel: 'local',
        bridgeHostIps: [],
        providerKinds: ['claude'] as const,
        brokerEndpoint: 'ws://127.0.0.1:7777',
        brokerAuthToken: 'token',
        pid: 1234,
        startedAt: 500,
        lastHeartbeatAt,
        ttlMs: 10_000,
      }),
    });

    await heartbeat.start();
    expect(writes).toEqual([1_000]);

    now = 3_000;
    await vi.advanceTimersByTimeAsync(2_000);

    expect(writes).toEqual([1_000, 3_000]);
  });

  it('deletes the manifest when stopped', async () => {
    const manifestStore = {
      write: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    };
    const heartbeat = new HeartbeatService({
      intervalMs: 2_000,
      now: () => 1_000,
      manifestStore,
      buildManifest: (lastHeartbeatAt) => ({
        installationId: 'install-1',
        instanceId: 'instance-1',
        logicalWindowKey: 'window-1',
        windowLabel: 'api',
        workspaceFolders: ['/workspace/api'],
        runtimeKind: 'local' as const,
        runtimeLabel: 'local',
        bridgeHostIps: [],
        providerKinds: ['claude'] as const,
        brokerEndpoint: 'ws://127.0.0.1:7777',
        brokerAuthToken: 'token',
        pid: 1234,
        startedAt: 500,
        lastHeartbeatAt,
        ttlMs: 10_000,
      }),
    });

    await heartbeat.start();
    await heartbeat.stop();

    expect(manifestStore.delete).toHaveBeenCalledTimes(1);
  });
});
