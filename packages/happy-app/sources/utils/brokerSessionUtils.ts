import type { BrokerAttachability, BrokerDiscoveredSession, BrokerProvider } from 'happy-wire';

import type { Metadata } from '@/sync/storageTypes';

type BrokerSessionTranslationKey =
    | 'sessionInfo.brokerAttached'
    | 'sessionInfo.brokerSource'
    | 'machine.brokerAttachability.attachable'
    | 'machine.brokerAttachability.attachable_with_degraded_capabilities'
    | 'machine.brokerAttachability.not_attachable'
    | 'machine.brokerProvider.claude'
    | 'machine.brokerProvider.codex'
    | 'machine.brokerDegradedFlags.read_only_attach'
    | 'machine.brokerDegradedFlags.approval_bridge_unavailable'
    | 'machine.brokerDegradedFlags.attachment_bridge_unavailable'
    | 'machine.brokerDegradedFlags.selection_context_stale';

type BrokerSessionTranslate = (key: BrokerSessionTranslationKey) => string;

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

export function getBrokerSessionMetadataSummary(
    metadata: Pick<Metadata, 'sessionSource' | 'brokerDegradedFlags'> | null | undefined,
    translate: BrokerSessionTranslate,
): string | null {
    if (metadata?.sessionSource !== 'broker_attached') {
        return null;
    }

    const degradedMessages = getBrokerSessionDegradedMessages(metadata.brokerDegradedFlags, translate);
    if (degradedMessages.length === 0) {
        return translate('sessionInfo.brokerAttached');
    }

    return [translate('sessionInfo.brokerSource'), ...degradedMessages].join(' • ');
}

function formatUnknownDegradedFlag(flag: string): string {
    const withSpaces = flag.split('_').filter(Boolean).join(' ');
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}
