import type { TrackedSession } from './types';

export type BrokerSessionReuseTarget = {
  brokerSessionId: string;
  brokerUrl?: string;
  brokerWindowInstanceId?: string;
};

function hasMatchingBrokerIdentity(
  session: TrackedSession,
  target: BrokerSessionReuseTarget,
): boolean {
  if (
    session.source !== 'broker_attached' ||
    session.brokerSessionId !== target.brokerSessionId
  ) {
    return false;
  }

  if (target.brokerUrl && session.brokerUrl !== target.brokerUrl) {
    return false;
  }

  if (
    target.brokerWindowInstanceId &&
    session.brokerWindowInstanceId !== target.brokerWindowInstanceId
  ) {
    return false;
  }

  return true;
}

export function findReusableBrokerSession(
  tracked: Map<number, TrackedSession>,
  target: BrokerSessionReuseTarget,
): TrackedSession | undefined {
  return Array.from(tracked.values()).find(
    (session) =>
      hasMatchingBrokerIdentity(session, target) &&
      !!session.happySessionId,
  );
}

export function findConflictingBrokerSessions(
  tracked: Map<number, TrackedSession>,
  target: BrokerSessionReuseTarget,
): TrackedSession[] {
  return Array.from(tracked.values()).filter(
    (session) =>
      session.source === 'broker_attached' &&
      session.brokerSessionId === target.brokerSessionId &&
      !hasMatchingBrokerIdentity(session, target),
  );
}
