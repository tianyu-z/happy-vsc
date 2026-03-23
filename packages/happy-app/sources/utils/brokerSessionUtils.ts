import type { BrokerAttachability, BrokerDiscoveredSession } from 'happy-wire';

import type { Metadata } from '@/sync/storageTypes';

const ATTACHABILITY_LABELS: Record<BrokerAttachability, string> = {
    attachable: 'Ready to attach',
    attachable_with_degraded_capabilities: 'Attach with limited control',
    not_attachable: 'Not attachable',
};

const DEGRADED_FLAG_LABELS: Record<string, string> = {
    read_only_attach: 'Read-only attach',
    approval_bridge_unavailable: 'Approval requests stay in VS Code',
    attachment_bridge_unavailable: 'Attachments stay in VS Code',
    selection_context_stale: 'Editor selection may be stale',
};

export function getBrokerSessionBadge(
    metadata: Pick<Metadata, 'sessionSource'> | null | undefined,
): string | null {
    return metadata?.sessionSource === 'broker_attached' ? 'Broker' : null;
}

export function canAttachBrokerSession(
    session: Pick<BrokerDiscoveredSession, 'attachability'>,
): boolean {
    return (
        session.attachability === 'attachable'
        || session.attachability === 'attachable_with_degraded_capabilities'
    );
}

export function getBrokerSessionAttachabilityLabel(
    session: Pick<BrokerDiscoveredSession, 'attachability'>,
): string {
    return ATTACHABILITY_LABELS[session.attachability];
}

export function getBrokerSessionDegradedMessages(flags: string[] | undefined): string[] {
    return (flags || []).map((flag) => DEGRADED_FLAG_LABELS[flag] || formatUnknownDegradedFlag(flag));
}

function formatUnknownDegradedFlag(flag: string): string {
    const withSpaces = flag.split('_').filter(Boolean).join(' ');
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}
