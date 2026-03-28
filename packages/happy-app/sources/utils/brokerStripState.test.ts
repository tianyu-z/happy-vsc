import { afterEach, describe, expect, it, vi } from 'vitest';

import { createBrokerStripStateController } from './brokerStripState';

describe('brokerStripState', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('auto-collapses the expanded broker banner after 3 seconds with no interaction', async () => {
        vi.useFakeTimers();

        const state = createBrokerStripStateController();

        expect(state.mode).toBe('expanded');

        await vi.advanceTimersByTimeAsync(3_000);

        expect(state.mode).toBe('collapsed');
    });

    it('collapses once on first assistant delta and does not auto-expand again', () => {
        const state = createBrokerStripStateController();

        state.onAssistantDelta();
        expect(state.mode).toBe('collapsed');

        state.onEnter();
        expect(state.mode).toBe('collapsed');
    });

    it('collapses on first scroll past the threshold', () => {
        const state = createBrokerStripStateController();

        state.onScroll(24);
        expect(state.mode).toBe('expanded');

        state.onScroll(25);
        expect(state.mode).toBe('collapsed');
    });

    it('collapses on first sent user message', () => {
        const state = createBrokerStripStateController();

        state.onUserMessageSent();

        expect(state.mode).toBe('collapsed');
    });
});
