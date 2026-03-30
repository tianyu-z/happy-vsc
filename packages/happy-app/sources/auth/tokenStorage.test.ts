import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureStoreMocks = vi.hoisted(() => ({
    getItemAsync: vi.fn(),
    setItemAsync: vi.fn(),
    deleteItemAsync: vi.fn(),
}));

vi.mock('react-native', () => ({
    Platform: {
        OS: 'web',
    },
}));

vi.mock('expo-secure-store', () => secureStoreMocks);

type StorageMock = {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
};

function createLocalStorageMock(): StorageMock {
    const data = new Map<string, string>();

    return {
        getItem: vi.fn((key: string) => data.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
            data.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
            data.delete(key);
        }),
        clear: vi.fn(() => {
            data.clear();
        }),
    };
}

describe('TokenStorage on web', () => {
    beforeEach(() => {
        vi.resetModules();
        Object.defineProperty(globalThis, 'localStorage', {
            value: createLocalStorageMock(),
            configurable: true,
            writable: true,
        });
    });

    it('returns null and clears malformed stored credentials', async () => {
        globalThis.localStorage?.setItem('auth_credentials', '{"token":');

        const { TokenStorage } = await import('./tokenStorage');

        await expect(TokenStorage.getCredentials()).resolves.toBeNull();
        expect(globalThis.localStorage?.removeItem).toHaveBeenCalledWith('auth_credentials');
    });

    it('returns null and clears structurally invalid stored credentials', async () => {
        globalThis.localStorage?.setItem('auth_credentials', JSON.stringify({ token: 123, secret: true }));

        const { TokenStorage } = await import('./tokenStorage');

        await expect(TokenStorage.getCredentials()).resolves.toBeNull();
        expect(globalThis.localStorage?.removeItem).toHaveBeenCalledWith('auth_credentials');
    });
});
