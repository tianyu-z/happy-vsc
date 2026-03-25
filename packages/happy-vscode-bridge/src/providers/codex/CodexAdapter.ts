import { createHash } from 'node:crypto';

import type {
  ApprovalIntent,
  DiscoveredBrokerSession,
  InterruptIntent,
  ProviderAdapter,
  ProviderAdapterHealth,
  ProviderAttachment,
  SendUserMessageIntent,
} from '../types';

export type CodexLiveSessionCandidate = {
  providerSessionRef: string;
  title?: string;
  isLive: boolean;
  canAttach: boolean;
  supportsApprovals: boolean;
  supportsInterrupt: boolean;
};

export type CodexSessionMetadata = {
  providerSessionRef: string;
  title?: string;
  latestSeq?: number;
};

export interface CodexLiveSource {
  listLiveSessions(): Promise<CodexLiveSessionCandidate[]>;
}

export interface CodexMetadataSource {
  listSessionMetadata(): Promise<CodexSessionMetadata[]>;
}

export type CodexActionHandlers = {
  sendUserMessage?: (intent: SendUserMessageIntent) => Promise<void> | void;
  interrupt?: (intent: InterruptIntent) => Promise<void> | void;
  resolveApproval?: (intent: ApprovalIntent) => Promise<void> | void;
};

export type CodexAdapterOptions = {
  liveSource: CodexLiveSource;
  metadataSource?: CodexMetadataSource;
  actions?: CodexActionHandlers;
  attachmentBridgeAvailable?: boolean;
};

type NormalizedCodexSession = DiscoveredBrokerSession & {
  latestSeq: number;
};

function toStableBrokerSessionId(providerSessionRef: string): string {
  const digest = createHash('sha256').update(providerSessionRef).digest('hex').slice(0, 24);
  return `codex-${digest}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export class CodexAdapter implements ProviderAdapter {
  private readonly liveSource: CodexLiveSource;
  private readonly metadataSource?: CodexMetadataSource;
  private readonly actions: CodexActionHandlers;
  private readonly attachmentBridgeAvailable: boolean;
  private readonly discoveredByProviderRef = new Map<string, NormalizedCodexSession>();
  private readonly discoveredByBrokerId = new Map<string, NormalizedCodexSession>();

  constructor(options: CodexAdapterOptions) {
    this.liveSource = options.liveSource;
    this.metadataSource = options.metadataSource;
    this.actions = options.actions ?? {};
    this.attachmentBridgeAvailable = options.attachmentBridgeAvailable ?? true;
  }

  async discover(): Promise<DiscoveredBrokerSession[]> {
    const liveCandidates = await this.liveSource.listLiveSessions();
    if (liveCandidates.length === 0) {
      this.discoveredByProviderRef.clear();
      this.discoveredByBrokerId.clear();
      return [];
    }

    const metadataByRef = await this.loadMetadataByRef();
    const normalized = liveCandidates.map((candidate) => {
      const metadata = metadataByRef.get(candidate.providerSessionRef);
      return this.normalizeCandidate(candidate, metadata);
    });

    this.discoveredByProviderRef.clear();
    this.discoveredByBrokerId.clear();

    for (const session of normalized) {
      this.discoveredByProviderRef.set(session.providerSessionRef, session);
      this.discoveredByBrokerId.set(session.brokerSessionId, session);
    }

    return normalized.map(({ latestSeq: _latestSeq, ...session }) => session);
  }

  async attach(ref: string): Promise<ProviderAttachment | null> {
    let session = this.findSession(ref);
    if (!session) {
      await this.discover();
      session = this.findSession(ref);
    }

    if (!session || session.attachability === 'not_attachable') {
      return null;
    }

    return {
      brokerSessionId: session.brokerSessionId,
      providerSessionRef: session.providerSessionRef,
      provider: 'codex',
      latestSeq: session.latestSeq,
      capabilities: [...session.capabilities],
      degradedFlags: [...session.degradedFlags],
    };
  }

  async sendUserMessage(intent: SendUserMessageIntent): Promise<void> {
    if (!this.actions.sendUserMessage) {
      throw new Error('Codex sendUserMessage bridge unavailable');
    }

    await this.actions.sendUserMessage(intent);
  }

  async interrupt(intent: InterruptIntent): Promise<void> {
    if (!this.actions.interrupt) {
      throw new Error('Codex interrupt bridge unavailable');
    }

    await this.actions.interrupt(intent);
  }

  async resolveApproval(intent: ApprovalIntent): Promise<void> {
    if (!this.actions.resolveApproval) {
      throw new Error('Codex approval bridge unavailable');
    }

    await this.actions.resolveApproval(intent);
  }

  getHealth(ref: string): ProviderAdapterHealth {
    const session = this.findSession(ref);
    if (!session) {
      return {
        degradedFlags: [],
      };
    }

    return {
      approvalBridgeAvailable: !session.degradedFlags.includes('approval_bridge_unavailable'),
      attachmentBridgeAvailable: !session.degradedFlags.includes('attachment_bridge_unavailable'),
      readOnlyAttach: session.degradedFlags.includes('read_only_attach'),
      degradedFlags: [...session.degradedFlags],
    };
  }

  private async loadMetadataByRef(): Promise<Map<string, CodexSessionMetadata>> {
    if (!this.metadataSource) {
      return new Map();
    }

    let metadataList: CodexSessionMetadata[];
    try {
      metadataList = await this.metadataSource.listSessionMetadata();
    } catch {
      return new Map();
    }

    const metadataByRef = new Map<string, CodexSessionMetadata>();
    for (const metadata of metadataList) {
      metadataByRef.set(metadata.providerSessionRef, metadata);
    }

    return metadataByRef;
  }

  private normalizeCandidate(
    candidate: CodexLiveSessionCandidate,
    metadata: CodexSessionMetadata | undefined,
  ): NormalizedCodexSession {
    const capabilities: string[] = [];
    const degradedFlags: string[] = [];

    if (this.actions.sendUserMessage) {
      capabilities.push('sendUserMessage');
    } else {
      degradedFlags.push('read_only_attach');
    }

    if (candidate.supportsInterrupt && this.actions.interrupt) {
      capabilities.push('interrupt');
    } else if (candidate.supportsInterrupt) {
      degradedFlags.push('interrupt_bridge_unavailable');
    }

    if (candidate.supportsApprovals && this.actions.resolveApproval) {
      capabilities.push('resolveApproval');
    } else if (candidate.supportsApprovals) {
      degradedFlags.push('approval_bridge_unavailable');
    }

    const baseAttachability = candidate.isLive && candidate.canAttach ? 'attachable' : 'not_attachable';

    if (baseAttachability === 'attachable' && !this.attachmentBridgeAvailable) {
      degradedFlags.push('attachment_bridge_unavailable');
    }

    const attachability =
      baseAttachability === 'attachable' && degradedFlags.length > 0
        ? 'attachable_with_degraded_capabilities'
        : baseAttachability;

    return {
      brokerSessionId: toStableBrokerSessionId(candidate.providerSessionRef),
      providerSessionRef: candidate.providerSessionRef,
      provider: 'codex',
      title: metadata?.title ?? candidate.title ?? 'Codex Session',
      attachability,
      capabilities: unique(capabilities),
      degradedFlags: unique(degradedFlags),
      latestSeq: metadata?.latestSeq ?? 0,
    };
  }

  private findSession(ref: string): NormalizedCodexSession | undefined {
    return this.discoveredByProviderRef.get(ref) ?? this.discoveredByBrokerId.get(ref);
  }
}
