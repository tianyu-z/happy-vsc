import { describe, expect, it } from 'vitest';

import type { BrokerDiscoveredSession } from '@/sync/brokerTypes';

import { groupBrokerSessionsByWindow } from './brokerWindowGroups';

function makeRuntimeMetadata() {
    return {
        desiredMode: 'runtime_preferred' as const,
        effectiveMode: 'runtime' as const,
        modeReason: 'runtime_ready',
        compatibility: 'supported' as const,
        providerExtension: {
            id: 'anthropic.claude-code',
            version: '1.0.0',
        },
        probeHealth: {
            runtime: 'ready' as const,
            storage: 'ready' as const,
        },
    };
}

function makeSession(
    overrides: Partial<BrokerDiscoveredSession> = {},
): BrokerDiscoveredSession {
    return {
        brokerSessionId: 'broker-sess-1',
        provider: 'claude',
        title: 'Claude session',
        attachability: 'attachable',
        capabilities: ['sendUserMessage', 'interrupt', 'resolveApproval'],
        degradedFlags: [],
        windowInstanceId: 'window-a',
        windowLabel: 'api-repo.code-workspace',
        workspaceLabel: 'api-repo',
        windowOrdinal: 1,
        isActiveWindow: false,
        workspacePath: '/home/work/api-repo',
        windowLastActiveAt: '2026-03-26T15:00:00.000Z',
        ...makeRuntimeMetadata(),
        ...overrides,
    };
}

function makeLegacySession(
    overrides: Partial<BrokerDiscoveredSession> = {},
): BrokerDiscoveredSession {
    const session = makeSession(overrides);
    delete (session as Partial<BrokerDiscoveredSession>).windowInstanceId;
    delete (session as Partial<BrokerDiscoveredSession>).windowLabel;
    delete (session as Partial<BrokerDiscoveredSession>).workspaceLabel;
    delete (session as Partial<BrokerDiscoveredSession>).windowOrdinal;
    delete (session as Partial<BrokerDiscoveredSession>).isActiveWindow;
    delete (session as Partial<BrokerDiscoveredSession>).workspacePath;
    delete (session as Partial<BrokerDiscoveredSession>).windowLastActiveAt;
    return session;
}

describe('groupBrokerSessionsByWindow', () => {
    it('groups sessions by window and keeps same-window Claude/Codex separate', () => {
        const result = groupBrokerSessionsByWindow([
            makeSession({
                brokerSessionId: 'claude-1',
                provider: 'claude',
                title: 'Claude 1',
                isActiveWindow: true,
            }),
            makeSession({
                brokerSessionId: 'codex-1',
                provider: 'codex',
                title: 'Codex 1',
                isActiveWindow: true,
            }),
        ]);

        expect(result.mode).toBe('grouped');
        if (result.mode !== 'grouped') {
            throw new Error('expected grouped mode');
        }

        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].displayLabel).toBe('api-repo');
        expect(result.groups[0].sessions.map((session) => session.provider)).toEqual([
            'claude',
            'codex',
        ]);
    });

    it('falls back to flat mode when window fields are missing', () => {
        const result = groupBrokerSessionsByWindow([
            makeLegacySession({ brokerSessionId: 'legacy-1', provider: 'claude' }),
        ]);

        expect(result.mode).toBe('flat');
        if (result.mode !== 'flat') {
            throw new Error('expected flat mode');
        }

        expect(result.upgradeHint).toBe('brokerWindowGroupingUpgradeRequired');
        expect(result.sessions.map((session) => session.brokerSessionId)).toEqual(['legacy-1']);
    });

    it('sorts the active window first and disambiguates same-name workspaces', () => {
        const result = groupBrokerSessionsByWindow([
            makeSession({
                brokerSessionId: 'inactive-1',
                windowInstanceId: 'window-a',
                windowLabel: 'api-repo (main)',
                workspaceLabel: 'api-repo',
                windowOrdinal: 2,
                isActiveWindow: false,
            }),
            makeSession({
                brokerSessionId: 'active-1',
                windowInstanceId: 'window-b',
                windowLabel: 'api-repo (tests)',
                workspaceLabel: 'api-repo',
                windowOrdinal: 1,
                isActiveWindow: true,
            }),
        ]);

        expect(result.mode).toBe('grouped');
        if (result.mode !== 'grouped') {
            throw new Error('expected grouped mode');
        }

        expect(result.groups.map((group) => group.windowInstanceId)).toEqual([
            'window-b',
            'window-a',
        ]);
        expect(result.groups.map((group) => group.displayLabel)).toEqual([
            'api-repo (tests)',
            'api-repo (main)',
        ]);
    });

    it('sorts grouped sessions by attachability, then provider, then title', () => {
        const result = groupBrokerSessionsByWindow([
            makeSession({
                brokerSessionId: 'z-not',
                provider: 'codex',
                title: 'Z',
                attachability: 'not_attachable',
                windowInstanceId: 'win-a',
                windowLabel: 'api-repo',
                workspaceLabel: 'api-repo',
                windowOrdinal: 1,
                isActiveWindow: true,
            }),
            makeSession({
                brokerSessionId: 'b-degraded',
                provider: 'codex',
                title: 'B',
                attachability: 'attachable_with_degraded_capabilities',
                windowInstanceId: 'win-a',
                windowLabel: 'api-repo',
                workspaceLabel: 'api-repo',
                windowOrdinal: 1,
                isActiveWindow: true,
            }),
            makeSession({
                brokerSessionId: 'a-attach',
                provider: 'claude',
                title: 'A',
                attachability: 'attachable',
                windowInstanceId: 'win-a',
                windowLabel: 'api-repo',
                workspaceLabel: 'api-repo',
                windowOrdinal: 1,
                isActiveWindow: true,
            }),
        ]);

        expect(result.mode).toBe('grouped');
        if (result.mode !== 'grouped') {
            throw new Error('expected grouped mode');
        }

        expect(result.groups[0].sessions.map((session) => session.brokerSessionId)).toEqual([
            'a-attach',
            'b-degraded',
            'z-not',
        ]);
    });
});
