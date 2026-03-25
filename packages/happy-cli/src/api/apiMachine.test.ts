import { beforeEach, describe, expect, it, vi } from 'vitest';

const discoverSessionsMock = vi.fn();
const loadBrokerManifestMock = vi.fn();
const spawnSessionMock = vi.fn();

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    homedir: () => '/broker-root',
  };
});

vi.mock('@/ui/logger', () => ({
  logger: {
    debug: vi.fn(),
    debugLargeJson: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/configuration', () => ({
  configuration: {
    serverUrl: 'ws://localhost:3000',
    happyHomeDir: '/tmp/happy-home',
  },
}));

vi.mock('../modules/common/registerCommonHandlers', () => ({
  registerCommonHandlers: vi.fn(),
}));

vi.mock('../modules/openclaw', () => ({
  registerOpenClawHandlers: vi.fn(),
  openClawTunnelManager: {
    setEventCallback: vi.fn(),
    closeAll: vi.fn(),
  },
}));

vi.mock('@/claude/utils/claudeSessionIndex', () => ({
  listClaudeSessionsFromIndex: vi.fn(),
  getClaudeSessionPreview: vi.fn(),
  findClaudeProjectId: vi.fn(),
  getClaudeSessionUserMessages: vi.fn(),
  saveClaudeSessionCacheStats: vi.fn(),
}));

vi.mock('@/claude/utils/claudeSessionFork', () => ({
  forkAndTruncateSession: vi.fn(),
  forkSession: vi.fn(),
}));

vi.mock('@/gemini/utils/sessionReader', () => ({
  readGeminiSessionLog: vi.fn(),
  listGeminiSessions: vi.fn(),
  getGeminiSessionPreview: vi.fn(),
  saveGeminiSessionCacheStats: vi.fn(),
}));

vi.mock('@/gemini/utils/sessionFork', () => ({
  forkGeminiSession: vi.fn(),
  forkAndTruncateGeminiSession: vi.fn(),
}));

vi.mock('@/codex/utils/codexSessionReader', () => ({
  readCodexSessionUserMessages: vi.fn(),
  listCodexSessions: vi.fn(),
  getCodexSessionPreview: vi.fn(),
  saveCodexSessionCacheStats: vi.fn(),
}));

vi.mock('@/codex/utils/codexSessionFork', () => ({
  forkCodexSession: vi.fn(),
  forkAndTruncateCodexSession: vi.fn(),
}));

vi.mock('@/cache/SessionCache', () => ({
  SessionCache: class {
    invalidate() {}
    list = vi.fn();
  },
  matchFields: vi.fn(),
}));

vi.mock('./rpc/RpcHandlerManager', () => ({
  RpcHandlerManager: class {
    private handlers = new Map<string, (params: unknown) => unknown>();

    registerHandler(method: string, handler: (params: unknown) => unknown) {
      this.handlers.set(`machine-1:${method}`, handler);
    }

    async handleRequest(request: { method: string; params: unknown }) {
      const handler = this.handlers.get(request.method);
      if (!handler) {
        return { error: 'Method not found' };
      }

      try {
        return await handler(request.params);
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    onSocketConnect() {}
    onSocketDisconnect() {}
  },
}));

vi.mock('@/utils/time', () => ({
  backoff: vi.fn(),
}));

vi.mock('@/broker/brokerManifest', () => ({
  loadBrokerManifest: loadBrokerManifestMock,
}));

vi.mock('@/broker/BrokerClient', () => ({
  BrokerClient: vi.fn().mockImplementation(() => ({
    discoverSessions: discoverSessionsMock,
  })),
}));

async function createTestClient() {
  const { ApiMachineClient } = await import('./apiMachine');

  const client = new ApiMachineClient('token', {
    id: 'machine-1',
    encryptionKey: new Uint8Array(32).fill(7),
    encryptionVariant: 'legacy',
    metadata: {
      host: 'localhost',
      platform: 'linux',
      happyCliVersion: 'test',
      homeDir: '/home/test',
      happyHomeDir: '/tmp/happy-home',
      happyLibDir: '/tmp/happy-lib',
    },
    metadataVersion: 1,
    daemonState: null,
    daemonStateVersion: 1,
  });

  client.setRPCHandlers({
    spawnSession: spawnSessionMock,
    stopSession: vi.fn(),
    requestShutdown: vi.fn(),
    orchestratorDispatch: vi.fn(),
    orchestratorCancel: vi.fn(),
  });

  return client;
}

async function callMachineRpc(client: unknown, method: string, params: Record<string, unknown>) {
  const manager = (client as any).rpcHandlerManager;
  const response = await manager.handleRequest({
    method: `machine-1:${method}`,
    params,
  });

  if (response?.error) {
    throw new Error(response.error);
  }

  return response;
}

describe('ApiMachineClient broker RPCs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadBrokerManifestMock.mockResolvedValue({
      port: 7777,
      token: 'broker-token',
      url: 'ws://127.0.0.1:7777?token=broker-token',
    });
    spawnSessionMock.mockResolvedValue({
      type: 'success',
      sessionId: 'happy-sess-1',
    });
  });

  it('lists broker sessions through the machine RPC layer', async () => {
    discoverSessionsMock.mockResolvedValue([
      {
        brokerSessionId: 'broker-sess-1',
        provider: 'claude',
        title: 'Broker Session',
        lastActivityAt: '2026-03-23T12:00:00.000Z',
      },
    ]);

    const client = await createTestClient();

    const result = await callMachineRpc(client, 'broker-list-sessions', {});

    expect(result.sessions[0].provider).toBe('claude');
    expect(loadBrokerManifestMock).toHaveBeenCalledWith('/broker-root/.happy-vsc');
  });

  it('spawns a broker-attached worker through the daemon RPC layer', async () => {
    const client = await createTestClient();

    const result = await callMachineRpc(client, 'broker-attach-session', {
      brokerSessionId: 'broker-sess-1',
    });

    expect(result).toEqual({ type: 'success', sessionId: 'happy-sess-1' });
    expect(spawnSessionMock).toHaveBeenCalledWith(expect.objectContaining({
      directory: '/broker-root/.happy-vsc',
      source: 'broker_attached',
      brokerRootDir: '/broker-root/.happy-vsc',
      brokerUrl: 'ws://127.0.0.1:7777?token=broker-token',
      brokerSessionId: 'broker-sess-1',
    }));
    expect(loadBrokerManifestMock).toHaveBeenCalledWith('/broker-root/.happy-vsc');
  });

  it('rejects broker attach calls without a broker session id', async () => {
    const client = await createTestClient();

    await expect(callMachineRpc(client, 'broker-attach-session', {}))
      .rejects
      .toThrow('brokerSessionId is required');
  });

  it('surfaces broker discovery failures as RPC errors', async () => {
    discoverSessionsMock.mockRejectedValue(new Error('broker unavailable'));

    const client = await createTestClient();

    await expect(callMachineRpc(client, 'broker-list-sessions', {}))
      .rejects
      .toThrow('broker unavailable');
  });
});
