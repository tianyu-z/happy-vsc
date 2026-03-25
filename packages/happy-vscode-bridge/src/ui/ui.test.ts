import { describe, expect, it, vi } from 'vitest';

import { BridgeSessionTreeDataProvider } from './BridgeSessionTreeDataProvider';
import {
  bridgeCommandIds,
  formatProviderDiagnosticsReport,
  registerBridgeCommands,
} from './BridgeCommands';
import { createBridgeStatusBar } from './BridgeStatusBar';

function makeRuntime() {
  let sessions = [
    {
      brokerSessionId: 'broker-sess-1',
      provider: 'claude' as const,
      title: 'Claude Session',
      attachability: 'attachable_with_degraded_capabilities' as const,
      capabilities: ['sendUserMessage'],
      degradedFlags: ['runtime_probe_unverified'],
      desiredMode: 'runtime_preferred' as const,
      effectiveMode: 'runtime' as const,
      modeReason: 'runtime_degraded',
      compatibility: 'supported' as const,
      providerExtension: {
        id: 'anthropic.claude-code',
        version: '1.0.0',
      },
      probeHealth: {
        runtime: 'degraded' as const,
        storage: 'ready' as const,
      },
    },
  ];
  const listeners = new Set<() => void>();

  return {
    refresh: vi.fn(async () => sessions),
    listDiscoveredSessions: vi.fn(() => sessions),
    listProviderDiagnostics: vi.fn(() => [
      {
        provider: 'claude' as const,
        compatibility: 'supported' as const,
        activationState: 'active' as const,
        providerExtension: {
          id: 'anthropic.claude-code',
          version: '2.1.81',
        },
        commands: ['claude-vscode.editor.open'],
        contextKeys: ['claudeCode.sessionActive'],
        exportKeys: ['runtimeBridge'],
        moduleExportKeys: ['activate', 'deactivate', 'openTabs'],
        runtimeCapture: {
          captured: true,
          patchedHostCount: 2,
          providerKeys: ['allComms'],
          providerMethods: ['resolveWebviewView'],
          commCount: 1,
          knownChannelRefs: ['live-channel-42'],
        },
        hasRuntimeProbe: false,
        hasStorageProbe: true,
        discoveredSessions: sessions
          .filter((session) => session.provider === 'claude')
          .map((session) => ({
            title: session.title,
            attachability: session.attachability,
            capabilities: session.capabilities,
            degradedFlags: session.degradedFlags,
            desiredMode: session.desiredMode,
            effectiveMode: session.effectiveMode,
            modeReason: session.modeReason,
            probeHealth: session.probeHealth,
            runtimeDiagnostics: {
              runtimeProviderSessionRef: 'broker-sess-1',
              runtimeChannelRef: 'live-channel-42',
              interruptBridgeState: 'provider_not_captured',
              interruptCommMatched: false,
            },
          })),
      },
      {
        provider: 'codex' as const,
        compatibility: 'supported' as const,
        activationState: 'active' as const,
        providerExtension: {
          id: 'openai.chatgpt',
          version: '26.318.11754',
        },
        commands: ['chatgpt.newCodexPanel'],
        contextKeys: ['chatgpt.sidebarView.visible'],
        exportKeys: ['chatSessionBridge'],
        moduleExportKeys: ['activate'],
        runtimeCapture: null,
        hasRuntimeProbe: false,
        hasStorageProbe: true,
        discoveredSessions: [],
      },
    ]),
    setSessionDesiredMode: vi.fn(async (_brokerSessionId: string, desiredMode: 'runtime_preferred' | 'storage_preferred') => {
      sessions = sessions.map((session) => ({
        ...session,
        desiredMode,
        effectiveMode: desiredMode === 'storage_preferred' ? 'storage' : 'runtime',
        modeReason:
          desiredMode === 'storage_preferred'
            ? 'storage_preferred_selected'
            : 'runtime_degraded',
      }));
      for (const listener of listeners) {
        listener();
      }
      return sessions[0];
    }),
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function makeVscodeHost() {
  const commands = new Map<string, (...args: unknown[]) => unknown>();
  const treeViews: unknown[] = [];
  const openedDocuments: Array<{
    content: string;
    language?: string;
  }> = [];
  const statusBarItems: Array<{
    text: string;
    tooltip?: string;
    command?: string;
    show: ReturnType<typeof vi.fn>;
    hide: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  }> = [];

  return {
    commands: {
      registerCommand: vi.fn((id: string, handler: (...args: unknown[]) => unknown) => {
        commands.set(id, handler);
        return {
          dispose: vi.fn(() => {
            commands.delete(id);
          }),
        };
      }),
      getRegisteredCommands: () => commands,
    },
    window: {
      createTreeView: vi.fn((_id: string, options: unknown) => {
        treeViews.push(options);
        return {
          dispose: vi.fn(),
        };
      }),
      showTextDocument: vi.fn(async (_document: unknown) => {}),
      createStatusBarItem: vi.fn(() => {
        const item = {
          text: '',
          tooltip: undefined as string | undefined,
          command: undefined as string | undefined,
          show: vi.fn(),
          hide: vi.fn(),
          dispose: vi.fn(),
        };
        statusBarItems.push(item);
        return item;
      }),
    },
    workspace: {
      openTextDocument: vi.fn(
        async (options: { content: string; language?: string }) => {
          openedDocuments.push(options);
          return {
            getText: () => options.content,
          };
        },
      ),
    },
    getTreeViews() {
      return treeViews;
    },
    getStatusBarItems() {
      return statusBarItems;
    },
    getOpenedDocuments() {
      return openedDocuments;
    },
  };
}

describe('bridge ui', () => {
  it('formats session rows with probe labels and degraded state', async () => {
    const runtime = makeRuntime();
    const provider = new BridgeSessionTreeDataProvider(runtime as never);

    const items = await provider.getChildren();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      label: 'Claude Session',
    });
    expect(String(items[0].description)).toContain('RuntimeProbe (Recommended)');
    expect(String(items[0].description)).toContain('degraded');
  });

  it('registers bridge commands and toggles session mode through the runtime', async () => {
    const runtime = makeRuntime();
    const vscode = makeVscodeHost();

    const registrations = registerBridgeCommands({
      runtime: runtime as never,
      vscode: vscode as never,
      startBroker: vi.fn(async () => {}),
      stopBroker: vi.fn(async () => {}),
      getDiagnosticsReport: vi.fn(async () => 'report'),
    });

    expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(5);
    expect([...vscode.commands.getRegisteredCommands().keys()].sort()).toEqual(
      [...bridgeCommandIds].sort(),
    );

    const switchMode = vscode.commands.getRegisteredCommands().get(
      'happyVscodeBridge.switchSessionMode',
    );
    await switchMode?.({ brokerSessionId: 'broker-sess-1' });

    expect(runtime.setSessionDesiredMode).toHaveBeenCalledWith(
      'broker-sess-1',
      'storage_preferred',
    );

    registrations.forEach((registration) => registration.dispose());
  });

  it('registers a provider diagnostics command that opens a report document', async () => {
    const runtime = makeRuntime();
    const vscode = makeVscodeHost();

    registerBridgeCommands({
      runtime: runtime as never,
      vscode: vscode as never,
      startBroker: vi.fn(async () => {}),
      stopBroker: vi.fn(async () => {}),
      getDiagnosticsReport: vi.fn(async () => [
        '# Happy Companion Provider Diagnostics',
        '',
        '## Claude',
        '- compatibility: supported',
      ].join('\n')),
    });

    const diagnoseProviders = vscode.commands.getRegisteredCommands().get(
      'happyVscodeBridge.diagnoseProviders',
    );
    const report = await diagnoseProviders?.();

    expect(typeof report).toBe('string');
    expect(String(report)).toContain('Happy Companion Provider Diagnostics');
    expect(vscode.workspace.openTextDocument).toHaveBeenCalledTimes(1);
    expect(vscode.window.showTextDocument).toHaveBeenCalledTimes(1);
    expect(vscode.getOpenedDocuments()[0]).toMatchObject({
      language: 'markdown',
    });
    expect(vscode.getOpenedDocuments()[0]?.content).toContain('## Claude');
  });

  it('refreshes runtime state before generating the provider diagnostics report', async () => {
    const runtime = makeRuntime();
    const vscode = makeVscodeHost();
    const getDiagnosticsReport = vi.fn(async () => 'report');

    registerBridgeCommands({
      runtime: runtime as never,
      vscode: vscode as never,
      startBroker: vi.fn(async () => {}),
      stopBroker: vi.fn(async () => {}),
      getDiagnosticsReport,
    });

    const diagnoseProviders = vscode.commands.getRegisteredCommands().get(
      'happyVscodeBridge.diagnoseProviders',
    );
    await diagnoseProviders?.();

    expect(runtime.refresh).toHaveBeenCalledTimes(1);
    expect(getDiagnosticsReport).toHaveBeenCalledTimes(1);
  });

  it('formats provider diagnostics with session capabilities and degraded flags', () => {
    const runtime = makeRuntime();

    const report = formatProviderDiagnosticsReport({
      bridgeLogPath: '/tmp/bridge.log',
      exthostLogDir: '/tmp/exthost14',
      diagnostics: runtime.listProviderDiagnostics(),
    });

    expect(report).toContain(
      '- Session Capabilities: sendUserMessage',
    );
    expect(report).toContain(
      '- Session Degraded Flags: runtime_probe_unverified',
    );
    expect(report).toContain(
      '- Session Probe Health: runtime=degraded | storage=ready',
    );
    expect(report).toContain(
      '- Module Export Keys: activate, deactivate, openTabs',
    );
    expect(report).toContain(
      '- Runtime Capture: captured=yes | patchedHosts=2 | comms=1',
    );
    expect(report).toContain(
      '- Runtime Capture Channel Refs: live-channel-42',
    );
    expect(report).toContain(
      '- Session Runtime Refs: provider=broker-sess-1 | channel=live-channel-42',
    );
    expect(report).toContain(
      '- Session Interrupt Bridge: state=provider_not_captured | commMatched=no',
    );
  });

  it('creates a status bar item that reflects session counts', async () => {
    const runtime = makeRuntime();
    const vscode = makeVscodeHost();

    const statusBar = createBridgeStatusBar({
      runtime: runtime as never,
      vscode: vscode as never,
    });

    expect(vscode.window.createStatusBarItem).toHaveBeenCalledTimes(1);
    expect(vscode.getStatusBarItems()[0].text).toContain('1 session');
    expect(vscode.getStatusBarItems()[0].text).toContain('1 degraded');
    expect(vscode.getStatusBarItems()[0].show).toHaveBeenCalledTimes(1);

    statusBar.dispose();
  });
});
