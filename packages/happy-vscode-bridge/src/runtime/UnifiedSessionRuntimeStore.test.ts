import { describe, expect, it } from 'vitest';

import { UnifiedSessionRuntimeStore } from './UnifiedSessionRuntimeStore';
import type { UnifiedSessionRecordInput } from './types';

function makeSession(
  overrides: Partial<UnifiedSessionRecordInput> = {},
): UnifiedSessionRecordInput {
  return {
    provider: 'claude',
    providerSessionKey: 'v1|anthropic.claude-code|folder:file:///workspace|conversation-1',
    providerSessionRef: 'provider-session-ref-1',
    title: 'Claude Session',
    latestSeq: 7,
    desiredMode: 'runtime_preferred',
    effectiveMode: 'runtime',
    modeReason: 'runtime_ready',
    compatibility: 'supported',
    providerExtension: {
      id: 'anthropic.claude-code',
      version: '1.0.0',
    },
    probeHealth: {
      runtime: 'ready',
      storage: 'ready',
    },
    attachability: 'attachable',
    capabilities: ['sendUserMessage', 'interrupt'],
    degradedFlags: [],
    ...overrides,
  };
}

describe('UnifiedSessionRuntimeStore', () => {
  it('keeps brokerSessionId stable across runtime/storage transitions', () => {
    const store = new UnifiedSessionRuntimeStore();

    const first = store.upsert(makeSession());
    const second = store.upsert(
      makeSession({
        effectiveMode: 'storage',
        modeReason: 'runtime_unavailable_fallback_to_storage',
        attachability: 'attachable_with_degraded_capabilities',
        capabilities: [],
        degradedFlags: ['read_only_attach'],
        probeHealth: {
          runtime: 'unavailable',
          storage: 'ready',
        },
      }),
    );

    expect(second.brokerSessionId).toBe(first.brokerSessionId);
  });

  it('projects discovered sessions and snapshots from stored records', () => {
    const store = new UnifiedSessionRuntimeStore();

    const record = store.upsert(makeSession());
    const discovered = store.listDiscoveredSessions();
    const snapshot = store.getSnapshot(record.brokerSessionId);

    expect(discovered).toEqual([
      expect.objectContaining({
        brokerSessionId: record.brokerSessionId,
        provider: 'claude',
        title: 'Claude Session',
        attachability: 'attachable',
        desiredMode: 'runtime_preferred',
        effectiveMode: 'runtime',
        modeReason: 'runtime_ready',
      }),
    ]);
    expect(snapshot).toMatchObject({
      brokerSessionId: record.brokerSessionId,
      latestSeq: 7,
      desiredMode: 'runtime_preferred',
      effectiveMode: 'runtime',
      modeReason: 'runtime_ready',
    });
  });

  it('does not regress latestSeq when a later update is older', () => {
    const store = new UnifiedSessionRuntimeStore();

    const first = store.upsert(makeSession({ latestSeq: 10 }));
    const second = store.upsert(makeSession({ latestSeq: 3 }));

    expect(second.latestSeq).toBe(10);
    expect(store.getSnapshot(first.brokerSessionId)?.latestSeq).toBe(10);
  });
});
