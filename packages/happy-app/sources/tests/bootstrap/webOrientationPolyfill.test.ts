import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

describe('web orientation polyfill', () => {
    it('fills missing screen.orientation.type on web', async () => {
        vi.stubGlobal('window', {
            innerWidth: 1280,
            innerHeight: 720,
            addEventListener: vi.fn(),
        });
        vi.stubGlobal('screen', {});

        await import('../../polyfills/webOrientation');

        expect((globalThis.screen as any).orientation.type).toBe('landscape-primary');
    });
});
