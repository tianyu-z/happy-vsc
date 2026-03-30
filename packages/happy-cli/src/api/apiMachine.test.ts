import { beforeEach, describe, expect, it, vi } from 'vitest';

const buildSummaryMock = vi.fn();
const resolveAttachTargetMock = vi.fn();
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

vi.mock('@/broker/BrokerInventoryManager', () => ({
  BrokerInventoryManager: vi.fn().mockImplementation(() => ({
    buildSummary: buildSummaryMock,
    resolveAttachTarget: resolveAttachTargetMock,
  })),
}));

vi.mock('@/broker/brokerManifest', () => ({
  loadBrokerManifest: vi.fn(),
}));

vi.mock('@/broker/BrokerClient', () => ({
  BrokerClient: vi.fn(),
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
    buildSummaryMock.mockResolvedValue({
      updatedAt: 1,
      instances: [],
      sessions: [
        {
          canonicalSessionKey: 'machine-1:instance-1:broker-sess-1',
          instanceId: 'instance-1',
          brokerSessionId: 'broker-sess-1',
          providerSessionKey: 'provider-key-1',
          provider: 'claude',
          title: 'Broker Session',
          attachability: 'attachable',
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
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
          lastActiveAt: 1,
        },
      ],
    });
    resolveAttachTargetMock.mockResolvedValue({
      canonicalSessionKey: 'machine-1:instance-1:broker-sess-1',
      instanceId: 'instance-1',
      brokerSessionId: 'broker-sess-1',
      brokerUrl: 'ws://127.0.0.1:7777?token=broker-token',
      manifestPath: '/tmp/happy-home/bridges/vscode/instances/instance-1.json',
      manifest: {
        installationId: 'install-1',
        instanceId: 'instance-1',
        logicalWindowKey: 'window-1',
        windowLabel: 'api',
        workspaceFolders: ['/workspace/api'],
        runtimeKind: 'ssh',
        runtimeLabel: 'ssh:gpu-1',
        bridgeHostIps: ['10.0.0.2'],
        preferredHostIp: '10.0.0.2',
        runtimeIp: '10.0.0.2',
        providerKinds: ['claude'],
        brokerEndpoint: 'ws://127.0.0.1:7777',
        brokerAuthToken: 'broker-token',
        pid: 1234,
        startedAt: 1,
        lastHeartbeatAt: 2,
        ttlMs: 10_000,
      },
    });
    spawnSessionMock.mockResolvedValue({
      type: 'success',
      sessionId: 'happy-sess-1',
    });
  });

  it('lists broker sessions through the machine RPC layer', async () => {
    const client = await createTestClient();

    const result = await callMachineRpc(client, 'broker-list-sessions', {});

    expect(result.sessions[0].provider).toBe('claude');
    expect(result.sessions[0].canonicalSessionKey).toBe(
      'machine-1:instance-1:broker-sess-1',
    );
    expect(buildSummaryMock).toHaveBeenCalledTimes(1);
  });

  it('spawns a broker-attached worker through the daemon RPC layer', async () => {
    const client = await createTestClient();

    const result = await callMachineRpc(client, 'broker-attach-session', {
      instanceId: 'instance-1',
      brokerSessionId: 'broker-sess-1',
    });

    expect(result).toEqual({ type: 'success', sessionId: 'happy-sess-1' });
    expect(spawnSessionMock).toHaveBeenCalledWith(expect.objectContaining({
      directory: '/workspace/api',
      source: 'broker_attached',
      brokerUrl: 'ws://127.0.0.1:7777?token=broker-token',
      brokerSessionId: 'broker-sess-1',
      instanceId: 'instance-1',
      canonicalBrokerSessionKey: 'machine-1:instance-1:broker-sess-1',
    }));
    expect(resolveAttachTargetMock).toHaveBeenCalledWith({
      instanceId: 'instance-1',
      brokerSessionId: 'broker-sess-1',
      canonicalSessionKey: undefined,
    });
  });

  it('rejects broker attach calls without a broker session id', async () => {
    const client = await createTestClient();

    await expect(callMachineRpc(client, 'broker-attach-session', {}))
      .rejects
      .toThrow('brokerSessionId is required');
  });

  it('surfaces broker discovery failures as RPC errors', async () => {
    buildSummaryMock.mockRejectedValue(new Error('broker unavailable'));

    const client = await createTestClient();

    await expect(callMachineRpc(client, 'broker-list-sessions', {}))
      .rejects
      .toThrow('broker unavailable');
  });
});
