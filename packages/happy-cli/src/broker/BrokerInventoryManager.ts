import type {
  BrokerInventoryInstance,
  BrokerInventoryInstanceStatus,
  BrokerInventorySession,
  BrokerInventorySummary,
  BrokerInstanceManifest,
} from '../../../happy-wire/src/brokerProtocol';

import type { BrokerDiscoveredSession } from './brokerTypes';
import { BrokerClient } from './BrokerClient';
import {
  loadBrokerManifestConnections,
  type BrokerManifestConnection,
} from './brokerManifest';

type BrokerDiscoverClient = Pick<BrokerClient, 'discoverSessions'>;

type BrokerInventoryManagerOptions = {
  machineId: string;
  happyHomeDir?: string;
  now?: () => number;
  cleanupAfterMs?: number;
  loadConnections?: () => Promise<BrokerManifestConnection[]>;
  createClient?: (brokerUrl: string) => BrokerDiscoverClient;
  deleteManifest?: (manifestPath: string) => Promise<void>;
};

type AttachTargetInput = {
  canonicalSessionKey?: string;
  instanceId?: string;
  brokerSessionId?: string;
};

type AttachTarget = {
  canonicalSessionKey: string;
  instanceId: string;
  brokerSessionId: string;
  brokerUrl: string;
  manifestPath: string;
  manifest: BrokerInstanceManifest;
};

type CandidateConnection = BrokerManifestConnection & {
  ageMs: number;
  status: BrokerInventoryInstanceStatus;
};

export class BrokerInventoryManager {
  private readonly machineId: string;
  private readonly now: () => number;
  private readonly cleanupAfterMs: number;
  private readonly loadConnections: () => Promise<BrokerManifestConnection[]>;
  private readonly createClient: (brokerUrl: string) => BrokerDiscoverClient;
  private readonly deleteManifest: (manifestPath: string) => Promise<void>;

  constructor(options: BrokerInventoryManagerOptions) {
    this.machineId = options.machineId;
    this.now = options.now ?? Date.now;
    this.cleanupAfterMs = options.cleanupAfterMs ?? 60_000;
    this.loadConnections =
      options.loadConnections ??
      (() => loadBrokerManifestConnections(options.happyHomeDir ?? '.'));
    this.createClient = options.createClient ?? ((brokerUrl) => new BrokerClient(brokerUrl));
    this.deleteManifest = options.deleteManifest ?? (async () => {});
  }

  async buildSummary(): Promise<BrokerInventorySummary> {
    const updatedAt = this.now();
    const candidates = await this.classifyConnections(updatedAt);
    const onlineConnections = candidates.filter(
      (candidate) => candidate.status === 'online',
    );

    const discoveredByInstance = await Promise.all(
      onlineConnections.map(async (candidate) => {
        try {
          const client = this.createClient(candidate.brokerUrl);
          const sessions = await client.discoverSessions();
          return [
            candidate.manifest.instanceId,
            sessions,
          ] as [string, BrokerDiscoveredSession[]];
        } catch {
          return [
            candidate.manifest.instanceId,
            [],
          ] as [string, BrokerDiscoveredSession[]];
        }
      }),
    );

    const sessionsByInstance = new Map<string, BrokerDiscoveredSession[]>(
      discoveredByInstance,
    );

    return {
      updatedAt,
      instances: candidates
        .map((candidate) => this.toInventoryInstance(candidate, updatedAt))
        .sort(compareInventoryInstances),
      sessions: onlineConnections
        .flatMap((candidate) =>
          (sessionsByInstance.get(candidate.manifest.instanceId) ?? []).map((session) =>
            this.toInventorySession(candidate, session, updatedAt),
          ),
        )
        .sort((left, right) => right.lastActiveAt - left.lastActiveAt),
    };
  }

  async resolveAttachTarget(input: AttachTargetInput): Promise<AttachTarget> {
    const summary = await this.buildSummary();
    const parsedKey = input.canonicalSessionKey
      ? parseCanonicalSessionKey(input.canonicalSessionKey)
      : null;
    const instanceId = input.instanceId ?? parsedKey?.instanceId;
    const brokerSessionId = input.brokerSessionId ?? parsedKey?.brokerSessionId;

    if (!instanceId || !brokerSessionId) {
      throw new Error('session_not_found');
    }

    const session = summary.sessions.find(
      (candidate) =>
        candidate.instanceId === instanceId &&
        candidate.brokerSessionId === brokerSessionId,
    );
    if (!session) {
      throw new Error('session_not_found');
    }

    const candidates = await this.classifyConnections(this.now());
    const connection = candidates.find(
      (candidate) =>
        candidate.status === 'online' &&
        candidate.manifest.instanceId === session.instanceId,
    );

    if (!connection) {
      throw new Error('instance_not_found');
    }

    return {
      canonicalSessionKey: session.canonicalSessionKey,
      instanceId: session.instanceId,
      brokerSessionId: session.brokerSessionId,
      brokerUrl: connection.brokerUrl,
      manifestPath: connection.manifestPath,
      manifest: connection.manifest,
    };
  }

