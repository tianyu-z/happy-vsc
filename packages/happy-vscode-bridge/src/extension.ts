import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { networkInterfaces as defaultNetworkInterfaces } from 'node:os';

import type { BrokerProvider } from 'happy-wire';

import {
  FileBridgeInstallationIdStore,
  buildBridgeInstanceIdentity,
  getBridgeInstallationIdPath,
  resolveBridgeHappyHomeDir,
} from './broker/BridgeInstanceIdentity';
import { HeartbeatService } from './broker/HeartbeatService';
import { BrokerManifestStore } from './broker/BrokerManifestStore';
import { BrokerServer, type BrokerAdapterHost } from './broker/BrokerServer';
import { SharedSessionStore } from './broker/SharedSessionStore';
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
import { detectHostIpInfo } from './runtime/ipAddress';
import { deriveRuntimeInfo } from './runtime/runtimeLabel';
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
  happyHomeDir?: string;
  now?: () => number;
  networkInterfaces?: typeof defaultNetworkInterfaces;
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
      workspaceFile?:
        | {
            toString(): string;
            fsPath?: string;
          }
        | null;
      workspaceFolders?: Array<{
        uri: {
          toString(): string;
          fsPath?: string;
        };
      }> | null;
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
    env?: {
      sessionId?: string;
      remoteName?: string;
      remoteAuthority?: string;
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
let activeHeartbeat: HeartbeatService | null = null;

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
      workspaceFile?: {
        toString(): string;
        fsPath?: string;
      } | null;
      workspaceFolders?: Array<{
        uri: {
          toString(): string;
          fsPath?: string;
        };
      }> | null;
    };
    env: {
      sessionId?: string;
      remoteName?: string;
      remoteAuthority?: string;
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

function toManifestWorkspaceFolders(vscode: ActivateOptions['vscode']): string[] {
  return (
    vscode?.workspace?.workspaceFolders
      ?.map((folder) => folder.uri.fsPath ?? folder.uri.toString())
      .filter((value): value is string => value.length > 0) ?? []
  );
}

function toLabelSegment(value: string): string {
  const normalized = value.replace(/[\\/]+$/, '');
  const parts = normalized.split(/[\\/]/).filter(Boolean);
  return parts.at(-1) ?? value;
}

function buildWindowLabel(vscode: ActivateOptions['vscode']): string {
  const workspaceFolders = toManifestWorkspaceFolders(vscode);
  if (workspaceFolders.length > 0) {
    return workspaceFolders.map((value) => toLabelSegment(value)).join(', ');
  }

  const workspaceFile =
    vscode?.workspace?.workspaceFile?.fsPath ??
    vscode?.workspace?.workspaceFile?.toString();
  if (workspaceFile) {
    return toLabelSegment(workspaceFile);
  }

  return 'VS Code';
}

function extractProviderKinds(runtime: CompanionRuntimeLike): BrokerProvider[] {
  return Array.from(
    new Set(
      runtime
        .listProviderDiagnostics()
        .map((diagnostic) => diagnostic.provider)
        .filter(
          (provider): provider is BrokerProvider =>
            provider === 'claude' || provider === 'codex',
        ),
    ),
  ).sort();
}

function toBrokerEndpoint(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname}`;
}

async function readMachineIdFromSettings(
  happyHomeDir: string,
): Promise<string | undefined> {
  try {
    const raw = await readFile(join(happyHomeDir, 'settings.json'), 'utf8');
    const parsed = JSON.parse(raw) as { machineId?: unknown };
    return typeof parsed.machineId === 'string' && parsed.machineId.length > 0
      ? parsed.machineId
      : undefined;
  } catch {
    return undefined;
  }
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
  const happyHomeDir = resolveBridgeHappyHomeDir(options.happyHomeDir);
  const installationIdStore = new FileBridgeInstallationIdStore(
    getBridgeInstallationIdPath(happyHomeDir),
  );
  const initialProviderKinds = extractProviderKinds(runtime);
  const identity = await buildBridgeInstanceIdentity({
    remoteName: vscode.env?.remoteName,
    workspaceFolders: toManifestWorkspaceFolders(vscode),
    extensionKind: 'workspace',
    editorSessionId: vscode.env?.sessionId,
    providerHostFingerprint: initialProviderKinds.join(','),
    installationIdStore,
  });
  const manifestStore = BrokerManifestStore.forInstance(identity.instanceId, {
    happyHomeDir,
  });
  const machineId = await readMachineIdFromSettings(happyHomeDir);
  const runtimeInfo = deriveRuntimeInfo({
    remoteName: vscode.env?.remoteName,
    remoteAuthority: vscode.env?.remoteAuthority,
  });
  const hostIpInfo = detectHostIpInfo(
    options.networkInterfaces ?? defaultNetworkInterfaces,
  );
  const brokerStartedAt = (options.now ?? Date.now)();
  let server: BrokerServer | null = null;
  let heartbeat: HeartbeatService | null = null;

  const startBroker = async () => {
    if (server) {
      return;
    }

    server = await BrokerServer.start({
      adapterHost,
      store,
      token: options.token,
    });
    const startedServer = server;
    activeServer = startedServer;

    heartbeat = new HeartbeatService({
      intervalMs: 2_000,
      now: options.now,
      manifestStore,
      buildManifest: (lastHeartbeatAt) => ({
        installationId: identity.installationId,
        instanceId: identity.instanceId,
        logicalWindowKey: identity.logicalWindowKey,
        ...(identity.editorSessionId
          ? { editorSessionId: identity.editorSessionId }
          : {}),
        ...(machineId ? { machineId } : {}),
        windowLabel: buildWindowLabel(vscode),
        workspaceFolders: toManifestWorkspaceFolders(vscode),
        runtimeKind: runtimeInfo.runtimeKind,
        runtimeLabel: runtimeInfo.runtimeLabel,
        bridgeHostIps: hostIpInfo.bridgeHostIps,
        ...(hostIpInfo.preferredHostIp
          ? { preferredHostIp: hostIpInfo.preferredHostIp }
          : {}),
        ...(hostIpInfo.runtimeIp ? { runtimeIp: hostIpInfo.runtimeIp } : {}),
        providerKinds: extractProviderKinds(runtime),
        brokerEndpoint: toBrokerEndpoint(startedServer.url),
        brokerAuthToken: startedServer.token,
        pid: process.pid,
        startedAt: brokerStartedAt,
        lastHeartbeatAt,
        ttlMs: 10_000,
      }),
    });
    activeHeartbeat = heartbeat;
    await heartbeat.start();
  };

  const stopBroker = async () => {
    if (heartbeat) {
      const active = heartbeat;
      heartbeat = null;
      if (activeHeartbeat === active) {
        activeHeartbeat = null;
      }
      await active.stop();
    }

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
  const heartbeat = activeHeartbeat;
  activeHeartbeat = null;
  const server = activeServer;
  activeServer = null;
  const runtime = activeRuntime;
  activeRuntime = null;
  const facade = activeFacade;
  activeFacade = null;

  if (heartbeat) {
    await heartbeat.stop();
  }

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
