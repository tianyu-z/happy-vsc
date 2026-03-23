import type { BrokerAttachability, BrokerProvider } from 'happy-wire';

export type BrokerSelectionRange = {
  startLine: number;
  startCharacter: number;
  endLine: number;
  endCharacter: number;
};

export type BrokerDiagnosticsSummary = {
  errors: number;
  warnings: number;
  infos: number;
  hints: number;
};

export type BrokerEditorContext = {
  activeFilePath: string | null;
  selectedText: string | null;
  selectionRanges: BrokerSelectionRange[];
  visibleFilePaths: string[];
  openTabs: string[];
  workspaceRoots: string[];
  gitBranch: string | null;
  diagnosticsSummary: BrokerDiagnosticsSummary;
};

export type DiscoveredBrokerSession = {
  brokerSessionId: string;
  providerSessionRef: string;
  provider: BrokerProvider;
  title: string;
  attachability: BrokerAttachability;
  capabilities: string[];
  degradedFlags: string[];
};

export type ProviderAttachment = {
  brokerSessionId: string;
  providerSessionRef: string;
  provider: BrokerProvider;
  latestSeq: number;
  capabilities: string[];
  degradedFlags: string[];
};

export type SendUserMessageIntent = {
  brokerSessionId: string;
  providerSessionRef: string;
  text: string;
};

export type InterruptIntent = {
  brokerSessionId: string;
  providerSessionRef: string;
  reason: string;
};

export type ApprovalIntent = {
  brokerSessionId: string;
  providerSessionRef: string;
  approvalId: string;
  decision: 'approve' | 'deny';
};

export type ProviderEvent = {
  type: string;
  payload?: unknown;
};

export type ProviderAdapterHealth = {
  approvalBridgeAvailable?: boolean;
  attachmentBridgeAvailable?: boolean;
  readOnlyAttach?: boolean;
  degradedFlags?: string[];
};

export interface ProviderAdapter {
  discover(): Promise<DiscoveredBrokerSession[]>;
  attach(ref: string): Promise<ProviderAttachment | null>;
  sendUserMessage(intent: SendUserMessageIntent): Promise<void>;
  interrupt(intent: InterruptIntent): Promise<void>;
  resolveApproval(intent: ApprovalIntent): Promise<void>;
  captureEditorContext?(ref: string): Promise<BrokerEditorContext>;
  watchEvents?(ref: string, onEvent: (event: ProviderEvent) => void): Promise<() => void> | (() => void);
  getHealth?(ref: string): Promise<ProviderAdapterHealth> | ProviderAdapterHealth;
}

export type ProviderAdapterMap = Partial<Record<BrokerProvider, ProviderAdapter>>;
