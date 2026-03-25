import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import type { BrokerProvider } from 'happy-wire';

import type { ProviderRuntimeCaptureDiagnostic } from './types';

type Disposable = {
  dispose(): unknown;
};

type CaptureWindowHost = {
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

type CaptureVscodeHost = {
  window?: CaptureWindowHost;
};

export type ProviderRuntimeCaptureRegistry = {
  getCapturedProvider(provider: BrokerProvider): unknown | null;
  getCaptureDiagnostic(provider: BrokerProvider): ProviderRuntimeCaptureDiagnostic | null;
};

export type ProviderRuntimeCaptureHandle = Disposable & {
  registry: ProviderRuntimeCaptureRegistry;
};

type InstallProviderRuntimeCaptureOptions = {
  additionalHosts?: CaptureVscodeHost[];
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
const captureRequire = createRequire(
  typeof __filename === 'string'
    ? __filename
    : resolve(process.cwd(), '__happy_provider_runtime_capture__.cjs'),
);

function captureFromViewType(
  captures: Map<BrokerProvider, unknown>,
  viewType: string,
  provider: unknown,
): void {
  if (claudeViewTypes.has(viewType)) {
    captures.set('claude', provider);
    return;
  }

  if (
    codexWebviewViewTypes.has(viewType) ||
    viewType === codexCustomEditorViewType
  ) {
    captures.set('codex', provider);
  }
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

export function installProviderRuntimeCapture(
  vscode: CaptureVscodeHost,
  options: InstallProviderRuntimeCaptureOptions = {},
): ProviderRuntimeCaptureHandle {
  const captures = new Map<BrokerProvider, unknown>();
  const patchedWindows = new Map<
    CaptureWindowHost,
    {
      registerWebviewViewProvider?: CaptureWindowHost['registerWebviewViewProvider'];
      registerCustomEditorProvider?: CaptureWindowHost['registerCustomEditorProvider'];
    }
  >();
  const registry: ProviderRuntimeCaptureRegistry = {
    getCapturedProvider(provider) {
      return captures.get(provider) ?? null;
    },
    getCaptureDiagnostic(provider) {
      const providerCapture = captures.get(provider) ?? null;
      const comms = toIterableArray(
        (providerCapture as { allComms?: Iterable<unknown> } | null | undefined)
          ?.allComms,
      );

      return {
        captured: providerCapture !== null,
        patchedHostCount: patchedWindows.size,
        providerKeys: toOwnKeys(providerCapture),
        providerMethods: toMethodKeys(providerCapture),
        commCount: providerCapture !== null ? comms?.length ?? 0 : null,
        knownChannelRefs: collectKnownChannelRefs(providerCapture),
      };
    },
  };
  const hosts = new Set<CaptureVscodeHost>([vscode, ...(options.additionalHosts ?? [])]);
  try {
    hosts.add(captureRequire('vscode') as CaptureVscodeHost);
  } catch {
    // Ignore non-extension test environments where the VS Code module is unavailable.
  }

  for (const host of hosts) {
    const windowHost = host.window;
    if (!windowHost || patchedWindows.has(windowHost)) {
      continue;
    }

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
        captureFromViewType(captures, viewType, provider);
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
        captureFromViewType(captures, viewType, provider);
        return originalRegisterCustomEditorProvider.call(
          windowHost,
          viewType,
          provider,
          registerOptions,
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
    },
  };
}
