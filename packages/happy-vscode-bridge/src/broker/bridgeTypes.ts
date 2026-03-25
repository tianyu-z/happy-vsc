import type {
  BridgeBrokerDiscoveredSession,
  BridgeBrokerSnapshot,
  DesiredMode,
} from '../runtime/types';

export type BridgeAttachmentRef = {
  id: string;
  kind: 'image' | 'file' | 'patch' | 'diff' | 'artifact';
  label: string;
  openRef?: string;
};

export type BridgeCaptureEditorContextResult = {
  activeFilePath: string | null;
  selectedText: string | null;
  selectionRanges: Array<{
    startLine: number;
    startCharacter: number;
    endLine: number;
    endCharacter: number;
  }>;
  workspaceRoots: string[];
  diagnosticsSummary: {
    errors: number;
    warnings: number;
    infos: number;
    hints: number;
  };
};

export type BridgeRunStatus =
  | 'idle'
  | 'running'
  | 'waiting_approval'
  | 'interrupted'
  | 'completed'
  | 'failed';

export type BridgeBrokerEvent =
  | {
      type: 'session.snapshot';
      snapshot: BridgeBrokerSnapshot;
    }
  | {
      type: 'session.discovered';
      session: BridgeBrokerDiscoveredSession;
    }
  | {
      type: 'session.message.delta';
      brokerSessionId: string;
      payload: {
        role: 'user' | 'assistant' | 'tool';
        text: string;
      };
    }
  | {
      type: 'session.run.status';
      brokerSessionId: string;
      payload: {
        status: BridgeRunStatus;
        reason?: string;
      };
    }
  | {
      type: 'session.approval.requested';
      brokerSessionId: string;
      payload: {
        approvalId: string;
        label: string;
        description?: string;
      };
    }
  | {
      type: 'session.approval.resolved';
      brokerSessionId: string;
      payload: {
        approvalId: string;
        decision: 'approve' | 'deny';
      };
    }
  | {
      type: 'session.approval.dismissed';
      brokerSessionId: string;
      payload: {
        approvalId: string;
      };
    }
  | {
      type: 'session.interrupt';
      brokerSessionId: string;
      payload: {
        outcome: 'requested' | 'accepted' | 'rejected' | 'completed';
        reason?: string;
      };
    }
  | {
      type: 'session.attachment.added';
      brokerSessionId: string;
      payload: {
        attachment: BridgeAttachmentRef;
      };
    };

export type BridgeDesiredMode = DesiredMode;
