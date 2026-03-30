import type {
  BrokerAttachability,
} from 'happy-wire';

import { modeReasons, runtimeHealthyModeReason, storageSelectedModeReason } from './modeReason';
import type {
  ModeReason,
  RuntimeModeSample,
  RuntimeHealth,
  SessionModeResolution,
  SessionModeResolveInput,
  StorageHealth,
  StorageModeSample,
} from './types';

type ResolverOptions = {
  now?: () => number;
  storageFreshnessWindowMs?: number;
  reboundDelayMs?: number;
};

type StableHealthTracker<T extends string> = {
  stable?: T;
  pending?: T;
};

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function resolveStableHealth<T extends string>(
  tracker: StableHealthTracker<T>,
  next: T,
  fatal = false,
): T {
  if (fatal || tracker.stable === undefined) {
    tracker.stable = next;
    tracker.pending = undefined;
    return tracker.stable;
  }

  if (tracker.stable === next) {
    tracker.pending = undefined;
    return tracker.stable;
  }

  if (tracker.pending === next) {
    tracker.stable = next;
    tracker.pending = undefined;
    return tracker.stable;
  }

  tracker.pending = next;
  return tracker.stable;
}

function normalizeStorageHealth(
  sample: StorageModeSample,
  now: number,
  freshnessWindowMs: number,
): StorageHealth {
  if (sample.status === 'unavailable') {
    return 'unavailable';
  }

  if (sample.status === 'stale') {
    return 'stale';
  }

  if (typeof sample.lastUpdatedAt !== 'number') {
    return 'stale';
  }

  return now - sample.lastUpdatedAt > freshnessWindowMs ? 'stale' : 'ready';
}

function resolveRuntimeModeReason(health: RuntimeHealth): ModeReason {
  return runtimeHealthyModeReason(health === 'degraded');
}

export class SessionModeResolver {
  private readonly now: () => number;
  private readonly storageFreshnessWindowMs: number;
  private readonly reboundDelayMs: number;
  private readonly runtimeHealthTracker: StableHealthTracker<RuntimeHealth> = {};
  private readonly storageHealthTracker: StableHealthTracker<StorageHealth> = {};

  private lastEffectiveMode: 'runtime' | 'storage' | null = null;
  private lastRuntimeFallbackAt: number | null = null;

  constructor(options: ResolverOptions = {}) {
    this.now = options.now ?? (() => Date.now());
    this.storageFreshnessWindowMs = options.storageFreshnessWindowMs ?? 60_000;
    this.reboundDelayMs = options.reboundDelayMs ?? 5_000;
  }

  resolve(input: SessionModeResolveInput): SessionModeResolution {
    const now = this.now();
    const runtimeHealth = resolveStableHealth(
      this.runtimeHealthTracker,
      input.runtime.status,
      input.runtime.fatal,
    );
    const sampledStorageHealth = normalizeStorageHealth(
      input.storage,
      now,
      this.storageFreshnessWindowMs,
    );
    const storageHealth = resolveStableHealth(
      this.storageHealthTracker,
      sampledStorageHealth,
      input.storage.fatal,
    );

    let effectiveMode: 'runtime' | 'storage';
    let modeReason: ModeReason;

    if (input.desiredMode === 'runtime_preferred') {
      if (runtimeHealth !== 'unavailable') {
        const reboundBlocked =
          this.lastEffectiveMode === 'storage' &&
          this.lastRuntimeFallbackAt !== null &&
          now - this.lastRuntimeFallbackAt < this.reboundDelayMs;

        if (reboundBlocked) {
          effectiveMode = 'storage';
          modeReason = modeReasons.runtimeRecoveryReboundThrottled;
        } else {
          effectiveMode = 'runtime';
          modeReason = resolveRuntimeModeReason(runtimeHealth);
        }
      } else if (storageHealth === 'unavailable') {
        effectiveMode = 'storage';
        modeReason = modeReasons.noProbeAvailable;
      } else {
        effectiveMode = 'storage';
        modeReason = modeReasons.runtimeUnavailableFallbackToStorage;
        if (this.lastEffectiveMode !== 'storage') {
          this.lastRuntimeFallbackAt = now;
        }
      }
    } else if (storageHealth !== 'unavailable') {
      effectiveMode = 'storage';
      modeReason = storageSelectedModeReason(storageHealth === 'stale');
    } else if (runtimeHealth !== 'unavailable') {
      effectiveMode = 'runtime';
      modeReason = modeReasons.storageUnavailableFallbackToRuntime;
    } else {
      effectiveMode = 'storage';
      modeReason = modeReasons.noProbeAvailable;
    }

    const baseAttachability =
      input.baseAttachability ??
      input.runtime.attachability ??
      input.storage.attachability ??
      'attachable';

    const resolved = this.resolveProjection({
      input,
      runtimeHealth,
      storageHealth,
      effectiveMode,
      modeReason,
      baseAttachability,
    });

    this.lastEffectiveMode = resolved.effectiveMode;
    return resolved;
  }

  private resolveProjection(params: {
    input: SessionModeResolveInput;
    runtimeHealth: RuntimeHealth;
    storageHealth: StorageHealth;
    effectiveMode: 'runtime' | 'storage';
    modeReason: ModeReason;
    baseAttachability: BrokerAttachability;
  }): SessionModeResolution {
    const {
      input,
      runtimeHealth,
      storageHealth,
      effectiveMode,
      modeReason,
      baseAttachability,
    } = params;

    const degradedFlags = unique([
      ...(effectiveMode === 'runtime'
        ? input.runtime.degradedFlags ?? []
        : input.storage.degradedFlags ?? []),
      ...(storageHealth === 'stale' ? ['stale_storage_state'] : []),
      ...(effectiveMode === 'storage' ? ['read_only_attach'] : []),
    ]);

    const capabilities =
      effectiveMode === 'runtime'
        ? [...(input.runtime.capabilities ?? [])]
        : [];

    let attachability: BrokerAttachability = baseAttachability;

    if (
      (effectiveMode === 'runtime' && runtimeHealth === 'unavailable') ||
      (effectiveMode === 'storage' && storageHealth === 'unavailable')
    ) {
      attachability = 'not_attachable';
    } else if (
      effectiveMode === 'storage' ||
      runtimeHealth === 'degraded' ||
      degradedFlags.length > 0
    ) {
      attachability =
        baseAttachability === 'not_attachable'
          ? 'not_attachable'
          : 'attachable_with_degraded_capabilities';
    }

    return {
      desiredMode: input.desiredMode,
      effectiveMode,
      modeReason,
      attachability,
      capabilities,
      degradedFlags,
      probeHealth: {
        runtime: runtimeHealth,
        storage: storageHealth,
      },
    };
  }
}
