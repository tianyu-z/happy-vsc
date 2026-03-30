import { BrokerManifestStore } from './broker/BrokerManifestStore';
import { BrokerServer, type BrokerAdapterHost } from './broker/BrokerServer';
import { SharedSessionStore } from './broker/SharedSessionStore';
import { basename } from 'node:path';
import { ProviderHostRegistry } from './runtime/ProviderHostRegistry';
import {
  installProviderRuntimeCapture,
  type MutableProviderRuntimeCaptureRegistry,
} from './runtime/ProviderRuntimeCapture';
import {
  discoverSharedRegistrarCandidatesFromVscodeApi,
  installExtHostSharedRegistrationCapture,
} from './runtime/ExtHostSharedRegistrationCapture';
import { AdapterFacade } from './runtime/AdapterFacade';
import {
  CompanionRuntime,
  type CompanionRuntimeLike,
} from './runtime/CompanionRuntime';
import {
  createDefaultProbeFactories,
  resolveExthostLogDir,
} from './runtime/createDefaultProbeFactories';
import type { WorkspaceLocator } from './runtime/types';
import {
  bridgeCommandIds,
  formatProviderDiagnosticsReport,
  registerBridgeCommands,
} from './ui/BridgeCommands';
import { BridgeSessionTreeDataProvider } from './ui/BridgeSessionTreeDataProvider';
import { createBridgeStatusBar } from './ui/BridgeStatusBar';

export type BridgeExtensionContext = {
  globalStorageUri: {
    fsPath: string;
  };
  logUri?: {
    fsPath: string;
  };
  subscriptions: Array<{
    dispose(): unknown;
  }>;
};

type BridgeTabSnapshot = {
  label?: string;
  input?: {
    uri?: {
      scheme?: string;
      authority?: string;
      path?: string;
      fsPath?: string;
    };
  };
};

type ActivateOptions = {
  adapterHost?: BrokerAdapterHost;
  runtime?: CompanionRuntimeLike;
  createRuntime?: (
    options?: Parameters<typeof CompanionRuntime.create>[0],
  ) => Promise<CompanionRuntimeLike>;
  installSharedCapture?: (params: {
    vscode: NonNullable<ActivateOptions['vscode']>;
    registry: MutableProviderRuntimeCaptureRegistry;
    candidates?: unknown[];
  }) =>
    | {
        diagnostics?: unknown;
        dispose(): unknown;
      }
    | Promise<{
        diagnostics?: unknown;
        dispose(): unknown;
      }>;
  eagerlyActivateProviders?: (
    vscode: NonNullable<ActivateOptions['vscode']>,
  ) => Promise<void>;
  sharedCaptureCandidates?: unknown[];
  token?: string;
  vscode?: {
    commands?: {
      getCommands?(filterInternal?: boolean): Promise<string[]>;
      executeCommand?<T = unknown>(
        id: string,
        ...args: unknown[]
      ): Promise<T>;
      registerCommand(
        id: string,
        callback: (...args: unknown[]) => unknown,
      ): { dispose(): unknown };
    };
    window?: {
      state?: {
        focused?: boolean;
      };
      onDidChangeWindowState?(
        listener: (state: { focused: boolean }) => unknown,
      ): { dispose(): unknown };
      createTreeView?(
        id: string,
        options: { treeDataProvider: unknown },
      ): { dispose(): unknown };
      registerWebviewViewProvider?(
        viewType: string,
        provider: unknown,
        options?: unknown,
      ): { dispose(): unknown };
      registerCustomEditorProvider?(
        viewType: string,
        provider: unknown,
        options?: unknown,
      ): { dispose(): unknown };
      showTextDocument?(document: unknown): Promise<unknown> | unknown;
      createStatusBarItem?(): {
        text: string;
        tooltip?: string;
        command?: string;
        show(): unknown;
        dispose(): unknown;
      };
      tabGroups?: {
        all?: Array<{
          tabs?: unknown[];
        }>;
      };
    };
    workspace?: {
      openTextDocument?(options: {
        content: string;
        language?: string;
      }): Promise<unknown>;
      workspaceFile?: { toString(): string; fsPath?: string } | null;
      workspaceFolders?: Array<{
        uri: { toString(): string; fsPath?: string };
      }> | null;
    };
    env?: {
      sessionId?: string;
    };
    Uri?: {
      parse(value: string): unknown;
    };
    chat?: {
      registerChatSessionItemProvider?(
        chatSessionType: string,
        provider: unknown,
      ): { dispose(): unknown };
    };
    extensions?:
      | unknown[]
      | {
          all?: unknown[];
          getExtension?(id: string): unknown;
        };
  };
};

