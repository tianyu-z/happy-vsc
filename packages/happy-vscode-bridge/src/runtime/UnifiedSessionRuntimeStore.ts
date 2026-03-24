import { createHash } from 'node:crypto';

import type {
  BridgeBrokerDiscoveredSession,
  BridgeBrokerSnapshot,
  UnifiedSessionRecord,
  UnifiedSessionRecordInput,
} from './types';

function toStableBrokerSessionId(provider: string, providerSessionKey: string): string {
  const digest = createHash('sha256')
    .update(`${provider}|${providerSessionKey}`)
    .digest('hex')
    .slice(0, 24);

  return `${provider}-${digest}`;
}

function cloneRecord(record: UnifiedSessionRecord): UnifiedSessionRecord {
  return {
    ...record,
    capabilities: [...record.capabilities],
    degradedFlags: [...record.degradedFlags],
  };
}

export class UnifiedSessionRuntimeStore {
  private readonly byProviderSessionKey = new Map<string, UnifiedSessionRecord>();
  private readonly byBrokerSessionId = new Map<string, UnifiedSessionRecord>();

  upsert(input: UnifiedSessionRecordInput): UnifiedSessionRecord {
    const existing = this.byProviderSessionKey.get(input.providerSessionKey);
    const brokerSessionId =
      existing?.brokerSessionId ??
      toStableBrokerSessionId(input.provider, input.providerSessionKey);

    const record: UnifiedSessionRecord = {
      ...input,
      brokerSessionId,
      latestSeq: Math.max(existing?.latestSeq ?? 0, input.latestSeq),
      capabilities: [...input.capabilities],
      degradedFlags: [...input.degradedFlags],
    };

    this.byProviderSessionKey.set(input.providerSessionKey, record);
    this.byBrokerSessionId.set(brokerSessionId, record);
    return cloneRecord(record);
  }

  getRecord(brokerSessionId: string): UnifiedSessionRecord | undefined {
    const record = this.byBrokerSessionId.get(brokerSessionId);
    return record ? cloneRecord(record) : undefined;
  }

  getSnapshot(brokerSessionId: string): BridgeBrokerSnapshot | undefined {
    const record = this.byBrokerSessionId.get(brokerSessionId);
    return record ? this.toSnapshot(record) : undefined;
  }

  listSnapshots(): BridgeBrokerSnapshot[] {
    return Array.from(this.byProviderSessionKey.values()).map((record) =>
      this.toSnapshot(record),
    );
  }

  listDiscoveredSessions(): BridgeBrokerDiscoveredSession[] {
    return Array.from(this.byProviderSessionKey.values()).map((record) =>
      this.toDiscoveredSession(record),
    );
  }

  private toDiscoveredSession(
    record: UnifiedSessionRecord,
  ): BridgeBrokerDiscoveredSession {
    return {
      brokerSessionId: record.brokerSessionId,
      provider: record.provider,
      title: record.title,
      attachability: record.attachability,
      capabilities: [...record.capabilities],
      degradedFlags: [...record.degradedFlags],
      desiredMode: record.desiredMode,
      effectiveMode: record.effectiveMode,
      modeReason: record.modeReason,
      compatibility: record.compatibility,
      providerExtension: record.providerExtension,
      probeHealth: record.probeHealth,
    };
  }

  private toSnapshot(record: UnifiedSessionRecord): BridgeBrokerSnapshot {
    return {
      brokerSessionId: record.brokerSessionId,
      provider: record.provider,
      latestSeq: record.latestSeq,
      capabilities: [...record.capabilities],
      degradedFlags: [...record.degradedFlags],
      desiredMode: record.desiredMode,
      effectiveMode: record.effectiveMode,
      modeReason: record.modeReason,
      compatibility: record.compatibility,
      providerExtension: record.providerExtension,
      probeHealth: record.probeHealth,
    };
  }
}
