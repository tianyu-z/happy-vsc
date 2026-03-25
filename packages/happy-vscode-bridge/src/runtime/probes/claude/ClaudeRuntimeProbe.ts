import type { BrokerAttachability } from 'happy-wire';

import type { BrokerEditorContext, ProviderEvent } from '../../../providers/types';
import type {
  RuntimeSessionBridgeDiagnostic,
  RuntimeSessionEvidence,
  WorkspaceLocator,
} from '../../types';
import type { ProviderHostResolution, RuntimeProbe } from '../types';

type ClaudeRuntimeProbeSession = {
  providerSessionRef: string;
  title?: string;
  latestSeq?: number;
  sessionId?: string;
  threadId?: string;
  conversationId?: string;
  transcriptObjectIds?: string[];
  supportsInterrupt?: boolean;
  interruptBridgeAvailable?: boolean;
  supportsApprovals?: boolean;
  canAttach?: boolean;
  eventStreamAvailable?: boolean;
  bridgeDiagnostics?: RuntimeSessionBridgeDiagnostic;
  workspace: WorkspaceLocator;
};

type ClaudeRuntimeProbeOptions = {
  listSessions?: () => Promise<ClaudeRuntimeProbeSession[]>;
  watchSession?: (
    ref: string,
    onEvent: (event: ProviderEvent) => void,
  ) => Promise<() => void>;
  sendMessage?: (ref: string, text: string) => Promise<void>;
  interrupt?: (ref: string, reason: string) => Promise<void>;
  resolveApproval?: (
    ref: string,
    approvalId: string,
    decision: 'approve' | 'deny',
  ) => Promise<void>;
  captureEditorContext?: (ref: string) => Promise<BrokerEditorContext>;
};

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function resolveAttachability(
  baseAttachability: BrokerAttachability,
  degradedFlags: string[],
): BrokerAttachability {
  if (baseAttachability === 'not_attachable') {
    return baseAttachability;
  }

  return degradedFlags.length > 0
    ? 'attachable_with_degraded_capabilities'
    : baseAttachability;
}

export class ClaudeRuntimeProbe implements RuntimeProbe {
  private readonly resolution: ProviderHostResolution;
  private readonly options: ClaudeRuntimeProbeOptions;

  constructor(
    resolution: ProviderHostResolution,
    options: ClaudeRuntimeProbeOptions = {},
  ) {
    this.resolution = resolution;
    this.options = options;
  }

  async discoverSessions(): Promise<RuntimeSessionEvidence[]> {
    if (!this.options.listSessions) {
      return [];
    }

    const sessions = await this.options.listSessions();

    return sessions.map((session) => {
      const capabilities: string[] = [];
      const degradedFlags: string[] = [];

      if (this.options.sendMessage) {
        capabilities.push('sendUserMessage');
      } else {
        degradedFlags.push('read_only_attach');
      }

      const interruptBridgeAvailable =
        (session.interruptBridgeAvailable ?? Boolean(this.options.interrupt)) &&
        Boolean(this.options.interrupt);
      if (session.supportsInterrupt && interruptBridgeAvailable) {
        capabilities.push('interrupt');
      } else if (session.supportsInterrupt) {
        degradedFlags.push('interrupt_bridge_unavailable');
      }

      if (session.supportsApprovals && this.options.resolveApproval) {
        capabilities.push('resolveApproval');
      } else if (session.supportsApprovals) {
        degradedFlags.push('approval_bridge_unavailable');
      }

      if (!session.eventStreamAvailable || !this.options.watchSession) {
        degradedFlags.push('event_stream_unavailable');
      }

      if (this.options.captureEditorContext) {
        capabilities.push('captureEditorContext');
      }

      return {
        providerSessionRef: session.providerSessionRef,
        title: session.title,
        latestSeq: session.latestSeq,
        sessionId: session.sessionId,
        threadId: session.threadId,
        conversationId: session.conversationId,
        transcriptObjectIds: session.transcriptObjectIds,
        workspace: session.workspace,
        capabilities: unique(capabilities),
        degradedFlags: unique(degradedFlags),
        bridgeDiagnostics: session.bridgeDiagnostics,
        attachability: resolveAttachability(
          session.canAttach === false
            ? 'not_attachable'
            : 'attachable',
          unique(degradedFlags),
        ),
      };
    });
  }

  async watchSession(
    ref: string,
    onEvent: (event: ProviderEvent) => void,
  ): Promise<() => void> {
    if (!this.options.watchSession) {
      return () => {};
    }

    return this.options.watchSession(ref, onEvent);
  }

  async sendMessage(ref: string, text: string): Promise<void> {
    if (!this.options.sendMessage) {
      throw new Error(
        `${this.resolution.providerExtension.id} sendMessage bridge unavailable`,
      );
    }

    await this.options.sendMessage(ref, text);
  }

  async interrupt(ref: string, reason: string): Promise<void> {
    if (!this.options.interrupt) {
      throw new Error(
        `${this.resolution.providerExtension.id} interrupt bridge unavailable`,
      );
    }

    await this.options.interrupt(ref, reason);
  }

  async resolveApproval(
    ref: string,
    approvalId: string,
    decision: 'approve' | 'deny',
  ): Promise<void> {
    if (!this.options.resolveApproval) {
      throw new Error(
        `${this.resolution.providerExtension.id} approval bridge unavailable`,
      );
    }

    await this.options.resolveApproval(ref, approvalId, decision);
  }

  async captureEditorContext(ref: string): Promise<BrokerEditorContext> {
    if (!this.options.captureEditorContext) {
      throw new Error(
        `${this.resolution.providerExtension.id} editor context bridge unavailable`,
      );
    }

    return this.options.captureEditorContext(ref);
  }
}
