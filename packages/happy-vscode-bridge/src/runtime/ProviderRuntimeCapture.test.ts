import { describe, expect, it, vi } from 'vitest';

import { installProviderRuntimeCapture } from './ProviderRuntimeCapture';

describe('ProviderRuntimeCapture', () => {
  it('captures Claude and Codex live providers from VS Code registrations', () => {
    const registerWebviewViewProvider = vi.fn(() => ({
      dispose: vi.fn(),
    }));
    const registerCustomEditorProvider = vi.fn(() => ({
      dispose: vi.fn(),
    }));
    const vscode = {
      window: {
        registerWebviewViewProvider,
        registerCustomEditorProvider,
      },
    };
    const claudeProvider = { name: 'claude-provider' };
    const codexProvider = { name: 'codex-provider' };

    const capture = installProviderRuntimeCapture(vscode);

    vscode.window.registerWebviewViewProvider(
      'claudeVSCodeSidebar',
      claudeProvider,
      {},
    );
    vscode.window.registerCustomEditorProvider(
      'chatgpt.conversationEditor',
      codexProvider,
      {},
    );

    expect(capture.registry.getCapturedProvider('claude')).toBe(claudeProvider);
    expect(capture.registry.getCapturedProvider('codex')).toBe(codexProvider);
    expect(registerWebviewViewProvider).toHaveBeenCalledTimes(1);
    expect(registerCustomEditorProvider).toHaveBeenCalledTimes(1);
  });

  it('restores original VS Code registration methods on dispose', () => {
    const registerWebviewViewProvider = vi.fn(() => ({
      dispose: vi.fn(),
    }));
    const registerCustomEditorProvider = vi.fn(() => ({
      dispose: vi.fn(),
    }));
    const vscode = {
      window: {
        registerWebviewViewProvider,
        registerCustomEditorProvider,
      },
    };

    const capture = installProviderRuntimeCapture(vscode);
    const wrappedRegisterWebviewViewProvider =
      vscode.window.registerWebviewViewProvider;
    const wrappedRegisterCustomEditorProvider =
      vscode.window.registerCustomEditorProvider;

    expect(wrappedRegisterWebviewViewProvider).not.toBe(
      registerWebviewViewProvider,
    );
    expect(wrappedRegisterCustomEditorProvider).not.toBe(
      registerCustomEditorProvider,
    );

    capture.dispose();

    expect(vscode.window.registerWebviewViewProvider).toBe(
      registerWebviewViewProvider,
    );
    expect(vscode.window.registerCustomEditorProvider).toBe(
      registerCustomEditorProvider,
    );
  });

  it('captures providers registered from an additional VS Code host', () => {
    const primaryVscode = {
      window: {
        registerWebviewViewProvider: vi.fn(() => ({
          dispose: vi.fn(),
        })),
        registerCustomEditorProvider: vi.fn(() => ({
          dispose: vi.fn(),
        })),
      },
    };
    const alternateRegisterWebviewViewProvider = vi.fn(() => ({
      dispose: vi.fn(),
    }));
    const alternateVscode = {
      window: {
        registerWebviewViewProvider: alternateRegisterWebviewViewProvider,
      },
    };
    const claudeProvider = { name: 'claude-provider-from-alternate-host' };

    const capture = installProviderRuntimeCapture(primaryVscode, {
      additionalHosts: [alternateVscode],
    });

    alternateVscode.window.registerWebviewViewProvider(
      'claudeVSCodeSidebar',
      claudeProvider,
      {},
    );

    expect(capture.registry.getCapturedProvider('claude')).toBe(claudeProvider);
    expect(alternateRegisterWebviewViewProvider).toHaveBeenCalledTimes(1);
  });

  it('describes captured provider shape and known runtime channel refs', () => {
    const registerWebviewViewProvider = vi.fn(() => ({
      dispose: vi.fn(),
    }));
    const vscode = {
      window: {
        registerWebviewViewProvider,
      },
    };
    const claudeProvider = {
      allComms: new Set([
        {
          channels: new Map([
            ['live-channel-42', {}],
            ['live-channel-84', {}],
          ]),
          interruptClaude: vi.fn(async () => undefined),
        },
      ]),
      resolveWebviewView: vi.fn(),
    };

    const capture = installProviderRuntimeCapture(vscode);

    vscode.window.registerWebviewViewProvider(
      'claudeVSCodeSidebar',
      claudeProvider,
      {},
    );

    expect(capture.registry.getCaptureDiagnostic('claude')).toMatchObject({
      captured: true,
      patchedHostCount: 1,
      providerKeys: expect.arrayContaining(['allComms', 'resolveWebviewView']),
      providerMethods: expect.arrayContaining(['resolveWebviewView']),
      commCount: 1,
      knownChannelRefs: ['live-channel-42', 'live-channel-84'],
    });
  });
});
