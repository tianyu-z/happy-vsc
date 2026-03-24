import { describe, expect, it } from 'vitest';

import {
    canAttachBrokerSession,
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
