import type { ModeReason } from './types';

export const modeReasons = {
  runtimeReady: 'runtime_ready',
  runtimeDegraded: 'runtime_degraded',
  runtimeUnavailableFallbackToStorage: 'runtime_unavailable_fallback_to_storage',
  runtimeRecoveryReboundThrottled: 'runtime_recovery_rebound_throttled',
  noProbeAvailable: 'no_probe_available',
  storagePreferredSelected: 'storage_preferred_selected',
  storageStaleSelected: 'storage_stale_selected',
  storageUnavailableFallbackToRuntime: 'storage_unavailable_fallback_to_runtime',
} as const satisfies Record<string, ModeReason>;

export function runtimeHealthyModeReason(isDegraded: boolean): ModeReason {
  return isDegraded ? modeReasons.runtimeDegraded : modeReasons.runtimeReady;
}

export function storageSelectedModeReason(isStale: boolean): ModeReason {
  return isStale ? modeReasons.storageStaleSelected : modeReasons.storagePreferredSelected;
}
