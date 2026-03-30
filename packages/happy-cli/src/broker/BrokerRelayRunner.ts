import type { ApiClient } from '../api/api';
import type { ApiSessionClient } from '../api/apiSession';
import type { AgentState, MachineMetadata, Metadata, Session, UserMessage } from '../api/types';
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
type BrokerRelayEventStream = Pick<BrokerEventStream, 'subscribeEvents' | 'close'>;
type RelaySession = Pick<
  ApiSessionClient,
  | 'keepAlive'
  | 'onUserMessage'
  | 'rpcHandlerManager'
  | 'sendAgentMessage'
  | 'sessionId'
  | 'updateAgentState'
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
  machineMetadata: MachineMetadata;
  machineId: string;
  brokerMachineId?: string;
  brokerInstanceId?: string;
  canonicalBrokerSessionKey?: string;
  runtimeKind?: string;
  runtimeLabel?: string;
  windowLabel?: string;
  preferredHostIp?: string;
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
    updateAgentState: (handler: (state: AgentState) => AgentState) => {
      this.currentSession?.updateAgentState(handler);
    },
  };
  private readonly projector = new BrokerEventProjector(this.proxySession);

  private attachedBrokerSessionId: string | null = null;
  private currentSession: RelaySession | null = null;
  private reconnectionHandle: OfflineReconnectionHandle | null = null;
  private isRunning = false;
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
      const canonicalBrokerSessionKey =
        this.options.canonicalBrokerSessionKey
        ?? `${this.options.brokerMachineId ?? this.options.machineId}:${this.options.brokerInstanceId ?? 'legacy'}:${snapshot.brokerSessionId}`;
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
        transport: {
          kind: 'vscode-broker',
          brokerMachineId: this.options.brokerMachineId ?? this.options.machineId,
          brokerInstanceId: this.options.brokerInstanceId ?? 'legacy',
          brokerSessionId: snapshot.brokerSessionId,
          canonicalBrokerSessionKey,
          runtimeKind: this.options.runtimeKind,
          runtimeLabel: this.options.runtimeLabel,
          windowLabel: this.options.windowLabel,
          preferredHostIp: this.options.preferredHostIp,
        },
      });
      const sessionTag =
        this.options.sessionTag ??
        buildBrokerSessionTag({
          machineId: this.options.machineId,
          canonicalSessionKey: canonicalBrokerSessionKey,
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
        },
        response,
        sessionTag,
        state,
      });

      this.currentSession = setupResult.session;
      this.reconnectionHandle = setupResult.reconnectionHandle;
      this.bindSession(setupResult.session);
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

  private fail(error: Error): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.rejectRun(error);
  }
}
