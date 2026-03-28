import { describe, expect, it } from 'vitest';

import { buildBrokerAttachArgs } from './brokerAttachArgs';

describe('buildBrokerAttachArgs', () => {
  it('builds the broker-attached child argv including window identity', () => {
    const args = buildBrokerAttachArgs({
      startedBy: 'daemon',
      brokerSessionId: 'broker-sess-1',
      brokerRootDir: '/tmp/.happy-vsc',
      brokerUrl: 'ws://127.0.0.1:7777?token=test',
      windowInstanceId: 'window-a',
      brokerWindowLabel: 'Window A',
      brokerWorkspaceLabel: 'Workspace A',
      brokerWorkspacePath: '/workspace-a',
      brokerWindowOrdinal: 2,
      brokerWindowIsActive: true,
      brokerWindowLastActiveAt: '2026-03-26T15:00:00.000Z',
    });

    expect(args).toEqual([
      'broker-attached-session',
      '--started-by',
      'daemon',
      '--broker-session-id',
      'broker-sess-1',
      '--broker-root-dir',
      '/tmp/.happy-vsc',
      '--broker-url',
      'ws://127.0.0.1:7777?token=test',
      '--window-instance-id',
      'window-a',
      '--broker-window-label',
      'Window A',
      '--broker-workspace-label',
      'Workspace A',
      '--broker-workspace-path',
      '/workspace-a',
      '--broker-window-ordinal',
      '2',
      '--broker-window-is-active',
      'true',
      '--broker-window-last-active-at',
      '2026-03-26T15:00:00.000Z',
    ]);
  });

  it('omits optional flags when values are undefined', () => {
    const args = buildBrokerAttachArgs({
      startedBy: 'terminal',
      brokerSessionId: 'broker-sess-1',
    });

    expect(args).toEqual([
      'broker-attached-session',
      '--started-by',
      'terminal',
      '--broker-session-id',
      'broker-sess-1',
    ]);
  });
});
