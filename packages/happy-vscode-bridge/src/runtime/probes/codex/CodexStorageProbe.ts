import type { StorageSessionEvidence, WorkspaceLocator } from '../../types';
import type { ProviderHostResolution, StorageProbe } from '../types';

type CodexStorageProbeSession = {
  providerSessionRef: string;
  title?: string;
  latestSeq?: number;
  conversationId?: string;
  recordId?: string;
  transcriptObjectIds?: string[];
  workspace: WorkspaceLocator;
};

type CodexStorageProbeOptions = {
  listSessions?: () => Promise<CodexStorageProbeSession[]>;
};

export class CodexStorageProbe implements StorageProbe {
  private readonly resolution: ProviderHostResolution;
  private readonly options: CodexStorageProbeOptions;

  constructor(
    resolution: ProviderHostResolution,
    options: CodexStorageProbeOptions = {},
  ) {
    this.resolution = resolution;
    this.options = options;
  }

  async discoverSessions(): Promise<StorageSessionEvidence[]> {
    const listSessions = this.options.listSessions;
    if (!listSessions) {
      return [];
    }

    const sessions = await listSessions();
    return sessions.map((session) => ({
      providerSessionRef: session.providerSessionRef,
      title: session.title,
      latestSeq: session.latestSeq,
      conversationId: session.conversationId,
      recordId: session.recordId,
      transcriptObjectIds: session.transcriptObjectIds,
      workspace: session.workspace,
      capabilities: [],
      degradedFlags: ['read_only_attach'],
      attachability:
        this.resolution.compatibility === 'incompatible'
          ? 'not_attachable'
          : 'attachable_with_degraded_capabilities',
    }));
  }
}