type ActivatableExtension = {
  id?: string;
  isActive?: boolean;
  activate?: () => Promise<unknown>;
};

const emptyAdapterHost: BrokerAdapterHost = {
  discover: async () => [],
  attach: async () => null,
};

let activeServer: BrokerServer | null = null;
let activeRuntime: CompanionRuntimeLike | null = null;
let activeFacade: AdapterFacade | null = null;

async function loadVscodeHost() {
  const loader = new Function('return import("vscode")') as () => Promise<{
    commands: {
      getCommands(filterInternal?: boolean): Promise<string[]>;
      executeCommand<T = unknown>(id: string, ...args: unknown[]): Promise<T>;
      registerCommand(
        id: string,
        callback: (...args: unknown[]) => unknown,
      ): { dispose(): unknown };
    };
    window: {
      state?: {
        focused?: boolean;
      };
      onDidChangeWindowState?(
        listener: (state: { focused: boolean }) => unknown,
      ): { dispose(): unknown };
      createTreeView(
        id: string,
        options: { treeDataProvider: unknown },
      ): { dispose(): unknown };
      registerWebviewViewProvider(
        viewType: string,
        provider: unknown,
        options?: unknown,
      ): { dispose(): unknown };
      registerCustomEditorProvider(
        viewType: string,
        provider: unknown,
        options?: unknown,
      ): { dispose(): unknown };
      showTextDocument(document: unknown): Promise<unknown> | unknown;
      createStatusBarItem(): {
        text: string;
        tooltip?: string;
        command?: string;
        show(): unknown;
        dispose(): unknown;
      };
      tabGroups: {
        all: Array<{
          tabs?: unknown[];
        }>;
      };
    };
    workspace: {
      openTextDocument(options: {
        content: string;
        language?: string;
      }): Promise<unknown>;
    };
    Uri: {
      parse(value: string): unknown;
    };
    chat: {
      registerChatSessionItemProvider(
        chatSessionType: string,
        provider: unknown,
      ): { dispose(): unknown };
    };
    extensions: {
      all: unknown[];
      getExtension(id: string): unknown;
    };
  }>;

  return loader();
}

function toWorkspaceLocator(vscode: ActivateOptions['vscode']): WorkspaceLocator {
  const folderUris = vscode?.workspace?.workspaceFolders
    ?.map((folder) => folder.uri.toString())
    .filter((value): value is string => value.length > 0);
  const workspaceFileUri = vscode?.workspace?.workspaceFile?.toString() ?? null;

  return {
    workspaceFileUri,
    ...(folderUris?.length ? { folderUris } : {}),
  };
}

function buildDiagnosticsReport(params: {
  runtime: CompanionRuntimeLike;
  bridgeLogPath?: string;
  exthostLogDir?: string | null;
}): string {
  return formatProviderDiagnosticsReport({
    bridgeLogPath: params.bridgeLogPath,
    exthostLogDir: params.exthostLogDir,
    diagnostics: params.runtime.listProviderDiagnostics(),
  });
}

function listOpenTabs(vscode: ActivateOptions['vscode']): BridgeTabSnapshot[] {
  const tabs: BridgeTabSnapshot[] = [];

  for (const group of vscode?.window?.tabGroups?.all ?? []) {
    if (!Array.isArray(group.tabs)) {
      continue;
    }
    tabs.push(...(group.tabs as BridgeTabSnapshot[]));
  }

  return tabs;
}

type BrokerWindowManifestMetadata = {
  windowInstanceId?: string;
  windowLabel: string;
  workspaceLabel: string;
  workspacePath: string | null;
  isActiveWindow: boolean;
  windowLastActiveAt: string | null;
};

function labelFromPath(value: string): string {
  const normalized = value.replace(/\\/g, '/').replace(/\/+$/, '');
  const result = basename(normalized);
  return result || normalized || 'No Workspace';
}

