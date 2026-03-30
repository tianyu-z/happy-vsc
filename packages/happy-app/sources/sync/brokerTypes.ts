import {
    brokerAttachabilitySchema,
    brokerCompatibilitySchema,
    brokerDesiredModeSchema,
    brokerEffectiveModeSchema,
    brokerInventoryInstanceSchema,
    brokerInventorySessionSchema,
    brokerInventorySummarySchema,
    brokerProbeHealthSchema,
    brokerProviderExtensionSchema,
    brokerProviderSchema,
    brokerRuntimeKindSchema,
    type BrokerAttachability,
    type BrokerCompatibility,
    type BrokerDesiredMode,
    type BrokerEffectiveMode,
    type BrokerInventoryInstance,
    type BrokerInventorySession,
    type BrokerInventorySummary,
    type BrokerProbeHealth,
    type BrokerProvider,
    type BrokerProviderExtension,
    type BrokerRuntimeKind,
} from 'happy-wire';

export {
    brokerAttachabilitySchema,
    brokerCompatibilitySchema,
    brokerDesiredModeSchema,
    brokerEffectiveModeSchema,
    brokerInventoryInstanceSchema,
    brokerInventorySessionSchema,
    brokerInventorySummarySchema,
    brokerProbeHealthSchema,
    brokerProviderExtensionSchema,
    brokerProviderSchema,
    brokerRuntimeKindSchema,
};

export type {
    BrokerAttachability,
    BrokerCompatibility,
    BrokerDesiredMode,
    BrokerEffectiveMode,
    BrokerInventoryInstance,
    BrokerInventorySummary,
    BrokerProbeHealth,
    BrokerProvider,
    BrokerProviderExtension,
    BrokerRuntimeKind,
};

// Keep the historical app name to minimize churn in existing UI code.
export const brokerDiscoveredSessionSchema = brokerInventorySessionSchema;
export type BrokerDiscoveredSession = BrokerInventorySession;
