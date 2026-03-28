import type {
    BrokerAttachability,
    BrokerCompatibility,
    BrokerDesiredMode,
    BrokerDiscoveredSession,
    BrokerEffectiveMode,
    BrokerProvider,
    BrokerProviderExtension,
} from '@/sync/brokerTypes';

import type { Metadata } from '@/sync/storageTypes';

type BrokerSessionTranslationKey =
    | 'sessionInfo.brokerAttached'
    | 'sessionInfo.brokerSource'
    | 'sessionInfo.brokerRuntimeAttached'
    | 'sessionInfo.brokerRuntimeDegraded'
    | 'sessionInfo.brokerStorageFallback'
    | 'sessionInfo.brokerStorageAttached'
    | 'sessionInfo.brokerControlSync.interruptAndApproval'
    | 'sessionInfo.brokerControlSync.interrupt'
    | 'sessionInfo.brokerControlSync.approval'
    | 'machine.brokerAttachability.attachable'
    | 'machine.brokerAttachability.attachable_with_degraded_capabilities'
    | 'machine.brokerAttachability.not_attachable'
    | 'machine.brokerAttach'
    | 'machine.brokerWindowHeader.activeWindow'
    | 'machine.brokerWindowHeader.sessions'
    | 'machine.brokerWindowHeader.degraded'
    | 'machine.brokerWindowHeader.unavailable'
    | 'machine.brokerProvider.claude'
    | 'machine.brokerProvider.codex'
    | 'machine.brokerDegradedFlags.unstable_session_identity'
    | 'machine.brokerReadOnlyAttachDescription'
    | 'machine.brokerDegradedFlags.read_only_attach'
    | 'machine.brokerDegradedFlags.interrupt_bridge_unavailable'
    | 'machine.brokerDegradedFlags.approval_bridge_unavailable'
    | 'machine.brokerDegradedFlags.attachment_bridge_unavailable'
    | 'machine.brokerDegradedFlags.selection_context_stale';

type BrokerSessionTranslate = (
    key: BrokerSessionTranslationKey,
    params?: { count: number },
) => string;

type BrokerRuntimeMetadataLike = {
    desiredMode?: BrokerDesiredMode;
    effectiveMode?: BrokerEffectiveMode;
    modeReason?: string;
    compatibility?: BrokerCompatibility;
    providerExtension?: BrokerProviderExtension;
};

type BrokerReadOnlyLike = {
    degradedFlags?: string[];
    brokerDegradedFlags?: string[];
    effectiveMode?: BrokerEffectiveMode;
    brokerEffectiveMode?: BrokerEffectiveMode;
};

type BrokerStripSummaryLike = Pick<
    Metadata,
    | 'sessionSource'
    | 'brokerWindowOrdinal'
    | 'brokerDesiredMode'
    | 'brokerEffectiveMode'
    | 'brokerDegradedFlags'
    | 'brokerCapabilities'
> | null | undefined;

type BrokerWindowHeaderSummaryLike = {
    isActiveWindow?: boolean;
    sessions: Array<Pick<BrokerDiscoveredSession, 'attachability' | 'degradedFlags'>>;
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
    unstable_session_identity: 'machine.brokerDegradedFlags.unstable_session_identity',
    read_only_attach: 'machine.brokerDegradedFlags.read_only_attach',
    interrupt_bridge_unavailable: 'machine.brokerDegradedFlags.interrupt_bridge_unavailable',
    approval_bridge_unavailable: 'machine.brokerDegradedFlags.approval_bridge_unavailable',
    attachment_bridge_unavailable: 'machine.brokerDegradedFlags.attachment_bridge_unavailable',
    selection_context_stale: 'machine.brokerDegradedFlags.selection_context_stale',
};

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

