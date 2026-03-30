import type { TrackedSession } from './types';

export function findReusableBrokerSession(
  tracked: Map<number, TrackedSession>,
  canonicalBrokerSessionKey: string,
): TrackedSession | undefined {
  return Array.from(tracked.values()).find(
    (session) =>
      session.source === 'broker_attached' &&
      session.canonicalBrokerSessionKey === canonicalBrokerSessionKey &&
      !!session.happySessionId,
  );
}
