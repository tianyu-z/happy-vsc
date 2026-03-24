import { describe, expect, it, vi } from 'vitest';

import type { ProviderHostResolution } from '../types';

import { CodexRuntimeProbe } from './CodexRuntimeProbe';
import { CodexStorageProbe } from './CodexStorageProbe';

const codexCommands = [
  'chatgpt.addToThread',
  'chatgpt.addFileToThread',
  'chatgpt.openSidebar',
  'chatgpt.newChat',
  'chatgpt.implementTodo',
  'chatgpt.newCodexPanel',
];

function makeHostResolution(): ProviderHostResolution {
  return {
    provider: 'codex',
    compatibility: 'supported',
    activationState: 'active',
    providerExtension: {
      id: 'openai.chatgpt',
      version: '1.0.0',
    },
    commands: [...codexCommands],
    contextKeys: ['chatgpt.sessionActive'],
    exportKeys: ['runtimeBridge'],
    host: {
      provider: 'codex',
      extensionId: 'openai.chatgpt',
      getCommands: async () => [...codexCommands],
      isCommandAvailable: async (commandId) => codexCommands.includes(commandId),
      getContextKeys: async () => ['chatgpt.sessionActive'],
      hasContextKey: async (key) => key === 'chatgpt.sessionActive',
      activateExtension: async () => ({ runtimeBridge: {} }),
      getExports: async () => ({ runtimeBridge: {} }),
    },
  };
}

type CodexRuntimeSessionInput = {
  providerSessionRef?: string;
  conversationId?: string;
  title?: string;
  latestSeq?: number;
  supportsInterrupt?: boolean;
  supportsApprovals?: boolean;
  eventStreamAvailable?: boolean;
  canAttach?: boolean;
};

type CodexStorageSessionInput = {
  providerSessionRef?: string;
  conversationId?: string;
  title?: string;
  latestSeq?: number;
  recordId?: string;
};

async function discoverCodexSession(options: {
  runtime?: CodexRuntimeSessionInput[];
  storage?: CodexStorageSessionInput[];
  attachmentBridgeAvailable?: boolean;
}) {
  const runtimeProbe = new CodexRuntimeProbe(makeHostResolution(), {
    listSessions: async () =>
      (options.runtime ?? []).map((session) => ({
        providerSessionRef: String(session.providerSessionRef ?? 'runtime-ref'),
        conversationId: session.conversationId,
        title: session.title,
        latestSeq: session.latestSeq,
        supportsInterrupt: Boolean(session.supportsInterrupt),
        supportsApprovals: Boolean(session.supportsApprovals),
        eventStreamAvailable:
          session.eventStreamAvailable === undefined
            ? true
            : Boolean(session.eventStreamAvailable),
        canAttach: session.canAttach,
        workspace: {
          folderUris: ['file:///workspace'],
        },
      })),
    sendMessage: async () => {},
    interrupt: async () => {},
    resolveApproval: async () => {},
    watchSession: async () => () => {},
    attachmentBridgeAvailable: options.attachmentBridgeAvailable ?? true,
  });
  const storageProbe = new CodexStorageProbe(makeHostResolution(), {
    listSessions: async () =>
      (options.storage ?? []).map((session) => ({
        providerSessionRef: String(session.providerSessionRef ?? session.conversationId ?? 'storage-ref'),
        conversationId: session.conversationId,
        title: session.title,
        latestSeq: session.latestSeq,
        recordId: session.recordId,
        workspace: {
          folderUris: ['file:///workspace'],
        },
      })),
  });

  const runtimeSessions = await runtimeProbe.discoverSessions();
  const storageSessions = await storageProbe.discoverSessions();

  if (runtimeSessions.length === 0) {
    return storageSessions[0] ?? null;
  }

  const runtimeSession = runtimeSessions[0];
  const storageMatch = storageSessions.find(
    (session) => session.conversationId === runtimeSession.conversationId,
  );

  return {
    ...runtimeSession,
    latestSeq: storageMatch?.latestSeq ?? runtimeSession.latestSeq,
    title: storageMatch?.title ?? runtimeSession.title,
  };
}

