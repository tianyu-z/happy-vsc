import { describe, expect, it, vi } from 'vitest';

import { BridgeSessionTreeDataProvider } from './BridgeSessionTreeDataProvider';
import { bridgeCommandIds, registerBridgeCommands } from './BridgeCommands';
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
    getTreeViews() {
      return treeViews;
    },
    getStatusBarItems() {
      return statusBarItems;
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
    });

    expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(4);
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
