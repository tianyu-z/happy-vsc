import type {
  BrokerDiscoveredSession,
  BrokerEvent,
  BrokerSnapshot,
} from 'happy-wire';

export type BrokerLogEntry = {
  seq: number;
  at: number;
  sessionId: string;
  event: BrokerEvent;
};

type SessionProjection = {
  snapshot?: BrokerSnapshot;
  discovered?: BrokerDiscoveredSession;
};

export class SharedSessionStore {
  private seq = 0;
  private logs: BrokerLogEntry[] = [];
  private projections = new Map<string, SessionProjection>();
  private subscribers = new Set<(entry: BrokerLogEntry) => void>();

  append(sessionId: string, event: BrokerEvent): BrokerLogEntry {
    const entry: BrokerLogEntry = {
      seq: ++this.seq,
      at: Date.now(),
      sessionId,
      event,
    };
    this.logs.push(entry);
    this.projectEvent(entry);
    for (const callback of this.subscribers) {
      callback(entry);
    }
    return entry;
  }

  getSnapshot(sessionId: string): BrokerSnapshot | undefined {
    return this.projections.get(sessionId)?.snapshot;
  }

  listSnapshots(): BrokerSnapshot[] {
    return Array.from(this.projections.values())
      .map((projection) => projection.snapshot)
      .filter((snapshot): snapshot is BrokerSnapshot => Boolean(snapshot));
  }

  listDiscoveredSessions(): BrokerDiscoveredSession[] {
    return Array.from(this.projections.values())
      .map((projection) => projection.discovered)
      .filter(
        (discovered): discovered is BrokerDiscoveredSession => Boolean(discovered),
      );
  }

  subscribe(callback: (entry: BrokerLogEntry) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private projectEvent(entry: BrokerLogEntry) {
    const projection: SessionProjection =
      this.projections.get(entry.sessionId) ?? {};
    if (entry.event.type === 'session.snapshot') {
      projection.snapshot = {
        ...entry.event.snapshot,
        latestSeq: entry.seq,
      };
    }
    if (entry.event.type === 'session.discovered') {
      projection.discovered = entry.event.session;
    }
    this.projections.set(entry.sessionId, projection);
  }
}
