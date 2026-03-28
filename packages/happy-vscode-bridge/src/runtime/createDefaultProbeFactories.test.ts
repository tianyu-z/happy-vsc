import { describe, expect, it, vi } from 'vitest';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { createDefaultProbeFactories } from './createDefaultProbeFactories';
import { createProviderRuntimeCaptureRegistry } from './ProviderRuntimeCapture';
import type { ProviderRuntimeCaptureRegistry } from './ProviderRuntimeCapture';
import type { ProviderHostResolution } from './probes/types';

function toFileUri(path: string): string {
  return `file://${path}`;
}

function makeResolution(
  provider: ProviderHostResolution['provider'],
  commands: string[] = [],
): ProviderHostResolution {
  return {
    provider,
    compatibility: 'supported',
    activationState: 'active',
    providerExtension: {
      id: provider === 'claude' ? 'anthropic.claude-code' : 'openai.chatgpt',
      version: '1.0.0',
    },
    commands,
    contextKeys: [],
    exportKeys: [],
    host: null,
  };
}

async function writeLogFixture(params: {
  rootName: string;
  claudeLog?: string;
  codexLog?: string;
}) {
  const exthostDir = join(
    tmpdir(),
    `happy-vscode-bridge-${params.rootName}`,
    'logs',
    '20260324T000449',
    'exthost6',
  );
  const bridgeLogDir = join(exthostDir, 'happy.happy-vscode-bridge');

  await mkdir(bridgeLogDir, { recursive: true });

  let claudeLogPath: string | undefined;
  if (params.claudeLog) {
    const claudeDir = join(exthostDir, 'Anthropic.claude-code');
    await mkdir(claudeDir, { recursive: true });
    claudeLogPath = join(claudeDir, 'Claude VSCode.log');
    await writeFile(claudeLogPath, params.claudeLog, 'utf8');
  }

  let codexLogPath: string | undefined;
  if (params.codexLog) {
    const codexDir = join(exthostDir, 'openai.chatgpt');
    await mkdir(codexDir, { recursive: true });
    codexLogPath = join(codexDir, 'Codex.log');
    await writeFile(codexLogPath, params.codexLog, 'utf8');
  }

  return {
    logPath: bridgeLogDir,
    claudeLogPath,
    codexLogPath,
  };
}

