import { BrokerManifestStore } from './broker/BrokerManifestStore';
import { BrokerServer, type BrokerAdapterHost } from './broker/BrokerServer';
import { SharedSessionStore } from './broker/SharedSessionStore';
import { ProviderHostRegistry } from './runtime/ProviderHostRegistry';
import { AdapterFacade } from './runtime/AdapterFacade';
import {
  CompanionRuntime,
  type CompanionRuntimeLike,
} from './runtime/CompanionRuntime';
import { bridgeCommandIds, registerBridgeCommands } from './ui/BridgeCommands';
import { BridgeSessionTreeDataProvider } from './ui/BridgeSessionTreeDataProvider';
import { createBridgeStatusBar } from './ui/BridgeStatusBar';

export type BridgeExtensionContext = {
  globalStorageUri: {
    fsPath: string;
  };
  subscriptions: Array<{
    dispose(): unknown;
  }>;
};

type ActivateOptions = {
  adapterHost?: BrokerAdapterHost;
  runtime?: CompanionRuntimeLike;
  token?: string;
  vscode?: {
    commands?: {
      getCommands?(filterInternal?: boolean): Promise<string[]>;
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
      createStatusBarItem?(): {
        text: string;
        tooltip?: string;
        command?: string;
        show(): unknown;
        dispose(): unknown;
      };
    };
    extensions?: unknown[] | { all?: unknown[] };
  };
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
      createStatusBarItem(): {
        text: string;
        tooltip?: string;
        command?: string;
        show(): unknown;
        dispose(): unknown;
      };
    };
    extensions: {
      all: unknown[];
    };
  }>;

  return loader();
}

export async function activate(
  context?: BridgeExtensionContext,
  options: ActivateOptions = {},
) {
  if (!context) {
    return { started: false };
  }

  const vscode = options.vscode ?? (await loadVscodeHost());
  const registryCommands = vscode.commands?.getCommands
    ? {
        getCommands: (filterInternal?: boolean) =>
          vscode.commands!.getCommands!(filterInternal),
      }
    : undefined;
  const runtime =
    options.runtime ??
    (await CompanionRuntime.create({
      registry: new ProviderHostRegistry({
        extensions: (
          Array.isArray(vscode.extensions)
            ? vscode.extensions
            : (vscode.extensions?.all ?? [])
        ) as never,
        commands: registryCommands as never,
      }),
    }));
  const store = new SharedSessionStore();
  const adapterHost = options.adapterHost ?? new AdapterFacade({
    runtime,
    store,
  });
  const manifestStore = new BrokerManifestStore(context.globalStorageUri.fsPath);
  let server: BrokerServer | null = null;

  const startBroker = async () => {
    if (server) {
      return;
    }

    server = await BrokerServer.start({
      adapterHost,
      manifestStore,
      store,
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

  const treeDataProvider = new BridgeSessionTreeDataProvider(runtime);
  const commandDisposables =
    vscode.commands && vscode.window
      ? registerBridgeCommands({
          runtime,
          vscode: {
            commands: vscode.commands,
          },
          startBroker,
          stopBroker,
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
