import type { BridgeBrokerEvent } from './bridgeTypes';
import type {
  BridgeBrokerDiscoveredSession,
  BridgeBrokerSnapshot,
} from '../runtime/types';

export type BrokerLogEntry = {
  seq: number;
  at: number;
  sessionId: string;
  event: BridgeBrokerEvent;
};

type SessionProjection = {
  snapshot?: BridgeBrokerSnapshot;
  discovered?: BridgeBrokerDiscoveredSession;
};

export class SharedSessionStore {
  private seq = 0;
  private logs: BrokerLogEntry[] = [];
  private projections = new Map<string, SessionProjection>();
  private subscribers = new Set<(entry: BrokerLogEntry) => void>();

  append(sessionId: string, event: BridgeBrokerEvent): BrokerLogEntry {
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

  getSnapshot(sessionId: string): BridgeBrokerSnapshot | undefined {
    return this.projections.get(sessionId)?.snapshot;
  }

  listSnapshots(): BridgeBrokerSnapshot[] {
    return Array.from(this.projections.values())
      .map((projection) => projection.snapshot)
      .filter((snapshot): snapshot is BridgeBrokerSnapshot => Boolean(snapshot));
  }

  listDiscoveredSessions(): BridgeBrokerDiscoveredSession[] {
    return Array.from(this.projections.values())
      .map((projection) => projection.discovered)
      .filter(
        (discovered): discovered is BridgeBrokerDiscoveredSession =>
          Boolean(discovered),
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
