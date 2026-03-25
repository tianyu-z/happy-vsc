import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import type { BrokerProvider } from 'happy-wire';

import type {
  ProviderRuntimeCaptureDiagnostic,
  ProviderRuntimeCapturePath,
} from './types';

export type Disposable = {
  dispose(): unknown;
};

export type CaptureWindowHost = {
  registerWebviewViewProvider?: (
    viewType: string,
    provider: unknown,
    options?: unknown,
  ) => Disposable;
  registerCustomEditorProvider?: (
    viewType: string,
    provider: unknown,
    options?: unknown,
  ) => Disposable;
};

export type CaptureChatHost = {
  registerChatSessionItemProvider?: (
    chatSessionType: string,
    provider: unknown,
  ) => Disposable;
};

export type CaptureVscodeHost = {
  window?: CaptureWindowHost;
  chat?: CaptureChatHost;
};

export type ProviderRuntimeCaptureRegistry = {
  getCapturedProvider(provider: BrokerProvider): unknown | null;
  getCapturedViewProvider?(provider: BrokerProvider): unknown | null;
  getCapturedChatSessionProvider?(provider: BrokerProvider): unknown | null;
  getCaptureDiagnostic(provider: BrokerProvider): ProviderRuntimeCaptureDiagnostic | null;
};

export type MutableProviderRuntimeCaptureRegistry = ProviderRuntimeCaptureRegistry & {
  captureRegistration(
    viewType: string,
    provider: unknown,
    options?: {
      capturePath?: ProviderRuntimeCapturePath | null;
    },
  ): void;
  captureChatSessionRegistration(
    chatSessionType: string,
    provider: unknown,
    options?: {
      capturePath?: ProviderRuntimeCapturePath | null;
    },
  ): void;
  setSharedHookDiagnostic(diagnostic: {
    installed: boolean;
    targetKind: 'instance' | 'prototype' | null;
    failureReason?: string | null;
  }): void;
};

export type ProviderRuntimeCaptureHandle = Disposable & {
  registry: ProviderRuntimeCaptureRegistry;
};

type InstallProviderRuntimeCaptureOptions = {
  additionalHosts?: CaptureVscodeHost[];
};

type CreateProviderRuntimeCaptureRegistryOptions = {
  getPatchedHostCount?: () => number;
};

const claudeViewTypes = new Set([
  'claudeVSCodeSidebar',
  'claudeVSCodeSidebarSecondary',
]);
const codexWebviewViewTypes = new Set([
  'chatgpt.sidebarView',
  'chatgpt.sidebarSecondaryView',
]);
const codexCustomEditorViewType = 'chatgpt.conversationEditor';
const codexChatSessionType = 'openai-codex';
const codexTrackedViewStateKey = Symbol(
  'happy.happy-vscode-bridge.codexTrackedViewState',
);
const codexTrackedViewInstalledKey = Symbol(
  'happy.happy-vscode-bridge.codexTrackedViewInstalled',
);
const captureRequire = createRequire(
  typeof __filename === 'string'
    ? __filename
    : resolve(process.cwd(), '__happy_provider_runtime_capture__.cjs'),
);

type CodexTrackedViewState = {
  sidebarSessionRef: string | null;
  panelSessionRefs: Map<object, string>;
};

type TrackableCodexViewProvider = {
  sidebarView?: {
    webview?: unknown;
  } | null;
  findPanelByWebview?: (webview: unknown) => unknown;
  postMessageToWebview?: (webview: unknown, message: unknown) => unknown;
  navigateToRoute?: (path: string, state?: unknown) => unknown;
};

export function getTrackedCodexViewState(providerCapture: unknown): {
  sidebarSessionRef: string | null;
  panelSessionRefs: string[];
} | null {
  if (
    !providerCapture ||
    (typeof providerCapture !== 'object' && typeof providerCapture !== 'function')
  ) {
    return null;
  }

  const state = (
    providerCapture as {
      [codexTrackedViewStateKey]?: CodexTrackedViewState;
    }
  )[codexTrackedViewStateKey];
  if (!state) {
    return null;
  }

  return {
    sidebarSessionRef: state.sidebarSessionRef,
    panelSessionRefs: [...new Set(state.panelSessionRefs.values())],
  };
}

function captureFromViewType(
  viewType: string,
): BrokerProvider | null {
  if (claudeViewTypes.has(viewType)) {
    return 'claude';
  }

  if (
    codexWebviewViewTypes.has(viewType) ||
    viewType === codexCustomEditorViewType
  ) {
    return 'codex';
  }

  return null;
}

