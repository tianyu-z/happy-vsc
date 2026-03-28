import { describe, expect, it, vi } from 'vitest';
import type { Session } from '@/sync/storageTypes';
import {
    createSessionHref,
    navigateBackFromSession,
} from './sessionNavigation';

function createSession(overrides: Partial<Session> = {}): Session {
    return {
        id: 'session-1',
        seq: 1,
        createdAt: 0,
        updatedAt: 0,
        active: true,
        activeAt: 0,
        metadata: {
            path: '/repo',
            host: 'host',
            machineId: 'machine-1',
        },
        metadataVersion: 1,
        agentState: null,
        agentStateVersion: 1,
        thinking: false,
        thinkingAt: 0,
        presence: 'online',
        ...overrides,
    };
}

describe('createSessionHref', () => {
    it('includes returnTo when navigating from a list page', () => {
        expect(createSessionHref('session-1', '/machine/machine-1')).toBe(
            '/session/session-1?returnTo=%2Fmachine%2Fmachine-1',
        );
    });

    it('omits returnTo when none is provided', () => {
        expect(createSessionHref('session-1')).toBe('/session/session-1');
    });
});

describe('navigateBackFromSession', () => {
    it('replaces to explicit returnTo instead of relying on history', () => {
        const router = {
            back: vi.fn(),
            canGoBack: vi.fn(() => true),
            replace: vi.fn(),
        };

        navigateBackFromSession({
            router,
            sessionId: 'session-1',
            session: createSession(),
            returnTo: '/machine/machine-1',
        });

        expect(router.replace).toHaveBeenCalledWith('/machine/machine-1');
        expect(router.back).not.toHaveBeenCalled();
    });

    it('allows static session routes as explicit return targets', () => {
        const router = {
            back: vi.fn(),
            canGoBack: vi.fn(() => true),
            replace: vi.fn(),
        };

        navigateBackFromSession({
            router,
            sessionId: 'session-1',
            session: createSession(),
            returnTo: '/session/history',
        });

        expect(router.replace).toHaveBeenCalledWith('/session/history');
        expect(router.back).not.toHaveBeenCalled();
    });

    it('falls back to the machine detail page when there is no valid history', () => {
        const router = {
            back: vi.fn(),
            canGoBack: vi.fn(() => false),
            replace: vi.fn(),
        };

        navigateBackFromSession({
            router,
            sessionId: 'session-1',
            session: createSession(),
        });

        expect(router.replace).toHaveBeenCalledWith('/machine/machine-1');
        expect(router.back).not.toHaveBeenCalled();
    });

    it('ignores self-referential returnTo values and uses stable fallback', () => {
        const router = {
            back: vi.fn(),
            canGoBack: vi.fn(() => false),
            replace: vi.fn(),
        };

        navigateBackFromSession({
            router,
            sessionId: 'session-1',
            session: createSession(),
            returnTo: '/session/session-1',
        });

        expect(router.replace).toHaveBeenCalledWith('/machine/machine-1');
        expect(router.back).not.toHaveBeenCalled();
    });

    it('uses history only when no explicit return target exists and history is valid', () => {
        const router = {
            back: vi.fn(),
            canGoBack: vi.fn(() => true),
            replace: vi.fn(),
        };

        navigateBackFromSession({
            router,
            sessionId: 'session-1',
            session: createSession(),
        });

        expect(router.back).toHaveBeenCalledTimes(1);
        expect(router.replace).not.toHaveBeenCalled();
    });

    it('falls back to home when machine context is unavailable', () => {
        const router = {
            back: vi.fn(),
            canGoBack: vi.fn(() => false),
            replace: vi.fn(),
        };

        navigateBackFromSession({
            router,
            sessionId: 'session-1',
            session: createSession({
                metadata: {
                    path: '/repo',
                    host: 'host',
                },
            }),
        });

        expect(router.replace).toHaveBeenCalledWith('/');
        expect(router.back).not.toHaveBeenCalled();
    });
});
