import { describe, expect, it } from 'vitest';

import { findReusableBrokerSession } from './brokerSessionReuse';
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
          canonicalBrokerSessionKey: 'machine-1:instance-1:broker-sess-1',
          happySessionId: 'happy-sess-1',
          pid: 11,
        },
      ],
    ]);

    expect(
      findReusableBrokerSession(
        tracked,
        'machine-1:instance-1:broker-sess-1',
      )?.happySessionId,
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
          canonicalBrokerSessionKey: 'machine-1:instance-1:broker-sess-1',
          pid: 11,
        },
      ],
    ]);

    expect(
      findReusableBrokerSession(
        tracked,
        'machine-1:instance-1:broker-sess-1',
      ),
    ).toBeUndefined();
  });
});