describe('createDefaultProbeFactories', () => {
  it('discovers Claude sessions from the current exthost logs', async () => {
    const fixture = await writeLogFixture({
      rootName: 'claude',
      claudeLog: `
2026-03-24 07:07:40.907 [info] Received message from webview: {"type":"request","requestId":"9jdfq0fpn4u","request":{"type":"update_session_state","sessionId":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","state":"running","title":"Test setup and configuration"}}
2026-03-24 07:07:43.506 [info] Received message from webview: {"type":"request","requestId":"4tshzveg36n","request":{"type":"update_session_state","sessionId":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","state":"idle","title":"Test setup and configuration"}}
      `.trim(),
    });
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
    });

    const probes = await factories.claude!(makeResolution('claude'));
    const sessions = await probes.storageProbe!.discoverSessions();

    expect(sessions).toEqual([
      expect.objectContaining({
        providerSessionRef: '98774e08-0c03-4d72-89cb-6a29ba6ae93a',
        title: 'Test setup and configuration',
        workspace: {
          folderUris: ['file:///workspace'],
        },
      }),
    ]);
  });

  it('discovers Codex sessions from the current exthost logs', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex',
      codexLog: `
2026-03-24 07:06:53.694 [warning] [CodexMcpConnection] cli: message="codex_app_server::codex_message_processor: thread/resume overrides ignored for running thread 019d19f6-20f7-7802-a890-8c29bbfb4f15: config overrides were provided and ignored while running"
2026-03-24 07:09:31.795 [warning] [IpcClient] Received broadcast but no handler is configured method=thread-stream-state-changed
      `.trim(),
    });
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
    });

    const probes = await factories.codex!(makeResolution('codex'));
    const sessions = await probes.storageProbe!.discoverSessions();

    expect(sessions).toEqual([
      expect.objectContaining({
        providerSessionRef: '019d19f6-20f7-7802-a890-8c29bbfb4f15',
        title: 'Codex Thread 019d19f6',
        workspace: {
          folderUris: ['file:///workspace'],
        },
      }),
    ]);
  });

  it('discovers Codex sessions from conversationId log markers when running-thread markers are absent', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-conversation-id',
      codexLog: `
2026-03-24 10:35:42.380 [error] [desktop-notifications][unhandled-rejection] Error: No AppServerManager registered for conversationId: 019d2043-3b9d-7da1-b009-5ac6c2f6eace
2026-03-24 10:35:47.656 [error] [desktop-notifications][unhandled-rejection] Error: No AppServerManager registered for conversationId: 019d2043-3b9d-7da1-b009-5ac6c2f6eace
      `.trim(),
    });
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
    });

    const probes = await factories.codex!(makeResolution('codex'));
    const sessions = await probes.storageProbe!.discoverSessions();

    expect(sessions).toEqual([
      expect.objectContaining({
        providerSessionRef: '019d2043-3b9d-7da1-b009-5ac6c2f6eace',
        title: 'Codex Thread 019d2043',
        workspace: {
          folderUris: ['file:///workspace'],
        },
      }),
    ]);
  });

  it('discovers Codex sessions from open conversation tabs when log markers are absent', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-tabs',
    });
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: vi.fn(async () => undefined),
      createUri: (value) => ({ value }),
      listTabs: () => [
        {
          label: 'Fix runtime bridge regression',
          input: {
            uri: {
              scheme: 'openai-codex',
              authority: 'route',
              path: '/local/019d1fcb-5c1d-7c39-8df7-0f85f6e5c001',
              fsPath: '/local/019d1fcb-5c1d-7c39-8df7-0f85f6e5c001',
            },
          },
        },
      ],
    });

    const probes = await factories.codex!(
      makeResolution('codex', [
        'vscode.openWith',
        'type',
        'workbench.action.chat.focusInput',
        'workbench.action.chat.submit',
        'workbench.action.chat.cancel',
      ]),
    );

    expect(probes.runtimeProbe).toBeDefined();

    const sessions = await probes.runtimeProbe!.discoverSessions();

    expect(sessions).toEqual([
      expect.objectContaining({
        providerSessionRef: '019d1fcb-5c1d-7c39-8df7-0f85f6e5c001',
        threadId: '019d1fcb-5c1d-7c39-8df7-0f85f6e5c001',
        title: 'Fix runtime bridge regression',
        capabilities: expect.arrayContaining(['sendUserMessage', 'interrupt']),
        workspace: {
          folderUris: ['file:///workspace'],
        },
      }),
    ]);
  });

  it('discovers Codex sessions from a captured chat session provider when tabs and logs are absent', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-chat-provider',
    });
    const codexConversationId = '019d230f-5c1d-7c39-8df7-0f85f6e5c002';
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: vi.fn(async () => undefined),
      createUri: (value) => ({ value }),
      providerCaptures: {
        getCapturedProvider: (provider) =>
          provider === 'codex'
            ? {
                provideChatSessionItems: vi.fn(async () => [
                  {
                    id: codexConversationId,
                    label: 'Runtime-only Codex Session',
                    resource: {
                      scheme: 'openai-codex',
                      authority: 'route',
                      path: `/local/${codexConversationId}`,
                      fsPath: `/local/${codexConversationId}`,
                    },
                  },
                ]),
              }
            : null,
        getCaptureDiagnostic: () => null,
      },
    });

    const probes = await factories.codex!(
      makeResolution('codex', [
        'vscode.openWith',
        'type',
        'workbench.action.chat.focusInput',
        'workbench.action.chat.submit',
        'workbench.action.chat.cancel',
      ]),
    );

    const sessions = await probes.runtimeProbe!.discoverSessions();

    expect(sessions).toEqual([
      expect.objectContaining({
        providerSessionRef: codexConversationId,
        threadId: codexConversationId,
        title: 'Runtime-only Codex Session',
        capabilities: expect.arrayContaining(['sendUserMessage', 'interrupt']),
        workspace: {
          folderUris: ['file:///workspace'],
        },
      }),
    ]);
  });

  it('filters Codex captured history down to sessions scoped to the current window when log evidence exists', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-chat-provider-filtered-by-log',
      codexLog: `
2026-03-24 07:06:53.694 [warning] [CodexMcpConnection] cli: message="codex_app_server::codex_message_processor: thread/resume overrides ignored for running thread 019d2218-b01b-7930-8671-cbd49da63926: config overrides were provided and ignored while running"
      `.trim(),
    });
    const staleConversationId = '019c0000-0000-7000-8000-000000000000';
    const currentConversationId = '019d2218-b01b-7930-8671-cbd49da63926';
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: vi.fn(async () => undefined),
      createUri: (value) => ({ value }),
      providerCaptures: {
        getCapturedProvider: (provider) =>
          provider === 'codex'
            ? {
                provideChatSessionItems: vi.fn(async () => [
                  {
                    id: staleConversationId,
                    label: 'Stale Global Codex Session',
                    resource: {
                      scheme: 'openai-codex',
                      authority: 'route',
                      path: `/local/${staleConversationId}`,
                      fsPath: `/local/${staleConversationId}`,
                    },
                  },
                  {
                    id: currentConversationId,
                    label: 'Current Window Codex Session',
                    resource: {
                      scheme: 'openai-codex',
                      authority: 'route',
                      path: `/local/${currentConversationId}`,
                      fsPath: `/local/${currentConversationId}`,
                    },
                  },
                ]),
              }
            : null,
        getCaptureDiagnostic: () => null,
      },
    });

    const probes = await factories.codex!(
      makeResolution('codex', [
        'vscode.openWith',
        'type',
        'workbench.action.chat.focusInput',
        'workbench.action.chat.submit',
        'workbench.action.chat.cancel',
      ]),
    );

    const sessions = await probes.runtimeProbe!.discoverSessions();

    expect(sessions).toEqual([
      expect.objectContaining({
        providerSessionRef: currentConversationId,
        title: 'Current Window Codex Session',
        capabilities: expect.arrayContaining(['sendUserMessage', 'interrupt']),
        workspace: {
          folderUris: ['file:///workspace'],
        },
      }),
    ]);
  });

  it('falls back to only recent Codex captured sessions when scoped signals are absent', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-chat-provider-recent-fallback',
    });
    const recentConversationId = '019d2218-b01b-7930-8671-cbd49da63926';
    const staleConversationId = '019c0000-0000-7000-8000-000000000000';
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: vi.fn(async () => undefined),
      createUri: (value) => ({ value }),
      now: () => Date.parse('2026-03-25T03:10:00.000Z'),
      providerCaptures: {
        getCapturedProvider: (provider) =>
          provider === 'codex'
            ? {
                provideChatSessionItems: vi.fn(async () => [
                  {
                    id: recentConversationId,
                    label: 'Recent Codex Session',
                    resource: {
                      scheme: 'openai-codex',
                      authority: 'route',
                      path: `/local/${recentConversationId}`,
                      fsPath: `/local/${recentConversationId}`,
                    },
                  },
                  {
                    id: staleConversationId,
                    label: 'Ancient Codex Session',
                    resource: {
                      scheme: 'openai-codex',
                      authority: 'route',
                      path: `/local/${staleConversationId}`,
                      fsPath: `/local/${staleConversationId}`,
                    },
                  },
                ]),
              }
            : null,
        getCaptureDiagnostic: () => null,
      },
    });

    const probes = await factories.codex!(
      makeResolution('codex', [
        'vscode.openWith',
        'type',
        'workbench.action.chat.focusInput',
        'workbench.action.chat.submit',
        'workbench.action.chat.cancel',
      ]),
    );

    const sessions = await probes.runtimeProbe!.discoverSessions();

    expect(sessions).toEqual([
      expect.objectContaining({
        providerSessionRef: recentConversationId,
        title: 'Recent Codex Session',
        capabilities: expect.arrayContaining(['sendUserMessage', 'interrupt']),
        workspace: {
          folderUris: ['file:///workspace'],
        },
      }),
    ]);
  });

  it('filters Codex captured history down to sessions scoped to the current view provider panel when log and tab signals are absent', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-chat-provider-filtered-by-view-panel',
    });
    const currentConversationId = '019d2218-b01b-7930-8671-cbd49da63926';
    const staleConversationId = '019d2217-b01b-7930-8671-cbd49da63926';
    const activePanel = {
      webview: {
        postMessage: vi.fn(),
      },
      viewColumn: 1,
    };
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: vi.fn(async () => undefined),
      createUri: (value) => ({ value }),
      providerCaptures: {
        getCapturedProvider: (provider) =>
          provider === 'codex'
            ? {
                provideChatSessionItems: vi.fn(async () => [
                  {
                    id: currentConversationId,
                    label: 'Current Window Codex Session',
                    resource: {
                      scheme: 'openai-codex',
                      authority: 'route',
                      path: `/local/${currentConversationId}`,
                      fsPath: `/local/${currentConversationId}`,
                    },
                  },
                  {
                    id: staleConversationId,
                    label: 'Stale Global Codex Session',
                    resource: {
                      scheme: 'openai-codex',
                      authority: 'route',
                      path: `/local/${staleConversationId}`,
                      fsPath: `/local/${staleConversationId}`,
                    },
                  },
                ]),
              }
            : null,
        getCapturedViewProvider: (provider) =>
          provider === 'codex'
            ? {
                editorPanels: new Map([
                  [
                    activePanel,
                    {
                      ready: true,
                      pendingMessages: [],
                      initialRoute: `/local/${currentConversationId}`,
                    },
                  ],
                ]),
                focusedView: {
                  kind: 'panel',
                  panel: activePanel,
                },
              }
            : null,
        getCaptureDiagnostic: () => null,
      } as ProviderRuntimeCaptureRegistry,
    });

    const probes = await factories.codex!(
      makeResolution('codex', [
        'vscode.openWith',
        'type',
        'workbench.action.chat.focusInput',
        'workbench.action.chat.submit',
        'workbench.action.chat.cancel',
      ]),
    );

    const sessions = await probes.runtimeProbe!.discoverSessions();

    expect(sessions).toEqual([
      expect.objectContaining({
        providerSessionRef: currentConversationId,
        title: 'Current Window Codex Session',
        capabilities: expect.arrayContaining(['sendUserMessage', 'interrupt']),
        workspace: {
          folderUris: ['file:///workspace'],
        },
      }),
    ]);
  });

  it('filters Codex captured history down to the tracked sidebar route when no panel or log scope exists', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-chat-provider-filtered-by-sidebar-route',
    });
    const currentConversationId = '019d2218-b01b-7930-8671-cbd49da63926';
    const staleConversationId = '019d2217-b01b-7930-8671-cbd49da63926';
    const sidebarWebview = {
      postMessage: vi.fn(),
    };
    const viewProvider = {
      sidebarView: {
        webview: sidebarWebview,
        visible: true,
      },
      postMessageToWebview: vi.fn(),
      navigateToRoute(path: string) {
        this.postMessageToWebview(sidebarWebview, {
          type: 'navigate-to-route',
          path,
        });
      },
    };
    const registry = createProviderRuntimeCaptureRegistry();

    registry.captureRegistration('chatgpt.sidebarView', viewProvider);
    registry.captureChatSessionRegistration('openai-codex', {
      provideChatSessionItems: vi.fn(async () => [
        {
          id: currentConversationId,
          label: 'Current Sidebar Codex Session',
          resource: {
            scheme: 'openai-codex',
            authority: 'route',
            path: `/local/${currentConversationId}`,
            fsPath: `/local/${currentConversationId}`,
          },
        },
        {
          id: staleConversationId,
          label: 'Other Recent Codex Session',
          resource: {
            scheme: 'openai-codex',
            authority: 'route',
            path: `/local/${staleConversationId}`,
            fsPath: `/local/${staleConversationId}`,
          },
        },
      ]),
    });

    viewProvider.navigateToRoute(`/local/${currentConversationId}`);

    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: vi.fn(async () => undefined),
      createUri: (value) => ({ value }),
      providerCaptures: registry,
    });

    const probes = await factories.codex!(
      makeResolution('codex', [
        'vscode.openWith',
        'type',
        'workbench.action.chat.focusInput',
        'workbench.action.chat.submit',
        'workbench.action.chat.cancel',
      ]),
    );

    const sessions = await probes.runtimeProbe!.discoverSessions();

    expect(sessions).toEqual([
      expect.objectContaining({
        providerSessionRef: currentConversationId,
        title: 'Current Sidebar Codex Session',
        capabilities: expect.arrayContaining(['sendUserMessage', 'interrupt']),
        workspace: {
          folderUris: ['file:///workspace'],
        },
      }),
    ]);
  });

  it('discovers Codex sessions from a backfilled chat session controller when the provider object was not captured directly', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-chat-controller',
    });
    const codexConversationId = '019d230f-5c1d-7c39-8df7-0f85f6e5c004';
    const items = new Map();
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: vi.fn(async () => undefined),
      createUri: (value) => ({ value }),
      providerCaptures: {
        getCapturedProvider: (provider) =>
          provider === 'codex'
            ? {
                items,
                refreshHandler: vi.fn(async () => {
                  items.set(
                    `openai-codex://route/local/${codexConversationId}`,
                    {
                      id: codexConversationId,
                      label: 'Backfilled Codex Session',
                      resource: {
                        scheme: 'openai-codex',
                        authority: 'route',
                        path: `/local/${codexConversationId}`,
                        fsPath: `/local/${codexConversationId}`,
                      },
                    },
                  );
                }),
              }
            : null,
        getCaptureDiagnostic: () => null,
      },
    });

    const probes = await factories.codex!(
      makeResolution('codex', [
        'vscode.openWith',
        'type',
        'workbench.action.chat.focusInput',
        'workbench.action.chat.submit',
        'workbench.action.chat.cancel',
      ]),
    );

    const sessions = await probes.runtimeProbe!.discoverSessions();

    expect(sessions).toEqual([
      expect.objectContaining({
        providerSessionRef: codexConversationId,
        threadId: codexConversationId,
        title: 'Backfilled Codex Session',
        capabilities: expect.arrayContaining(['sendUserMessage', 'interrupt']),
        workspace: {
          folderUris: ['file:///workspace'],
        },
      }),
    ]);
  });

  it('creates a Codex runtime probe that routes messages through VS Code chat commands', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-runtime',
      codexLog: `
2026-03-24 07:06:53.694 [warning] [CodexMcpConnection] cli: message="codex_app_server::codex_message_processor: thread/resume overrides ignored for running thread 019d19f6-20f7-7802-a890-8c29bbfb4f15: config overrides were provided and ignored while running"
      `.trim(),
    });
    const executeCommand = vi.fn(async () => undefined);
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: executeCommand,
      createUri: (value) => ({ value }),
    });

    const probes = await factories.codex!(
      makeResolution('codex', [
        'vscode.openWith',
        'type',
        'workbench.action.chat.focusInput',
        'workbench.action.chat.submit',
        'workbench.action.chat.cancel',
      ]),
    );

    expect(probes.runtimeProbe).toBeDefined();

    const [session] = await probes.runtimeProbe!.discoverSessions();
    expect(session).toMatchObject({
      providerSessionRef: '019d19f6-20f7-7802-a890-8c29bbfb4f15',
      capabilities: expect.arrayContaining(['sendUserMessage', 'interrupt']),
    });

    await probes.runtimeProbe!.sendMessage?.(
      session.providerSessionRef,
      'ship the patch',
    );
    await probes.runtimeProbe!.interrupt?.(
      session.providerSessionRef,
      'user_cancelled',
    );

    expect(executeCommand).toHaveBeenNthCalledWith(
      1,
      'vscode.openWith',
      {
        value: 'openai-codex://route/local/019d19f6-20f7-7802-a890-8c29bbfb4f15',
      },
      'chatgpt.conversationEditor',
      {
        preview: false,
      },
    );
    expect(executeCommand).toHaveBeenNthCalledWith(
      2,
      'workbench.action.chat.focusInput',
    );
    expect(executeCommand).toHaveBeenNthCalledWith(3, 'type', {
      text: 'ship the patch',
    });
    expect(executeCommand).toHaveBeenNthCalledWith(
      4,
      'workbench.action.chat.submit',
    );
    expect(executeCommand).toHaveBeenNthCalledWith(
      5,
      'vscode.openWith',
      {
        value: 'openai-codex://route/local/019d19f6-20f7-7802-a890-8c29bbfb4f15',
      },
      'chatgpt.conversationEditor',
      {
        preview: false,
      },
    );
    expect(executeCommand).toHaveBeenNthCalledWith(
      6,
      'workbench.action.chat.focusInput',
    );
    expect(executeCommand).toHaveBeenNthCalledWith(
      7,
      'workbench.action.chat.cancel',
    );
  });

  it('prefers the captured Codex thread follower bridge over chat commands when sending into an existing session', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-runtime-captured-view-thread-follower-send',
    });
    const codexConversationId = '019d19f6-20f7-7802-a890-8c29bbfb4f15';
    const executeCommand = vi.fn(async () => undefined);
    const navigateToRoute = vi.fn();
    const handleThreadFollowerStartTurnRequest = vi.fn(async () => undefined);
    const sidebarWebview = {
      postMessage: vi.fn(),
    };
    const registry = createProviderRuntimeCaptureRegistry();

    registry.captureRegistration('chatgpt.sidebarView', {
      sidebarView: {
        webview: sidebarWebview,
      },
      navigateToRoute,
      postMessageToWebview: vi.fn(),
      handleThreadFollowerStartTurnRequest,
    });
    registry.captureChatSessionRegistration('openai-codex', {
      provideChatSessionItems: vi.fn(async () => [
        {
          id: codexConversationId,
          label: 'Captured Codex Session',
          resource: {
            scheme: 'openai-codex',
            authority: 'route',
            path: `/local/${codexConversationId}`,
            fsPath: `/local/${codexConversationId}`,
          },
        },
      ]),
    });

    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: executeCommand,
      createUri: (value) => ({ value }),
      providerCaptures: registry,
    });

    const probes = await factories.codex!(
      makeResolution('codex', [
        'vscode.openWith',
        'type',
        'workbench.action.chat.focusInput',
        'workbench.action.chat.submit',
        'workbench.action.chat.cancel',
      ]),
    );

    const [session] = await probes.runtimeProbe!.discoverSessions();

    await probes.runtimeProbe!.sendMessage?.(
      session.providerSessionRef,
      'ship the patch',
    );

    expect(navigateToRoute).toHaveBeenCalledWith(
      `/local/${codexConversationId}`,
      undefined,
    );
    expect(handleThreadFollowerStartTurnRequest).toHaveBeenCalledTimes(1);
    expect(handleThreadFollowerStartTurnRequest).toHaveBeenCalledWith(
      sidebarWebview,
      expect.any(String),
      {
        conversationId: codexConversationId,
        turnStartParams: expect.objectContaining({
          input: [
            {
              type: 'text',
              text: 'ship the patch',
              text_elements: [],
            },
          ],
          cwd: null,
          model: null,
          effort: null,
          collaborationMode: null,
        }),
      },
    );
    expect(executeCommand).not.toHaveBeenCalled();
  });

  it('prefers captured Codex view routing over vscode.openWith when sending into an existing session', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-runtime-captured-view-send',
    });
    const codexConversationId = '019d19f6-20f7-7802-a890-8c29bbfb4f15';
    const executeCommand = vi.fn(async () => undefined);
    const navigateToRoute = vi.fn();
    const registry = createProviderRuntimeCaptureRegistry();

    registry.captureRegistration('chatgpt.sidebarView', {
      sidebarView: {
        webview: {
          postMessage: vi.fn(),
        },
      },
      navigateToRoute,
      postMessageToWebview: vi.fn(),
    });
    registry.captureChatSessionRegistration('openai-codex', {
      provideChatSessionItems: vi.fn(async () => [
        {
          id: codexConversationId,
          label: 'Captured Codex Session',
          resource: {
            scheme: 'openai-codex',
            authority: 'route',
            path: `/local/${codexConversationId}`,
            fsPath: `/local/${codexConversationId}`,
          },
        },
      ]),
    });

    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: executeCommand,
      createUri: (value) => ({ value }),
      providerCaptures: registry,
    });

    const probes = await factories.codex!(
      makeResolution('codex', [
        'vscode.openWith',
        'type',
        'workbench.action.chat.focusInput',
        'workbench.action.chat.submit',
        'workbench.action.chat.cancel',
      ]),
    );

    const [session] = await probes.runtimeProbe!.discoverSessions();

    await probes.runtimeProbe!.sendMessage?.(
      session.providerSessionRef,
      'ship the patch',
    );
    await probes.runtimeProbe!.interrupt?.(
      session.providerSessionRef,
      'user_cancelled',
    );

    expect(navigateToRoute).toHaveBeenNthCalledWith(
      1,
      `/local/${codexConversationId}`,
      undefined,
    );
    expect(navigateToRoute).toHaveBeenNthCalledWith(
      2,
      `/local/${codexConversationId}`,
      undefined,
    );
    expect(executeCommand).toHaveBeenNthCalledWith(
      1,
      'workbench.action.chat.focusInput',
    );
    expect(executeCommand).toHaveBeenNthCalledWith(2, 'type', {
      text: 'ship the patch',
    });
    expect(executeCommand).toHaveBeenNthCalledWith(
      3,
      'workbench.action.chat.submit',
    );
    expect(executeCommand).toHaveBeenNthCalledWith(
      4,
      'workbench.action.chat.focusInput',
    );
    expect(executeCommand).toHaveBeenNthCalledWith(
      5,
      'workbench.action.chat.cancel',
    );
    expect(executeCommand).not.toHaveBeenCalledWith(
      'vscode.openWith',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it('creates a Codex runtime probe without event stream degradation when log watching is available', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-runtime-watch',
      codexLog: `
2026-03-24 07:06:53.694 [warning] [CodexMcpConnection] cli: message="codex_app_server::codex_message_processor: thread/resume overrides ignored for running thread 019d19f6-20f7-7802-a890-8c29bbfb4f15: config overrides were provided and ignored while running"
      `.trim(),
    });
    const executeCommand = vi.fn(async () => undefined);
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: executeCommand,
      createUri: (value) => ({ value }),
      watchPollMs: 10,
    });

    const probes = await factories.codex!(
      makeResolution('codex', [
        'vscode.openWith',
        'type',
        'workbench.action.chat.focusInput',
        'workbench.action.chat.submit',
        'workbench.action.chat.cancel',
      ]),
    );
    const [session] = await probes.runtimeProbe!.discoverSessions();

    expect(session.degradedFlags).not.toContain('event_stream_unavailable');
    expect(session.degradedFlags).not.toContain('approval_bridge_unavailable');
    expect(session.degradedFlags).not.toContain('runtime_probe_unverified');
    expect(session.attachability).toBe('attachable');
  });

  it('watches Codex session state transitions from appended logs', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-watch-events',
      codexLog: `
2026-03-24 07:06:53.694 [warning] [CodexMcpConnection] cli: message="codex_app_server::codex_message_processor: thread/resume overrides ignored for running thread 019d19f6-20f7-7802-a890-8c29bbfb4f15: config overrides were provided and ignored while running"
      `.trim(),
    });
    const executeCommand = vi.fn(async () => undefined);
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: executeCommand,
      createUri: (value) => ({ value }),
      watchPollMs: 10,
    });

    const probes = await factories.codex!(
      makeResolution('codex', [
        'vscode.openWith',
        'type',
        'workbench.action.chat.focusInput',
        'workbench.action.chat.submit',
        'workbench.action.chat.cancel',
      ]),
    );
    const [session] = await probes.runtimeProbe!.discoverSessions();
    const events: Array<{ type: string; payload?: unknown }> = [];

    const cleanup = await probes.runtimeProbe!.watchSession(
      session.providerSessionRef,
      (event) => {
        events.push(event);
      },
    );

    await appendFile(
      fixture.codexLogPath!,
      `
2026-03-24 07:06:54.001 [info] maybe_resume_success conversationId=019d19f6-20f7-7802-a890-8c29bbfb4f15 latestTurnId=019d2061-3301-7670-95bc-58715a3b65a7 latestTurnStatus=completed markedStreaming=true turnCount=68
      `.trimStart(),
      'utf8',
    );

    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (events.length > 0) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    await cleanup();

    expect(events).toEqual([
      {
        type: 'session.run.status',
        payload: {
          status: 'completed',
        },
      },
    ]);
  });

  it('prefers the captured Claude live channel transport over primaryEditor.open when sending into an active session', async () => {
    const fixture = await writeLogFixture({
      rootName: 'claude-runtime-live-channel-send',
      claudeLog: `
2026-03-24 07:07:40.100 [info] Received message from webview: {"type":"launch_claude","channelId":"live-channel-42","cwd":"/home/work","resume":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","model":"opus[1m]","permissionMode":"default","thinkingLevel":"default_on"}
2026-03-24 07:07:40.907 [info] Received message from webview: {"type":"request","requestId":"9jdfq0fpn4u","request":{"type":"update_session_state","sessionId":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","state":"running","title":"Test setup and configuration"}}
      `.trim(),
    });
    const executeCommand = vi.fn(async () => undefined);
    const transportMessage = vi.fn(async () => undefined);
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: executeCommand,
      providerCaptures: {
        getCapturedProvider: (provider) =>
          provider === 'claude'
            ? {
                allComms: new Set([
                  {
                    channels: new Map([
                      ['live-channel-42', {}],
                    ]),
                    transportMessage,
                  },
                ]),
              }
            : null,
        getCaptureDiagnostic: () => null,
      },
    });

    const probes = await factories.claude!(
      makeResolution('claude', ['claude-vscode.primaryEditor.open']),
    );
    const [session] = await probes.runtimeProbe!.discoverSessions();

    await probes.runtimeProbe!.sendMessage?.(
      session.providerSessionRef,
      'continue from the current context',
    );

    expect(transportMessage).toHaveBeenCalledTimes(1);
    expect(transportMessage).toHaveBeenCalledWith(
      'live-channel-42',
      {
        type: 'user',
        uuid: expect.any(String),
        session_id: '',
        parent_tool_use_id: null,
        message: {
          role: 'user',
          content: 'continue from the current context',
        },
      },
      false,
    );
    expect(executeCommand).not.toHaveBeenCalled();
  });

  it('creates a Claude runtime probe that routes prompts into an existing session', async () => {
    const fixture = await writeLogFixture({
      rootName: 'claude-runtime',
      claudeLog: `
2026-03-24 07:07:40.907 [info] Received message from webview: {"type":"request","requestId":"9jdfq0fpn4u","request":{"type":"update_session_state","sessionId":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","state":"running","title":"Test setup and configuration"}}
      `.trim(),
    });
    const executeCommand = vi.fn(async () => undefined);
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: executeCommand,
    });

    const probes = await factories.claude!(
      makeResolution('claude', ['claude-vscode.primaryEditor.open']),
    );

    expect(probes.runtimeProbe).toBeDefined();

    const [session] = await probes.runtimeProbe!.discoverSessions();
    expect(session).toMatchObject({
      providerSessionRef: '98774e08-0c03-4d72-89cb-6a29ba6ae93a',
      capabilities: expect.arrayContaining(['sendUserMessage']),
    });

    await probes.runtimeProbe!.sendMessage?.(
      session.providerSessionRef,
      'continue from the current context',
    );

    expect(executeCommand).toHaveBeenCalledWith(
      'claude-vscode.primaryEditor.open',
      '98774e08-0c03-4d72-89cb-6a29ba6ae93a',
      'continue from the current context',
    );
  });

  it('discovers Claude sessions from a captured live comm history when logs are absent', async () => {
    const fixture = await writeLogFixture({
      rootName: 'claude-runtime-history',
    });
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: vi.fn(async () => undefined),
      providerCaptures: {
        getCapturedProvider: (provider) =>
          provider === 'claude'
            ? {
                allComms: new Set([
                  {
                    listSessions: vi.fn(async () => ({
                      type: 'list_sessions_response',
                      sessions: [
                        {
                          id: 'claude-session-2',
                          lastModified: 200,
                          summary: 'Second Claude Session',
                        },
                        {
                          id: 'claude-session-1',
                          lastModified: 100,
                          summary: 'First Claude Session',
                        },
                      ],
                    })),
                  },
                ]),
              }
            : null,
        getCaptureDiagnostic: () => null,
      },
    });

    const probes = await factories.claude!(
      makeResolution('claude', ['claude-vscode.primaryEditor.open']),
    );

    const sessions = await probes.runtimeProbe!.discoverSessions();

    expect(sessions).toEqual([
      expect.objectContaining({
        providerSessionRef: 'claude-session-2',
        title: 'Second Claude Session',
        capabilities: expect.arrayContaining(['sendUserMessage']),
        workspace: {
          folderUris: ['file:///workspace'],
        },
      }),
      expect.objectContaining({
        providerSessionRef: 'claude-session-1',
        title: 'First Claude Session',
        capabilities: expect.arrayContaining(['sendUserMessage']),
        workspace: {
          folderUris: ['file:///workspace'],
        },
      }),
    ]);
  });

  it('bridges Claude interrupts through a captured live provider session', async () => {
    const fixture = await writeLogFixture({
      rootName: 'claude-runtime-interrupt',
      claudeLog: `
2026-03-24 07:07:40.100 [info] Received message from webview: {"type":"launch_claude","channelId":"live-channel-42","cwd":"/home/work","resume":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","model":"opus[1m]","permissionMode":"default","thinkingLevel":"default_on"}
2026-03-24 07:07:40.907 [info] Received message from webview: {"type":"request","requestId":"9jdfq0fpn4u","request":{"type":"update_session_state","sessionId":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","state":"running","title":"Test setup and configuration"}}
      `.trim(),
    });
    const interruptClaude = vi.fn(async () => undefined);
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: vi.fn(async () => undefined),
      providerCaptures: {
        getCapturedProvider: (provider) =>
          provider === 'claude'
            ? {
                allComms: new Set([
                  {
                    channels: new Map([
                      ['live-channel-42', {}],
                    ]),
                    interruptClaude,
                  },
                ]),
              }
            : null,
      },
    });

    const probes = await factories.claude!(
      makeResolution('claude', ['claude-vscode.primaryEditor.open']),
    );
    const [session] = await probes.runtimeProbe!.discoverSessions();

    expect(session.capabilities).toContain('interrupt');
    expect(session.degradedFlags).not.toContain('interrupt_bridge_unavailable');
    expect(session.bridgeDiagnostics).toMatchObject({
      runtimeProviderSessionRef: '98774e08-0c03-4d72-89cb-6a29ba6ae93a',
      runtimeChannelRef: 'live-channel-42',
      interruptBridgeState: 'ready',
      interruptCommMatched: true,
    });

    await probes.runtimeProbe!.interrupt?.(
      session.providerSessionRef,
      'user_cancelled',
    );

    expect(interruptClaude).toHaveBeenCalledWith(
      'live-channel-42',
    );
  });

  it('surfaces Claude interrupt diagnostics when the runtime provider is not captured', async () => {
    const fixture = await writeLogFixture({
      rootName: 'claude-runtime-interrupt-missing-capture',
      claudeLog: `
2026-03-24 07:07:40.100 [info] Received message from webview: {"type":"launch_claude","channelId":"live-channel-42","cwd":"/home/work","resume":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","model":"opus[1m]","permissionMode":"default","thinkingLevel":"default_on"}
2026-03-24 07:07:40.907 [info] Received message from webview: {"type":"request","requestId":"9jdfq0fpn4u","request":{"type":"update_session_state","sessionId":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","state":"running","title":"Test setup and configuration"}}
      `.trim(),
    });
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: vi.fn(async () => undefined),
      providerCaptures: {
        getCapturedProvider: () => null,
        getCaptureDiagnostic: () => null,
      },
    });

    const probes = await factories.claude!(
      makeResolution('claude', ['claude-vscode.primaryEditor.open']),
    );
    const [session] = await probes.runtimeProbe!.discoverSessions();

    expect(session.capabilities).not.toContain('interrupt');
    expect(session.degradedFlags).toContain('interrupt_bridge_unavailable');
    expect(session.bridgeDiagnostics).toMatchObject({
      runtimeProviderSessionRef: '98774e08-0c03-4d72-89cb-6a29ba6ae93a',
      runtimeChannelRef: 'live-channel-42',
      interruptBridgeState: 'provider_not_captured',
      interruptCommMatched: false,
    });
  });

  it('creates a Claude runtime probe without event stream degradation when log watching is available', async () => {
    const fixture = await writeLogFixture({
      rootName: 'claude-runtime-watch',
      claudeLog: `
2026-03-24 07:07:40.907 [info] Received message from webview: {"type":"request","requestId":"9jdfq0fpn4u","request":{"type":"update_session_state","sessionId":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","state":"running","title":"Test setup and configuration"}}
      `.trim(),
    });
    const executeCommand = vi.fn(async () => undefined);
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: executeCommand,
      watchPollMs: 10,
    });

    const probes = await factories.claude!(
      makeResolution('claude', ['claude-vscode.primaryEditor.open']),
    );
    const [session] = await probes.runtimeProbe!.discoverSessions();

    expect(session.degradedFlags).not.toContain('event_stream_unavailable');
    expect(session.degradedFlags).not.toContain('approval_bridge_unavailable');
    expect(session.degradedFlags).not.toContain('runtime_probe_unverified');
    expect(session.attachability).toBe('attachable');
  });

  it('watches Claude session state transitions from appended logs', async () => {
    const fixture = await writeLogFixture({
      rootName: 'claude-watch-events',
      claudeLog: `
2026-03-24 07:07:40.907 [info] Received message from webview: {"type":"request","requestId":"9jdfq0fpn4u","request":{"type":"update_session_state","sessionId":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","state":"running","title":"Test setup and configuration"}}
      `.trim(),
    });
    const executeCommand = vi.fn(async () => undefined);
    const factories = createDefaultProbeFactories({
      extensionLogPath: fixture.logPath,
      workspace: {
        folderUris: ['file:///workspace'],
      },
      commandExecutor: executeCommand,
      watchPollMs: 10,
    });

    const probes = await factories.claude!(
      makeResolution('claude', ['claude-vscode.primaryEditor.open']),
    );
    const [session] = await probes.runtimeProbe!.discoverSessions();
    const events: Array<{ type: string; payload?: unknown }> = [];

    const cleanup = await probes.runtimeProbe!.watchSession(
      session.providerSessionRef,
      (event) => {
        events.push(event);
      },
    );

    await appendFile(
      fixture.claudeLogPath!,
      `
2026-03-24 07:07:43.506 [info] Received message from webview: {"type":"request","requestId":"4tshzveg36n","request":{"type":"update_session_state","sessionId":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","state":"idle","title":"Test setup and configuration"}}
      `.trimStart(),
      'utf8',
    );

    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (events.length > 0) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    await cleanup();

    expect(events).toEqual([
      {
        type: 'session.run.status',
        payload: {
          status: 'idle',
        },
      },
    ]);
  });

  it('watches Claude message deltas from the native session file', async () => {
    const fixture = await writeLogFixture({
      rootName: 'claude-watch-session-file',
      claudeLog: `
2026-03-24 07:07:40.907 [info] Received message from webview: {"type":"request","requestId":"9jdfq0fpn4u","request":{"type":"update_session_state","sessionId":"98774e08-0c03-4d72-89cb-6a29ba6ae93a","state":"running","title":"Test setup and configuration"}}
      `.trim(),
    });
    const workspaceDir = join(
      tmpdir(),
      'happy-vscode-bridge-workspaces',
      'claude-watch-session-file',
    );
    const claudeConfigDir = join(tmpdir(), 'happy-vscode-bridge-claude-config');
    const projectDir = join(
      claudeConfigDir,
      'projects',
      workspaceDir.replace(/[^a-zA-Z0-9-]/g, '-'),
    );
    const sessionFilePath = join(
      projectDir,
      '98774e08-0c03-4d72-89cb-6a29ba6ae93a.jsonl',
    );
    await mkdir(projectDir, { recursive: true });
    await writeFile(
      sessionFilePath,
      `${JSON.stringify({
        type: 'user',
        uuid: 'existing-user',
        message: { role: 'user', content: 'existing question' },
      })}\n`,
      'utf8',
    );

    vi.stubEnv('CLAUDE_CONFIG_DIR', claudeConfigDir);
    try {
      const factories = createDefaultProbeFactories({
        extensionLogPath: fixture.logPath,
        workspace: {
          folderUris: [toFileUri(workspaceDir)],
        },
        commandExecutor: vi.fn(async () => undefined),
        watchPollMs: 10,
      });

      const probes = await factories.claude!(
        makeResolution('claude', ['claude-vscode.primaryEditor.open']),
      );
      const [session] = await probes.runtimeProbe!.discoverSessions();
      const events: Array<{ type: string; payload?: unknown }> = [];

      const cleanup = await probes.runtimeProbe!.watchSession(
        session.providerSessionRef,
        (event) => {
          events.push(event);
        },
      );

      await appendFile(
        sessionFilePath,
        [
          JSON.stringify({
            type: 'user',
            uuid: 'new-user',
            message: { role: 'user', content: 'who trained you?' },
          }),
          JSON.stringify({
            type: 'assistant',
            uuid: 'new-assistant',
            message: {
              content: [
                { type: 'text', text: 'I was trained by OpenAI.' },
              ],
            },
          }),
          '',
        ].join('\n'),
        'utf8',
      );

      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (events.length >= 2) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      await cleanup();

      expect(events).toEqual([
        {
          type: 'session.message.delta',
          payload: {
            role: 'user',
            text: 'who trained you?',
          },
        },
        {
          type: 'session.message.delta',
          payload: {
            role: 'assistant',
            text: 'I was trained by OpenAI.',
          },
        },
      ]);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('watches Codex message deltas from the native session file', async () => {
    const fixture = await writeLogFixture({
      rootName: 'codex-watch-session-file',
      codexLog: `
2026-03-24 07:06:53.694 [warning] [CodexMcpConnection] cli: message="codex_app_server::codex_message_processor: thread/resume overrides ignored for running thread 019d19f6-20f7-7802-a890-8c29bbfb4f15: config overrides were provided and ignored while running"
      `.trim(),
    });
    const codexHomeDir = join(tmpdir(), 'happy-vscode-bridge-codex-home');
    const sessionDir = join(codexHomeDir, 'sessions', '2026', '03', '24');
    const sessionFilePath = join(
      sessionDir,
      'rollout-20260324-019d19f6-20f7-7802-a890-8c29bbfb4f15.jsonl',
    );
    await mkdir(sessionDir, { recursive: true });
    await writeFile(
      sessionFilePath,
      `${JSON.stringify({
        type: 'response_item',
        timestamp: '2026-03-24T07:06:53.694Z',
        payload: {
          role: 'user',
          content: [{ type: 'input_text', text: 'existing prompt' }],
        },
      })}\n`,
      'utf8',
    );

    vi.stubEnv('CODEX_HOME', codexHomeDir);
    try {
      const factories = createDefaultProbeFactories({
        extensionLogPath: fixture.logPath,
        workspace: {
          folderUris: [toFileUri(join(tmpdir(), 'codex-workspace'))],
        },
        commandExecutor: vi.fn(async () => undefined),
        createUri: (value) => ({ value }),
        watchPollMs: 10,
      });

      const probes = await factories.codex!(
        makeResolution('codex', [
          'vscode.openWith',
          'type',
          'workbench.action.chat.focusInput',
          'workbench.action.chat.submit',
          'workbench.action.chat.cancel',
        ]),
      );
      const [session] = await probes.runtimeProbe!.discoverSessions();
      const events: Array<{ type: string; payload?: unknown }> = [];

      const cleanup = await probes.runtimeProbe!.watchSession(
        session.providerSessionRef,
        (event) => {
          events.push(event);
        },
      );

      await appendFile(
        sessionFilePath,
        [
          JSON.stringify({
            type: 'response_item',
            timestamp: '2026-03-24T07:07:00.000Z',
            payload: {
              role: 'user',
              content: [{ type: 'input_text', text: 'new prompt' }],
            },
          }),
          JSON.stringify({
            type: 'response_item',
            timestamp: '2026-03-24T07:07:01.000Z',
            payload: {
              role: 'assistant',
              content: [{ type: 'output_text', text: 'new answer' }],
            },
          }),
          '',
        ].join('\n'),
        'utf8',
      );

      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (events.length >= 2) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      await cleanup();

      expect(events).toEqual([
        {
          type: 'session.message.delta',
          payload: {
            role: 'user',
            text: 'new prompt',
          },
        },
        {
          type: 'session.message.delta',
          payload: {
            role: 'assistant',
            text: 'new answer',
          },
        },
      ]);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
