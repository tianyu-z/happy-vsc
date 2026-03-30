import type {
    BrokerAttachability,
    BrokerCompatibility,
    BrokerDesiredMode,
    BrokerDiscoveredSession,
    BrokerEffectiveMode,
    BrokerInventoryInstance,
    BrokerProvider,
    BrokerProviderExtension,
} from '@/sync/brokerTypes';

import type { Machine, Metadata } from '@/sync/storageTypes';

type BrokerSessionTranslationKey =
    | 'sessionInfo.brokerAttached'
    | 'sessionInfo.brokerSource'
    | 'machine.brokerAttachability.attachable'
    | 'machine.brokerAttachability.attachable_with_degraded_capabilities'
    | 'machine.brokerAttachability.not_attachable'
    | 'machine.brokerAttach'
    | 'machine.brokerProvider.claude'
    | 'machine.brokerProvider.codex'
    | 'machine.brokerDegradedFlags.read_only_attach'
    | 'machine.brokerDegradedFlags.interrupt_bridge_unavailable'
    | 'machine.brokerDegradedFlags.approval_bridge_unavailable'
    | 'machine.brokerDegradedFlags.attachment_bridge_unavailable'
    | 'machine.brokerDegradedFlags.selection_context_stale';

type BrokerSessionTranslate = (key: BrokerSessionTranslationKey) => string;

type BrokerRuntimeMetadataLike = {
    desiredMode?: BrokerDesiredMode;
    effectiveMode?: BrokerEffectiveMode;
    modeReason?: string;
    compatibility?: BrokerCompatibility;
    providerExtension?: BrokerProviderExtension;
};

export type FlattenedBrokerSession = BrokerDiscoveredSession & {
    machineId: string;
    machineLabel: string;
    machineHost?: string;
    installationId: string;
    logicalWindowKey: string;
    windowLabel: string;
    runtimeKind: BrokerInventoryInstance['runtimeKind'];
    runtimeLabel: string;
    bridgeHostIps: string[];
    preferredHostIp?: string;
    runtimeIp?: string;
    lastSeenAt: number;
    instanceStatus: BrokerInventoryInstance['status'];
};

const ATTACHABILITY_LABEL_KEYS: Record<BrokerAttachability, BrokerSessionTranslationKey> = {
    attachable: 'machine.brokerAttachability.attachable',
    attachable_with_degraded_capabilities: 'machine.brokerAttachability.attachable_with_degraded_capabilities',
    not_attachable: 'machine.brokerAttachability.not_attachable',
};

const PROVIDER_LABEL_KEYS: Record<BrokerProvider, BrokerSessionTranslationKey> = {
    claude: 'machine.brokerProvider.claude',
    codex: 'machine.brokerProvider.codex',
};

const DEGRADED_FLAG_LABEL_KEYS: Record<string, BrokerSessionTranslationKey> = {
    read_only_attach: 'machine.brokerDegradedFlags.read_only_attach',
    interrupt_bridge_unavailable: 'machine.brokerDegradedFlags.interrupt_bridge_unavailable',
    approval_bridge_unavailable: 'machine.brokerDegradedFlags.approval_bridge_unavailable',
    attachment_bridge_unavailable: 'machine.brokerDegradedFlags.attachment_bridge_unavailable',
    selection_context_stale: 'machine.brokerDegradedFlags.selection_context_stale',
};

export function flattenBrokerSessions(
    machines: Array<Pick<Machine, 'id' | 'metadata' | 'daemonState'>>,
): FlattenedBrokerSession[] {
    return machines
        .flatMap((machine) => {
            const inventory = machine.daemonState?.brokerInventory;
            if (!inventory) {
                return [];
            }

            const instancesById = new Map(
                inventory.instances.map((instance) => [instance.instanceId, instance] as const),
            );
            const machineHost = machine.metadata?.host;
            const machineLabel = machine.metadata?.displayName?.trim() || machineHost || machine.id;

            return inventory.sessions.flatMap((session) => {
                const instance = instancesById.get(session.instanceId);
                if (!instance || instance.status !== 'online') {
                    return [];
                }

                return [{
                    ...session,
                    machineId: machine.id,
                    machineLabel,
                    ...(machineHost ? { machineHost } : {}),
                    installationId: instance.installationId,
                    logicalWindowKey: instance.logicalWindowKey,
                    windowLabel: instance.windowLabel,
                    runtimeKind: instance.runtimeKind,
                    runtimeLabel: instance.runtimeLabel,
                    bridgeHostIps: [...instance.bridgeHostIps],
                    ...(instance.preferredHostIp
                        ? { preferredHostIp: instance.preferredHostIp }
                        : {}),
                    ...(instance.runtimeIp ? { runtimeIp: instance.runtimeIp } : {}),
                    lastSeenAt: instance.lastSeenAt,
                    instanceStatus: instance.status,
                }];
            });
        })
        .sort((left, right) => right.lastActiveAt - left.lastActiveAt);
}

export function formatBrokerRowSubtitle(input: {
    runtimeLabel?: string;
    machineLabel?: string;
    windowLabel?: string;
    preferredHostIp?: string;
}): string {
    const topLine = input.runtimeLabel?.trim() ?? '';
    const bottomLine = [
        input.machineLabel?.trim(),
        input.windowLabel?.trim(),
        input.preferredHostIp?.trim(),
    ].filter((value): value is string => Boolean(value)).join(' • ');

    return [topLine, bottomLine].filter(Boolean).join('\n');
}

