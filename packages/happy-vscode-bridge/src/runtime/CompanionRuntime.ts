import type {
  BrokerProvider,
} from 'happy-wire';

import type {
  BridgeAttachmentRef,
  BridgeBrokerEvent,
  BridgeDesiredMode,
} from '../broker/bridgeTypes';
import type { BrokerEditorContext, ProviderEvent } from '../providers/types';
import { ProviderHostRegistry } from './ProviderHostRegistry';
import { ProviderSessionNormalizer } from './ProviderSessionNormalizer';
import { SessionModeResolver } from './SessionModeResolver';
import { UnifiedSessionRuntimeStore } from './UnifiedSessionRuntimeStore';
import type {
  BridgeBrokerDiscoveredSession,
  BridgeBrokerSnapshot,
  DesiredMode,
  NormalizedProviderSession,
  RuntimeSessionEvidence,
  StorageSessionEvidence,
} from './types';
import type {
  ProviderHostResolution,
  RuntimeProbe,
  StorageProbe,
} from './probes/types';

export type CompanionProviderState = {
  resolution: ProviderHostResolution;
  runtimeProbe?: RuntimeProbe;
  storageProbe?: StorageProbe;
};

export type CompanionProviderStateMap = Partial<
  Record<BrokerProvider, CompanionProviderState>
>;

export type ProviderProbeFactory = (
  resolution: ProviderHostResolution,
) =>
  | Promise<Pick<CompanionProviderState, 'runtimeProbe' | 'storageProbe'>>
  | Pick<CompanionProviderState, 'runtimeProbe' | 'storageProbe'>;

type CompanionRuntimeOptions = {
  providerStates?: CompanionProviderStateMap;
  registry?: ProviderHostRegistry;
  probeFactories?: Partial<Record<BrokerProvider, ProviderProbeFactory>>;
  normalizer?: ProviderSessionNormalizer;
  store?: UnifiedSessionRuntimeStore;
  createModeResolver?: () => SessionModeResolver;
};

type ProviderSessionSourceRecord = {
  provider: BrokerProvider;
  resolution: ProviderHostResolution;
  runtime?: RuntimeSessionEvidence;
  storage?: StorageSessionEvidence;
  normalized: NormalizedProviderSession;
};

type SessionWatchRecord = {
  listeners: Set<(event: BridgeBrokerEvent) => void>;
  cleanup: () => void | Promise<void>;
};

const supportedProviders: BrokerProvider[] = ['claude', 'codex'];

function uniqueById(attachments: BridgeAttachmentRef[]): BridgeAttachmentRef[] {
  const byId = new Map<string, BridgeAttachmentRef>();

  for (const attachment of attachments) {
    byId.set(attachment.id, attachment);
  }

  return [...byId.values()];
}

