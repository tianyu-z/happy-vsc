import { describe, expect, it } from 'vitest';

import {
    canAttachBrokerSession,
    getBrokerSessionAttachabilityLabel,
    getBrokerSessionAttachActionLabel,
    getBrokerSessionBadge,
    getBrokerSessionDegradedMessages,
    getBrokerSessionDisabledReason,
    getBrokerSessionRuntimeDetails,
    getBrokerSessionStripSummary,
    getBrokerSessionMetadataSummary,
    getBrokerSessionProviderLabel,
    getBrokerWindowHeaderSummary,
    isBrokerSessionReadOnly,
} from './brokerSessionUtils';

describe('brokerSessionUtils', () => {
    const translate = (key: string, params?: Record<string, unknown>): string =>
        params ? `t:${key}:${JSON.stringify(params)}` : `t:${key}`;

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

    it('returns disable reasons for unstable session identity without blocking read-only attaches', () => {
        expect(getBrokerSessionDisabledReason({
            attachability: 'not_attachable',
            degradedFlags: ['unstable_session_identity'],
        }, translate)).toBe('t:machine.brokerDegradedFlags.unstable_session_identity');

        expect(getBrokerSessionDisabledReason({
            attachability: 'attachable_with_degraded_capabilities',
            degradedFlags: ['read_only_attach'],
        }, translate)).toBeNull();
    });

    it('detects read-only broker sessions from discovered rows and persisted metadata', () => {
        expect(isBrokerSessionReadOnly({
            degradedFlags: ['read_only_attach'],
        })).toBe(true);

        expect(isBrokerSessionReadOnly({
            brokerDegradedFlags: ['read_only_attach'],
        })).toBe(true);

        expect(isBrokerSessionReadOnly({
            degradedFlags: [],
            brokerDegradedFlags: [],
            effectiveMode: 'runtime',
            brokerEffectiveMode: 'runtime',
        })).toBe(false);
    });

    it('builds strip summaries for runtime and storage-backed broker sessions', () => {
        expect(getBrokerSessionStripSummary({
            sessionSource: 'broker_attached',
            brokerWindowOrdinal: 1,
            brokerDesiredMode: 'runtime_preferred',
            brokerEffectiveMode: 'runtime',
            brokerDegradedFlags: [],
            brokerCapabilities: ['sendUserMessage', 'interrupt', 'resolveApproval'],
        }, translate)).toBe(
            'Window 1 • t:sessionInfo.brokerRuntimeAttached • t:sessionInfo.brokerControlSync.interruptAndApproval',
        );

        expect(getBrokerSessionStripSummary({
            sessionSource: 'broker_attached',
            brokerWindowOrdinal: 2,
            brokerDesiredMode: 'runtime_preferred',
            brokerEffectiveMode: 'storage',
            brokerDegradedFlags: ['read_only_attach'],
            brokerCapabilities: ['sendUserMessage'],
        }, translate)).toBe(
            'Window 2 • t:sessionInfo.brokerStorageFallback',
        );
    });

    it('summarizes grouped broker window headers', () => {
        expect(getBrokerWindowHeaderSummary({
            isActiveWindow: true,
            sessions: [
                {
                    attachability: 'attachable',
                    degradedFlags: [],
                },
                {
                    attachability: 'attachable_with_degraded_capabilities',
                    degradedFlags: ['read_only_attach'],
                },
            ],
        }, translate)).toBe(
            't:machine.brokerWindowHeader.activeWindow • t:machine.brokerWindowHeader.sessions:{"count":2} • t:machine.brokerWindowHeader.degraded:{"count":1}',
        );

        expect(getBrokerWindowHeaderSummary({
            isActiveWindow: false,
            sessions: [
                {
                    attachability: 'not_attachable',
                    degradedFlags: ['unstable_session_identity'],
                },
            ],
        }, translate)).toBe(
            't:machine.brokerWindowHeader.sessions:{"count":1} • t:machine.brokerWindowHeader.unavailable',
        );
    });
});
