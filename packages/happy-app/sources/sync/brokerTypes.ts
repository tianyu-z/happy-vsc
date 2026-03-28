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

export const brokerProviderExtensionSchema = z.object({
    id: z.string().min(1),
    version: z.string().min(1),
}).strict();
export type BrokerProviderExtension = z.infer<typeof brokerProviderExtensionSchema>;

export const brokerProbeHealthSchema = z.object({
    runtime: z.enum(['ready', 'degraded', 'unavailable']),
    storage: z.enum(['ready', 'stale', 'unavailable']),
}).strict();
export type BrokerProbeHealth = z.infer<typeof brokerProbeHealthSchema>;

export const brokerAttachabilitySchema = z.enum([
    'attachable',
    'attachable_with_degraded_capabilities',
    'not_attachable',
]);
export type BrokerAttachability = z.infer<typeof brokerAttachabilitySchema>;

const brokerRuntimeMetadataShape = {
    desiredMode: brokerDesiredModeSchema,
    effectiveMode: brokerEffectiveModeSchema,
    modeReason: z.string().min(1),
    compatibility: brokerCompatibilitySchema,
    providerExtension: brokerProviderExtensionSchema,
    probeHealth: brokerProbeHealthSchema,
} as const;

export const brokerDiscoveredSessionSchema = z.object({
    brokerSessionId: z.string().min(1),
    provider: brokerProviderSchema,
    title: z.string(),
    attachability: brokerAttachabilitySchema,
    capabilities: z.array(z.string()),
    degradedFlags: z.array(z.string()),
    windowInstanceId: z.string().min(1).optional(),
    windowLabel: z.string().optional(),
    workspaceLabel: z.string().optional(),
    windowOrdinal: z.number().int().positive().optional(),
    isActiveWindow: z.boolean().optional(),
    workspacePath: z.string().nullable().optional(),
    windowLastActiveAt: z.string().nullable().optional(),
    ...brokerRuntimeMetadataShape,
}).strip();
export type BrokerDiscoveredSession = z.infer<typeof brokerDiscoveredSessionSchema>;
