import type { BrokerEvent, BrokerSnapshot } from 'happy-wire';

export type BrokerLogEntry = {
  sessionId: string;
  seq: number;
  at: number;
  event: BrokerEvent;
};

type SessionProjection = {
  log: BrokerLogEntry[];
  snapshot: BrokerSnapshot | null;
};

export class SharedSessionStore {
  private seq = 0;
  private sessions = new Map<string, SessionProjection>();

  append(sessionId: string, event: BrokerEvent): BrokerLogEntry {
    const entry: BrokerLogEntry = {
      sessionId,
      seq: ++this.seq,
      at: Date.now(),
      event,
    };

    const session = this.sessions.get(sessionId) ?? {
      log: [],
      snapshot: null,
    };

    session.log.push(entry);

    if (event.type === 'session.snapshot') {
      session.snapshot = event.snapshot;
    }

    this.sessions.set(sessionId, session);

    return entry;
  }

  getSnapshot(sessionId: string): BrokerSnapshot | null {
    return this.sessions.get(sessionId)?.snapshot ?? null;
  }

  getLog(sessionId: string): BrokerLogEntry[] {
    return [...(this.sessions.get(sessionId)?.log ?? [])];
  }
}
