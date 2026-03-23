import { describe, it, expect } from 'vitest';
import {
  brokerDiscoveredSessionSchema,
  brokerSnapshotSchema,
  brokerEventSchema,
} from './brokerProtocol';

describe('broker protocol', () => {
  it('parses a discovered session', () => {
    expect(
      brokerDiscoveredSessionSchema.parse({
        brokerSessionId: 'sess_123',
        provider: 'claude',
        title: 'Attach me',
        attachability: 'attachable',
        capabilities: ['sendUserMessage'],
        degradedFlags: [],
      }).provider,
    ).toBe('claude');
  });

  it('parses a snapshot', () => {
    expect(
      brokerSnapshotSchema.parse({
        brokerSessionId: 'sess_123',
        provider: 'codex',
        latestSeq: 42,
        capabilities: ['sendUserMessage'],
        degradedFlags: ['selection_context_stale'],
      }).latestSeq,
    ).toBe(42);
  });

  it('parses a broker event envelope', () => {
    expect(
      brokerEventSchema.parse({
        type: 'session.snapshot',
        snapshot: {
          brokerSessionId: 'sess_123',
          provider: 'claude',
          latestSeq: 7,
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
        },
      }).type,
    ).toBe('session.snapshot');
  });
});
