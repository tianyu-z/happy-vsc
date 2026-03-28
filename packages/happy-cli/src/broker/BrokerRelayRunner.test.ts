import { describe, expect, it, vi } from 'vitest';

import { BrokerRelayRunner } from './BrokerRelayRunner';

const {
  mockBackfillClaudeSessionHistory,
  mockBackfillCodexSessionHistory,
} = vi.hoisted(() => ({
  mockBackfillClaudeSessionHistory: vi.fn(),
  mockBackfillCodexSessionHistory: vi.fn(),
}));

vi.mock('../claude/utils/claudeBackfill', () => ({
  backfillClaudeSessionHistory: mockBackfillClaudeSessionHistory,
}));

vi.mock('../codex/utils/codexBackfill', () => ({
  backfillCodexSessionHistory: mockBackfillCodexSessionHistory,
}));

function createFakeSession(sessionId: string) {
  let userMessageHandler: ((message: any) => unknown) | undefined;
  const rpcHandlers = new Map<string, (params: any) => unknown>();

  const session = {
    sessionId,
    sendAgentMessage: vi.fn(),
    sendUserTextMessage: vi.fn(),
    sendClaudeSessionMessageBatch: vi.fn().mockResolvedValue({ result: 'success' }),
    sendBackfillBatch: vi.fn().mockResolvedValue({ result: 'success' }),
    keepAlive: vi.fn(),
    isConnected: vi.fn(() => true),
    updateAgentState: vi.fn((handler: (state: any) => any) => {
      fakeState = handler(fakeState);
    }),
    onUserMessage: vi.fn((handler: (message: any) => unknown) => {
      userMessageHandler = handler;
    }),
    rpcHandlerManager: {
      registerHandler: vi.fn((name: string, handler: (params: any) => unknown) => {
        rpcHandlers.set(name, handler);
      }),
    },
  };

  let fakeState: any = {};

  return {
    session,
    getState: () => fakeState,
    emitUserMessage: async (message: any) => {
      await userMessageHandler?.(message);
    },
    getRpcHandler: (name: string) => rpcHandlers.get(name),
  };
}

