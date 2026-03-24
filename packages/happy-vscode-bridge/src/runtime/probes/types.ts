import type { BrokerProvider } from 'happy-wire';

import type {
  BrokerEditorContext,
  ProviderEvent,
} from '../../providers/types';
import type {
  Compatibility,
  ProviderExtension,
  RuntimeSessionEvidence,
  StorageSessionEvidence,
} from '../types';

export type ProviderActivationState = 'active' | 'inactive' | 'missing';

export interface ProviderProbeHost {
  readonly provider: BrokerProvider;
  readonly extensionId: string;
  getCommands(): Promise<string[]>;
  isCommandAvailable(commandId: string): Promise<boolean>;
  getContextKeys(): Promise<string[]>;
  hasContextKey(key: string): Promise<boolean>;
  activateExtension<T = unknown>(): Promise<T | undefined>;
  getExports<T = unknown>(): Promise<T | undefined>;
}

export type ProviderHostResolution = {
  provider: BrokerProvider;
  compatibility: Compatibility;
  activationState: ProviderActivationState;
  providerExtension: ProviderExtension;
  commands: string[];
  contextKeys: string[];
  exportKeys: string[];
  host: ProviderProbeHost | null;
};

export interface RuntimeProbe {
  discoverSessions(): Promise<RuntimeSessionEvidence[]>;
  watchSession(
    ref: string,
    onEvent: (event: ProviderEvent) => void,
  ): Promise<() => void>;
  sendMessage?(ref: string, text: string): Promise<void>;
  interrupt?(ref: string, reason: string): Promise<void>;
  resolveApproval?(
    ref: string,
    approvalId: string,
    decision: 'approve' | 'deny',
  ): Promise<void>;
  captureEditorContext?(ref: string): Promise<BrokerEditorContext>;
}

export interface StorageProbe {
  discoverSessions(): Promise<StorageSessionEvidence[]>;
}
