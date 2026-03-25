import { expect, it, describe } from 'vitest';
import { SharedSessionStore } from './SharedSessionStore';

describe('SharedSessionStore', () => {
  it('assigns monotonically increasing seq values', () => {
    const store = new SharedSessionStore();
    const first = store.append('session-1', {
      type: 'session.discovered',
      session: {
        brokerSessionId: 'session-1',
        provider: 'claude',
        title: 'Test session',
        attachability: 'attachable',
        capabilities: [],
        degradedFlags: [],
      },
    });
    const second = store.append('session-1', {
      type: 'session.snapshot',
      snapshot: {
        brokerSessionId: 'session-1',
        provider: 'claude',
        latestSeq: first.seq,
        capabilities: [],
        degradedFlags: [],
      },
    });
    expect(second.seq).toBe(first.seq + 1);
  });

  it('projects session snapshots', () => {
    const store = new SharedSessionStore();
    store.append('session-1', {
      type: 'session.snapshot',
      snapshot: {
        brokerSessionId: 'session-1',
        provider: 'claude',
        latestSeq: 0,
        capabilities: [],
        degradedFlags: [],
      },
    });
    const snapshot = store.getSnapshot('session-1');
    expect(snapshot).toBeDefined();
    expect(snapshot?.latestSeq).toBeGreaterThan(0);
    expect(snapshot?.brokerSessionId).toBe('session-1');
  });
});
