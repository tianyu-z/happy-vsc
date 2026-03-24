import { describe, expect, it, vi } from 'vitest';

import type { ProviderHostResolution } from '../types';

import { ClaudeRuntimeProbe } from './ClaudeRuntimeProbe';
import { ClaudeStorageProbe } from './ClaudeStorageProbe';

function makeHostResolution(): ProviderHostResolution {
  return {
    provider: 'claude',
    compatibility: 'supported',
    activationState: 'active',
    providerExtension: {
      id: 'anthropic.claude-code',
      version: '1.0.0',
    },
    commands: ['claude.resume'],
    contextKeys: ['claude.sessionActive'],
    exportKeys: ['runtimeBridge'],
    host: {
      provider: 'claude',
      extensionId: 'anthropic.claude-code',
      getCommands: async () => ['claude.resume'],
      isCommandAvailable: async (commandId) => commandId === 'claude.resume',
      getContextKeys: async () => ['claude.sessionActive'],
      hasContextKey: async (key) => key === 'claude.sessionActive',
      activateExtension: async () => ({
        runtimeBridge: {},
      }),
      getExports: async () => ({
        runtimeBridge: {},
      }),
    },
  };
}

async function discoverClaudeSession(options: {
  runtimeSessions?: Array<Record<string, unknown>>;
  storageSessions?: Array<Record<string, unknown>>;
}) {
  const runtimeProbe = new ClaudeRuntimeProbe(makeHostResolution(), {
    listSessions: async () =>
      (options.runtimeSessions ?? []).map((session) => ({
        providerSessionRef: String(session.providerSessionRef ?? 'runtime-ref'),
        conversationId: session.conversationId as string | undefined,
        latestSeq: session.latestSeq as number | undefined,
        title: session.title as string | undefined,
        supportsInterrupt: Boolean(session.supportsInterrupt),
        supportsApprovals: Boolean(session.supportsApprovals),
        eventStreamAvailable:
          session.eventStreamAvailable === undefined
            ? true
            : Boolean(session.eventStreamAvailable),
        workspace: {
          folderUris: ['file:///workspace'],
        },
      })),
    sendMessage: async () => {},
    interrupt: async () => {},
    resolveApproval: async () => {},
    watchSession: async () => () => {},
  });
  const storageProbe = new ClaudeStorageProbe(makeHostResolution(), {
    listSessions: async () =>
      (options.storageSessions ?? []).map((session) => ({
        providerSessionRef: String(
          session.providerSessionRef ?? session.conversationId ?? 'storage-ref',
        ),
        conversationId: session.conversationId as string | undefined,
        latestSeq: session.latestSeq as number | undefined,
        title: session.title as string | undefined,
        workspace: {
          folderUris: ['file:///workspace'],
        },
      })),
  });

  const runtimeSessions = await runtimeProbe.discoverSessions();
  const storageSessions = await storageProbe.discoverSessions();

  return runtimeSessions.map((runtimeSession) => {
    const storageSession = storageSessions.find(
      (session) => session.conversationId === runtimeSession.conversationId,
    );

    return {
      ...runtimeSession,
      latestSeq: storageSession?.latestSeq ?? runtimeSession.latestSeq,
      title: storageSession?.title ?? runtimeSession.title,
    };
  });
}

describe('Claude probes', () => {
  it('prefers runtime evidence and falls back to storage metadata', async () => {
    await expect(
      discoverClaudeSession({
        runtimeSessions: [{ conversationId: 'conv-1', supportsInterrupt: true }],
        storageSessions: [{ conversationId: 'conv-1', latestSeq: 42 }],
      }),
    ).resolves.toMatchObject([
      {
        conversationId: 'conv-1',
        latestSeq: 42,
      },
    ]);
  });

  it('marks missing action bridges as degraded runtime sessions', async () => {
    const probe = new ClaudeRuntimeProbe(makeHostResolution(), {
      listSessions: async () => [
        {
          providerSessionRef: 'runtime-ref-1',
          conversationId: 'conv-1',
          supportsInterrupt: true,
          supportsApprovals: true,
          workspace: {
            folderUris: ['file:///workspace'],
          },
        },
      ],
      sendMessage: async () => {},
      watchSession: async () => () => {},
    });

    await expect(probe.discoverSessions()).resolves.toMatchObject([
      {
        degradedFlags: expect.arrayContaining([
          'interrupt_bridge_unavailable',
          'approval_bridge_unavailable',
          'runtime_probe_unverified',
        ]),
        attachability: 'attachable_with_degraded_capabilities',
      },
    ]);
  });

  it('returns storage-only Claude sessions as read-only degraded metadata', async () => {
    const probe = new ClaudeStorageProbe(makeHostResolution(), {
      listSessions: async () => [
        {
          providerSessionRef: 'storage-ref-1',
          conversationId: 'conv-1',
          latestSeq: 7,
          workspace: {
            folderUris: ['file:///workspace'],
          },
        },
      ],
    });

    await expect(probe.discoverSessions()).resolves.toMatchObject([
      {
        conversationId: 'conv-1',
        latestSeq: 7,
        degradedFlags: ['read_only_attach'],
        attachability: 'attachable_with_degraded_capabilities',
        capabilities: [],
      },
    ]);
  });

  it('forwards runtime actions through injected bridges', async () => {
    const sendMessage = vi.fn(async () => {});
    const watchSession = vi.fn(async () => () => {});
    const probe = new ClaudeRuntimeProbe(makeHostResolution(), {
      listSessions: async () => [],
      sendMessage,
      watchSession,
    });

    await probe.sendMessage?.('runtime-ref-1', 'hello');
    await probe.watchSession('runtime-ref-1', () => {});

    expect(sendMessage).toHaveBeenCalledWith('runtime-ref-1', 'hello');
    expect(watchSession).toHaveBeenCalledTimes(1);
  });
});