function parseCodexRouteSessionRef(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.startsWith('/') ? value.slice(1) : value;
  const segments = normalized
    .split('/')
    .filter((segment) => segment.length > 0);
  if (segments.length < 2) {
    return null;
  }

  if (segments[0] !== 'local' && segments[0] !== 'remote') {
    return null;
  }

  return segments[1] ?? null;
}

function isTrackableObject(
  value: unknown,
): value is Record<PropertyKey, unknown> {
  return Boolean(
    value &&
      (typeof value === 'object' || typeof value === 'function'),
  );
}

function getOrCreateTrackedCodexViewState(
  provider: Record<PropertyKey, unknown>,
): CodexTrackedViewState {
  const existing = provider[
    codexTrackedViewStateKey
  ] as CodexTrackedViewState | undefined;
  if (existing) {
    return existing;
  }

  const state: CodexTrackedViewState = {
    sidebarSessionRef: null,
    panelSessionRefs: new Map<object, string>(),
  };
  Object.defineProperty(provider, codexTrackedViewStateKey, {
    value: state,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return state;
}

function installCodexViewProviderTracking(provider: unknown): unknown {
  if (!isTrackableObject(provider)) {
    return provider;
  }

  if (provider[codexTrackedViewInstalledKey]) {
    return provider;
  }

  const state = getOrCreateTrackedCodexViewState(provider);
  Object.defineProperty(provider, codexTrackedViewInstalledKey, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  const trackableProvider = provider as TrackableCodexViewProvider;
  const originalNavigateToRoute = trackableProvider.navigateToRoute;
  if (typeof originalNavigateToRoute === 'function') {
    trackableProvider.navigateToRoute = function patchedNavigateToRoute(
      this: TrackableCodexViewProvider,
      path: string,
      stateValue?: unknown,
    ) {
      const providerSessionRef = parseCodexRouteSessionRef(path);
      if (providerSessionRef) {
        state.sidebarSessionRef = providerSessionRef;
      }

      return originalNavigateToRoute.call(this, path, stateValue);
    };
  }

  const originalPostMessageToWebview = trackableProvider.postMessageToWebview;
  if (typeof originalPostMessageToWebview === 'function') {
    trackableProvider.postMessageToWebview = function patchedPostMessageToWebview(
      this: TrackableCodexViewProvider,
      webview: unknown,
      message: unknown,
    ) {
      const providerSessionRef = parseCodexRouteSessionRef(
        typeof message === 'object' &&
          message !== null &&
          (message as { type?: unknown }).type === 'navigate-to-route'
          ? (message as { path?: unknown }).path
          : null,
      );
      if (providerSessionRef) {
        if (this.sidebarView?.webview === webview) {
          state.sidebarSessionRef = providerSessionRef;
        }

        if (typeof this.findPanelByWebview === 'function') {
          const panel = this.findPanelByWebview(webview);
          if (
            panel &&
            (typeof panel === 'object' || typeof panel === 'function')
          ) {
            state.panelSessionRefs.set(panel as object, providerSessionRef);
          }
        }
      }

      return originalPostMessageToWebview.call(this, webview, message);
    };
  }

  return provider;
}

function captureFromChatSessionType(
  chatSessionType: string,
): BrokerProvider | null {
  if (chatSessionType === codexChatSessionType) {
    return 'codex';
  }

  return null;
}

function toOwnKeys(value: unknown): string[] {
  if (
    !value ||
    (typeof value !== 'object' && typeof value !== 'function')
  ) {
    return [];
  }

  return Object.getOwnPropertyNames(value).sort();
}

function toMethodKeys(value: unknown): string[] {
  if (
    !value ||
    (typeof value !== 'object' && typeof value !== 'function')
  ) {
    return [];
  }

  const methods = new Set<string>();
  for (const key of Object.getOwnPropertyNames(value)) {
    if (
      key !== 'constructor' &&
      typeof (value as Record<string, unknown>)[key] === 'function'
    ) {
      methods.add(key);
    }
  }

  const prototype = Object.getPrototypeOf(value);
  if (!prototype || prototype === Object.prototype) {
    return [...methods].sort();
  }

  for (const key of Object.getOwnPropertyNames(prototype)) {
    if (
      key !== 'constructor' &&
      typeof (value as Record<string, unknown>)[key] === 'function'
    ) {
      methods.add(key);
    }
  }

  return [...methods].sort();
}

function toIterableArray(value: unknown): unknown[] | null {
  if (
    !value ||
    typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] !==
      'function'
  ) {
    return null;
  }

  try {
    return Array.from(value as Iterable<unknown>);
  } catch {
    return null;
  }
}

function collectKnownChannelRefs(providerCapture: unknown): string[] {
  const refs = new Set<string>();
  const comms = toIterableArray(
    (providerCapture as {
      allComms?: Iterable<{
        channels?: {
          keys?(): Iterable<unknown>;
          forEach?(callback: (value: unknown, key: unknown) => void): void;
        };
      }>;
    } | null | undefined)?.allComms,
  );
  if (!comms) {
    return [];
  }

  for (const candidate of comms) {
    const channels = (candidate as {
      channels?: {
        keys?(): Iterable<unknown>;
        forEach?(callback: (value: unknown, key: unknown) => void): void;
      };
    }).channels;
    if (typeof channels?.keys === 'function') {
      for (const key of channels.keys()) {
        if (typeof key === 'string' && key.trim().length > 0) {
          refs.add(key.trim());
        }
      }
      continue;
    }

    if (typeof channels?.forEach === 'function') {
      channels.forEach((_value, key) => {
        if (typeof key === 'string' && key.trim().length > 0) {
          refs.add(key.trim());
        }
      });
    }
  }

  return [...refs].sort();
}

export function createProviderRuntimeCaptureRegistry(
  options: CreateProviderRuntimeCaptureRegistryOptions = {},
): MutableProviderRuntimeCaptureRegistry {
  const viewCaptures = new Map<BrokerProvider, unknown>();
  const viewCapturePaths = new Map<
    BrokerProvider,
    ProviderRuntimeCapturePath | null
  >();
  const chatSessionCaptures = new Map<BrokerProvider, unknown>();
  const chatSessionCapturePaths = new Map<
    BrokerProvider,
    ProviderRuntimeCapturePath | null
  >();
  const sharedHookState = {
    installed: false,
    targetKind: null as 'instance' | 'prototype' | null,
    failureReason: null as string | null,
  };

  const getResolvedProviderCapture = (provider: BrokerProvider): unknown | null => {
    if (provider === 'codex') {
      return (
        chatSessionCaptures.get(provider) ??
        viewCaptures.get(provider) ??
        null
      );
    }

    return (
      viewCaptures.get(provider) ??
      chatSessionCaptures.get(provider) ??
      null
    );
  };

  const getResolvedCapturePath = (
    provider: BrokerProvider,
  ): ProviderRuntimeCapturePath | null => {
    if (provider === 'codex') {
      return (
        chatSessionCapturePaths.get(provider) ??
        viewCapturePaths.get(provider) ??
        null
      );
    }

    return (
      viewCapturePaths.get(provider) ??
      chatSessionCapturePaths.get(provider) ??
      null
    );
  };

  const getDiagnosticProviderCapture = (
    provider: BrokerProvider,
  ): unknown | null => {
    if (provider === 'codex') {
      return (
        viewCaptures.get(provider) ??
        chatSessionCaptures.get(provider) ??
        null
      );
    }

    return getResolvedProviderCapture(provider);
  };

  const getDiagnosticCapturePath = (
    provider: BrokerProvider,
  ): ProviderRuntimeCapturePath | null => {
    if (provider === 'codex') {
      return (
        viewCapturePaths.get(provider) ??
        chatSessionCapturePaths.get(provider) ??
        null
      );
    }

    return getResolvedCapturePath(provider);
  };

  return {
    captureRegistration(viewType: string, provider: unknown, captureOptions = {}) {
      const matchedProvider = captureFromViewType(viewType);
      if (!matchedProvider) {
        return;
      }

      const capturedProvider =
        matchedProvider === 'codex'
          ? installCodexViewProviderTracking(provider)
          : provider;

      viewCaptures.set(matchedProvider, capturedProvider);
      viewCapturePaths.set(
        matchedProvider,
        captureOptions.capturePath ?? null,
      );
    },
    captureChatSessionRegistration(
      chatSessionType: string,
      provider: unknown,
      captureOptions = {},
    ) {
      const matchedProvider = captureFromChatSessionType(chatSessionType);
      if (!matchedProvider) {
        return;
      }

      chatSessionCaptures.set(matchedProvider, provider);
      chatSessionCapturePaths.set(
        matchedProvider,
        captureOptions.capturePath ?? null,
      );
    },
    setSharedHookDiagnostic(diagnostic) {
      sharedHookState.installed = diagnostic.installed;
      sharedHookState.targetKind = diagnostic.targetKind;
      sharedHookState.failureReason = diagnostic.failureReason ?? null;
    },
    getCapturedProvider(provider) {
      return getResolvedProviderCapture(provider);
    },
    getCapturedViewProvider(provider) {
      return viewCaptures.get(provider) ?? null;
    },
    getCapturedChatSessionProvider(provider) {
      return chatSessionCaptures.get(provider) ?? null;
    },
    getCaptureDiagnostic(provider) {
      const providerCapture = getDiagnosticProviderCapture(provider);
      const comms = toIterableArray(
        (providerCapture as { allComms?: Iterable<unknown> } | null | undefined)
          ?.allComms,
      );

      return {
        captured: providerCapture !== null,
        patchedHostCount: options.getPatchedHostCount?.() ?? 0,
        sharedHookInstalled: sharedHookState.installed,
        sharedHookTargetKind: sharedHookState.targetKind,
        sharedHookFailureReason: sharedHookState.failureReason,
        capturePath: getDiagnosticCapturePath(provider),
        providerKeys: toOwnKeys(providerCapture),
        providerMethods: toMethodKeys(providerCapture),
        commCount: providerCapture !== null ? comms?.length ?? 0 : null,
        knownChannelRefs: collectKnownChannelRefs(providerCapture),
      };
    },
  };
}

export function installProviderRuntimeCapture(
  vscode: CaptureVscodeHost,
  options: InstallProviderRuntimeCaptureOptions = {},
): ProviderRuntimeCaptureHandle {
  const patchedWindows = new Map<
    CaptureWindowHost,
    {
      registerWebviewViewProvider?: CaptureWindowHost['registerWebviewViewProvider'];
      registerCustomEditorProvider?: CaptureWindowHost['registerCustomEditorProvider'];
    }
  >();
  const patchedChats = new Map<
    CaptureChatHost,
    {
      registerChatSessionItemProvider?: CaptureChatHost['registerChatSessionItemProvider'];
    }
  >();
  const patchedHosts = new Set<object>();
  const registry = createProviderRuntimeCaptureRegistry({
    getPatchedHostCount: () => patchedHosts.size,
  });
  const hosts = new Set<CaptureVscodeHost>([vscode, ...(options.additionalHosts ?? [])]);
  try {
    hosts.add(captureRequire('vscode') as CaptureVscodeHost);
  } catch {
    // Ignore non-extension test environments where the VS Code module is unavailable.
  }

  for (const host of hosts) {
    const windowHost = host.window;
    if (!windowHost || patchedWindows.has(windowHost)) {
      // Continue patching chat hosts even when the window host was already seen.
    } else {
      patchedHosts.add(windowHost);

      const originalRegisterWebviewViewProvider =
        windowHost.registerWebviewViewProvider;
      const originalRegisterCustomEditorProvider =
        windowHost.registerCustomEditorProvider;
      patchedWindows.set(windowHost, {
        registerWebviewViewProvider: originalRegisterWebviewViewProvider,
        registerCustomEditorProvider: originalRegisterCustomEditorProvider,
      });

      if (originalRegisterWebviewViewProvider) {
        windowHost.registerWebviewViewProvider = (
          viewType: string,
          provider: unknown,
          registerOptions?: unknown,
        ) => {
          registry.captureRegistration(viewType, provider, {
            capturePath: 'window_host',
          });
          return originalRegisterWebviewViewProvider.call(
            windowHost,
            viewType,
            provider,
            registerOptions,
          );
        };
      }

      if (originalRegisterCustomEditorProvider) {
        windowHost.registerCustomEditorProvider = (
          viewType: string,
          provider: unknown,
          registerOptions?: unknown,
        ) => {
          registry.captureRegistration(viewType, provider, {
            capturePath: 'window_host',
          });
          return originalRegisterCustomEditorProvider.call(
            windowHost,
            viewType,
            provider,
            registerOptions,
          );
        };
      }
    }

    const chatHost = host.chat;
    if (!chatHost || patchedChats.has(chatHost)) {
      continue;
    }

    patchedHosts.add(chatHost);
    const originalRegisterChatSessionItemProvider =
      chatHost.registerChatSessionItemProvider;
    patchedChats.set(chatHost, {
      registerChatSessionItemProvider:
        originalRegisterChatSessionItemProvider,
    });

    if (originalRegisterChatSessionItemProvider) {
      chatHost.registerChatSessionItemProvider = (
        chatSessionType: string,
        provider: unknown,
      ) => {
        registry.captureChatSessionRegistration(
          chatSessionType,
          provider,
          {
            capturePath: 'window_host',
          },
        );
        return originalRegisterChatSessionItemProvider.call(
          chatHost,
          chatSessionType,
          provider,
        );
      };
    }
  }

  return {
    registry,
    dispose() {
      for (const [windowHost, originals] of patchedWindows) {
        if (originals.registerWebviewViewProvider) {
          windowHost.registerWebviewViewProvider =
            originals.registerWebviewViewProvider;
        }
        if (originals.registerCustomEditorProvider) {
          windowHost.registerCustomEditorProvider =
            originals.registerCustomEditorProvider;
        }
      }

      for (const [chatHost, originals] of patchedChats) {
        if (originals.registerChatSessionItemProvider) {
          chatHost.registerChatSessionItemProvider =
            originals.registerChatSessionItemProvider;
        }
      }
    },
  };
}