export function getBrokerSessionBadge(
    metadata: Pick<Metadata, 'sessionSource'> | null | undefined,
    translate: BrokerSessionTranslate,
): string | null {
    return metadata?.sessionSource === 'broker_attached'
        ? translate('sessionInfo.brokerSource')
        : null;
}

export function canAttachBrokerSession(
    session: Pick<BrokerDiscoveredSession, 'attachability'>,
): boolean {
    return (
        session.attachability === 'attachable'
        || session.attachability === 'attachable_with_degraded_capabilities'
    );
}

export function getBrokerSessionProviderLabel(
    provider: BrokerProvider,
    translate: BrokerSessionTranslate,
): string {
    return translate(PROVIDER_LABEL_KEYS[provider]);
}

export function getBrokerSessionAttachabilityLabel(
    session: Pick<BrokerDiscoveredSession, 'attachability'>,
    translate: BrokerSessionTranslate,
): string {
    return translate(ATTACHABILITY_LABEL_KEYS[session.attachability]);
}

export function getBrokerSessionDegradedMessages(
    flags: string[] | undefined,
    translate: BrokerSessionTranslate,
): string[] {
    return (flags || []).map((flag) => {
        const translationKey = DEGRADED_FLAG_LABEL_KEYS[flag];
        return translationKey ? translate(translationKey) : formatUnknownDegradedFlag(flag);
    });
}

export function getBrokerSessionRuntimeDetails(
    metadata: BrokerRuntimeMetadataLike | null | undefined,
): string[] {
    if (!metadata) {
        return [];
    }

    const details: string[] = [];

    if (metadata.desiredMode) {
        details.push(`Desired: ${formatDesiredMode(metadata.desiredMode)}`);
    }
    if (metadata.effectiveMode) {
        details.push(`Active: ${formatEffectiveMode(metadata.effectiveMode)}`);
    }
    if (metadata.modeReason) {
        details.push(`Reason: ${formatModeReason(metadata.modeReason)}`);
    }
    if (metadata.compatibility) {
        details.push(`Compatibility: ${formatCompatibility(metadata.compatibility)}`);
    }
    if (metadata.providerExtension) {
        details.push(
            `Provider: ${metadata.providerExtension.id}@${metadata.providerExtension.version}`,
        );
    }

    return details;
}

export function getBrokerSessionAttachActionLabel(
    session: Pick<BrokerRuntimeMetadataLike, 'effectiveMode'>,
    translate: BrokerSessionTranslate,
): string {
    const attachLabel = translate('machine.brokerAttach');

    if (session.effectiveMode === 'storage') {
        return `${attachLabel} (${formatEffectiveMode(session.effectiveMode)})`;
    }

    return attachLabel;
}

export function getBrokerSessionMetadataSummary(
    metadata: Pick<
        Metadata,
        | 'sessionSource'
        | 'brokerDegradedFlags'
        | 'brokerDesiredMode'
        | 'brokerEffectiveMode'
        | 'brokerModeReason'
        | 'brokerCompatibility'
        | 'brokerProviderExtension'
    > | null | undefined,
    translate: BrokerSessionTranslate,
): string | null {
    if (metadata?.sessionSource !== 'broker_attached') {
        return null;
    }

    const runtimeDetails = getBrokerSessionRuntimeDetails({
        desiredMode: metadata.brokerDesiredMode,
        effectiveMode: metadata.brokerEffectiveMode,
        modeReason: metadata.brokerModeReason,
        compatibility: metadata.brokerCompatibility,
        providerExtension: metadata.brokerProviderExtension,
    });
    const degradedMessages = getBrokerSessionDegradedMessages(metadata.brokerDegradedFlags, translate);
    if (runtimeDetails.length === 0 && degradedMessages.length === 0) {
        return translate('sessionInfo.brokerAttached');
    }

    return [translate('sessionInfo.brokerSource'), ...runtimeDetails, ...degradedMessages].join(' • ');
}

function formatUnknownDegradedFlag(flag: string): string {
    const withSpaces = flag.split('_').filter(Boolean).join(' ');
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function formatDesiredMode(mode: BrokerDesiredMode): string {
    return mode === 'runtime_preferred' ? 'Runtime preferred' : 'Storage preferred';
}

function formatEffectiveMode(mode: BrokerEffectiveMode): string {
    return mode === 'runtime' ? 'Runtime' : 'Storage';
}

function formatCompatibility(compatibility: BrokerCompatibility): string {
    switch (compatibility) {
        case 'supported':
            return 'Supported';
        case 'unknown':
            return 'Unknown';
        case 'incompatible':
            return 'Incompatible';
    }
}

function formatModeReason(reason: string): string {
    const knownReasons: Record<string, string> = {
        runtime_ready: 'Runtime ready',
        runtime_degraded: 'Runtime degraded',
        runtime_unavailable_fallback_to_storage: 'Runtime unavailable, fallback to storage',
        storage_preferred_selected: 'Storage preferred',
        storage_stale_selected: 'Storage data may be stale',
    };

    return knownReasons[reason] ?? formatUnknownDegradedFlag(reason);
}
