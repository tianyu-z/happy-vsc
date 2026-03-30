import { describe, expect, it } from 'vitest';

import {
    canAttachBrokerSession,
    flattenBrokerSessions,
    formatBrokerRowSubtitle,
    getBrokerSessionAttachabilityLabel,
    getBrokerSessionAttachActionLabel,
    getBrokerSessionBadge,
    getBrokerSessionDegradedMessages,
    getBrokerSessionRuntimeDetails,
    getBrokerSessionMetadataSummary,
    getBrokerSessionProviderLabel,
} from './brokerSessionUtils';

describe('brokerSessionUtils', () => {
    const translate = (key: string): string => `t:${key}`;

    it('flattens online broker inventory across machines into a single active list', () => {
        const sessions = flattenBrokerSessions([
            {
                id: 'machine-1',
                metadata: {
                    host: 'gpu-1',
                    displayName: 'GPU Box',
                    platform: 'linux',
                    happyCliVersion: '1.0.0',
                    happyHomeDir: '/home/me/.happy',
                    homeDir: '/home/me',
                },
                daemonState: {
                    brokerInventory: {
                        updatedAt: 100,
                        instances: [
                            {
                                installationId: 'install-1',
                                instanceId: 'inst-1',
                                logicalWindowKey: 'win-1',
                                windowLabel: 'api',
                                workspaceFolders: ['/workspace/api'],
                                runtimeKind: 'ssh',
                                runtimeLabel: 'ssh:gpu-1',
                                bridgeHostIps: ['10.0.0.2'],
                                preferredHostIp: '10.0.0.2',
                                providerKinds: ['codex'],
                                startedAt: 1,
                                lastSeenAt: 100,
                                ttlMs: 10_000,
                                status: 'online',
                            },
                            {
                                installationId: 'install-1',
                                instanceId: 'inst-shadowed',
                                logicalWindowKey: 'win-shadowed',
                                windowLabel: 'shadowed',
                                workspaceFolders: ['/workspace/shadowed'],
                                runtimeKind: 'ssh',
                                runtimeLabel: 'ssh:gpu-1',
                                bridgeHostIps: ['10.0.0.2'],
                                providerKinds: ['claude'],
                                startedAt: 1,
                                lastSeenAt: 100,
                                ttlMs: 10_000,
                                status: 'shadowed',
                            },
                        ],
                        sessions: [
                            {
                                canonicalSessionKey: 'machine-1:inst-1:sess-1',
                                instanceId: 'inst-1',
                                brokerSessionId: 'sess-1',
                                providerSessionKey: 'provider-1',
                                provider: 'codex',
                                title: 'Fix API',
                                attachability: 'attachable',
                                capabilities: ['sendUserMessage'],
                                degradedFlags: [],
                                desiredMode: 'runtime_preferred',
                                effectiveMode: 'runtime',
                                modeReason: 'runtime_ready',
                                compatibility: 'supported',
                                providerExtension: {
                                    id: 'openai.chatgpt',
                                    version: '1.0.0',
                                },
                                probeHealth: {
                                    runtime: 'ready',
                                    storage: 'ready',
                                },
                                lastActiveAt: 50,
                            },
                            {
                                canonicalSessionKey: 'machine-1:inst-shadowed:sess-shadowed',
                                instanceId: 'inst-shadowed',
                                brokerSessionId: 'sess-shadowed',
                                providerSessionKey: 'provider-shadowed',
                                provider: 'claude',
                                title: 'Shadowed Session',
                                attachability: 'attachable',
                                capabilities: ['sendUserMessage'],
                                degradedFlags: [],
                                desiredMode: 'runtime_preferred',
                                effectiveMode: 'runtime',
                                modeReason: 'runtime_ready',
                                compatibility: 'supported',
                                providerExtension: {
                                    id: 'anthropic.claude-code',
                                    version: '1.0.0',
                                },
                                probeHealth: {
                                    runtime: 'ready',
                                    storage: 'ready',
                                },
                                lastActiveAt: 60,
                            },
                        ],
                    },
                },
            } as any,
            {
                id: 'machine-2',
                metadata: {
                    host: 'build-box',
                    platform: 'linux',
                    happyCliVersion: '1.0.0',
                    happyHomeDir: '/home/me/.happy',
                    homeDir: '/home/me',
                },
                daemonState: {
                    brokerInventory: {
                        updatedAt: 100,
                        instances: [
                            {
                                installationId: 'install-2',
                                instanceId: 'inst-2',
                                logicalWindowKey: 'win-2',
                                windowLabel: 'web',
                                workspaceFolders: ['/workspace/web'],
                                runtimeKind: 'wsl',
                                runtimeLabel: 'wsl:build-box',
                                bridgeHostIps: ['172.20.10.5'],
                                preferredHostIp: '172.20.10.5',
                                providerKinds: ['claude'],
                                startedAt: 1,
                                lastSeenAt: 100,
                                ttlMs: 10_000,
                                status: 'online',
                            },
                        ],
                        sessions: [
                            {
                                canonicalSessionKey: 'machine-2:inst-2:sess-2',
                                instanceId: 'inst-2',
                                brokerSessionId: 'sess-2',
                                providerSessionKey: 'provider-2',
                                provider: 'claude',
                                title: 'Review web',
                                attachability: 'attachable',
                                capabilities: ['sendUserMessage'],
                                degradedFlags: [],
                                desiredMode: 'runtime_preferred',
                                effectiveMode: 'runtime',
                                modeReason: 'runtime_ready',
                                compatibility: 'supported',
                                providerExtension: {
                                    id: 'anthropic.claude-code',
                                    version: '1.0.0',
                                },
                                probeHealth: {
                                    runtime: 'ready',
                                    storage: 'ready',
                                },
                                lastActiveAt: 70,
                            },
                        ],
                    },
                },
            } as any,
        ]);

        expect(sessions.map((session) => session.canonicalSessionKey)).toEqual([
            'machine-2:inst-2:sess-2',
            'machine-1:inst-1:sess-1',
        ]);
        expect(sessions[0]).toMatchObject({
            machineId: 'machine-2',
            machineLabel: 'build-box',
            windowLabel: 'web',
            runtimeLabel: 'wsl:build-box',
            preferredHostIp: '172.20.10.5',
        });
    });

    it('formats live session subtitles as runtime plus machine, window, and ip', () => {
        expect(formatBrokerRowSubtitle({
            runtimeLabel: 'ssh:gpu-1',
            machineLabel: 'gpu-1',
            windowLabel: 'api',
            preferredHostIp: '10.0.0.2',
        })).toBe('ssh:gpu-1\ngpu-1 • api • 10.0.0.2');

        expect(formatBrokerRowSubtitle({
            runtimeLabel: 'local',
            machineLabel: 'macbook',
        })).toBe('local\nmacbook');
    });

    it('labels broker-attached sessions as broker-backed', () => {
        expect(getBrokerSessionBadge({
            sessionSource: 'broker_attached',
        }, translate)).toBe('t:sessionInfo.brokerSource');
    });

    it('maps broker attachability states for display and interaction', () => {
        expect(canAttachBrokerSession({ attachability: 'attachable' })).toBe(true);
        expect(
            getBrokerSessionAttachabilityLabel({ attachability: 'attachable' }, translate),
        ).toBe('t:machine.brokerAttachability.attachable');

        expect(canAttachBrokerSession({ attachability: 'attachable_with_degraded_capabilities' })).toBe(true);
        expect(
            getBrokerSessionAttachabilityLabel({
                attachability: 'attachable_with_degraded_capabilities',
            }, translate),
        ).toBe('t:machine.brokerAttachability.attachable_with_degraded_capabilities');

        expect(canAttachBrokerSession({ attachability: 'not_attachable' })).toBe(false);
        expect(
            getBrokerSessionAttachabilityLabel({ attachability: 'not_attachable' }, translate),
        ).toBe('t:machine.brokerAttachability.not_attachable');
    });

    it('maps provider labels via translation keys', () => {
        expect(getBrokerSessionProviderLabel('claude', translate)).toBe('t:machine.brokerProvider.claude');
        expect(getBrokerSessionProviderLabel('codex', translate)).toBe('t:machine.brokerProvider.codex');
    });

    it('maps degraded flags to human-readable warnings', () => {
        const warnings = getBrokerSessionDegradedMessages([
            'read_only_attach',
            'interrupt_bridge_unavailable',
            'approval_bridge_unavailable',
            'attachment_bridge_unavailable',
            'selection_context_stale',
        ], translate);

        expect(warnings).toEqual([
            't:machine.brokerDegradedFlags.read_only_attach',
            't:machine.brokerDegradedFlags.interrupt_bridge_unavailable',
            't:machine.brokerDegradedFlags.approval_bridge_unavailable',
            't:machine.brokerDegradedFlags.attachment_bridge_unavailable',
            't:machine.brokerDegradedFlags.selection_context_stale',
        ]);
    });

    it('builds a broker metadata summary without conflating source and degraded reasons', () => {
        expect(getBrokerSessionMetadataSummary({
            sessionSource: 'broker_attached',
            brokerDegradedFlags: [],
        }, translate)).toBe('t:sessionInfo.brokerAttached');

        expect(getBrokerSessionMetadataSummary({
            sessionSource: 'broker_attached',
            brokerDegradedFlags: ['approval_bridge_unavailable', 'selection_context_stale'],
        }, translate)).toBe(
            't:sessionInfo.brokerSource • t:machine.brokerDegradedFlags.approval_bridge_unavailable • t:machine.brokerDegradedFlags.selection_context_stale',
        );

        expect(getBrokerSessionMetadataSummary({
            sessionSource: 'broker_attached',
            brokerDesiredMode: 'runtime_preferred',
            brokerEffectiveMode: 'storage',
            brokerModeReason: 'runtime_unavailable_fallback_to_storage',
            brokerCompatibility: 'supported',
            brokerProviderExtension: {
                id: 'anthropic.claude-code',
                version: '1.0.0',
            },
            brokerDegradedFlags: ['read_only_attach'],
        }, translate)).toBe(
            't:sessionInfo.brokerSource • Desired: Runtime preferred • Active: Storage • Reason: Runtime unavailable, fallback to storage • Compatibility: Supported • Provider: anthropic.claude-code@1.0.0 • t:machine.brokerDegradedFlags.read_only_attach',
        );

        expect(getBrokerSessionMetadataSummary({
            sessionSource: 'direct',
            brokerDegradedFlags: ['approval_bridge_unavailable'],
        }, translate)).toBeNull();
    });

    it('formats runtime details and attach action labels for broker session rows', () => {
        expect(getBrokerSessionRuntimeDetails({
            desiredMode: 'runtime_preferred',
            effectiveMode: 'storage',
            modeReason: 'runtime_unavailable_fallback_to_storage',
            compatibility: 'supported',
            providerExtension: {
                id: 'anthropic.claude-code',
                version: '1.0.0',
            },
        })).toEqual([
            'Desired: Runtime preferred',
            'Active: Storage',
            'Reason: Runtime unavailable, fallback to storage',
            'Compatibility: Supported',
            'Provider: anthropic.claude-code@1.0.0',
        ]);

        expect(getBrokerSessionAttachActionLabel({
            effectiveMode: 'storage',
        }, translate)).toBe('t:machine.brokerAttach (Storage)');
        expect(getBrokerSessionAttachActionLabel({
            effectiveMode: 'runtime',
        }, translate)).toBe('t:machine.brokerAttach');
    });

    it('formats unknown degraded flags into readable fallback text', () => {
        expect(getBrokerSessionDegradedMessages(['selection_context_unavailable'], translate)).toEqual([
            'Selection context unavailable',
        ]);
    });
});
