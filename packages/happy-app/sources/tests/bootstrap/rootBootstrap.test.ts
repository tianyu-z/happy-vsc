import { describe, expect, it, vi } from 'vitest';
import { bootstrapRootApp } from '../../bootstrap/rootBootstrap';

describe('bootstrapRootApp', () => {
    it('falls back to logged-out state when restoring stored credentials fails', async () => {
        const credentials = {
            token: 'token-1',
            secret: 'secret-1',
        };
        const removeCredentials = vi.fn(async () => true);

        await expect(bootstrapRootApp({
            loadFonts: vi.fn(async () => {}),
            awaitSodiumReady: vi.fn(async () => {}),
            getCredentials: vi.fn(async () => credentials),
            restoreSync: vi.fn(async () => {
                throw new Error('Invalid secret key length');
            }),
            removeCredentials,
            logError: vi.fn(),
        })).resolves.toEqual({
            credentials: null,
        });

        expect(removeCredentials).toHaveBeenCalledTimes(1);
    });

    it('falls back to logged-out state when initialization throws before auth restore', async () => {
        const removeCredentials = vi.fn(async () => true);

        await expect(bootstrapRootApp({
            loadFonts: vi.fn(async () => {
                throw new Error('Font load failed');
            }),
            awaitSodiumReady: vi.fn(async () => {}),
            getCredentials: vi.fn(async () => null),
            restoreSync: vi.fn(async () => {}),
            removeCredentials,
            logError: vi.fn(),
        })).resolves.toEqual({
            credentials: null,
        });

        expect(removeCredentials).not.toHaveBeenCalled();
    });

    it('falls back to logged-out state when bootstrap hangs past the timeout', async () => {
        const removeCredentials = vi.fn(async () => true);

        await expect(bootstrapRootApp({
            loadFonts: () => new Promise<void>(() => {}),
            awaitSodiumReady: vi.fn(async () => {}),
            getCredentials: vi.fn(async () => null),
            restoreSync: vi.fn(async () => {}),
            removeCredentials,
            logError: vi.fn(),
            timeoutMs: 10,
        })).resolves.toEqual({
            credentials: null,
        });

        expect(removeCredentials).not.toHaveBeenCalled();
    });
});
