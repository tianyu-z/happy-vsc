import type { CompanionRuntimeLike } from '../runtime/CompanionRuntime';
import type { DesiredMode } from '../runtime/types';

type Disposable = {
  dispose(): unknown;
};

type BridgeCommandHost = {
  commands: {
    registerCommand(
      id: string,
      callback: (...args: unknown[]) => unknown,
    ): Disposable;
  };
};

type RegisterBridgeCommandsOptions = {
  runtime: CompanionRuntimeLike;
  vscode: BridgeCommandHost;
  startBroker: () => Promise<void>;
  stopBroker: () => Promise<void>;
};

export const bridgeCommandIds = [
  'happyVscodeBridge.startBroker',
  'happyVscodeBridge.stopBroker',
  'happyVscodeBridge.refreshSessions',
  'happyVscodeBridge.switchSessionMode',
] as const;

function toggleDesiredMode(current: DesiredMode): DesiredMode {
  return current === 'runtime_preferred'
    ? 'storage_preferred'
    : 'runtime_preferred';
}

export function registerBridgeCommands(
  options: RegisterBridgeCommandsOptions,
): Disposable[] {
  const { runtime, vscode } = options;

  return [
    vscode.commands.registerCommand(bridgeCommandIds[0], async () => {
      await options.startBroker();
    }),
    vscode.commands.registerCommand(bridgeCommandIds[1], async () => {
      await options.stopBroker();
    }),
    vscode.commands.registerCommand(bridgeCommandIds[2], async () => {
      await runtime.refresh();
    }),
    vscode.commands.registerCommand(
      bridgeCommandIds[3],
      async (input?: unknown) => {
        const commandInput = (input ?? {}) as {
          brokerSessionId?: string;
          desiredMode?: DesiredMode;
        };
        const brokerSessionId = commandInput.brokerSessionId;
        if (!brokerSessionId) {
          return null;
        }

        const session = runtime
          .listDiscoveredSessions()
          .find((candidate) => candidate.brokerSessionId === brokerSessionId);
        if (!session) {
          return null;
        }

        return runtime.setSessionDesiredMode(
          brokerSessionId,
          commandInput.desiredMode ?? toggleDesiredMode(session.desiredMode),
        );
      },
    ),
  ];
}
