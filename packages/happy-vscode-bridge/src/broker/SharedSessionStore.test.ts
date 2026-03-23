import { describe, expect, it } from 'vitest';

import { SharedSessionStore } from './SharedSessionStore';

describe('SharedSessionStore', () => {
  it('assigns monotonically increasing seq values', () => {
    const store = new SharedSessionStore();

    const first = store.append('session-1', {
      type: 'session.discovered',
      session: {
        brokerSessionId: 'session-1',
        provider: 'claude',
        title: 'Attach me',
        attachability: 'attachable',
        capabilities: ['sendUserMessage'],
        degradedFlags: [],
      },
    });
    const second = store.append('session-1', {
      type: 'session.snapshot',
      snapshot: {
        brokerSessionId: 'session-1',
        provider: 'claude',
        latestSeq: 2,
        capabilities: ['sendUserMessage'],
        degradedFlags: [],
      },
    });

    expect(second.seq).toBe(first.seq + 1);
  });

  it('projects the latest snapshot for a session', () => {
    const store = new SharedSessionStore();

    store.append('session-1', {
      type: 'session.snapshot',
      snapshot: {
        brokerSessionId: 'session-1',
        provider: 'codex',
        latestSeq: 5,
        capabilities: ['sendUserMessage'],
        degradedFlags: ['selection_context_stale'],
      },
    });

    expect(store.getSnapshot('session-1')).toMatchObject({
      brokerSessionId: 'session-1',
      provider: 'codex',
      latestSeq: 5,
      degradedFlags: ['selection_context_stale'],
    });
  });
});