function hasIntersection(left: string[] | undefined, right: string[] | undefined): boolean {
  if (!left?.length || !right?.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.some((value) => rightSet.has(value));
}

function sessionsMatch(
  runtime: RuntimeSessionEvidence,
  storage: StorageSessionEvidence,
): boolean {
  if (
    runtime.conversationId &&
    storage.conversationId &&
    runtime.conversationId === storage.conversationId
  ) {
    return true;
  }

  if (
    storage.providerSessionRef &&
    runtime.providerSessionRef === storage.providerSessionRef
  ) {
    return true;
  }

  return hasIntersection(runtime.transcriptObjectIds, storage.transcriptObjectIds);
}

function toDesiredMode(mode: BridgeDesiredMode): DesiredMode {
  return mode;
}

function toRuntimeStatus(runtime: RuntimeSessionEvidence | undefined) {
  if (!runtime) {
    return {
      status: 'unavailable' as const,
    };
  }

  const degraded =
    (runtime.degradedFlags?.length ?? 0) > 0 ||
    runtime.attachability === 'attachable_with_degraded_capabilities' ||
    runtime.attachability === 'not_attachable';

  return {
    status: degraded ? ('degraded' as const) : ('ready' as const),
    capabilities: runtime.capabilities,
    degradedFlags: runtime.degradedFlags,
    attachability: runtime.attachability,
  };
}

function toStorageStatus(storage: StorageSessionEvidence | undefined) {
  if (!storage) {
    return {
      status: 'unavailable' as const,
    };
  }

  return {
    status: 'ready' as const,
    lastUpdatedAt: Date.now(),
    capabilities: storage.capabilities,
    degradedFlags: storage.degradedFlags,
    attachability: storage.attachability,
  };
}

function toBrokerEvent(
  brokerSessionId: string,
  event: ProviderEvent,
): BridgeBrokerEvent | null {
  if ('brokerSessionId' in event) {
    return event as unknown as BridgeBrokerEvent;
  }

  switch (event.type) {
    case 'session.message.delta':
    case 'session.run.status':
    case 'session.approval.requested':
    case 'session.approval.resolved':
    case 'session.approval.dismissed':
    case 'session.interrupt':
    case 'session.attachment.added':
      return {
        type: event.type,
        brokerSessionId,
        payload: event.payload,
      } as unknown as BridgeBrokerEvent;
    default:
      return null;
  }
}

function toProviderStateMap(
  providerStates: CompanionProviderStateMap | undefined,
): CompanionProviderStateMap {
  return providerStates ?? {};
}

export interface CompanionRuntimeLike {
  refresh(): Promise<BridgeBrokerDiscoveredSession[]>;
  listDiscoveredSessions(): BridgeBrokerDiscoveredSession[];
  attachSession(brokerSessionId: string): Promise<BridgeBrokerSnapshot | null>;
  sendMessage(brokerSessionId: string, text: string): Promise<void>;
  interruptSession(brokerSessionId: string, reason: string): Promise<void>;
  resolveApproval(
    brokerSessionId: string,
    approvalId: string,
    decision: 'approve' | 'deny',
  ): Promise<void>;
  captureEditorContext(brokerSessionId: string): Promise<BrokerEditorContext | null>;
  listAttachments(brokerSessionId: string): Promise<BridgeAttachmentRef[]>;
  setSessionDesiredMode(
    brokerSessionId: string,
    desiredMode: BridgeDesiredMode,
  ): Promise<BridgeBrokerDiscoveredSession>;
  watchBrokerEvents(
    brokerSessionId: string,
    onEvent: (event: BridgeBrokerEvent) => void,
  ): Promise<() => void>;
  subscribe(listener: () => void): () => void;
  dispose(): Promise<void>;
}

export class CompanionRuntime implements CompanionRuntimeLike {
  private readonly registry?: ProviderHostRegistry;
  private readonly probeFactories: Partial<Record<BrokerProvider, ProviderProbeFactory>>;
  private readonly normalizer: ProviderSessionNormalizer;
  private readonly store: UnifiedSessionRuntimeStore;
  private readonly createModeResolver: () => SessionModeResolver;

  private providerStates: CompanionProviderStateMap;
  private readonly desiredModes = new Map<string, DesiredMode>();
  private readonly modeResolvers = new Map<string, SessionModeResolver>();
  private readonly sessionSources = new Map<string, ProviderSessionSourceRecord>();
  private readonly listeners = new Set<() => void>();
  private readonly attachments = new Map<string, BridgeAttachmentRef[]>();
  private readonly sessionWatches = new Map<string, SessionWatchRecord>();

  constructor(options: CompanionRuntimeOptions = {}) {
    this.registry = options.registry;
    this.probeFactories = options.probeFactories ?? {};
    this.normalizer = options.normalizer ?? new ProviderSessionNormalizer();
    this.store = options.store ?? new UnifiedSessionRuntimeStore();
    this.createModeResolver = options.createModeResolver ?? (() => new SessionModeResolver());
    this.providerStates = toProviderStateMap(options.providerStates);
  }

  static async create(options: CompanionRuntimeOptions = {}): Promise<CompanionRuntime> {
    const runtime = new CompanionRuntime(options);
    await runtime.refresh();
    return runtime;
  }

  async refresh(): Promise<BridgeBrokerDiscoveredSession[]> {
    this.providerStates = await this.resolveProviderStates();
    const nextKeys = new Set<string>();
    const nextSources = new Map<string, ProviderSessionSourceRecord>();

    for (const provider of supportedProviders) {
      const state = this.providerStates[provider];
      if (!state) {
        continue;
      }

      const runtimeSessions = state.runtimeProbe
        ? await state.runtimeProbe.discoverSessions()
        : [];
      const storageSessions = state.storageProbe
        ? await state.storageProbe.discoverSessions()
        : [];

      for (const sourceRecord of this.normalizeProviderSessions({
        provider,
        resolution: state.resolution,
        runtimeSessions,
        storageSessions,
      })) {
        nextKeys.add(sourceRecord.normalized.providerSessionKey);
        nextSources.set(sourceRecord.normalized.providerSessionKey, sourceRecord);
        this.projectSourceRecord(sourceRecord);
      }
    }

    this.sessionSources.clear();
    for (const [key, sourceRecord] of nextSources.entries()) {
      this.sessionSources.set(key, sourceRecord);
    }

    this.store.pruneExcept(nextKeys);
    this.notify();
    return this.listDiscoveredSessions();
  }

  listDiscoveredSessions(): BridgeBrokerDiscoveredSession[] {
    return this.store.listDiscoveredSessions();
  }

  async attachSession(brokerSessionId: string): Promise<BridgeBrokerSnapshot | null> {
    const record = await this.resolveRecord(brokerSessionId);
    if (!record) {
      return null;
    }

    return this.store.getSnapshot(record.brokerSessionId) ?? null;
  }

  async sendMessage(brokerSessionId: string, text: string): Promise<void> {
    const { runtimeProbe, runtimeProviderSessionRef } =
      await this.resolveRuntimeControlTarget(brokerSessionId);

    if (!runtimeProbe.sendMessage) {
      throw new Error(`Broker session ${brokerSessionId} does not support sendMessage`);
    }

    await runtimeProbe.sendMessage(runtimeProviderSessionRef, text);
  }

  async interruptSession(brokerSessionId: string, reason: string): Promise<void> {
    const { runtimeProbe, runtimeProviderSessionRef } =
      await this.resolveRuntimeControlTarget(brokerSessionId);

    if (!runtimeProbe.interrupt) {
      throw new Error(`Broker session ${brokerSessionId} does not support interrupt`);
    }

    await runtimeProbe.interrupt(runtimeProviderSessionRef, reason);
  }

  async resolveApproval(
    brokerSessionId: string,
    approvalId: string,
    decision: 'approve' | 'deny',
  ): Promise<void> {
    const { runtimeProbe, runtimeProviderSessionRef } =
      await this.resolveRuntimeControlTarget(brokerSessionId);

    if (!runtimeProbe.resolveApproval) {
      throw new Error(`Broker session ${brokerSessionId} does not support approvals`);
    }

    await runtimeProbe.resolveApproval(runtimeProviderSessionRef, approvalId, decision);
  }

  async captureEditorContext(
    brokerSessionId: string,
  ): Promise<BrokerEditorContext | null> {
    const record = await this.resolveRecord(brokerSessionId);
    if (!record?.runtimeProviderSessionRef) {
      return null;
    }

    const runtimeProbe = this.providerStates[record.provider]?.runtimeProbe;
    if (!runtimeProbe?.captureEditorContext) {
      return null;
    }

    return runtimeProbe.captureEditorContext(record.runtimeProviderSessionRef);
  }

  async listAttachments(brokerSessionId: string): Promise<BridgeAttachmentRef[]> {
    const record = await this.resolveRecord(brokerSessionId);
    if (!record?.runtimeProviderSessionRef) {
      return [...(this.attachments.get(brokerSessionId) ?? [])];
    }

    const runtimeProbe = this.providerStates[record.provider]?.runtimeProbe;
    if (!runtimeProbe?.listAttachments) {
      return [...(this.attachments.get(brokerSessionId) ?? [])];
    }

    const discovered = await runtimeProbe.listAttachments(record.runtimeProviderSessionRef);
    const merged = uniqueById([
      ...(this.attachments.get(brokerSessionId) ?? []),
      ...discovered,
    ]);
    this.attachments.set(brokerSessionId, merged);
    return [...merged];
  }

  async setSessionDesiredMode(
    brokerSessionId: string,
    desiredMode: BridgeDesiredMode,
  ): Promise<BridgeBrokerDiscoveredSession> {
    const record = await this.resolveRecord(brokerSessionId);
    if (!record) {
      throw new Error(`Unknown broker session: ${brokerSessionId}`);
    }

    this.desiredModes.set(record.providerSessionKey, toDesiredMode(desiredMode));
    const sourceRecord = this.sessionSources.get(record.providerSessionKey);
    if (!sourceRecord) {
      throw new Error(`No cached session sources for broker session: ${brokerSessionId}`);
    }

    this.projectSourceRecord(sourceRecord);
    this.notify();

    const updated = this.listDiscoveredSessions().find(
      (session) => session.brokerSessionId === brokerSessionId,
    );
    if (!updated) {
      throw new Error(`Unknown broker session: ${brokerSessionId}`);
    }

    return updated;
  }

  async watchBrokerEvents(
    brokerSessionId: string,
    onEvent: (event: BridgeBrokerEvent) => void,
  ): Promise<() => void> {
    const watch = await this.ensureSessionWatch(brokerSessionId);
    if (!watch) {
      return () => {};
    }

    watch.listeners.add(onEvent);

    return () => {
      watch.listeners.delete(onEvent);
      if (watch.listeners.size > 0) {
        return;
      }

      this.sessionWatches.delete(brokerSessionId);
      void watch.cleanup();
    };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async dispose(): Promise<void> {
    await Promise.all(
      Array.from(this.sessionWatches.values(), (watch) => watch.cleanup()),
    );
    this.sessionWatches.clear();
    this.listeners.clear();
  }

  private async resolveProviderStates(): Promise<CompanionProviderStateMap> {
    if (!this.registry) {
      return this.providerStates;
    }

    const providerStates: CompanionProviderStateMap = {};

    for (const provider of supportedProviders) {
      const resolution = await this.registry.resolve(provider);
      const factory = this.probeFactories[provider];
      const probes = factory ? await factory(resolution) : {};
      providerStates[provider] = {
        resolution,
        ...probes,
      };
    }

    return providerStates;
  }

  private normalizeProviderSessions(params: {
    provider: BrokerProvider;
    resolution: ProviderHostResolution;
    runtimeSessions: RuntimeSessionEvidence[];
    storageSessions: StorageSessionEvidence[];
  }): ProviderSessionSourceRecord[] {
    const remainingStorage = new Set(params.storageSessions.map((_session, index) => index));
    const sourceRecords: ProviderSessionSourceRecord[] = [];

    for (const runtimeSession of params.runtimeSessions) {
      const storageIndex = params.storageSessions.findIndex(
        (storageSession, index) =>
          remainingStorage.has(index) &&
          sessionsMatch(runtimeSession, storageSession),
      );
      const storageSession =
        storageIndex >= 0 ? params.storageSessions[storageIndex] : undefined;
      if (storageIndex >= 0) {
        remainingStorage.delete(storageIndex);
      }

      sourceRecords.push(
        this.createSourceRecord({
          provider: params.provider,
          resolution: params.resolution,
          runtime: runtimeSession,
          storage: storageSession,
        }),
      );
    }

    for (const storageIndex of remainingStorage) {
      sourceRecords.push(
        this.createSourceRecord({
          provider: params.provider,
          resolution: params.resolution,
          storage: params.storageSessions[storageIndex],
        }),
      );
    }

    return sourceRecords;
  }

  private createSourceRecord(params: {
    provider: BrokerProvider;
    resolution: ProviderHostResolution;
    runtime?: RuntimeSessionEvidence;
    storage?: StorageSessionEvidence;
  }): ProviderSessionSourceRecord {
    return {
      provider: params.provider,
      resolution: params.resolution,
      runtime: params.runtime,
      storage: params.storage,
      normalized: this.normalizer.normalize({
        provider: params.provider,
        providerExtensionId: params.resolution.providerExtension.id,
        runtime: params.runtime,
        storage: params.storage,
      }),
    };
  }

  private projectSourceRecord(sourceRecord: ProviderSessionSourceRecord): void {
    const providerSessionKey = sourceRecord.normalized.providerSessionKey;
    const desiredMode =
      this.desiredModes.get(providerSessionKey) ?? 'runtime_preferred';
    const modeResolver = this.modeResolvers.get(providerSessionKey) ?? this.createModeResolver();
    this.modeResolvers.set(providerSessionKey, modeResolver);

    const modeResolution = modeResolver.resolve({
      desiredMode,
      runtime: toRuntimeStatus(sourceRecord.runtime),
      storage: toStorageStatus(sourceRecord.storage),
      baseAttachability: sourceRecord.normalized.attachability,
    });

    this.store.upsert({
      provider: sourceRecord.provider,
      providerSessionKey,
      providerSessionRef: sourceRecord.normalized.providerSessionRef,
      title: sourceRecord.normalized.title,
      latestSeq: sourceRecord.normalized.latestSeq,
      desiredMode,
      effectiveMode: modeResolution.effectiveMode,
      modeReason: modeResolution.modeReason,
      compatibility: sourceRecord.resolution.compatibility,
      providerExtension: sourceRecord.resolution.providerExtension,
      probeHealth: modeResolution.probeHealth,
      attachability: modeResolution.attachability,
      capabilities: modeResolution.capabilities,
      degradedFlags: modeResolution.degradedFlags,
      workspaceIdentity: sourceRecord.normalized.workspaceIdentity,
      conversationIdentity: sourceRecord.normalized.conversationIdentity,
      runtimeProviderSessionRef: sourceRecord.normalized.runtimeProviderSessionRef,
      storageProviderSessionRef: sourceRecord.normalized.storageProviderSessionRef,
    });
  }

  private async resolveRecord(brokerSessionId: string) {
    const existing = this.store.getRecord(brokerSessionId);
    if (existing) {
      return existing;
    }

    await this.refresh();
    return this.store.getRecord(brokerSessionId);
  }

  private async resolveRuntimeControlTarget(brokerSessionId: string) {
    const record = await this.resolveRecord(brokerSessionId);
    if (!record) {
      throw new Error(`Unknown broker session: ${brokerSessionId}`);
    }

    if (record.effectiveMode !== 'runtime' || !record.runtimeProviderSessionRef) {
      throw new Error(`Broker session ${brokerSessionId} is not in runtime mode`);
    }

    const runtimeProbe = this.providerStates[record.provider]?.runtimeProbe;
    if (!runtimeProbe) {
      throw new Error(`No runtime probe available for broker session ${brokerSessionId}`);
    }

    return {
      record,
      runtimeProbe,
      runtimeProviderSessionRef: record.runtimeProviderSessionRef,
    };
  }

  private async ensureSessionWatch(
    brokerSessionId: string,
  ): Promise<SessionWatchRecord | null> {
    const existing = this.sessionWatches.get(brokerSessionId);
    if (existing) {
      return existing;
    }

    const record = await this.resolveRecord(brokerSessionId);
    if (!record?.runtimeProviderSessionRef) {
      return null;
    }

    const runtimeProbe = this.providerStates[record.provider]?.runtimeProbe;
    if (!runtimeProbe?.watchSession) {
      return null;
    }

    const listeners = new Set<(event: BridgeBrokerEvent) => void>();
    const cleanup = await runtimeProbe.watchSession(
      record.runtimeProviderSessionRef,
      (providerEvent) => {
        if (providerEvent.type === 'session.attachment.added') {
          const attachment = (
            providerEvent.payload as { attachment?: BridgeAttachmentRef } | undefined
          )?.attachment;
          if (attachment) {
            const current = this.attachments.get(brokerSessionId) ?? [];
            this.attachments.set(
              brokerSessionId,
              uniqueById([...current, attachment]),
            );
          }
        }

        const brokerEvent = toBrokerEvent(brokerSessionId, providerEvent);
        if (!brokerEvent) {
          return;
        }

        if (brokerEvent.type === 'session.attachment.added') {
          const current = this.attachments.get(brokerSessionId) ?? [];
          this.attachments.set(
            brokerSessionId,
            uniqueById([...current, brokerEvent.payload.attachment]),
          );
        }

        for (const listener of listeners) {
          listener(brokerEvent);
        }
      },
    );

    const watch = {
      listeners,
      cleanup,
    };
    this.sessionWatches.set(brokerSessionId, watch);
    return watch;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