function resolveBrokerWindowManifestMetadata(params: {
  vscode: ActivateOptions['vscode'];
}): BrokerWindowManifestMetadata {
  const workspaceFile = params.vscode?.workspace?.workspaceFile;
  const firstWorkspaceFolder = params.vscode?.workspace?.workspaceFolders?.[0];
  const workspacePath =
    workspaceFile?.fsPath ?? firstWorkspaceFolder?.uri.fsPath ?? null;
  const workspaceLabel = workspacePath
    ? labelFromPath(workspacePath)
    : 'No Workspace';
  const sessionId = params.vscode?.env?.sessionId?.trim();
  const focusedState = params.vscode?.window?.state?.focused;
  const isActiveWindow = typeof focusedState === 'boolean' ? focusedState : false;

  return {
    windowInstanceId: sessionId?.length ? sessionId : undefined,
    windowLabel:
      workspaceLabel === 'No Workspace'
        ? 'VS Code Window'
        : `VS Code Window · ${workspaceLabel}`,
    workspaceLabel,
    workspacePath,
    isActiveWindow,
    windowLastActiveAt: isActiveWindow ? new Date().toISOString() : null,
  };
}

function createSharedCaptureDiscoveryHost(
  vscode: NonNullable<ActivateOptions['vscode']>,
): NonNullable<ActivateOptions['vscode']> {
  return {
    window: {
      registerWebviewViewProvider:
        vscode.window?.registerWebviewViewProvider,
      registerCustomEditorProvider:
        vscode.window?.registerCustomEditorProvider,
    },
    chat: {
      registerChatSessionItemProvider:
        vscode.chat?.registerChatSessionItemProvider,
    },
  };
}

const eagerlyActivatedProviderExtensionIds = [
  'anthropic.claude-code',
  'openai.chatgpt',
] as const;

function listInstalledExtensions(
  vscode: ActivateOptions['vscode'],
): ActivatableExtension[] {
  if (Array.isArray(vscode?.extensions)) {
    return vscode.extensions as ActivatableExtension[];
  }

  const all = vscode?.extensions?.all;
  if (Array.isArray(all)) {
    return all as ActivatableExtension[];
  }

  return [];
}

async function eagerlyActivateSupportedProviders(
  vscode: ActivateOptions['vscode'],
): Promise<void> {
  const extensions = listInstalledExtensions(vscode);
  if (extensions.length === 0) {
    return;
  }

  const activations = eagerlyActivatedProviderExtensionIds.flatMap(
    (extensionId) => {
      const extension = extensions.find(
        (candidate) => candidate.id?.trim().toLowerCase() === extensionId,
      );
      if (!extension?.activate || extension.isActive) {
        return [];
      }

      return [extension.activate()];
    },
  );

  if (activations.length === 0) {
    return;
  }

  await Promise.allSettled(activations);
}

