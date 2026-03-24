import { describe, expect, it } from 'vitest';

import { SessionModeResolver } from './SessionModeResolver';
import type { SessionModeResolveInput } from './types';

function makeProbeState(
  overrides: Partial<SessionModeResolveInput> = {},
): SessionModeResolveInput {
  return {
    desiredMode: 'runtime_preferred',
    runtime: {
      status: 'ready',
      capabilities: ['sendUserMessage', 'interrupt'],
      degradedFlags: [],
    },
    storage: {
      status: 'ready',
      lastUpdatedAt: 0,
      capabilities: [],
      degradedFlags: [],
    },
    ...overrides,
  };
}

describe('SessionModeResolver', () => {
  it('prefers runtime when runtime_preferred is healthy', () => {
    const resolver = new SessionModeResolver({ now: () => 0 });

    const resolved = resolver.resolve(makeProbeState());

    expect(resolved).toMatchObject({
      desiredMode: 'runtime_preferred',
      effectiveMode: 'runtime',
      modeReason: 'runtime_ready',
      attachability: 'attachable',
      capabilities: ['sendUserMessage', 'interrupt'],
      degradedFlags: [],
      probeHealth: {
        runtime: 'ready',
        storage: 'ready',
      },
    });
  });

  it('falls back to storage when runtime is unavailable', () => {
    const resolver = new SessionModeResolver({ now: () => 0 });

    const resolved = resolver.resolve(
      makeProbeState({
        runtime: {
          status: 'unavailable',
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
        },
      }),
    );

    expect(resolved).toMatchObject({
      effectiveMode: 'storage',
      modeReason: 'runtime_unavailable_fallback_to_storage',
      attachability: 'attachable_with_degraded_capabilities',
      probeHealth: {
        runtime: 'unavailable',
        storage: 'ready',
      },
    });
    expect(resolved.degradedFlags).toContain('read_only_attach');
  });

  it('requires two matching samples before changing runtime health', () => {
    const resolver = new SessionModeResolver({ now: () => 0 });

    resolver.resolve(
      makeProbeState({
        runtime: {
          status: 'unavailable',
          capabilities: [],
          degradedFlags: [],
        },
      }),
    );

    const resolved = resolver.resolve(
      makeProbeState({
        runtime: {
          status: 'ready',
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
        },
      }),
    );

    expect(resolved.effectiveMode).toBe('storage');
    expect(resolved.probeHealth.runtime).toBe('unavailable');
  });

  it('throttles automatic rebound after fallback', () => {
    let now = 0;
    const resolver = new SessionModeResolver({
      now: () => now,
      reboundDelayMs: 5000,
    });

    resolver.resolve(
      makeProbeState({
        runtime: {
          status: 'unavailable',
          capabilities: [],
          degradedFlags: [],
        },
      }),
    );

    now = 1000;
    resolver.resolve(
      makeProbeState({
        runtime: {
          status: 'ready',
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
        },
      }),
    );

    now = 1500;
    const throttled = resolver.resolve(
      makeProbeState({
        runtime: {
          status: 'ready',
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
        },
      }),
    );

    expect(throttled.effectiveMode).toBe('storage');
    expect(throttled.modeReason).toBe('runtime_recovery_rebound_throttled');

    now = 6001;
    const rebound = resolver.resolve(
      makeProbeState({
        runtime: {
          status: 'ready',
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
        },
      }),
    );

    expect(rebound.effectiveMode).toBe('runtime');
    expect(rebound.modeReason).toBe('runtime_ready');
  });

  it('marks storage older than 60s as stale', () => {
    const resolver = new SessionModeResolver({ now: () => 61_000 });

    const resolved = resolver.resolve(
      makeProbeState({
        desiredMode: 'storage_preferred',
        runtime: {
          status: 'unavailable',
          capabilities: [],
          degradedFlags: [],
        },
      }),
    );

    expect(resolved.effectiveMode).toBe('storage');
    expect(resolved.probeHealth.storage).toBe('stale');
    expect(resolved.degradedFlags).toContain('stale_storage_state');
  });

  it('does not expose full-control capabilities while storage mode is active', () => {
    const resolver = new SessionModeResolver({ now: () => 0 });

    const resolved = resolver.resolve(
      makeProbeState({
        desiredMode: 'storage_preferred',
        storage: {
          status: 'ready',
          lastUpdatedAt: 0,
          capabilities: ['sendUserMessage', 'interrupt'],
          degradedFlags: [],
        },
      }),
    );

    expect(resolved.effectiveMode).toBe('storage');
    expect(resolved.capabilities).toEqual([]);
    expect(resolved.degradedFlags).toContain('read_only_attach');
  });
});
