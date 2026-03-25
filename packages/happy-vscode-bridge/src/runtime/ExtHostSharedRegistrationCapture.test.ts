import { describe, expect, it, vi } from 'vitest';

import { createProviderRuntimeCaptureRegistry } from './ProviderRuntimeCapture';
import {
  discoverSharedRegistrarCandidatesFromVscodeApi,
  installExtHostSharedRegistrationCapture,
  locateSharedWebviewRegistrar,
} from './ExtHostSharedRegistrationCapture';

type SharedFixture = ReturnType<typeof createSharedRegistrarFixture>;

function createSharedRegistrarFixture(targetKind: 'instance' | 'prototype') {
  const sharedCalls = {
    registerWebviewViewProvider: vi.fn(() => ({
      dispose: vi.fn(),
    })),
    registerCustomEditorProvider: vi.fn(() => ({
      dispose: vi.fn(),
    })),
    registerChatSessionItemProvider: vi.fn(() => ({
      dispose: vi.fn(),
    })),
  };

  let sharedRegistrar: {
    registerWebviewViewProvider: (...args: unknown[]) => { dispose: ReturnType<typeof vi.fn> };
    registerCustomEditorProvider: (...args: unknown[]) => { dispose: ReturnType<typeof vi.fn> };
    registerChatSessionItemProvider: (...args: unknown[]) => { dispose: ReturnType<typeof vi.fn> };
  };

  if (targetKind === 'instance') {
    sharedRegistrar = {
      registerWebviewViewProvider: (...args) =>
        sharedCalls.registerWebviewViewProvider(...args),
      registerCustomEditorProvider: (...args) =>
        sharedCalls.registerCustomEditorProvider(...args),
      registerChatSessionItemProvider: (...args) =>
        sharedCalls.registerChatSessionItemProvider(...args),
    };
  } else {
    class SharedRegistrarPrototype {
      registerWebviewViewProvider(...args: unknown[]) {
        return sharedCalls.registerWebviewViewProvider(...args);
      }

      registerCustomEditorProvider(...args: unknown[]) {
        return sharedCalls.registerCustomEditorProvider(...args);
      }

      registerChatSessionItemProvider(...args: unknown[]) {
        return sharedCalls.registerChatSessionItemProvider(...args);
      }
    }

    sharedRegistrar = new SharedRegistrarPrototype();
  }

  const makeApiHost = (extensionId: string) => ({
    window: {
      registerWebviewViewProvider(
        viewType: string,
        provider: unknown,
        options?: unknown,
      ) {
        return sharedRegistrar.registerWebviewViewProvider(
          { id: extensionId },
          viewType,
          provider,
          options,
        );
      },
      registerCustomEditorProvider(
        viewType: string,
        provider: unknown,
        options?: unknown,
      ) {
        return sharedRegistrar.registerCustomEditorProvider(
          { id: extensionId },
          viewType,
          provider,
          options,
        );
      },
    },
    chat: {
      registerChatSessionItemProvider(
        chatSessionType: string,
        provider: unknown,
      ) {
        return sharedRegistrar.registerChatSessionItemProvider(
          { id: extensionId },
          chatSessionType,
          provider,
        );
      },
    },
  });

  const happyApi = makeApiHost('happy.happy-vscode-bridge');
  const claudeApi = makeApiHost('anthropic.claude-code');
  const codexApi = makeApiHost('openai.chatgpt');

  return {
    happyApi,
    claudeApi,
    codexApi,
    sharedRegistrar,
    sharedCalls,
    candidates: [
      { unrelated: true },
      { label: 'shared-registrar', value: sharedRegistrar },
    ],
  };
}

function expectLocatedSharedRegistrar(
  fixture: SharedFixture,
  targetKind: 'instance' | 'prototype',
) {
  const located = locateSharedWebviewRegistrar({
    vscodeHost: fixture.happyApi,
    functionSource:
      fixture.happyApi.window.registerWebviewViewProvider?.toString(),
    candidates: fixture.candidates,
  });

  expect(located).not.toBeNull();
  expect(located?.targetKind).toBe(targetKind);

  if (targetKind === 'instance') {
    expect(located?.target).toBe(fixture.sharedRegistrar);
    expect(located?.registerWebviewViewProvider).toBe(
      fixture.sharedRegistrar.registerWebviewViewProvider,
    );
    return;
  }

  const sharedPrototype = Object.getPrototypeOf(fixture.sharedRegistrar) as {
    registerWebviewViewProvider: unknown;
  };
  expect(located?.target).toBe(sharedPrototype);
  expect(located?.registerWebviewViewProvider).toBe(
    sharedPrototype.registerWebviewViewProvider,
  );
}

