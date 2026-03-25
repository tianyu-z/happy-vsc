import { describe, expect, it, vi } from 'vitest';

import {
  createProviderRuntimeCaptureRegistry,
  getTrackedCodexViewState,
  installProviderRuntimeCapture,
} from './ProviderRuntimeCapture';

describe('ProviderRuntimeCapture', () => {
  it('captures providers through a reusable registration entrypoint', () => {
    const registry = createProviderRuntimeCaptureRegistry();
    const claudeProvider = { name: 'claude-provider' };
    const codexProvider = { name: 'codex-provider' };

    registry.captureRegistration('claudeVSCodeSidebar', claudeProvider);
    registry.captureRegistration('chatgpt.conversationEditor', codexProvider);

    expect(registry.getCapturedProvider('claude')).toBe(claudeProvider);
    expect(registry.getCapturedProvider('codex')).toBe(codexProvider);
  });

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

  it('prefers captured Codex chat session providers over later editor registrations', () => {
    const registerCustomEditorProvider = vi.fn(() => ({
      dispose: vi.fn(),
    }));
    const registerChatSessionItemProvider = vi.fn(() => ({
      dispose: vi.fn(),
    }));
    const vscode = {
      window: {
        registerCustomEditorProvider,
      },
      chat: {
        registerChatSessionItemProvider,
      },
    };
    const codexChatProvider = {
      provideChatSessionItems: vi.fn(async () => []),
    };
    const codexEditorProvider = {
      resolveCustomTextEditor: vi.fn(),
    };

    const capture = installProviderRuntimeCapture(vscode);

    vscode.chat.registerChatSessionItemProvider(
      'openai-codex',
      codexChatProvider,
    );
    vscode.window.registerCustomEditorProvider(
      'chatgpt.conversationEditor',
      codexEditorProvider,
      {},
    );

    expect(capture.registry.getCapturedProvider('codex')).toBe(
      codexChatProvider,
    );
    expect((capture.registry as any).getCapturedViewProvider('codex')).toBe(
      codexEditorProvider,
    );
    expect(capture.registry.getCaptureDiagnostic('codex')).toMatchObject({
      captured: true,
      providerMethods: expect.arrayContaining(['resolveCustomTextEditor']),
    });
  });

  it('exposes Codex view and chat captures separately while preferring the view capture in diagnostics', () => {
    const registry = createProviderRuntimeCaptureRegistry();
    const codexViewProvider = {
      resolveCustomEditor: vi.fn(),
      editorPanels: new Map(),
    };
    const codexChatProvider = {
      provideChatSessionItems: vi.fn(async () => []),
    };

    registry.captureRegistration(
      'chatgpt.conversationEditor',
      codexViewProvider,
    );
    registry.captureChatSessionRegistration(
      'openai-codex',
      codexChatProvider,
    );

    expect((registry as any).getCapturedViewProvider('codex')).toBe(
      codexViewProvider,
    );
    expect((registry as any).getCapturedChatSessionProvider('codex')).toBe(
      codexChatProvider,
    );
    expect(registry.getCapturedProvider('codex')).toBe(codexChatProvider);
    expect(registry.getCaptureDiagnostic('codex')).toMatchObject({
      captured: true,
      providerMethods: expect.arrayContaining(['resolveCustomEditor']),
    });
  });

  it('tracks Codex sidebar route messages on the captured view provider', () => {
    const registry = createProviderRuntimeCaptureRegistry();
    const currentConversationId = '019d2218-b01b-7930-8671-cbd49da63926';
    const sidebarWebview = {
      postMessage: vi.fn(),
    };
    const codexViewProvider = {
      sidebarView: {
        webview: sidebarWebview,
      },
      postMessageToWebview: vi.fn(),
    };

    registry.captureRegistration('chatgpt.sidebarView', codexViewProvider);

    const capturedViewProvider = (registry as any).getCapturedViewProvider(
      'codex',
    );
    capturedViewProvider.postMessageToWebview(sidebarWebview, {
      type: 'navigate-to-route',
      path: `/local/${currentConversationId}`,
    });

    expect(getTrackedCodexViewState(capturedViewProvider)).toEqual({
      sidebarSessionRef: currentConversationId,
      panelSessionRefs: [],
    });
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
