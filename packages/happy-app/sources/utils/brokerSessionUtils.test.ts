import { describe, expect, it } from 'vitest';

import {
    canAttachBrokerSession,
    getBrokerSessionAttachabilityLabel,
    getBrokerSessionBadge,
    getBrokerSessionDegradedMessages,
} from './brokerSessionUtils';

describe('brokerSessionUtils', () => {
    it('labels broker-attached sessions as broker-backed', () => {
        expect(getBrokerSessionBadge({
            sessionSource: 'broker_attached',
            brokerDegradedFlags: [],
        } as any)).toBe('Broker');
    });

    it('maps broker attachability states for display and interaction', () => {
        expect(canAttachBrokerSession({ attachability: 'attachable' })).toBe(true);
        expect(getBrokerSessionAttachabilityLabel({ attachability: 'attachable' })).toBe('Ready to attach');

        expect(canAttachBrokerSession({ attachability: 'attachable_with_degraded_capabilities' })).toBe(true);
        expect(
            getBrokerSessionAttachabilityLabel({
                attachability: 'attachable_with_degraded_capabilities',
            }),
        ).toBe('Attach with limited control');

        expect(canAttachBrokerSession({ attachability: 'not_attachable' })).toBe(false);
        expect(getBrokerSessionAttachabilityLabel({ attachability: 'not_attachable' })).toBe('Not attachable');
    });

    it('maps degraded flags to human-readable warnings', () => {
        const warnings = getBrokerSessionDegradedMessages([
            'read_only_attach',
            'approval_bridge_unavailable',
            'attachment_bridge_unavailable',
            'selection_context_stale',
        ]);

        expect(warnings).toEqual([
            'Read-only attach',
            'Approval requests stay in VS Code',
            'Attachments stay in VS Code',
            'Editor selection may be stale',
        ]);
        expect(warnings.join(' ')).not.toContain('read_only_attach');
    });
});