describe('Codex probes', () => {
  it('marks storage-only codex sessions as read_only_attach', async () => {
    const session = await discoverCodexSession({
      runtime: [],
      storage: [{ conversationId: 'codex-1', recordId: 'state-1' }],
    });

    expect(session).toBeDefined();
    expect(session?.degradedFlags).toContain('read_only_attach');
    expect(session?.attachability).toBe('attachable_with_degraded_capabilities');
  });

  it('prefers runtime evidence and merges storage metadata', async () => {
    const session = await discoverCodexSession({
      runtime: [
        { conversationId: 'codex-42', title: 'runtime-title', latestSeq: 1 },
      ],
      storage: [
        { conversationId: 'codex-42', title: 'storage-title', latestSeq: 99 },
      ],
    });

    expect(session).toMatchObject({
      conversationId: 'codex-42',
      title: 'storage-title',
      latestSeq: 99,
    });
  });

  it('marks missing runtime bridges as degraded runtime sessions', async () => {
    const probe = new CodexRuntimeProbe(makeHostResolution(), {
      listSessions: async () => [
        {
          providerSessionRef: 'runtime-ref-1',
          conversationId: 'codex-1',
          supportsInterrupt: true,
          supportsApprovals: true,
          eventStreamAvailable: false,
          workspace: {
            folderUris: ['file:///workspace'],
          },
        },
      ],
    });

    const [session] = await probe.discoverSessions();

    expect(session.degradedFlags).toEqual(
      expect.arrayContaining([
        'runtime_probe_unverified',
        'read_only_attach',
        'interrupt_bridge_unavailable',
        'approval_bridge_unavailable',
        'event_stream_unavailable',
      ]),
    );
    expect(session.attachability).toBe('attachable_with_degraded_capabilities');
  });

  it('reports attachment_bridge_unavailable when attachment bridge is missing', async () => {
    const probe = new CodexRuntimeProbe(makeHostResolution(), {
      listSessions: async () => [
        {
          providerSessionRef: 'runtime-ref-2',
          conversationId: 'codex-2',
          supportsInterrupt: false,
          supportsApprovals: false,
          eventStreamAvailable: true,
          workspace: {
            folderUris: ['file:///workspace'],
          },
        },
      ],
      sendMessage: async () => {},
      interrupt: async () => {},
      resolveApproval: async () => {},
      watchSession: async () => () => {},
      attachmentBridgeAvailable: false,
    });

    const [session] = await probe.discoverSessions();

    expect(session.degradedFlags).toEqual(
      expect.arrayContaining(['runtime_probe_unverified', 'attachment_bridge_unavailable']),
    );
  });

  it('does not blame the attachment bridge when the session is not attachable', async () => {
    const probe = new CodexRuntimeProbe(makeHostResolution(), {
      listSessions: async () => [
        {
          providerSessionRef: 'runtime-ref-4',
          conversationId: 'codex-4',
          canAttach: false,
          eventStreamAvailable: true,
          workspace: {
            folderUris: ['file:///workspace'],
          },
        },
      ],
      sendMessage: async () => {},
      watchSession: async () => () => {},
      attachmentBridgeAvailable: false,
    });

    const [session] = await probe.discoverSessions();

    expect(session.attachability).toBe('not_attachable');
    expect(session.degradedFlags).not.toContain('attachment_bridge_unavailable');
  });

  it('forwards runtime actions through injected bridges', async () => {
    const sendMessage = vi.fn(async () => {});
    const interrupt = vi.fn(async () => {});
    const resolveApproval = vi.fn(async () => {});
    const watchSession = vi.fn(async () => () => {});
    const probe = new CodexRuntimeProbe(makeHostResolution(), {
      listSessions: async () => [],
      sendMessage,
      interrupt,
      resolveApproval,
      watchSession,
      attachmentBridgeAvailable: true,
    });

    await probe.sendMessage?.('runtime-ref-3', 'hello');
    await probe.interrupt?.('runtime-ref-3', 'user_cancelled');
    await probe.resolveApproval?.('runtime-ref-3', 'approval-1', 'approve');
    await probe.watchSession('runtime-ref-3', () => {});

    expect(sendMessage).toHaveBeenCalledWith('runtime-ref-3', 'hello');
    expect(interrupt).toHaveBeenCalledWith('runtime-ref-3', 'user_cancelled');
    expect(resolveApproval).toHaveBeenCalledWith(
      'runtime-ref-3',
      'approval-1',
      'approve',
    );
    expect(watchSession).toHaveBeenCalledTimes(1);
  });
});
