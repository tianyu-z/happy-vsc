import { beforeEach, describe, expect, it, vi } from 'vitest';

const { machineRPCMock, machineSpawnHTTPMock, waitUntilConnectedMock } = vi.hoisted(() => ({
    machineRPCMock: vi.fn(),
    machineSpawnHTTPMock: vi.fn(),
    waitUntilConnectedMock: vi.fn(),
}));

vi.mock('./apiSocket', () => ({
    apiSocket: {
        machineRPC: machineRPCMock,
        machineSpawnHTTP: machineSpawnHTTPMock,
        waitUntilConnected: waitUntilConnectedMock,
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
        waitUntilConnectedMock.mockResolvedValue(undefined);
    });

    it('waits for the realtime socket before listing broker sessions', async () => {
        let releaseConnection!: () => void;
        waitUntilConnectedMock.mockImplementation(
            () =>
                new Promise<void>((resolve) => {
                    releaseConnection = resolve;
                }),
        );
        machineRPCMock.mockResolvedValue({ sessions: [] });

        const pending = machineListBrokerSessions('machine-1');
        await Promise.resolve();

        expect(waitUntilConnectedMock).toHaveBeenCalledWith();
        expect(machineRPCMock).not.toHaveBeenCalled();

        releaseConnection();
        await pending;

        expect(machineRPCMock).toHaveBeenCalledWith(
            'machine-1',
            'broker-list-sessions',
            {},
        );
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
                    windowInstanceId: 'win-a',
                    windowLabel: 'api-repo.code-workspace',
                    workspaceLabel: 'api-repo',
                    windowOrdinal: 1,
                    isActiveWindow: true,
                    workspacePath: '/home/work/api-repo',
                    windowLastActiveAt: '2026-03-26T15:00:00.000Z',
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
            windowInstanceId: 'win-a',
            windowLabel: 'api-repo.code-workspace',
            workspaceLabel: 'api-repo',
            windowOrdinal: 1,
            isActiveWindow: true,
            workspacePath: '/home/work/api-repo',
            windowLastActiveAt: '2026-03-26T15:00:00.000Z',
        });
    });

    it('keeps legacy broker list DTOs without window metadata', async () => {
        machineRPCMock.mockResolvedValue({
            sessions: [
                {
                    brokerSessionId: 'broker-sess-legacy',
                    provider: 'codex',
                    title: 'Legacy session',
                    attachability: 'attachable',
                    capabilities: ['sendUserMessage'],
                    degradedFlags: [],
                    ...makeRuntimeMetadata(),
                },
            ],
        });

        await expect(machineListBrokerSessions('machine-1')).resolves.toEqual({
            sessions: [
                {
                    brokerSessionId: 'broker-sess-legacy',
                    provider: 'codex',
                    title: 'Legacy session',
                    attachability: 'attachable',
                    capabilities: ['sendUserMessage'],
                    degradedFlags: [],
                    ...makeRuntimeMetadata(),
                },
            ],
        });
    });

    it('accepts broker discovery DTOs with extra transport metadata fields', async () => {
        machineRPCMock.mockResolvedValue({
            sessions: [
                {
                    brokerSessionId: 'broker-sess-1',
                    provider: 'claude',
                    title: 'Attach me',
                    attachability: 'attachable',
                    capabilities: ['sendUserMessage', 'interrupt'],
                    degradedFlags: [],
                    brokerUrl: 'ws://127.0.0.1:43725?token=bridge-token',
                    brokerRootDir: '/home/work/.vscode-server/data/User/globalStorage/happy.happy-vscode-bridge',
                    ...makeRuntimeMetadata(),
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
                    capabilities: ['sendUserMessage', 'interrupt'],
                    degradedFlags: [],
                    ...makeRuntimeMetadata(),
                },
            ],
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
        machineSpawnHTTPMock.mockResolvedValue({
            type: 'success',
            sessionId: 'happy-sess-1',
        });

        const result = await machineAttachBrokerSession('machine-1', 'broker-sess-1');

        expect(machineSpawnHTTPMock).toHaveBeenCalledWith(
            'machine-1',
            {
                type: 'broker-attach-session',
                brokerSessionId: 'broker-sess-1',
            },
        );
        expect(waitUntilConnectedMock).not.toHaveBeenCalled();
        expect(result).toEqual({
            type: 'success',
            sessionId: 'happy-sess-1',
        });
    });
});
