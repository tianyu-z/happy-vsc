import { describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { activate, deactivate } from './extension';

describe('bridge extension entrypoint', () => {
  it('declares a VS Code extension entrypoint', async () => {
    const pkgPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      'package.json',
    );
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as {
      main?: unknown;
      publisher?: unknown;
      engines?: { vscode?: unknown };
      contributes?: {
        commands?: Array<{
          command?: unknown;
          title?: unknown;
        }>;
        viewsWelcome?: Array<{
          view?: unknown;
          contents?: unknown;
        }>;
        menus?: Record<
          string,
          Array<{
            command?: unknown;
            when?: unknown;
          }>
        >;
      };
    };
    expect(pkg.engines?.vscode).toBeTruthy();
    expect(pkg.publisher).toBe('happy');
    expect(typeof pkg.main).toBe('string');
    expect(pkg.main).toContain('dist/');
    expect(pkg.activationEvents).toContain('*');
    expect(
      pkg.contributes?.commands?.some(
        (item) => item.command === 'happyVscodeBridge.diagnoseProviders',
      ),
    ).toBe(true);
    expect(
      pkg.contributes?.viewsWelcome?.some(
        (item) =>
          item.view === 'happyVscodeBridge.sessions' &&
          String(item.contents).includes('Refresh Sessions'),
      ),
    ).toBe(true);
    expect(
      pkg.contributes?.menus?.['view/title']?.some(
        (item) =>
          item.command === 'happyVscodeBridge.refreshSessions' &&
          item.when === 'view == happyVscodeBridge.sessions',
      ),
    ).toBe(true);
  });

  it('exports VS Code lifecycle hooks', () => {
    expect(typeof activate).toBe('function');
    expect(typeof deactivate).toBe('function');
  });

  it('keeps Extension Development Host compatible with official provider extensions', async () => {
    const launchPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
      '..',
      '.vscode',
      'launch.json',
    );
    const launch = JSON.parse(await readFile(launchPath, 'utf8')) as {
      configurations?: Array<{
        name?: string;
        args?: unknown[];
      }>;
    };
    const config = launch.configurations?.find(
      (candidate) => candidate.name === 'Happy Companion Bridge: Extension Host',
    );
    const args = config?.args?.map((value) => String(value)) ?? [];

    expect(args).not.toContain('--disable-extensions');
    expect(args).toContain('--disable-extension=happy.happy-vscode-bridge');
    expect(args).toContain(
      '--disable-extension=undefined_publisher.happy-vscode-bridge',
    );
  });

  it('activates the broker with a real companion runtime and ui wiring', async () => {
    const runtime = {
      refresh: vi.fn(async () => []),
      listDiscoveredSessions: vi.fn(() => []),
      listProviderDiagnostics: vi.fn(() => []),
      setSessionDesiredMode: vi.fn(async () => {
        throw new Error('not needed');
      }),
      subscribe: vi.fn(() => () => {}),
      dispose: vi.fn(async () => {}),
    };
    const vscode = {
      commands: {
        registerCommand: vi.fn(() => ({
          dispose: vi.fn(),
        })),
      },
      window: {
        createTreeView: vi.fn(() => ({
          dispose: vi.fn(),
        })),
        createStatusBarItem: vi.fn(() => ({
          text: '',
          show: vi.fn(),
          hide: vi.fn(),
          dispose: vi.fn(),
        })),
      },
    };
    const context = {
      globalStorageUri: {
        fsPath: '/tmp/happy-vscode-bridge',
      },
      subscriptions: [] as Array<{ dispose(): unknown }>,
    };

    const result = await activate(context, {
      runtime: runtime as never,
      token: 'test-token',
      vscode: vscode as never,
    });

    expect(result.started).toBe(true);
    expect(result.commands).toContain('happyVscodeBridge.switchSessionMode');
    expect(result.commands).toContain('happyVscodeBridge.diagnoseProviders');
    expect(vscode.window.createTreeView).toHaveBeenCalledTimes(1);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalledTimes(1);
    expect(context.subscriptions.length).toBeGreaterThan(1);

    await deactivate();
  });

  it('wires default probe factories into runtime creation', async () => {
    const runtime = {
      refresh: vi.fn(async () => []),
      listDiscoveredSessions: vi.fn(() => []),
      listProviderDiagnostics: vi.fn(() => []),
      setSessionDesiredMode: vi.fn(async () => {
        throw new Error('not needed');
      }),
      subscribe: vi.fn(() => () => {}),
      dispose: vi.fn(async () => {}),
    };
    const createRuntime = vi.fn(async (_options) => runtime);
    const vscode = {
      commands: {
        getCommands: vi.fn(async () => []),
        registerCommand: vi.fn(() => ({
          dispose: vi.fn(),
        })),
      },
      window: {
        createTreeView: vi.fn(() => ({
          dispose: vi.fn(),
        })),
        createStatusBarItem: vi.fn(() => ({
          text: '',
          show: vi.fn(),
          hide: vi.fn(),
          dispose: vi.fn(),
        })),
      },
      extensions: [],
      workspace: {
        workspaceFolders: [
          {
            uri: {
              toString: () => 'file:///workspace',
            },
          },
        ],
      },
    };
    const context = {
      globalStorageUri: {
        fsPath: '/tmp/happy-vscode-bridge',
      },
      logUri: {
        fsPath: '/tmp/logs/20260324T000449/exthost6/happy.happy-vscode-bridge',
      },
      subscriptions: [] as Array<{ dispose(): unknown }>,
    };

    await activate(context, {
      createRuntime,
      token: 'test-token',
      vscode: vscode as never,
    });

    expect(createRuntime).toHaveBeenCalledTimes(1);
    expect(createRuntime.mock.calls[0]?.[0]).toMatchObject({
      probeFactories: expect.objectContaining({
        claude: expect.any(Function),
        codex: expect.any(Function),
      }),
    });

    await deactivate();
  });

  it('passes VS Code tabs into the default Codex probe factory', async () => {
    const runtime = {
      refresh: vi.fn(async () => []),
      listDiscoveredSessions: vi.fn(() => []),
      listProviderDiagnostics: vi.fn(() => []),
      setSessionDesiredMode: vi.fn(async () => {
        throw new Error('not needed');
      }),
      subscribe: vi.fn(() => () => {}),
      dispose: vi.fn(async () => {}),
    };
    const createRuntime = vi.fn(async (options) => {
      const probes = await options.probeFactories.codex({
        provider: 'codex',
        compatibility: 'supported',
        activationState: 'active',
        providerExtension: {
          id: 'openai.chatgpt',
          version: '26.318.11754',
        },
        commands: [
          'vscode.openWith',
          'type',
          'workbench.action.chat.focusInput',
          'workbench.action.chat.submit',
          'workbench.action.chat.cancel',
        ],
        contextKeys: [],
        exportKeys: [],
        host: null,
      });

      const sessions = await probes.runtimeProbe?.discoverSessions();
      expect(sessions).toEqual([
        expect.objectContaining({
          providerSessionRef: '019d1fcb-5c1d-7c39-8df7-0f85f6e5c001',
          title: 'Investigate codex discovery',
        }),
      ]);

      return runtime;
    });
    const vscode = {
      commands: {
        getCommands: vi.fn(async () => []),
        executeCommand: vi.fn(async () => undefined),
        registerCommand: vi.fn(() => ({
          dispose: vi.fn(),
        })),
      },
      window: {
        createTreeView: vi.fn(() => ({
          dispose: vi.fn(),
        })),
        createStatusBarItem: vi.fn(() => ({
          text: '',
          show: vi.fn(),
          hide: vi.fn(),
          dispose: vi.fn(),
        })),
        tabGroups: {
          all: [
            {
              tabs: [
                {
                  label: 'Investigate codex discovery',
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
            },
          ],
        },
      },
      extensions: [],
      workspace: {
        workspaceFolders: [
          {
            uri: {
              toString: () => 'file:///workspace',
            },
          },
        ],
      },
      Uri: {
        parse: (value: string) => ({ value }),
      },
    };
    const context = {
      globalStorageUri: {
        fsPath: '/tmp/happy-vscode-bridge',
      },
      logUri: {
        fsPath: '/tmp/logs/20260324T000449/exthost6/happy.happy-vscode-bridge',
      },
      subscriptions: [] as Array<{ dispose(): unknown }>,
    };

    await activate(context, {
      createRuntime,
      token: 'test-token',
      vscode: vscode as never,
    });

    expect(createRuntime).toHaveBeenCalledTimes(1);

    await deactivate();
  });

  it('eagerly activates supported provider extensions while capture hooks are installed', async () => {
    const runtime = {
      refresh: vi.fn(async () => []),
      listDiscoveredSessions: vi.fn(() => []),
      listProviderDiagnostics: vi.fn(() => []),
      setSessionDesiredMode: vi.fn(async () => {
        throw new Error('not needed');
      }),
      subscribe: vi.fn(() => () => {}),
      dispose: vi.fn(async () => {}),
    };
    const createRuntime = vi.fn(async () => runtime);
    const activateClaude = vi.fn(async () => undefined);
    const activateCodex = vi.fn(async () => undefined);
    const vscode = {
      commands: {
        getCommands: vi.fn(async () => []),
        registerCommand: vi.fn(() => ({
          dispose: vi.fn(),
        })),
      },
      window: {
        createTreeView: vi.fn(() => ({
          dispose: vi.fn(),
        })),
        createStatusBarItem: vi.fn(() => ({
          text: '',
          show: vi.fn(),
          hide: vi.fn(),
          dispose: vi.fn(),
        })),
        registerWebviewViewProvider: vi.fn(() => ({
          dispose: vi.fn(),
        })),
        registerCustomEditorProvider: vi.fn(() => ({
          dispose: vi.fn(),
        })),
      },
      extensions: [
        {
          id: 'anthropic.claude-code',
          isActive: false,
          packageJSON: {
            version: '2.1.81',
          },
          activate: activateClaude,
        },
        {
          id: 'openai.chatgpt',
          isActive: false,
          packageJSON: {
            version: '26.318.11754',
          },
          activate: activateCodex,
        },
      ],
      workspace: {
        workspaceFolders: [
          {
            uri: {
              toString: () => 'file:///workspace',
            },
          },
        ],
      },
    };
    const context = {
      globalStorageUri: {
        fsPath: '/tmp/happy-vscode-bridge',
      },
      subscriptions: [] as Array<{ dispose(): unknown }>,
    };

    await activate(context, {
      createRuntime,
      token: 'test-token',
      vscode: vscode as never,
    });

    expect(activateClaude).toHaveBeenCalledTimes(1);
    expect(activateCodex).toHaveBeenCalledTimes(1);

    await deactivate();
  });
});
