import type { ACPMessageData } from '@/api/apiSession';
import type { AgentState } from '@/api/types';

import type { BrokerEvent, BrokerProvider } from './brokerTypes';

export type BrokerEventProjectorSession = {
  sendAgentMessage: (provider: BrokerProvider, body: ACPMessageData) => void;
  keepAlive: (thinking: boolean, mode: 'local' | 'remote') => void;
  updateAgentState: (handler: (state: AgentState) => AgentState) => void;
};

type BrokerRunStatus = Extract<
  BrokerEvent,
  { type: 'session.run.status' }
>['payload']['status'];

const MAX_RECENT_USER_TEXTS = 20;

export class BrokerEventProjector {
  private readonly session: BrokerEventProjectorSession;
  private readonly recentOutboundUserTexts: string[] = [];
  private readonly pendingApprovals = new Set<string>();
  private lastRunStatus: BrokerRunStatus | null = null;
  private provider: BrokerProvider;

  constructor(session: BrokerEventProjectorSession, provider: BrokerProvider = 'claude') {
    this.session = session;
    this.provider = provider;
  }

  rememberOutboundUserText(text: string): void {
    if (!text) {
      return;
    }
    this.recentOutboundUserTexts.push(text);
    if (this.recentOutboundUserTexts.length > MAX_RECENT_USER_TEXTS) {
      this.recentOutboundUserTexts.splice(0, this.recentOutboundUserTexts.length - MAX_RECENT_USER_TEXTS);
    }
  }

  applyEvent(event: BrokerEvent): void {
    switch (event.type) {
      case 'session.snapshot':
        this.provider = event.snapshot.provider;
        return;
      case 'session.discovered':
        this.provider = event.session.provider;
        return;
      case 'session.message.delta':
        this.handleMessageDelta(event.payload.role, event.payload.text);
        return;
      case 'session.approval.requested':
        this.handleApprovalRequested(event.payload);
        return;
      case 'session.approval.resolved':
        this.handleApprovalResolved(event.payload);
        return;
      case 'session.approval.dismissed':
        this.handleApprovalDismissed(event.payload);
        return;
      case 'session.run.status':
        this.handleRunStatus(event.payload.status, event.payload.reason);
        return;
      case 'session.interrupt':
      case 'session.attachment.added':
        return;
      default:
        return;
    }
  }

  private handleMessageDelta(role: 'user' | 'assistant' | 'tool', text: string): void {
    if (role === 'assistant') {
      this.session.sendAgentMessage(this.provider, { type: 'message', message: text });
      return;
    }

    if (role === 'user') {
      if (this.shouldSuppressUserEcho(text)) {
        return;
      }
    }

    this.session.sendAgentMessage(this.provider, { type: 'message', message: text });
  }

  private shouldSuppressUserEcho(text: string): boolean {
    const index = this.recentOutboundUserTexts.indexOf(text);
    if (index === -1) {
      return false;
    }
    this.recentOutboundUserTexts.splice(index, 1);
    return true;
  }

  private handleApprovalRequested(payload: {
    approvalId: string;
    label: string;
    description?: string;
  }): void {
    if (this.pendingApprovals.has(payload.approvalId)) {
      return;
    }
    this.pendingApprovals.add(payload.approvalId);
    const now = Date.now();

    this.session.updateAgentState((currentState) => ({
      ...currentState,
      requests: {
        ...currentState.requests,
        [payload.approvalId]: {
          tool: payload.label,
          arguments: {
            description: payload.description ?? null,
            brokerApprovalId: payload.approvalId,
          },
          createdAt: now,
        },
      },
    }));
  }

  private handleApprovalResolved(payload: {
    approvalId: string;
    decision: 'approve' | 'deny';
  }): void {
    this.pendingApprovals.delete(payload.approvalId);

    this.session.updateAgentState((currentState) => {
      const request = currentState.requests?.[payload.approvalId];
      if (!request) {
        return currentState;
      }

      const { [payload.approvalId]: _, ...remainingRequests } = currentState.requests ?? {};
      return {
        ...currentState,
        requests: remainingRequests,
        completedRequests: {
          ...currentState.completedRequests,
          [payload.approvalId]: {
            ...request,
            completedAt: Date.now(),
            status: payload.decision === 'approve' ? 'approved' : 'denied',
          },
        },
      };
    });
  }

  private handleApprovalDismissed(payload: { approvalId: string }): void {
    this.pendingApprovals.delete(payload.approvalId);

    this.session.updateAgentState((currentState) => {
      const request = currentState.requests?.[payload.approvalId];
      if (!request) {
        return currentState;
      }

      const { [payload.approvalId]: _, ...remainingRequests } = currentState.requests ?? {};
      return {
        ...currentState,
        requests: remainingRequests,
        completedRequests: {
          ...currentState.completedRequests,
          [payload.approvalId]: {
            ...request,
            completedAt: Date.now(),
            status: 'canceled',
            reason: 'dismissed',
          },
        },
      };
    });
  }

  private handleRunStatus(status: BrokerRunStatus, reason?: string): void {
    if (this.lastRunStatus === status) {
      return;
    }
    this.lastRunStatus = status;

    switch (status) {
      case 'running':
        this.session.keepAlive(true, 'remote');
        return;
      case 'waiting_approval':
        this.session.keepAlive(false, 'remote');
        return;
      case 'idle':
        this.session.keepAlive(false, 'remote');
        return;
      case 'completed':
        this.session.keepAlive(false, 'remote');
        this.session.sendAgentMessage(this.provider, {
          type: 'message',
          message: '[Broker] Run completed.',
        });
        return;
      case 'interrupted':
        this.session.keepAlive(false, 'remote');
        this.session.sendAgentMessage(this.provider, {
          type: 'message',
          message: '[Broker] Run interrupted.',
        });
        return;
      case 'failed': {
        this.session.keepAlive(false, 'remote');
        const message = reason
          ? `[Broker] Run failed: ${reason}`
          : '[Broker] Run failed.';
        this.session.sendAgentMessage(this.provider, {
          type: 'message',
          message,
        });
        return;
      }
      default:
        return;
    }
  }
}