describe('ExtHostSharedRegistrationCapture', () => {
  it('locates a shared registrar instance behind per-extension window APIs', () => {
    expectLocatedSharedRegistrar(
      createSharedRegistrarFixture('instance'),
      'instance',
    );
  });

  it('locates a shared registrar prototype behind per-extension window APIs', () => {
    expectLocatedSharedRegistrar(
      createSharedRegistrarFixture('prototype'),
      'prototype',
    );
  });

  it('captures Claude and Codex registrations through the shared registrar seam', () => {
    const fixture = createSharedRegistrarFixture('instance');
    const registry = createProviderRuntimeCaptureRegistry();
    const claudeProvider = { id: 'claude-provider' };
    const codexProvider = { id: 'codex-provider' };

    const capture = installExtHostSharedRegistrationCapture({
      vscodeHost: fixture.happyApi,
      registry,
      candidates: fixture.candidates,
    });

    fixture.claudeApi.window.registerWebviewViewProvider(
      'claudeVSCodeSidebar',
      claudeProvider,
      {},
    );
    fixture.codexApi.window.registerCustomEditorProvider(
      'chatgpt.conversationEditor',
      codexProvider,
      {},
    );

    expect(registry.getCapturedProvider('claude')).toBe(claudeProvider);
    expect(registry.getCapturedProvider('codex')).toBe(codexProvider);
    expect(capture.diagnostics.installed).toBe(true);
    expect(capture.diagnostics.targetKind).toBe('instance');
  });

  it('captures Codex chat session registrations through the shared registrar seam', () => {
    const fixture = createSharedRegistrarFixture('instance');
    const registry = createProviderRuntimeCaptureRegistry();
    const codexProvider = {
      provideChatSessionItems: vi.fn(async () => []),
    };

    installExtHostSharedRegistrationCapture({
      vscodeHost: fixture.happyApi,
      registry,
      candidates: fixture.candidates,
    });

    fixture.codexApi.chat.registerChatSessionItemProvider(
      'openai-codex',
      codexProvider,
    );

    expect(registry.getCapturedProvider('codex')).toBe(codexProvider);
  });

  it('shares one patch across repeated installs and restores originals after the final dispose', () => {
    const fixture = createSharedRegistrarFixture('instance');
    const firstRegistry = createProviderRuntimeCaptureRegistry();
    const secondRegistry = createProviderRuntimeCaptureRegistry();
    const originalRegisterWebviewViewProvider =
      fixture.sharedRegistrar.registerWebviewViewProvider;
    const claudeProvider = { id: 'claude-provider' };

    const firstCapture = installExtHostSharedRegistrationCapture({
      vscodeHost: fixture.happyApi,
      registry: firstRegistry,
      candidates: fixture.candidates,
    });
    const patchedRegisterWebviewViewProvider =
      fixture.sharedRegistrar.registerWebviewViewProvider;
    const secondCapture = installExtHostSharedRegistrationCapture({
      vscodeHost: fixture.happyApi,
      registry: secondRegistry,
      candidates: fixture.candidates,
    });

    expect(patchedRegisterWebviewViewProvider).not.toBe(
      originalRegisterWebviewViewProvider,
    );
    expect(fixture.sharedRegistrar.registerWebviewViewProvider).toBe(
      patchedRegisterWebviewViewProvider,
    );

    fixture.claudeApi.window.registerWebviewViewProvider(
      'claudeVSCodeSidebar',
      claudeProvider,
      {},
    );

    expect(firstRegistry.getCapturedProvider('claude')).toBe(claudeProvider);
    expect(secondRegistry.getCapturedProvider('claude')).toBe(claudeProvider);

    firstCapture.dispose();
    expect(fixture.sharedRegistrar.registerWebviewViewProvider).toBe(
      patchedRegisterWebviewViewProvider,
    );

    secondCapture.dispose();
    expect(fixture.sharedRegistrar.registerWebviewViewProvider).toBe(
      originalRegisterWebviewViewProvider,
    );
  });

  it('patches prototype targets and restores the prototype methods on dispose', () => {
    const fixture = createSharedRegistrarFixture('prototype');
    const registry = createProviderRuntimeCaptureRegistry();
    const sharedPrototype = Object.getPrototypeOf(fixture.sharedRegistrar) as {
      registerWebviewViewProvider: unknown;
    };
    const originalRegisterWebviewViewProvider =
      sharedPrototype.registerWebviewViewProvider;
    const claudeProvider = { id: 'claude-provider' };

    const capture = installExtHostSharedRegistrationCapture({
      vscodeHost: fixture.happyApi,
      registry,
      candidates: fixture.candidates,
    });

    expect(sharedPrototype.registerWebviewViewProvider).not.toBe(
      originalRegisterWebviewViewProvider,
    );

    fixture.claudeApi.window.registerWebviewViewProvider(
      'claudeVSCodeSidebar',
      claudeProvider,
      {},
    );

    expect(registry.getCapturedProvider('claude')).toBe(claudeProvider);

    capture.dispose();

    expect(sharedPrototype.registerWebviewViewProvider).toBe(
      originalRegisterWebviewViewProvider,
    );
  });

  it('returns an inert handle when no shared registrar candidate is available', () => {
    const registry = createProviderRuntimeCaptureRegistry();
    const capture = installExtHostSharedRegistrationCapture({
      vscodeHost: {
        window: {
          registerWebviewViewProvider: vi.fn(),
        },
      },
      registry,
      candidates: [{ label: 'unrelated', value: { noop: true } }],
    });

    expect(capture.diagnostics).toEqual({
      installed: false,
      targetKind: null,
      failureReason: 'no_candidate_found',
    });

    expect(() => capture.dispose()).not.toThrow();
  });

  it('discovers a shared registrar candidate from the vscode api closure scopes', async () => {
    const fixture = createSharedRegistrarFixture('instance');

    const discovered = await discoverSharedRegistrarCandidatesFromVscodeApi(
      fixture.happyApi,
    );

    expect(discovered.failureReason).toBeNull();
    expect(
      discovered.candidates.some(
        (candidate) =>
          candidate &&
          typeof candidate === 'object' &&
          'value' in candidate &&
          candidate.value === fixture.sharedRegistrar,
      ),
    ).toBe(true);

    const located = locateSharedWebviewRegistrar({
      vscodeHost: fixture.happyApi,
      functionSource:
        fixture.happyApi.window.registerWebviewViewProvider?.toString(),
      candidates: discovered.candidates,
    });

    expect(located?.target).toBe(fixture.sharedRegistrar);
    expect(located?.targetKind).toBe('instance');
  });

  it('backfills existing Claude and Codex runtime providers from ext-host state when capture installs late', () => {
    const fixture = createSharedRegistrarFixture('instance');
    const registry = createProviderRuntimeCaptureRegistry();
    const claudeProvider = {
      allComms: new Set([
        {
          channels: new Map([['late-channel-1', {}]]),
        },
      ]),
    };
    const codexConversationId = '019d230f-5c1d-7c39-8df7-0f85f6e5c003';
    const codexController = {
      refreshHandler: vi.fn(async () => undefined),
      items: new Map([
        [
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
        ],
      ]),
    };
    const extHostWebviewViews = {
      _viewProviders: new Map([
        [
          'claudeVSCodeSidebar',
          {
            provider: claudeProvider,
          },
        ],
      ]),
    };
    const extHostChatSessions = {
      _chatSessionItemControllers: new Map([
        [
          1,
          {
            chatSessionType: 'openai-codex',
            controller: codexController,
          },
        ],
      ]),
    };

    installExtHostSharedRegistrationCapture({
      vscodeHost: fixture.happyApi,
      registry,
      candidates: [
        ...fixture.candidates,
        { label: 'scope:webviews', value: extHostWebviewViews },
        { label: 'scope:chatSessions', value: extHostChatSessions },
      ],
    });

    expect(registry.getCapturedProvider('claude')).toBe(claudeProvider);
    expect(registry.getCapturedProvider('codex')).toBe(codexController);
    expect(registry.getCaptureDiagnostic('claude')).toMatchObject({
      captured: true,
    });
    expect(registry.getCaptureDiagnostic('codex')).toMatchObject({
      captured: true,
    });
  });
});
