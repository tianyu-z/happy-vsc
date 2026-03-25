import type { TrackedSession } from './types';

export function findReusableBrokerSession(
  tracked: Map<number, TrackedSession>,
  brokerSessionId: string,
): TrackedSession | undefined {
  return Array.from(tracked.values()).find(
    (session) =>
      session.source === 'broker_attached' &&
      session.brokerSessionId === brokerSessionId &&
      !!session.happySessionId,
  );
}
