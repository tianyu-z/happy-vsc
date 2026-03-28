import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/tokenStorage', () => ({
    TokenStorage: {
        getCredentials: vi.fn(),
    },
}));

vi.mock('./encryption/encryption', () => ({
    Encryption: class Encryption {},
}));

import { apiSocket } from './apiSocket';

function resetApiSocket() {
    const internal = apiSocket as any;
    internal.socket = null;
    internal.config = null;
    internal.encryption = null;
    internal.messageHandlers = new Map();
    internal.reconnectedListeners = new Set();
    internal.statusListeners = new Set();
    internal.currentStatus = 'disconnected';
    internal.rpcHandlers = new Map();
    internal.registeredRpcMethods = new Set();
}

describe('apiSocket.waitUntilConnected', () => {
    beforeEach(() => {
        resetApiSocket();
    });

    afterEach(() => {
        resetApiSocket();
    });

    it('resolves after the socket transitions to connected', async () => {
        const socket = {
            connected: false,
        };

        (apiSocket as any).socket = socket;
        (apiSocket as any).currentStatus = 'connecting';

        let resolved = false;
        const waitPromise = apiSocket.waitUntilConnected(1000).then(() => {
            resolved = true;
        });

        await Promise.resolve();
        expect(resolved).toBe(false);

        socket.connected = true;
        (apiSocket as any).updateStatus('connected');

        await waitPromise;
        expect(resolved).toBe(true);
    });
});
