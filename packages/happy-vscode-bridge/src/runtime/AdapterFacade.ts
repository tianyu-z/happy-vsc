import type {
  BridgeAttachmentRef,
  BridgeBrokerEvent,
  BridgeCaptureEditorContextResult,
  BridgeDesiredMode,
} from '../broker/bridgeTypes';
import type {
  BridgeBrokerDiscoveredSession,
  BridgeBrokerSnapshot,
} from './types';

import { SharedSessionStore } from '../broker/SharedSessionStore';
import type { CompanionRuntimeLike } from './CompanionRuntime';

type AdapterFacadeOptions = {
  runtime: CompanionRuntimeLike;
  store: SharedSessionStore;
};

function toBrokerCaptureEditorContextResult(
  context: Awaited<ReturnType<CompanionRuntimeLike['captureEditorContext']>>,
): BridgeCaptureEditorContextResult | null {
  if (!context) {
    return null;
  }

  return {
    activeFilePath: context.activeFilePath,
    selectedText: context.selectedText,
    selectionRanges: context.selectionRanges,
    workspaceRoots: context.workspaceRoots,
    diagnosticsSummary: context.diagnosticsSummary,
  };
}

export class AdapterFacade {
  private readonly runtime: CompanionRuntimeLike;
  private readonly store: SharedSessionStore;
  private readonly activeEventSubscriptions = new Map<string, () => void>();

  constructor(options: AdapterFacadeOptions) {
    this.runtime = options.runtime;
    this.store = options.store;
  }

  async discover(): Promise<BridgeBrokerDiscoveredSession[]> {
    const sessions = await this.runtime.refresh();
    for (const session of sessions) {
      this.store.append(session.brokerSessionId, {
        type: 'session.discovered',
        session,
      });
    }
    return sessions;
  }

  async attach(brokerSessionId: string): Promise<BridgeBrokerSnapshot | null> {
    const snapshot = await this.runtime.attachSession(brokerSessionId);
    if (!snapshot) {
      return null;
    }

    this.store.append(snapshot.brokerSessionId, {
      type: 'session.snapshot',
      snapshot,
    });
    return snapshot;
  }

  async sendMessage(brokerSessionId: string, text: string): Promise<boolean> {
    await this.runtime.sendMessage(brokerSessionId, text);
    return true;
  }

  async interruptSession(
    brokerSessionId: string,
    reason: string,
  ): Promise<boolean> {
    await this.runtime.interruptSession(brokerSessionId, reason);
    return true;
  }

  async resolveApproval(
    brokerSessionId: string,
    approvalId: string,
    decision: 'approve' | 'deny',
  ): Promise<boolean> {
    await this.runtime.resolveApproval(brokerSessionId, approvalId, decision);
    return true;
  }

  async captureEditorContext(
    brokerSessionId: string,
  ): Promise<BridgeCaptureEditorContextResult | null> {
    const context = await this.runtime.captureEditorContext(brokerSessionId);
    return toBrokerCaptureEditorContextResult(context);
  }

  async listAttachments(brokerSessionId: string): Promise<BridgeAttachmentRef[]> {
    return this.runtime.listAttachments(brokerSessionId);
  }

  async setSessionDesiredMode(
    brokerSessionId: string,
    desiredMode: BridgeDesiredMode,
  ): Promise<BridgeBrokerDiscoveredSession> {
    const session = await this.runtime.setSessionDesiredMode(
      brokerSessionId,
      desiredMode,
    );
    this.store.append(session.brokerSessionId, {
      type: 'session.discovered',
      session,
    });
    return session;
  }

  async subscribeEvents(brokerSessionId: string): Promise<boolean> {
    if (this.activeEventSubscriptions.has(brokerSessionId)) {
      return true;
    }

    const unsubscribe = await this.runtime.watchBrokerEvents(
      brokerSessionId,
      (event: BridgeBrokerEvent) => {
        this.store.append(brokerSessionId, event);
      },
    );
    this.activeEventSubscriptions.set(brokerSessionId, unsubscribe);
    return true;
  }

  async dispose(): Promise<void> {
    for (const unsubscribe of this.activeEventSubscriptions.values()) {
      unsubscribe();
    }
    this.activeEventSubscriptions.clear();
    await this.runtime.dispose();
  }
}
