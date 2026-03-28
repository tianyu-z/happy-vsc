import type { ApiClient } from '../api/api';
import type { ApiSessionClient } from '../api/apiSession';
import type { AgentState, MachineMetadata, Metadata, Session, UserMessage } from '../api/types';
import { backfillClaudeSessionHistory } from '../claude/utils/claudeBackfill';
import { backfillCodexSessionHistory } from '../codex/utils/codexBackfill';
import { createSessionMetadata } from '../utils/createSessionMetadata';

import { BrokerClient } from './BrokerClient';
import { BrokerEventProjector } from './BrokerEventProjector';
import { BrokerEventStream, type BrokerEventStreamDisconnectReason } from './BrokerEventStream';
import { buildBrokerSessionTag } from './BrokerSessionIdentity';

type BrokerRelayApi = Pick<ApiClient, 'getOrCreateMachine' | 'getOrCreateSession' | 'sessionSyncClient'>;
type BrokerRelayClient = Pick<
  BrokerClient,
  'attachSession' | 'interruptSession' | 'resolveApproval' | 'sendMessage'
>;
type BrokerAttachSnapshot = Exclude<
  Awaited<ReturnType<BrokerRelayClient['attachSession']>>,
  null
>;
type BrokerRelayEventStream = Pick<BrokerEventStream, 'subscribeEvents' | 'close'>;
type RelaySession = Pick<
  ApiSessionClient,
  | 'keepAlive'
  | 'onUserMessage'
  | 'rpcHandlerManager'
  | 'sendAgentMessage'
  | 'sendUserTextMessage'
  | 'sessionId'
  | 'updateAgentState'
> &
  Partial<
    Pick<
      ApiSessionClient,
      'isConnected' | 'sendBackfillBatch' | 'sendClaudeSessionMessageBatch'
    >
  >;
type OfflineReconnectionHandle = {
  cancel: () => void;
};
type SetupOfflineReconnectionFn = (opts: {
  api: BrokerRelayApi;
  sessionTag: string;
  metadata: Metadata;
  state: AgentState;
  response: Session | null;
  onSessionSwap: (session: RelaySession) => void;
}) => {
  session: RelaySession;
  reconnectionHandle: OfflineReconnectionHandle | null;
  isOffline: boolean;
};

type SessionPermissionRequest = {
  approved: boolean;
  id: string;
};

export type BrokerRelayRunnerOptions = {
  api: BrokerRelayApi;
  brokerClient: BrokerRelayClient;
  brokerEventStream?: BrokerRelayEventStream;
  brokerSessionId: string;
  brokerUrl?: string;
  brokerWindowInstanceId?: string;
  brokerWindowLabel?: string;
  brokerWorkspaceLabel?: string;
  brokerWorkspacePath?: string;
  brokerWindowOrdinal?: number;
  brokerWindowIsActive?: boolean;
  brokerWindowLastActiveAt?: string;
  machineMetadata: MachineMetadata;
  machineId: string;
  notifyDaemonSessionStarted?: (sessionId: string, metadata: Metadata) => Promise<unknown>;
  sessionTag?: string;
  setupOfflineReconnection: SetupOfflineReconnectionFn;
  startedBy?: 'daemon' | 'terminal';
};

export class BrokerRelayRunner {
  private readonly brokerEventStream: BrokerRelayEventStream;
  private readonly setupReconnect: SetupOfflineReconnectionFn;
  private readonly runPromise: Promise<void>;
  private readonly proxySession = {
    keepAlive: (thinking: boolean, mode: 'local' | 'remote') => {
      this.currentSession?.keepAlive(thinking, mode);
    },
    sendAgentMessage: (provider: 'claude' | 'codex', body: any) => {
      this.currentSession?.sendAgentMessage(provider, body);
    },
    sendUserTextMessage: (text: string) => {
      this.currentSession?.sendUserTextMessage?.(text);
    },
    updateAgentState: (handler: (state: AgentState) => AgentState) => {
      this.currentSession?.updateAgentState(handler);
    },
  };
  private readonly projector = new BrokerEventProjector(this.proxySession);