  private async classifyConnections(now: number): Promise<CandidateConnection[]> {
    const loaded = await this.loadConnections();
    const activeCandidates = await Promise.all(
      loaded.map(async (connection) => {
        const ageMs = Math.max(0, now - connection.manifest.lastHeartbeatAt);
        if (ageMs > this.cleanupAfterMs) {
          await this.deleteManifest(connection.manifestPath);
          return null;
        }

        return {
          ...connection,
          ageMs,
          status: 'stale' as BrokerInventoryInstanceStatus,
        };
      }),
    );

    const candidates = activeCandidates.filter(
      (candidate): candidate is CandidateConnection => candidate !== null,
    );
    const byLogicalWindowKey = new Map<string, CandidateConnection[]>();

    for (const candidate of candidates) {
      const group = byLogicalWindowKey.get(candidate.manifest.logicalWindowKey);
      if (group) {
        group.push(candidate);
      } else {
        byLogicalWindowKey.set(candidate.manifest.logicalWindowKey, [candidate]);
      }
    }

    for (const group of byLogicalWindowKey.values()) {
      group.sort(
        (left, right) =>
          right.manifest.lastHeartbeatAt - left.manifest.lastHeartbeatAt,
      );

      const onlineGroup = group.filter(
        (candidate) => candidate.ageMs <= candidate.manifest.ttlMs,
      );

      if (onlineGroup.length === 0) {
        for (const candidate of group) {
          candidate.status = 'stale';
        }
        continue;
      }

      const primary = onlineGroup[0];
      for (const candidate of group) {
        if (candidate.ageMs > candidate.manifest.ttlMs) {
          candidate.status = 'stale';
        } else if (candidate.manifest.instanceId === primary?.manifest.instanceId) {
          candidate.status = 'online';
        } else {
          candidate.status = 'shadowed';
        }
      }
    }

    return candidates;
  }

  private toInventoryInstance(
    candidate: CandidateConnection,
    updatedAt: number,
  ): BrokerInventoryInstance {
    return {
      installationId: candidate.manifest.installationId,
      instanceId: candidate.manifest.instanceId,
      logicalWindowKey: candidate.manifest.logicalWindowKey,
      ...(candidate.manifest.editorSessionId
        ? { editorSessionId: candidate.manifest.editorSessionId }
        : {}),
      ...(candidate.manifest.machineId
        ? { machineId: candidate.manifest.machineId }
        : {}),
      windowLabel: candidate.manifest.windowLabel,
      workspaceFolders: [...candidate.manifest.workspaceFolders],
      runtimeKind: candidate.manifest.runtimeKind,
      runtimeLabel: candidate.manifest.runtimeLabel,
      bridgeHostIps: [...candidate.manifest.bridgeHostIps],
      ...(candidate.manifest.preferredHostIp
        ? { preferredHostIp: candidate.manifest.preferredHostIp }
        : {}),
      ...(candidate.manifest.runtimeIp
        ? { runtimeIp: candidate.manifest.runtimeIp }
        : {}),
      providerKinds: [...candidate.manifest.providerKinds],
      startedAt: candidate.manifest.startedAt,
      lastSeenAt: Math.min(updatedAt, candidate.manifest.lastHeartbeatAt),
      ttlMs: candidate.manifest.ttlMs,
      status: candidate.status,
    };
  }

  private toInventorySession(
    candidate: CandidateConnection,
    session: BrokerDiscoveredSession,
    updatedAt: number,
  ): BrokerInventorySession {
    return {
      canonicalSessionKey: buildCanonicalSessionKey(
        this.machineId,
        candidate.manifest.instanceId,
        session.brokerSessionId,
      ),
      instanceId: candidate.manifest.instanceId,
      brokerSessionId: session.brokerSessionId,
      providerSessionKey:
        'providerSessionKey' in session &&
        typeof session.providerSessionKey === 'string' &&
        session.providerSessionKey.length > 0
          ? session.providerSessionKey
          : session.brokerSessionId,
      provider: session.provider,
      title: session.title,
      attachability: session.attachability,
      capabilities: [...session.capabilities],
      degradedFlags: [...session.degradedFlags],
      desiredMode: session.desiredMode,
      effectiveMode: session.effectiveMode,
      modeReason: session.modeReason,
      compatibility: session.compatibility,
      providerExtension: session.providerExtension,
      probeHealth: session.probeHealth,
      lastActiveAt:
        'lastActiveAt' in session && typeof session.lastActiveAt === 'number'
          ? session.lastActiveAt
          : updatedAt,
      ...('messagePreview' in session &&
      typeof session.messagePreview === 'string'
        ? { messagePreview: session.messagePreview }
        : {}),
    };
  }
}

function buildCanonicalSessionKey(
  machineId: string,
  instanceId: string,
  brokerSessionId: string,
): string {
  return `${machineId}:${instanceId}:${brokerSessionId}`;
}

function parseCanonicalSessionKey(
  canonicalSessionKey: string,
): { machineId: string; instanceId: string; brokerSessionId: string } | null {
  const parts = canonicalSessionKey.split(':');
  if (parts.length < 3) {
    return null;
  }

  const [machineId, instanceId, ...rest] = parts;
  const brokerSessionId = rest.join(':');
  if (!machineId || !instanceId || !brokerSessionId) {
    return null;
  }

  return {
    machineId,
    instanceId,
    brokerSessionId,
  };
}

function compareInventoryInstances(
  left: BrokerInventoryInstance,
  right: BrokerInventoryInstance,
): number {
  const rank = (status: BrokerInventoryInstanceStatus): number => {
    switch (status) {
      case 'online':
        return 0;
      case 'shadowed':
        return 1;
      case 'stale':
        return 2;
    }
  };

  return (
    rank(left.status) - rank(right.status) ||
    right.lastSeenAt - left.lastSeenAt ||
    left.instanceId.localeCompare(right.instanceId)
  );
}
