import { beforeEach, describe, expect, it, vi } from 'vitest';

const { machineRPCMock } = vi.hoisted(() => ({
    machineRPCMock: vi.fn(),
}));

vi.mock('./apiSocket', () => ({
    apiSocket: {
        machineRPC: machineRPCMock,
    },
}));

vi.mock('./sync', () => ({
    sync: {},
}));

import { machineAttachBrokerSession, machineListBrokerSessions } from './ops';

describe('broker session ops', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls the machine broker list RPC', async () => {
        machineRPCMock.mockResolvedValue({
            sessions: [
                {
                    brokerSessionId: 'broker-sess-1',
                    provider: 'claude',
                    title: 'Attach me',
                    attachability: 'attachable',
                    capabilities: ['sendUserMessage'],
                    degradedFlags: [],
                },
            ],
        });

        const result = await machineListBrokerSessions('machine-1');

        expect(machineRPCMock).toHaveBeenCalledWith(
            'machine-1',
            'broker-list-sessions',
            {},
        );
        expect(result.sessions[0].provider).toBe('claude');
    });

    it('calls the machine broker attach RPC with the selected broker session id', async () => {
        machineRPCMock.mockResolvedValue({
            type: 'success',
            sessionId: 'happy-sess-1',
        });

        const result = await machineAttachBrokerSession('machine-1', 'broker-sess-1');

        expect(machineRPCMock).toHaveBeenCalledWith(
            'machine-1',
            'broker-attach-session',
            { brokerSessionId: 'broker-sess-1' },
        );
        expect(result).toEqual({
            type: 'success',
            sessionId: 'happy-sess-1',
        });
    });
});
