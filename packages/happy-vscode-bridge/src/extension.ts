import { BrokerManifestStore } from './broker/BrokerManifestStore';
import { BrokerServer, type BrokerAdapterHost } from './broker/BrokerServer';
import { SharedSessionStore } from './broker/SharedSessionStore';

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
  token?: string;
};

const emptyAdapterHost: BrokerAdapterHost = {
  discover: async () => [],
  attach: async () => null,
};

let activeServer: BrokerServer | null = null;

export async function activate(
  context?: BridgeExtensionContext,
  options: ActivateOptions = {},
) {
  if (!context) {
    return { started: false };
  }

  const server = await BrokerServer.start({
    adapterHost: options.adapterHost ?? emptyAdapterHost,
    manifestStore: new BrokerManifestStore(context.globalStorageUri.fsPath),
    store: new SharedSessionStore(),
    token: options.token,
  });

  activeServer = server;
  context.subscriptions.push({
    dispose: () => {
      void server.stop();
    },
  });

  return { started: true, port: server.port };
}

export async function deactivate() {
  const server = activeServer;
  activeServer = null;

  if (!server) {
    return;
  }

  await server.stop();
}