export async function activate(
  context?: BridgeExtensionContext,
  options: ActivateOptions = {},
) {
  if (!context) {
    return { started: false };
  }

  const vscode = options.vscode ?? (await loadVscodeHost());
  const sharedCaptureDiscoveryHost = createSharedCaptureDiscoveryHost(vscode);
  const registryCommands = vscode.commands?.getCommands
    ? {
        getCommands: (filterInternal?: boolean) =>
          vscode.commands!.getCommands!(filterInternal),
      }
    : undefined;
  const createRuntime = options.createRuntime ?? CompanionRuntime.create;
  const installSharedCapture =
    options.installSharedCapture ??
    (async (params: {
      vscode: NonNullable<ActivateOptions['vscode']>;
      registry: MutableProviderRuntimeCaptureRegistry;
      candidates?: unknown[];
    }) => {
      const discovery =
        params.candidates?.length
          ? {
              candidates: params.candidates,
              failureReason: null,
            }
          : await discoverSharedRegistrarCandidatesFromVscodeApi(
              params.vscode,
            );

      return installExtHostSharedRegistrationCapture({
        vscodeHost: params.vscode,
        registry: params.registry,
        candidates: discovery.candidates,
        failureReason: discovery.failureReason,
      });
    });
  const activateProviders =
    options.eagerlyActivateProviders ?? eagerlyActivateSupportedProviders;
  const exthostLogDir = resolveExthostLogDir(context.logUri?.fsPath);
  const providerRuntimeCapture = installProviderRuntimeCapture(vscode);
  const sharedCapture = await installSharedCapture({
    vscode: sharedCaptureDiscoveryHost,
    registry: providerRuntimeCapture.registry as MutableProviderRuntimeCaptureRegistry,
    candidates: options.sharedCaptureCandidates,
  });
  await activateProviders(vscode);
  const runtime =
    options.runtime ??
    (await createRuntime({
      registry: new ProviderHostRegistry({
        extensions: (
          Array.isArray(vscode.extensions)
            ? vscode.extensions
            : (vscode.extensions?.all ?? [])
        ) as never,
        commands: registryCommands as never,
      }),
      probeFactories: createDefaultProbeFactories({
        extensionLogPath: context.logUri?.fsPath,
        workspace: toWorkspaceLocator(vscode),
        commandExecutor: vscode.commands?.executeCommand
          ? (commandId, ...args) =>
              vscode.commands!.executeCommand!(commandId, ...args)
          : undefined,
        createUri: vscode.Uri?.parse
          ? (value) => vscode.Uri!.parse(value)
          : undefined,
        listTabs: () => listOpenTabs(vscode),
        providerCaptures: providerRuntimeCapture.registry,
      }),
    }));
  const store = new SharedSessionStore();
  const adapterHost = options.adapterHost ?? new AdapterFacade({
    runtime,
    store,
  });
  const manifestStore = new BrokerManifestStore(context.globalStorageUri.fsPath);
  const manifestWindowMetadata = resolveBrokerWindowManifestMetadata({
    vscode,
  });
  const setManifestWindowActiveState = (isActiveWindow: boolean) => {
    manifestWindowMetadata.isActiveWindow = isActiveWindow;
    if (isActiveWindow) {
      manifestWindowMetadata.windowLastActiveAt = new Date().toISOString();
    }
  };
  let server: BrokerServer | null = null;

  const startBroker = async () => {
    if (server) {
      return;
    }

    server = await BrokerServer.start({
      adapterHost,
      manifestStore,
      store,
      manifestWindowMetadata,
      token: options.token,
    });
    activeServer = server;
  };

  const stopBroker = async () => {
    if (!server) {
      return;
    }

    const brokerServer = server;
    server = null;
    if (activeServer === brokerServer) {
      activeServer = null;
    }
    await brokerServer.stop();
  };

  await startBroker();
  activeRuntime = runtime;
  activeFacade = adapterHost instanceof AdapterFacade ? adapterHost : null;
  if (vscode.window?.onDidChangeWindowState) {
    const windowStateSubscription = vscode.window.onDidChangeWindowState(
      (windowState) => {
        setManifestWindowActiveState(windowState.focused);
        if (!server) {
          return;
        }

        void manifestStore.write({
          port: server.port,
          token: server.token,
          ...manifestWindowMetadata,
        });
      },
    );
    context.subscriptions.push(windowStateSubscription);
  }

  const treeDataProvider = new BridgeSessionTreeDataProvider(runtime);
  const commandDisposables =
    vscode.commands && vscode.window
      ? registerBridgeCommands({
          runtime,
          vscode: {
            commands: vscode.commands,
            workspace: {
              openTextDocument: vscode.workspace?.openTextDocument,
            },
            window: {
              showTextDocument: vscode.window.showTextDocument,
            },
          },
          startBroker,
          stopBroker,
          getDiagnosticsReport: async () =>
            buildDiagnosticsReport({
              runtime,
              bridgeLogPath: context.logUri?.fsPath,
              exthostLogDir,
            }),
        })
      : [];
  const treeView = vscode.window?.createTreeView
    ? vscode.window.createTreeView('happyVscodeBridge.sessions', {
        treeDataProvider,
      })
    : { dispose: () => treeDataProvider.dispose() };
  const statusBar = vscode.window?.createStatusBarItem
    ? createBridgeStatusBar({
        runtime,
        vscode: {
          window: {
            createStatusBarItem: () => vscode.window!.createStatusBarItem!(),
          },
        },
      })
    : { dispose: () => {} };

  context.subscriptions.push(treeDataProvider);
  context.subscriptions.push(treeView);
  context.subscriptions.push(statusBar);
  context.subscriptions.push(sharedCapture);
  context.subscriptions.push(providerRuntimeCapture);
  context.subscriptions.push(...commandDisposables);
  context.subscriptions.push({
    dispose: () => {
      void stopBroker();
    },
  });
  context.subscriptions.push({
    dispose: () => {
      void runtime.dispose();
    },
  });

  return {
    started: true,
    port: activeServer ? activeServer.port : 0,
    manifestPath: manifestStore.getPath(),
    commands: [...bridgeCommandIds],
  };
}

export async function deactivate() {
  const server = activeServer;
  activeServer = null;
  const runtime = activeRuntime;
  activeRuntime = null;
  const facade = activeFacade;
  activeFacade = null;

  if (facade) {
    await facade.dispose();
  }

  if (runtime && !facade) {
    await runtime.dispose();
  }

  if (server) {
    await server.stop();
  }
}
