import { z } from 'zod';

export const brokerProviderSchema = z.enum(['claude', 'codex']);
export type BrokerProvider = z.infer<typeof brokerProviderSchema>;

export const brokerDesiredModeSchema = z.enum([
  'runtime_preferred',
  'storage_preferred',
]);
export type BrokerDesiredMode = z.infer<typeof brokerDesiredModeSchema>;

export const brokerEffectiveModeSchema = z.enum(['runtime', 'storage']);
export type BrokerEffectiveMode = z.infer<typeof brokerEffectiveModeSchema>;

export const brokerCompatibilitySchema = z.enum([
  'supported',
  'unknown',
  'incompatible',
]);
export type BrokerCompatibility = z.infer<typeof brokerCompatibilitySchema>;

export const brokerProviderExtensionSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
  })
  .strict();
export type BrokerProviderExtension = z.infer<typeof brokerProviderExtensionSchema>;

export const brokerProbeHealthSchema = z
  .object({
    runtime: z.enum(['ready', 'degraded', 'unavailable']),
    storage: z.enum(['ready', 'stale', 'unavailable']),
  })
  .strict();
export type BrokerProbeHealth = z.infer<typeof brokerProbeHealthSchema>;

const brokerRuntimeMetadataShape = {
  desiredMode: brokerDesiredModeSchema,
  effectiveMode: brokerEffectiveModeSchema,
  modeReason: z.string().min(1),
  compatibility: brokerCompatibilitySchema,
  providerExtension: brokerProviderExtensionSchema,
  probeHealth: brokerProbeHealthSchema,
} as const;

export const brokerAttachabilitySchema = z.enum([
  'attachable',
  'attachable_with_degraded_capabilities',
  'not_attachable',
]);
export type BrokerAttachability = z.infer<typeof brokerAttachabilitySchema>;

export const brokerDiscoveredSessionSchema = z
  .object({
    brokerSessionId: z.string().min(1),
    provider: brokerProviderSchema,
    title: z.string(),
    attachability: brokerAttachabilitySchema,
    capabilities: z.array(z.string()),
    degradedFlags: z.array(z.string()),
    ...brokerRuntimeMetadataShape,
  })
  .strict();
export type BrokerDiscoveredSession = z.infer<typeof brokerDiscoveredSessionSchema>;

export const brokerSnapshotSchema = z
  .object({
    brokerSessionId: z.string().min(1),
    provider: brokerProviderSchema,
    latestSeq: z.number().int().nonnegative(),
    capabilities: z.array(z.string()),
    degradedFlags: z.array(z.string()),
    ...brokerRuntimeMetadataShape,
  })
  .strict();
export type BrokerSnapshot = z.infer<typeof brokerSnapshotSchema>;

export const brokerAttachmentRefSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['image', 'file', 'patch', 'diff', 'artifact']),
    label: z.string().min(1),
    openRef: z.string().min(1).optional(),
  })
  .strict();
export type BrokerAttachmentRef = z.infer<typeof brokerAttachmentRefSchema>;
