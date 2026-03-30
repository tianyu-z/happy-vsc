import type { BrokerAttachability, BrokerDiscoveredSession, BrokerProvider } from '@/sync/brokerTypes';

export type BrokerWindowGroup = {
    windowInstanceId: string;
    windowLabel: string;
    workspaceLabel: string;
    workspacePath?: string | null;
    windowOrdinal: number;
    isActiveWindow: boolean;
    windowLastActiveAt?: string | null;
    displayLabel: string;
    sessions: BrokerDiscoveredSession[];
};

export type BrokerWindowGroupingResult =
    | {
        mode: 'grouped';
        groups: BrokerWindowGroup[];
    }
    | {
        mode: 'flat';
        sessions: BrokerDiscoveredSession[];
        upgradeHint: 'brokerWindowGroupingUpgradeRequired';
    };

export function groupBrokerSessionsByWindow(
    sessions: BrokerDiscoveredSession[],
): BrokerWindowGroupingResult {
    if (sessions.some((session) => !hasWindowGroupingMetadata(session))) {
        return {
            mode: 'flat',
            sessions,
            upgradeHint: 'brokerWindowGroupingUpgradeRequired',
        };
    }

    const groupsByWindow = new Map<string, BrokerWindowGroup>();

    for (const session of sessions) {
        const windowInstanceId = session.windowInstanceId!;
        const existing = groupsByWindow.get(windowInstanceId);
        if (existing) {
            existing.sessions.push(session);
            continue;
        }

        groupsByWindow.set(windowInstanceId, {
            windowInstanceId,
            windowLabel: session.windowLabel!,
            workspaceLabel: session.workspaceLabel!,
            workspacePath: session.workspacePath,
            windowOrdinal: session.windowOrdinal!,
            isActiveWindow: session.isActiveWindow!,
            windowLastActiveAt: session.windowLastActiveAt,
            displayLabel: session.workspaceLabel!,
            sessions: [session],
        });
    }

    const workspaceLabelCounts = countWorkspaceLabels(groupsByWindow.values());
    const groups = Array.from(groupsByWindow.values())
        .map((group) => ({
            ...group,
            displayLabel: getDisplayLabel(group, workspaceLabelCounts),
            sessions: [...group.sessions].sort(compareSessions),
        }))
        .sort(compareGroups);

    return {
        mode: 'grouped',
        groups,
    };
}

function hasWindowGroupingMetadata(
    session: BrokerDiscoveredSession,
): session is BrokerDiscoveredSession & {
    windowInstanceId: string;
    windowLabel: string;
    workspaceLabel: string;
    windowOrdinal: number;
    isActiveWindow: boolean;
} {
    return Boolean(
        session.windowInstanceId
        && session.windowLabel
        && session.workspaceLabel
        && Number.isFinite(session.windowOrdinal)
        && typeof session.isActiveWindow === 'boolean',
    );
}

function countWorkspaceLabels(
    groups: Iterable<BrokerWindowGroup>,
): Map<string, number> {
    const counts = new Map<string, number>();
    for (const group of groups) {
        counts.set(group.workspaceLabel, (counts.get(group.workspaceLabel) || 0) + 1);
    }
    return counts;
}

function getDisplayLabel(
    group: BrokerWindowGroup,
    workspaceLabelCounts: Map<string, number>,
): string {
    if ((workspaceLabelCounts.get(group.workspaceLabel) || 0) <= 1) {
        return group.workspaceLabel;
    }

    if (group.windowLabel && group.windowLabel !== group.workspaceLabel) {
        return group.windowLabel;
    }

    return `${group.workspaceLabel} (Window ${group.windowOrdinal})`;
}

function compareGroups(a: BrokerWindowGroup, b: BrokerWindowGroup): number {
    if (a.isActiveWindow !== b.isActiveWindow) {
        return a.isActiveWindow ? -1 : 1;
    }

    if (a.windowOrdinal !== b.windowOrdinal) {
        return a.windowOrdinal - b.windowOrdinal;
    }

    const lastActiveDiff = parseWindowLastActiveAt(b.windowLastActiveAt) - parseWindowLastActiveAt(a.windowLastActiveAt);
    if (lastActiveDiff !== 0) {
        return lastActiveDiff;
    }

    return a.displayLabel.localeCompare(b.displayLabel);
}

function compareSessions(a: BrokerDiscoveredSession, b: BrokerDiscoveredSession): number {
    const attachabilityDiff = getAttachabilityRank(a.attachability) - getAttachabilityRank(b.attachability);
    if (attachabilityDiff !== 0) {
        return attachabilityDiff;
    }

    const providerDiff = getProviderRank(a.provider) - getProviderRank(b.provider);
    if (providerDiff !== 0) {
        return providerDiff;
    }

    const titleDiff = a.title.localeCompare(b.title);
    if (titleDiff !== 0) {
        return titleDiff;
    }

    return a.brokerSessionId.localeCompare(b.brokerSessionId);
}

function getAttachabilityRank(attachability: BrokerAttachability): number {
    switch (attachability) {
        case 'attachable':
            return 0;
        case 'attachable_with_degraded_capabilities':
            return 1;
        case 'not_attachable':
            return 2;
    }
}

function getProviderRank(provider: BrokerProvider): number {
    switch (provider) {
        case 'claude':
            return 0;
        case 'codex':
            return 1;
    }
}

function parseWindowLastActiveAt(value: string | null | undefined): number {
    if (!value) {
        return 0;
    }

    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : 0;
}
