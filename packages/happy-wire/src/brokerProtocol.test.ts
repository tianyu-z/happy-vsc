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
});
