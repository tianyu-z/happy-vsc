import { describe, expect, it } from 'vitest';
import { shouldShowBrokerHydrationPlaceholder } from './brokerSessionHydration';

describe('shouldShowBrokerHydrationPlaceholder', () => {
    it('returns true for a freshly attached broker session with zero messages', () => {
        expect(
            shouldShowBrokerHydrationPlaceholder({
                sessionSource: 'broker_attached',
                createdAt: 1_700_000_000_000,
                now: 1_700_000_010_000,
                isLoaded: true,
                messageCount: 0,
                silentRefreshPhase: 'idle',
            }),
        ).toBe(true);
    });

    it('returns false after the refresh flow has already failed', () => {
        expect(
            shouldShowBrokerHydrationPlaceholder({
                sessionSource: 'broker_attached',
                createdAt: 1_700_000_000_000,
                now: 1_700_000_010_000,
                isLoaded: true,
                messageCount: 0,
                silentRefreshPhase: 'failed',
            }),
        ).toBe(false);
    });

    it('returns false for non-broker sessions', () => {
        expect(
            shouldShowBrokerHydrationPlaceholder({
                sessionSource: 'direct',
                createdAt: 1_700_000_000_000,
                now: 1_700_000_010_000,
                isLoaded: true,
                messageCount: 0,
                silentRefreshPhase: 'idle',
            }),
        ).toBe(false);
    });

    it('returns false once the hydration window expires', () => {
        expect(
            shouldShowBrokerHydrationPlaceholder({
                sessionSource: 'broker_attached',
                createdAt: 1_700_000_000_000,
                now: 1_700_000_030_500,
                isLoaded: true,
                messageCount: 0,
                silentRefreshPhase: 'idle',
            }),
        ).toBe(false);
    });
});
