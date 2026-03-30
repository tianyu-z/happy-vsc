import { describe, expect, it, vi } from 'vitest';

import {
  cleanupOrphanedDaemonBrokerAttachedProcesses,
  findOrphanedDaemonBrokerAttachedPids,
} from './orphanedBrokerAttach';

describe('findOrphanedDaemonBrokerAttachedPids', () => {
  it('selects daemon-started broker attached processes and ignores everything else', () => {
    expect(
      findOrphanedDaemonBrokerAttachedPids([
        {
          pid: 10,
          cmd: 'node /repo/packages/happy-cli/dist/index.mjs broker-attached-session --started-by daemon --broker-session-id claude-1',
        },
        {
          pid: 11,
          cmd: 'node /repo/packages/happy-cli/dist/index.mjs daemon start-sync',
        },
        {
          pid: 12,
          cmd: 'node /repo/packages/happy-cli/dist/index.mjs broker-attached-session --started-by terminal --broker-session-id claude-2',
        },
        {
          pid: 13,
          cmd: 'node /repo/packages/happy-cli/dist/index.mjs broker-attached-session --started-by daemon --broker-session-id codex-1',
        },
      ], 13),
    ).toEqual([10]);
  });
});

describe('cleanupOrphanedDaemonBrokerAttachedProcesses', () => {
  it('sends SIGTERM to each orphaned daemon broker attach process', async () => {
    const listProcesses = vi.fn().mockResolvedValue([
      {
        pid: 10,
        cmd: 'node /repo/packages/happy-cli/dist/index.mjs broker-attached-session --started-by daemon --broker-session-id claude-1',
      },
      {
        pid: 11,
        cmd: 'node /repo/packages/happy-cli/dist/index.mjs broker-attached-session --started-by daemon --broker-session-id codex-1',
      },
    ]);
    const kill = vi.fn();

    const result = await cleanupOrphanedDaemonBrokerAttachedProcesses({
      currentPid: 999,
      listProcesses,
      kill,
    });

    expect(kill).toHaveBeenCalledTimes(2);
    expect(kill).toHaveBeenNthCalledWith(1, 10, 'SIGTERM');
    expect(kill).toHaveBeenNthCalledWith(2, 11, 'SIGTERM');
    expect(result).toEqual({
      attempted: [10, 11],
      killed: [10, 11],
      failed: [],
    });
  });
});