describe('BrokerRelayRunner', () => {
  it('backfills Claude attach history through the live session when runtime refs are available', async () => {
    vi.clearAllMocks();

    const sessionRef = createFakeSession('happy-session-1');
    const brokerClient = {
      attachSession: vi.fn().mockResolvedValue({
        brokerSessionId: 'broker-sess-1',
        provider: 'claude',
        latestSeq: 1,
        runtimeProviderSessionRef: 'claude-runtime-ref-1',
        storageProviderSessionRef: 'claude-storage-ref-1',
        capabilities: ['sendUserMessage', 'interrupt'],
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
      }),
      sendMessage: vi.fn().mockResolvedValue(true),
      interruptSession: vi.fn().mockResolvedValue(true),
      resolveApproval: vi.fn().mockResolvedValue(true),
    };

    const runner = new BrokerRelayRunner({
      api: {
        getOrCreateMachine: vi.fn().mockResolvedValue({}),
        getOrCreateSession: vi.fn().mockResolvedValue({ id: 'happy-session-1' }),
        sessionSyncClient: vi.fn(),
      } as any,
      brokerClient: brokerClient as any,
      brokerEventStream: {
        subscribeEvents: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      },
      machineId: 'machine-1',
      machineMetadata: {
        host: 'localhost',
        platform: 'darwin',
        happyCliVersion: '0.0.0-test',
        homeDir: '/tmp',
        happyHomeDir: '/tmp/.happy',
        happyLibDir: '/tmp/.happy/lib',
      },
      brokerSessionId: 'broker-sess-1',
      brokerWindowInstanceId: 'window-a',
      brokerWindowLabel: 'Window A',
      brokerWorkspaceLabel: 'Workspace A',
      brokerWorkspacePath: '/workspace-a',
      brokerWindowOrdinal: 1,
      setupOfflineReconnection: vi.fn().mockReturnValue({
        session: sessionRef.session,
        reconnectionHandle: null,
        isOffline: false,
      }),
    });

    const startPromise = runner.start();
    await vi.waitFor(() => {
      expect(mockBackfillClaudeSessionHistory).toHaveBeenCalled();
    });

    expect(mockBackfillClaudeSessionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        workingDirectory: '/workspace-a',
        sessionId: 'claude-runtime-ref-1',
        sendBatch: expect.any(Function),
      }),
    );

    const sendBatch = mockBackfillClaudeSessionHistory.mock.calls[0]?.[0]?.sendBatch;
    await sendBatch?.([{ message: { type: 'user', uuid: 'user-1', message: { role: 'user', content: 'hello' } }, localId: 'local-1' }]);

    expect(sessionRef.session.sendClaudeSessionMessageBatch).toHaveBeenCalledWith(
      [{ message: { type: 'user', uuid: 'user-1', message: { role: 'user', content: 'hello' } }, localId: 'local-1' }],
      'replace',
    );

    await runner.stop();
    await startPromise;
  });

  it('backfills Codex attach history through the live session when runtime refs are available', async () => {
    vi.clearAllMocks();

    const sessionRef = createFakeSession('happy-session-1');
    const brokerClient = {
      attachSession: vi.fn().mockResolvedValue({
        brokerSessionId: 'broker-sess-1',
        provider: 'codex',
        latestSeq: 1,
        runtimeProviderSessionRef: 'codex-runtime-ref-1',
        storageProviderSessionRef: 'codex-storage-ref-1',
        capabilities: ['sendUserMessage', 'interrupt'],
        degradedFlags: [],
        desiredMode: 'runtime_preferred',
        effectiveMode: 'runtime',
        modeReason: 'runtime_ready',
        compatibility: 'supported',
        providerExtension: {
          id: 'openai.chatgpt',
          version: '1.0.0',
        },
        probeHealth: {
          runtime: 'ready',
          storage: 'ready',
        },
      }),
      sendMessage: vi.fn().mockResolvedValue(true),
      interruptSession: vi.fn().mockResolvedValue(true),
      resolveApproval: vi.fn().mockResolvedValue(true),
    };

    const runner = new BrokerRelayRunner({
      api: {
        getOrCreateMachine: vi.fn().mockResolvedValue({}),
        getOrCreateSession: vi.fn().mockResolvedValue({ id: 'happy-session-1' }),
        sessionSyncClient: vi.fn(),
      } as any,
      brokerClient: brokerClient as any,
      brokerEventStream: {
        subscribeEvents: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      },
      machineId: 'machine-1',
      machineMetadata: {
        host: 'localhost',
        platform: 'darwin',
        happyCliVersion: '0.0.0-test',
        homeDir: '/tmp',
        happyHomeDir: '/tmp/.happy',
        happyLibDir: '/tmp/.happy/lib',
      },
      brokerSessionId: 'broker-sess-1',
      brokerWindowInstanceId: 'window-a',
      brokerWindowLabel: 'Window A',
      brokerWorkspaceLabel: 'Workspace A',
      brokerWorkspacePath: '/workspace-a',
      brokerWindowOrdinal: 1,
      setupOfflineReconnection: vi.fn().mockReturnValue({
        session: sessionRef.session,
        reconnectionHandle: null,
        isOffline: false,
      }),
    });

    const startPromise = runner.start();
    await vi.waitFor(() => {
      expect(mockBackfillCodexSessionHistory).toHaveBeenCalled();
    });

    expect(mockBackfillCodexSessionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionIdOrPath: 'codex-runtime-ref-1',
        sendBatch: expect.any(Function),
      }),
    );

    const sendBatch = mockBackfillCodexSessionHistory.mock.calls[0]?.[0]?.sendBatch;
    await sendBatch?.([{ content: { role: 'user', content: { type: 'text', text: 'hello' } }, localId: 'local-1' }]);

    expect(sessionRef.session.sendBackfillBatch).toHaveBeenCalledWith(
      [{ content: { role: 'user', content: { type: 'text', text: 'hello' } }, localId: 'local-1' }],
      'replace',
    );

    await runner.stop();
    await startPromise;
  });

  it('falls back to storage provider refs for history backfill when runtime refs are unavailable', async () => {
    vi.clearAllMocks();

    const sessionRef = createFakeSession('happy-session-1');
    const brokerClient = {
      attachSession: vi.fn().mockResolvedValue({
        brokerSessionId: 'broker-sess-1',
        provider: 'codex',
        latestSeq: 1,
        runtimeProviderSessionRef: null,
        storageProviderSessionRef: 'codex-storage-ref-1',
        capabilities: ['sendUserMessage', 'interrupt'],
        degradedFlags: ['read_only_attach'],
        desiredMode: 'storage_preferred',
        effectiveMode: 'storage',
        modeReason: 'runtime_unavailable_fallback_to_storage',
        compatibility: 'supported',
        providerExtension: {
          id: 'openai.chatgpt',
          version: '1.0.0',
        },
        probeHealth: {
          runtime: 'unavailable',
          storage: 'ready',
        },
      }),
      sendMessage: vi.fn().mockResolvedValue(true),
      interruptSession: vi.fn().mockResolvedValue(true),
      resolveApproval: vi.fn().mockResolvedValue(true),
    };

    const runner = new BrokerRelayRunner({
      api: {
        getOrCreateMachine: vi.fn().mockResolvedValue({}),
        getOrCreateSession: vi.fn().mockResolvedValue({ id: 'happy-session-1' }),
        sessionSyncClient: vi.fn(),
      } as any,
      brokerClient: brokerClient as any,
      brokerEventStream: {
        subscribeEvents: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      },
      machineId: 'machine-1',
      machineMetadata: {
        host: 'localhost',
        platform: 'darwin',
        happyCliVersion: '0.0.0-test',
        homeDir: '/tmp',
        happyHomeDir: '/tmp/.happy',
        happyLibDir: '/tmp/.happy/lib',
      },
      brokerSessionId: 'broker-sess-1',
      brokerWindowInstanceId: 'window-a',
      brokerWindowLabel: 'Window A',
      brokerWorkspaceLabel: 'Workspace A',
      brokerWorkspacePath: '/workspace-a',
      brokerWindowOrdinal: 1,
      setupOfflineReconnection: vi.fn().mockReturnValue({
        session: sessionRef.session,
        reconnectionHandle: null,
        isOffline: false,
      }),
    });

    const startPromise = runner.start();
    await vi.waitFor(() => {
      expect(mockBackfillCodexSessionHistory).toHaveBeenCalled();
    });

    expect(mockBackfillCodexSessionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionIdOrPath: 'codex-storage-ref-1',
      }),
    );

    await runner.stop();
    await startPromise;
  });

  it('forwards mobile text, receives broker output, handles approval, and interrupts', async () => {
    const sessionRef = createFakeSession('happy-session-1');
    let onSessionSwap: ((session: any) => void) | undefined;
    let onEvent: ((entry: any) => void) | undefined;
    const getOrCreateSession = vi.fn().mockResolvedValue({ id: 'happy-session-1' });
    const brokerClient = {
      attachSession: vi.fn().mockResolvedValue({
        brokerSessionId: 'broker-sess-1',
        provider: 'claude',
        latestSeq: 1,
        capabilities: ['sendUserMessage', 'interrupt'],
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
      }),
      sendMessage: vi.fn().mockResolvedValue(true),
      interruptSession: vi.fn().mockResolvedValue(true),
      resolveApproval: vi.fn().mockResolvedValue(true),
    };

    const runner = new BrokerRelayRunner({
      api: {
        getOrCreateMachine: vi.fn().mockResolvedValue({}),
        getOrCreateSession,
      } as any,
      brokerClient: brokerClient as any,
      brokerEventStream: {
        subscribeEvents: vi.fn().mockImplementation(async (_brokerSessionId, next) => {
          onEvent = next;
        }),
        close: vi.fn().mockResolvedValue(undefined),
      },
      machineId: 'machine-1',
      machineMetadata: {
        host: 'localhost',
        platform: 'darwin',
        happyCliVersion: '0.0.0-test',
        homeDir: '/tmp',
        happyHomeDir: '/tmp/.happy',
        happyLibDir: '/tmp/.happy/lib',
      },
      brokerSessionId: 'broker-sess-1',
      brokerWindowInstanceId: 'window-a',
      brokerWindowLabel: 'Window A',
      brokerWorkspaceLabel: 'Workspace A',
      brokerWorkspacePath: '/workspace-a',
      brokerWindowOrdinal: 1,
      brokerWindowIsActive: true,
      brokerWindowLastActiveAt: '2026-03-26T15:00:00.000Z',
      notifyDaemonSessionStarted: vi.fn().mockResolvedValue({}),
      setupOfflineReconnection: vi.fn().mockImplementation(({ onSessionSwap: nextOnSessionSwap }) => {
        onSessionSwap = nextOnSessionSwap;
        return {
          session: sessionRef.session,
          reconnectionHandle: null,
          isOffline: false,
        };
      }),
    });

    const startPromise = runner.start();
    await vi.waitFor(() => {
      expect(onEvent).toBeTypeOf('function');
      expect(sessionRef.getRpcHandler('abort')).toBeTypeOf('function');
      expect(sessionRef.getRpcHandler('permission')).toBeTypeOf('function');
      expect(onSessionSwap).toBeTypeOf('function');
    });
    expect(getOrCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          windowInstanceId: 'window-a',
          brokerWindowLabel: 'Window A',
          brokerWorkspaceLabel: 'Workspace A',
          brokerWorkspacePath: '/workspace-a',
          brokerWindowOrdinal: 1,
          brokerWindowIsActive: true,
          brokerWindowLastActiveAt: '2026-03-26T15:00:00.000Z',
        }),
      }),
    );

    await sessionRef.emitUserMessage({
      role: 'user',
      content: { type: 'text', text: 'continue' },
    });

    expect(brokerClient.sendMessage).toHaveBeenCalledWith(
      'broker-sess-1',
      'continue',
    );

    onEvent?.({
      seq: 1,
      at: 123,
      sessionId: 'broker-sess-1',
      event: {
        type: 'session.message.delta',
        brokerSessionId: 'broker-sess-1',
        payload: { role: 'assistant', text: 'working' },
      },
    });

    expect(sessionRef.session.sendAgentMessage).toHaveBeenCalledWith('claude', {
      type: 'message',
      message: 'working',
    });

    onEvent?.({
      seq: 2,
      at: 124,
      sessionId: 'broker-sess-1',
      event: {
        type: 'session.message.delta',
        brokerSessionId: 'broker-sess-1',
        payload: { role: 'user', text: 'typed in VS Code' },
      },
    });

    expect(sessionRef.session.sendUserTextMessage).toHaveBeenCalledWith(
      'typed in VS Code',
    );

    await sessionRef.getRpcHandler('permission')?.({
      id: 'approval-1',
      approved: true,
    });

    expect(brokerClient.resolveApproval).toHaveBeenCalledWith(
      'broker-sess-1',
      'approval-1',
      'approve',
    );

    await sessionRef.getRpcHandler('abort')?.({ reason: 'user_abort' });

    expect(brokerClient.interruptSession).toHaveBeenCalledWith(
      'broker-sess-1',
      'user_abort',
    );

    await runner.stop();
    await startPromise;
  });

  it('rebinds user input and event projection after session swap', async () => {
    const initialSessionRef = createFakeSession('happy-session-1');
    const swappedSessionRef = createFakeSession('happy-session-1b');
    let onSessionSwap: ((session: any) => void) | undefined;
    let onEvent: ((entry: any) => void) | undefined;

    const brokerClient = {
      attachSession: vi.fn().mockResolvedValue({
        brokerSessionId: 'broker-sess-1',
        provider: 'claude',
        latestSeq: 1,
        capabilities: ['sendUserMessage', 'interrupt'],
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
      }),
      sendMessage: vi.fn().mockResolvedValue(true),
      interruptSession: vi.fn().mockResolvedValue(true),
      resolveApproval: vi.fn().mockResolvedValue(true),
    };

    const runner = new BrokerRelayRunner({
      api: {
        getOrCreateMachine: vi.fn().mockResolvedValue({}),
        getOrCreateSession: vi.fn().mockResolvedValue({ id: 'happy-session-1' }),
      } as any,
      brokerClient: brokerClient as any,
      brokerEventStream: {
        subscribeEvents: vi.fn().mockImplementation(async (_brokerSessionId, next) => {
          onEvent = next;
        }),
        close: vi.fn().mockResolvedValue(undefined),
      },
      machineId: 'machine-1',
      machineMetadata: {
        host: 'localhost',
        platform: 'darwin',
        happyCliVersion: '0.0.0-test',
        homeDir: '/tmp',
        happyHomeDir: '/tmp/.happy',
        happyLibDir: '/tmp/.happy/lib',
      },
      brokerSessionId: 'broker-sess-1',
      brokerWindowInstanceId: 'window-a',
      brokerWindowLabel: 'Window A',
      brokerWorkspaceLabel: 'Workspace A',
      brokerWorkspacePath: '/workspace-a',
      brokerWindowOrdinal: 1,
      notifyDaemonSessionStarted: vi.fn().mockResolvedValue({}),
      setupOfflineReconnection: vi.fn().mockImplementation(({ onSessionSwap: nextOnSessionSwap }) => {
        onSessionSwap = nextOnSessionSwap;
        return {
          session: initialSessionRef.session,
          reconnectionHandle: null,
          isOffline: false,
        };
      }),
    });

    const startPromise = runner.start();
    await vi.waitFor(() => {
      expect(onSessionSwap).toBeTypeOf('function');
      expect(onEvent).toBeTypeOf('function');
    });

    onSessionSwap?.(swappedSessionRef.session);

    await swappedSessionRef.emitUserMessage({
      role: 'user',
      content: { type: 'mixed', text: 'continue after swap', images: [{ type: 'image', url: 'x', width: 1, height: 1, mimeType: 'image/png' }] },
    });

    expect(brokerClient.sendMessage).toHaveBeenLastCalledWith(
      'broker-sess-1',
      'continue after swap',
    );

    onEvent?.({
      seq: 2,
      at: 456,
      sessionId: 'broker-sess-1',
      event: {
        type: 'session.message.delta',
        brokerSessionId: 'broker-sess-1',
        payload: { role: 'assistant', text: 'after swap' },
      },
    });

    expect(swappedSessionRef.session.sendAgentMessage).toHaveBeenCalledWith('claude', {
      type: 'message',
      message: 'after swap',
    });
    expect(initialSessionRef.session.sendAgentMessage).not.toHaveBeenCalledWith('claude', {
      type: 'message',
      message: 'after swap',
    });

    await swappedSessionRef.getRpcHandler('abort')?.({ reason: 'user_abort' });
    expect(brokerClient.interruptSession).toHaveBeenCalledWith('broker-sess-1', 'user_abort');

    await runner.stop();
    await startPromise;
  });
});