  private attachedBrokerSessionId: string | null = null;
  private currentSession: RelaySession | null = null;
  private reconnectionHandle: OfflineReconnectionHandle | null = null;
  private isRunning = false;
  private historyBackfillComplete = false;
  private historyBackfillPromise: Promise<void> | null = null;
  private resolveRun!: () => void;
  private rejectRun!: (error: Error) => void;
  private settled = false;

  constructor(private readonly options: BrokerRelayRunnerOptions) {
    if (options.brokerEventStream) {
      this.brokerEventStream = options.brokerEventStream;
    } else if (options.brokerUrl) {
      this.brokerEventStream = new BrokerEventStream(options.brokerUrl);
    } else {
      throw new Error('brokerUrl or brokerEventStream is required');
    }
    this.setupReconnect = options.setupOfflineReconnection;

    this.runPromise = new Promise<void>((resolve, reject) => {
      this.resolveRun = resolve;
      this.rejectRun = reject;
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Broker relay runner already started');
    }
    this.isRunning = true;

    try {
      await this.options.api.getOrCreateMachine({
        machineId: this.options.machineId,
        metadata: this.options.machineMetadata,
      });

      const snapshot = await this.options.brokerClient.attachSession(this.options.brokerSessionId);
      if (!snapshot) {
        throw new Error(`Broker session not found: ${this.options.brokerSessionId}`);
      }

      this.attachedBrokerSessionId = snapshot.brokerSessionId;
      const { metadata, state } = createSessionMetadata({
        flavor: snapshot.provider,
        machineId: this.options.machineId,
        startedBy: this.options.startedBy,
        source: 'broker_attached',
        brokerSessionId: snapshot.brokerSessionId,
        brokerCapabilities: snapshot.capabilities,
        brokerDegradedFlags: snapshot.degradedFlags,
        brokerDesiredMode: snapshot.desiredMode,
        brokerEffectiveMode: snapshot.effectiveMode,
        brokerModeReason: snapshot.modeReason,
        brokerCompatibility: snapshot.compatibility,
        brokerProviderExtension: snapshot.providerExtension,
        brokerProbeHealth: snapshot.probeHealth,
        windowInstanceId: this.options.brokerWindowInstanceId,
        brokerWindowLabel: this.options.brokerWindowLabel,
        brokerWorkspaceLabel: this.options.brokerWorkspaceLabel,
        brokerWorkspacePath: this.options.brokerWorkspacePath,
        brokerWindowOrdinal: this.options.brokerWindowOrdinal,
        brokerWindowIsActive: this.options.brokerWindowIsActive,
        brokerWindowLastActiveAt: this.options.brokerWindowLastActiveAt,
      });
      const sessionTag =
        this.options.sessionTag ??
        buildBrokerSessionTag({
          machineId: this.options.machineId,
          brokerSessionId: snapshot.brokerSessionId,
        });
      const response = await this.options.api.getOrCreateSession({
        tag: sessionTag,
        metadata,
        state,
      });
      const setupResult = this.setupReconnect({
        api: this.options.api,
        metadata,
        onSessionSwap: (session) => {
          this.currentSession = session;
          this.bindSession(session);
          void this.scheduleAttachedHistoryBackfill(snapshot, session);
        },
        response,
        sessionTag,
        state,
      });

      this.currentSession = setupResult.session;
      this.reconnectionHandle = setupResult.reconnectionHandle;
      this.bindSession(setupResult.session);
      void this.scheduleAttachedHistoryBackfill(snapshot, setupResult.session);
      this.projector.applyEvent({
        type: 'session.snapshot',
        snapshot,
      });

      if (response && this.options.notifyDaemonSessionStarted) {
        await this.options.notifyDaemonSessionStarted(response.id, metadata);
      }

      await this.brokerEventStream.subscribeEvents(
        snapshot.brokerSessionId,
        (entry) => {
          this.projector.applyEvent(entry.event);
        },
        {
          onDisconnect: (reason) => {
            this.handleDisconnect(reason);
          },
        },
      );

      await this.runPromise;
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.reconnectionHandle?.cancel();
    this.reconnectionHandle = null;
    await this.brokerEventStream.close();
    this.finish();
  }

  private bindSession(session: RelaySession): void {
    session.onUserMessage(async (message) => {
      await this.handleUserMessage(message);
    });
    session.rpcHandlerManager.registerHandler('abort', async (params: { reason?: string }) => {
      const reason = params?.reason ?? 'user_abort';
      return this.options.brokerClient.interruptSession(this.requireBrokerSessionId(), reason);
    });
    session.rpcHandlerManager.registerHandler('permission', async (params: SessionPermissionRequest) => {
      return this.options.brokerClient.resolveApproval(
        this.requireBrokerSessionId(),
        params.id,
        params.approved ? 'approve' : 'deny',
      );
    });
  }

  private async handleUserMessage(message: UserMessage): Promise<void> {
    const text = message.content.text;
    if (!text) {
      return;
    }

    const sent = await this.options.brokerClient.sendMessage(this.requireBrokerSessionId(), text);
    if (sent) {
      this.projector.rememberOutboundUserText(text);
    }
  }

  private handleDisconnect(reason: BrokerEventStreamDisconnectReason): void {
    if (reason.kind === 'error') {
      this.fail(reason.error);
      return;
    }

    this.finish();
  }

  private requireBrokerSessionId(): string {
    if (!this.attachedBrokerSessionId) {
      throw new Error('Broker relay runner not attached');
    }
    return this.attachedBrokerSessionId;
  }

  private finish(): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.resolveRun();
  }

  private scheduleAttachedHistoryBackfill(
    snapshot: BrokerAttachSnapshot,
    session: RelaySession,
  ): Promise<void> {
    if (this.historyBackfillComplete) {
      return Promise.resolve();
    }
    if (this.historyBackfillPromise) {
      return this.historyBackfillPromise;
    }

    this.historyBackfillPromise = this.runAttachedHistoryBackfill(snapshot, session)
      .catch(() => {})
      .finally(() => {
        this.historyBackfillPromise = null;
      });

    return this.historyBackfillPromise;
  }

  private async runAttachedHistoryBackfill(
    snapshot: BrokerAttachSnapshot,
    session: RelaySession,
  ): Promise<void> {
    if (this.historyBackfillComplete) {
      return;
    }

    const providerSessionRef =
      snapshot.runtimeProviderSessionRef ?? snapshot.storageProviderSessionRef ?? null;
    if (!providerSessionRef) {
      return;
    }

    for (let i = 0; i < 15 && !session.isConnected?.(); i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (!session.isConnected?.()) {
      return;
    }

    if (snapshot.provider === 'claude') {
      if (!this.options.brokerWorkspacePath || !session.sendClaudeSessionMessageBatch) {
        return;
      }

      await backfillClaudeSessionHistory({
        workingDirectory: this.options.brokerWorkspacePath,
        sessionId: providerSessionRef,
        sendBatch: async (messages) => {
          await session.sendClaudeSessionMessageBatch?.(messages, 'replace');
        },
      });
      this.historyBackfillComplete = true;
      return;
    }

    if (snapshot.provider === 'codex') {
      if (!session.sendBackfillBatch) {
        return;
      }

      await backfillCodexSessionHistory({
        sessionIdOrPath: providerSessionRef,
        sendBatch: async (messages) => {
          await session.sendBackfillBatch?.(messages, 'replace');
        },
      });
      this.historyBackfillComplete = true;
    }
  }

  private fail(error: Error): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.rejectRun(error);
  }
}