export function isBrokerSessionReadOnly(
    session: BrokerReadOnlyLike | null | undefined,
): boolean {
    const degradedFlags = session?.brokerDegradedFlags ?? session?.degradedFlags ?? [];
    return degradedFlags.includes('read_only_attach')
        || session?.brokerEffectiveMode === 'storage'
        || session?.effectiveMode === 'storage';
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

export function getBrokerSessionDisabledReason(
    session: Pick<BrokerDiscoveredSession, 'attachability' | 'degradedFlags'>,
    translate: BrokerSessionTranslate,
): string | null {
    if (session.degradedFlags.includes('unstable_session_identity')) {
        return translate('machine.brokerDegradedFlags.unstable_session_identity');
    }

    return canAttachBrokerSession(session)
        ? null
        : getBrokerSessionAttachabilityLabel(session, translate);
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

export function getBrokerSessionStripSummary(
    metadata: BrokerStripSummaryLike,
    translate: BrokerSessionTranslate,
): string | null {
    if (metadata?.sessionSource !== 'broker_attached') {
        return null;
    }

    const parts: string[] = [];

    if (Number.isFinite(metadata.brokerWindowOrdinal)) {
        parts.push(`Window ${metadata.brokerWindowOrdinal}`);
    }

    parts.push(translate(getBrokerStripStateKey(metadata)));

    const controlSyncKey = getBrokerControlSyncKey(metadata);
    if (controlSyncKey) {
        parts.push(translate(controlSyncKey));
    }

    return parts.join(' • ');
}

export function getBrokerWindowHeaderSummary(
    group: BrokerWindowHeaderSummaryLike,
    translate: BrokerSessionTranslate,
): string {
    const parts: string[] = [];

    if (group.isActiveWindow) {
        parts.push(translate('machine.brokerWindowHeader.activeWindow'));
    }

    parts.push(
        translate('machine.brokerWindowHeader.sessions', {
            count: group.sessions.length,
        }),
    );

    const degradedCount = group.sessions.filter((session) =>
        session.attachability === 'attachable_with_degraded_capabilities'
        || (canAttachBrokerSession(session) && session.degradedFlags.length > 0)
    ).length;
    if (degradedCount > 0) {
        parts.push(
            translate('machine.brokerWindowHeader.degraded', {
                count: degradedCount,
            }),
        );
    }

    if (!group.sessions.some((session) => canAttachBrokerSession(session))) {
        parts.push(translate('machine.brokerWindowHeader.unavailable'));
    }

    return parts.join(' • ');
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

function getBrokerStripStateKey(
    metadata: NonNullable<BrokerStripSummaryLike>,
): BrokerSessionTranslationKey {
    if (metadata.brokerEffectiveMode === 'storage') {
        return metadata.brokerDesiredMode === 'storage_preferred'
            ? 'sessionInfo.brokerStorageAttached'
            : 'sessionInfo.brokerStorageFallback';
    }

    return (metadata.brokerDegradedFlags || []).length > 0
        ? 'sessionInfo.brokerRuntimeDegraded'
        : 'sessionInfo.brokerRuntimeAttached';
}

function getBrokerControlSyncKey(
    metadata: NonNullable<BrokerStripSummaryLike>,
): BrokerSessionTranslationKey | null {
    if (metadata.brokerEffectiveMode !== 'runtime') {
        return null;
    }

    const capabilities = new Set(metadata.brokerCapabilities || []);
    const degradedFlags = new Set(metadata.brokerDegradedFlags || []);

    const interruptSynced = capabilities.has('interrupt')
        && !degradedFlags.has('interrupt_bridge_unavailable');
    const approvalSynced = capabilities.has('resolveApproval')
        && !degradedFlags.has('approval_bridge_unavailable');

    if (interruptSynced && approvalSynced) {
        return 'sessionInfo.brokerControlSync.interruptAndApproval';
    }
    if (interruptSynced) {
        return 'sessionInfo.brokerControlSync.interrupt';
    }
    if (approvalSynced) {
        return 'sessionInfo.brokerControlSync.approval';
    }

    return null;
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
