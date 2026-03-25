import { describe, expect, it, vi } from 'vitest';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { createDefaultProbeFactories } from './createDefaultProbeFactories';
import type { ProviderHostResolution } from './probes/types';

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
});
