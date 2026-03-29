import { describe, expect, it } from 'vitest';

import {
  findConflictingBrokerSessions,
  findReusableBrokerSession,
} from './brokerSessionReuse';
import type { TrackedSession } from './types';

describe('findReusableBrokerSession', () => {
  it('returns an existing happy session id for the same broker session', () => {
    const tracked = new Map<number, TrackedSession>([
      [
        11,
        {
          startedBy: 'daemon',
          source: 'broker_attached',
          brokerSessionId: 'broker-sess-1',
          brokerUrl: 'ws://127.0.0.1:40787?token=bridge-token',
          brokerWindowInstanceId: 'window-a',
          happySessionId: 'happy-sess-1',
          pid: 11,
        },
      ],
    ]);

    expect(
      findReusableBrokerSession(tracked, {
        brokerSessionId: 'broker-sess-1',
        brokerUrl: 'ws://127.0.0.1:40787?token=bridge-token',
        brokerWindowInstanceId: 'window-a',
      })?.happySessionId,
    ).toBe('happy-sess-1');
  });

  it('ignores tracked sessions that have no happy session id yet', () => {
    const tracked = new Map<number, TrackedSession>([
      [
        11,
        {
          startedBy: 'daemon',
          source: 'broker_attached',
          brokerSessionId: 'broker-sess-1',
          pid: 11,
        },
      ],
    ]);

    expect(
      findReusableBrokerSession(tracked, {
        brokerSessionId: 'broker-sess-1',
      }),
    ).toBeUndefined();
  });

  it('does not reuse a broker session when the broker url changed', () => {
    const tracked = new Map<number, TrackedSession>([
      [
        11,
        {
          startedBy: 'daemon',
          source: 'broker_attached',
          brokerSessionId: 'broker-sess-1',
          brokerUrl: 'ws://127.0.0.1:38123?token=old-token',
          brokerWindowInstanceId: 'window-a',
          happySessionId: 'happy-sess-1',
          pid: 11,
        },
      ],
    ]);

    expect(
      findReusableBrokerSession(tracked, {
        brokerSessionId: 'broker-sess-1',
        brokerUrl: 'ws://127.0.0.1:40787?token=new-token',
        brokerWindowInstanceId: 'window-a',
      }),
    ).toBeUndefined();
  });

  it('does not reuse a broker session when the window instance changed', () => {
    const tracked = new Map<number, TrackedSession>([
      [
        11,
        {
          startedBy: 'daemon',
          source: 'broker_attached',
          brokerSessionId: 'broker-sess-1',
          brokerUrl: 'ws://127.0.0.1:40787?token=bridge-token',
          brokerWindowInstanceId: 'window-old',
          happySessionId: 'happy-sess-1',
          pid: 11,
        },
      ],
    ]);

    expect(
      findReusableBrokerSession(tracked, {
        brokerSessionId: 'broker-sess-1',
        brokerUrl: 'ws://127.0.0.1:40787?token=bridge-token',
        brokerWindowInstanceId: 'window-new',
      }),
    ).toBeUndefined();
  });

  it('does not reuse a legacy tracked broker session when the caller has concrete broker identity', () => {
    const tracked = new Map<number, TrackedSession>([
      [
        11,
        {
          startedBy: 'daemon',
          source: 'broker_attached',
          brokerSessionId: 'broker-sess-1',
          happySessionId: 'happy-sess-1',
          pid: 11,
        },
      ],
    ]);

    expect(
      findReusableBrokerSession(tracked, {
        brokerSessionId: 'broker-sess-1',
        brokerUrl: 'ws://127.0.0.1:40787?token=bridge-token',
        brokerWindowInstanceId: 'window-a',
      }),
    ).toBeUndefined();
  });
});

describe('findConflictingBrokerSessions', () => {
  it('returns tracked broker sessions whose broker identity no longer matches', () => {
    const tracked = new Map<number, TrackedSession>([
      [
        11,
        {
          startedBy: 'daemon',
          source: 'broker_attached',
          brokerSessionId: 'broker-sess-1',
          brokerUrl: 'ws://127.0.0.1:38123?token=old-token',
          brokerWindowInstanceId: 'window-a',
          happySessionId: 'happy-sess-1',
          pid: 11,
        },
      ],
      [
        12,
        {
          startedBy: 'daemon',
          source: 'broker_attached',
          brokerSessionId: 'broker-sess-1',
          brokerUrl: 'ws://127.0.0.1:40787?token=new-token',
          brokerWindowInstanceId: 'window-b',
          happySessionId: 'happy-sess-2',
          pid: 12,
        },
      ],
      [
        13,
        {
          startedBy: 'daemon',
          source: 'broker_attached',
          brokerSessionId: 'broker-sess-2',
          brokerUrl: 'ws://127.0.0.1:40787?token=new-token',
          brokerWindowInstanceId: 'window-a',
          happySessionId: 'happy-sess-3',
          pid: 13,
        },
      ],
    ]);

    expect(
      findConflictingBrokerSessions(tracked, {
        brokerSessionId: 'broker-sess-1',
        brokerUrl: 'ws://127.0.0.1:40787?token=new-token',
        brokerWindowInstanceId: 'window-a',
      }).map((session) => session.pid),
    ).toEqual([11, 12]);
  });
});
