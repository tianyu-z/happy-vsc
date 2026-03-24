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

function makeRuntimeMetadata() {
    return {
        desiredMode: 'runtime_preferred',
        effectiveMode: 'runtime',
        modeReason: 'runtime_ready',
        compatibility: 'supported',
        providerExtension: {
            id: 'anthropic.claude-code',
            version: '1.0.0',
        },
        probeHealth: {
            runtime: 'ready',
            storage: 'ready',
        },
    };
}

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
                    ...makeRuntimeMetadata(),
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
        expect(result.sessions[0]).toMatchObject({
            desiredMode: 'runtime_preferred',
            effectiveMode: 'runtime',
        });
    });

    it('filters invalid broker session DTOs instead of failing the whole list', async () => {
        machineRPCMock.mockResolvedValue({
            sessions: [
                {
                    brokerSessionId: 'broker-sess-1',
                    provider: 'claude',
                    title: 'Attach me',
                    attachability: 'attachable',
                    capabilities: ['sendUserMessage'],
                    degradedFlags: [],
                    ...makeRuntimeMetadata(),
                },
                {
                    brokerSessionId: 'broker-sess-2',
                    provider: 'not-a-provider',
                    title: 'Invalid provider',
                    attachability: 'attachable',
                    capabilities: [],
                    degradedFlags: [],
                },
            ],
        });

        await expect(machineListBrokerSessions('machine-1')).resolves.toEqual({
            sessions: [
                {
                    brokerSessionId: 'broker-sess-1',
                    provider: 'claude',
                    title: 'Attach me',
                    attachability: 'attachable',
                    capabilities: ['sendUserMessage'],
                    degradedFlags: [],
                    ...makeRuntimeMetadata(),
                },
            ],
        });
    });

    it('rejects broker list responses without a sessions array', async () => {
        machineRPCMock.mockResolvedValue({});

        await expect(machineListBrokerSessions('machine-1')).rejects.toThrow(
            'Invalid broker sessions response',
        );
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
