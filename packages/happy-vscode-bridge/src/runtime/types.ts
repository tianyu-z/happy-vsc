import type {
  BrokerAttachability,
  BrokerDiscoveredSession,
  BrokerProvider,
  BrokerSnapshot,
} from 'happy-wire';

export type DesiredMode = 'runtime_preferred' | 'storage_preferred';
export type EffectiveMode = 'runtime' | 'storage';
export type ModeReason = string;
export type Compatibility = 'supported' | 'unknown' | 'incompatible';
export type ProviderActivationState = 'active' | 'inactive' | 'missing';
export type RuntimeHealth = 'ready' | 'degraded' | 'unavailable';
export type StorageHealth = 'ready' | 'stale' | 'unavailable';

export type ProbeHealth = {
  runtime: RuntimeHealth;
  storage: StorageHealth;
};

export type ProviderExtension = {
  id: string;
  version: string;
};

export type WorkspaceLocator = {
  remoteAuthority?: string | null;
  workspaceFileUri?: string | null;
  folderUris?: string[];
};

export type ProviderRuntimeCaptureDiagnostic = {
  captured: boolean;
  patchedHostCount: number;
  providerKeys: string[];
  providerMethods: string[];
  commCount: number | null;
  knownChannelRefs: string[];
};

export type RuntimeSessionBridgeDiagnostic = {
  runtimeProviderSessionRef: string | null;
  runtimeChannelRef: string | null;
  interruptBridgeState: string | null;
  interruptCommMatched: boolean | null;
};

export type RuntimeSessionEvidence = {
  providerSessionRef: string;
  title?: string;
  latestSeq?: number;
  sessionId?: string;
  threadId?: string;
  conversationId?: string;
  transcriptObjectIds?: string[];
  capabilities?: string[];
  degradedFlags?: string[];
  attachability?: BrokerAttachability;
  bridgeDiagnostics?: RuntimeSessionBridgeDiagnostic;
  workspace: WorkspaceLocator;
};

export type StorageSessionEvidence = {
  providerSessionRef?: string;
  title?: string;
  latestSeq?: number;
  conversationId?: string;
  recordId?: string;
  transcriptObjectIds?: string[];
  capabilities?: string[];
  degradedFlags?: string[];
  attachability?: BrokerAttachability;
  workspace: WorkspaceLocator;
};

export type ProviderSessionNormalizeInput = {
  provider: BrokerProvider;
  providerExtensionId: string;
  runtime?: RuntimeSessionEvidence;
  storage?: StorageSessionEvidence;
};

export type NormalizedProviderSession = {
  provider: BrokerProvider;
  providerExtensionId: string;
  providerSessionRef: string;
  runtimeProviderSessionRef: string | null;
  storageProviderSessionRef: string | null;
  workspaceIdentity: string;
  conversationIdentity: string | null;
  providerSessionKey: string;
  title: string;
  latestSeq: number;
  attachability: BrokerAttachability;
  capabilities: string[];
  degradedFlags: string[];
  identityStable: boolean;
};

export type RuntimeModeSample = {
  status: RuntimeHealth;
  capabilities?: string[];
  degradedFlags?: string[];
  attachability?: BrokerAttachability;
  fatal?: boolean;
};

export type StorageModeSample = {
  status: StorageHealth;
  lastUpdatedAt?: number | null;
  capabilities?: string[];
  degradedFlags?: string[];
  attachability?: BrokerAttachability;
  fatal?: boolean;
};

export type SessionModeResolveInput = {
  desiredMode: DesiredMode;
  runtime: RuntimeModeSample;
  storage: StorageModeSample;
  baseAttachability?: BrokerAttachability;
};

export type SessionModeResolution = {
  desiredMode: DesiredMode;
  effectiveMode: EffectiveMode;
  modeReason: ModeReason;
  attachability: BrokerAttachability;
  capabilities: string[];
  degradedFlags: string[];
  probeHealth: ProbeHealth;
};

export type UnifiedSessionRecordInput = {
  provider: BrokerProvider;
  providerSessionKey: string;
  providerSessionRef: string;
  title: string;
  latestSeq: number;
  desiredMode: DesiredMode;
  effectiveMode: EffectiveMode;
  modeReason: ModeReason;
  compatibility: Compatibility;
  providerExtension: ProviderExtension;
  probeHealth: ProbeHealth;
  attachability: BrokerAttachability;
  capabilities: string[];
  degradedFlags: string[];
  workspaceIdentity?: string;
  conversationIdentity?: string | null;
  runtimeProviderSessionRef?: string | null;
  storageProviderSessionRef?: string | null;
};

export type UnifiedSessionRecord = UnifiedSessionRecordInput & {
  brokerSessionId: string;
};

export type RuntimeMetadataProjection = {
  desiredMode: DesiredMode;
  effectiveMode: EffectiveMode;
  modeReason: ModeReason;
  compatibility: Compatibility;
  providerExtension: ProviderExtension;
  probeHealth: ProbeHealth;
};

export type BridgeBrokerDiscoveredSession = BrokerDiscoveredSession &
  RuntimeMetadataProjection;

export type BridgeBrokerSnapshot = BrokerSnapshot & RuntimeMetadataProjection;

export type BridgeProviderDiagnosticSession = {
  title: string;
  attachability: BrokerAttachability;
  capabilities: string[];
  degradedFlags: string[];
  desiredMode: DesiredMode;
  effectiveMode: EffectiveMode;
  modeReason: ModeReason;
  probeHealth: ProbeHealth;
  runtimeDiagnostics: RuntimeSessionBridgeDiagnostic | null;
};

export type BridgeProviderDiagnostic = {
  provider: BrokerProvider;
  compatibility: Compatibility;
  activationState: ProviderActivationState;
  providerExtension: ProviderExtension;
  commands: string[];
  contextKeys: string[];
  exportKeys: string[];
  moduleExportKeys: string[];
  runtimeCapture: ProviderRuntimeCaptureDiagnostic | null;
  hasRuntimeProbe: boolean;
  hasStorageProbe: boolean;
  discoveredSessions: BridgeProviderDiagnosticSession[];
};
