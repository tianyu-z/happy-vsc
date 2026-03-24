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
      engines?: { vscode?: unknown };
    };
    expect(pkg.engines?.vscode).toBeTruthy();
    expect(typeof pkg.main).toBe('string');
    expect(pkg.main).toContain('dist/');
  });

  it('exports VS Code lifecycle hooks', () => {
    expect(typeof activate).toBe('function');
    expect(typeof deactivate).toBe('function');
  });

  it('activates the broker with a real companion runtime and ui wiring', async () => {
    const runtime = {
      refresh: vi.fn(async () => []),
      listDiscoveredSessions: vi.fn(() => []),
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
    expect(vscode.window.createTreeView).toHaveBeenCalledTimes(1);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalledTimes(1);
    expect(context.subscriptions.length).toBeGreaterThan(1);

    await deactivate();
  });
});
