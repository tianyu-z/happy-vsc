import type { CompanionRuntimeLike } from '../runtime/CompanionRuntime';
import type { BridgeProviderDiagnostic, DesiredMode } from '../runtime/types';

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
  workspace?: {
    openTextDocument?: (options: {
      content: string;
      language?: string;
    }) => Promise<unknown>;
  };
  window?: {
    showTextDocument?: (document: unknown) => Promise<unknown> | unknown;
  };
};

type RegisterBridgeCommandsOptions = {
  runtime: CompanionRuntimeLike;
  vscode: BridgeCommandHost;
  startBroker: () => Promise<void>;
  stopBroker: () => Promise<void>;
  getDiagnosticsReport: () => Promise<string>;
};

export const bridgeCommandIds = [
  'happyVscodeBridge.startBroker',
  'happyVscodeBridge.stopBroker',
  'happyVscodeBridge.refreshSessions',
  'happyVscodeBridge.switchSessionMode',
  'happyVscodeBridge.diagnoseProviders',
] as const;

function toggleDesiredMode(current: DesiredMode): DesiredMode {
  return current === 'runtime_preferred'
    ? 'storage_preferred'
    : 'runtime_preferred';
}

function formatProvider(provider: BridgeProviderDiagnostic['provider']): string {
  return provider === 'claude' ? 'Claude' : 'Codex';
}

function formatValues(values: string[]): string {
  return values.length > 0 ? values.join(', ') : '(none)';
}

function formatOptionalBoolean(value: boolean | null | undefined): string {
  if (value === true) {
    return 'yes';
  }
  if (value === false) {
    return 'no';
  }
  return 'unknown';
}

function formatProbeHealth(
  probeHealth: BridgeProviderDiagnostic['discoveredSessions'][number]['probeHealth'],
): string {
  return `runtime=${probeHealth.runtime} | storage=${probeHealth.storage}`;
}

function selectInterestingCommands(
  provider: BridgeProviderDiagnostic['provider'],
  commands: string[],
): string[] {
  const patterns =
    provider === 'claude'
      ? [/^claude[-.]/i, /claude/i]
      : [/^chatgpt\./i, /codex/i, /chatgpt/i];

  const matched = commands.filter((command) =>
    patterns.some((pattern) => pattern.test(command)),
  );

  return matched.slice(0, 12);
}

function selectInterestingContextKeys(
  provider: BridgeProviderDiagnostic['provider'],
  contextKeys: string[],
): string[] {
  const patterns =
    provider === 'claude'
      ? [/claude/i]
      : [/codex/i, /chatgpt/i];

  const matched = contextKeys.filter((contextKey) =>
    patterns.some((pattern) => pattern.test(contextKey)),
  );

  return matched.slice(0, 12);
}

export function formatProviderDiagnosticsReport(params: {
  bridgeLogPath?: string;
  exthostLogDir?: string | null;
  diagnostics: BridgeProviderDiagnostic[];
}): string {
  const lines = [
    '# Happy Companion Provider Diagnostics',
    '',
    `Bridge Log Path: ${params.bridgeLogPath ?? 'unavailable'}`,
    `Extension Host Log Dir: ${params.exthostLogDir ?? 'unavailable'}`,
  ];

  for (const diagnostic of params.diagnostics) {
    const commandMatches = selectInterestingCommands(
      diagnostic.provider,
      diagnostic.commands,
    );
    const contextMatches = selectInterestingContextKeys(
      diagnostic.provider,
      diagnostic.contextKeys,
    );

    lines.push('');
    lines.push(`## ${formatProvider(diagnostic.provider)}`);
    lines.push(
      `- Extension: ${diagnostic.providerExtension.id}@${diagnostic.providerExtension.version}`,
    );
    lines.push(`- Compatibility: ${diagnostic.compatibility}`);
    lines.push(`- Activation State: ${diagnostic.activationState}`);
    lines.push(
      `- Runtime Probe: ${diagnostic.hasRuntimeProbe ? 'available' : 'unavailable'}`,
    );
    lines.push(
      `- Storage Probe: ${diagnostic.hasStorageProbe ? 'available' : 'unavailable'}`,
    );
    lines.push(`- Export Keys: ${formatValues(diagnostic.exportKeys)}`);
    lines.push(`- Module Export Keys: ${formatValues(diagnostic.moduleExportKeys)}`);
    lines.push(`- Commands Observed: ${diagnostic.commands.length}`);
    lines.push(
      `- Matching Commands: ${formatValues(commandMatches)}`,
    );
    lines.push(`- Context Keys Observed: ${diagnostic.contextKeys.length}`);
    lines.push(
      `- Matching Context Keys: ${formatValues(contextMatches)}`,
    );
    if (diagnostic.runtimeCapture) {
      lines.push(
        `- Runtime Capture: captured=${diagnostic.runtimeCapture.captured ? 'yes' : 'no'} | patchedHosts=${diagnostic.runtimeCapture.patchedHostCount} | comms=${diagnostic.runtimeCapture.commCount ?? 'n/a'}`,
      );
      lines.push(
        `- Runtime Shared Hook: installed=${diagnostic.runtimeCapture.sharedHookInstalled ? 'yes' : 'no'} | target=${diagnostic.runtimeCapture.sharedHookTargetKind ?? 'none'}`,
      );
      if (diagnostic.runtimeCapture.sharedHookFailureReason) {
        lines.push(
          `- Runtime Shared Hook Reason: ${diagnostic.runtimeCapture.sharedHookFailureReason}`,
        );
      }
      lines.push(
        `- Runtime Capture Path: ${diagnostic.runtimeCapture.capturePath ?? 'none'}`,
      );
      lines.push(
        `- Runtime Capture Keys: ${formatValues(diagnostic.runtimeCapture.providerKeys)}`,
      );
      lines.push(
        `- Runtime Capture Methods: ${formatValues(diagnostic.runtimeCapture.providerMethods)}`,
      );
      lines.push(
        `- Runtime Capture Channel Refs: ${formatValues(diagnostic.runtimeCapture.knownChannelRefs)}`,
      );
    }

    if (diagnostic.discoveredSessions.length === 0) {
      lines.push('- Discovered Sessions: (none)');
      continue;
    }

    for (const session of diagnostic.discoveredSessions) {
      lines.push(
        `- Session: ${session.title} | attachability=${session.attachability} | desired=${session.desiredMode} | effective=${session.effectiveMode} | reason=${session.modeReason}`,
      );
      lines.push(
        `- Session Capabilities: ${formatValues(session.capabilities)}`,
      );
      lines.push(
        `- Session Degraded Flags: ${formatValues(session.degradedFlags)}`,
      );
      lines.push(
        `- Session Probe Health: ${formatProbeHealth(session.probeHealth)}`,
      );
      if (session.runtimeDiagnostics) {
        lines.push(
          `- Session Runtime Refs: provider=${session.runtimeDiagnostics.runtimeProviderSessionRef ?? 'none'} | channel=${session.runtimeDiagnostics.runtimeChannelRef ?? 'none'}`,
        );
        lines.push(
          `- Session Interrupt Bridge: state=${session.runtimeDiagnostics.interruptBridgeState ?? 'unknown'} | commMatched=${formatOptionalBoolean(session.runtimeDiagnostics.interruptCommMatched)}`,
        );
      }
    }
  }

  return lines.join('\n');
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
    vscode.commands.registerCommand(bridgeCommandIds[4], async () => {
      await runtime.refresh();
      const report = await options.getDiagnosticsReport();
      const document = await vscode.workspace?.openTextDocument?.({
        content: report,
        language: 'markdown',
      });
      if (document && vscode.window?.showTextDocument) {
        await vscode.window.showTextDocument(document);
      }
      return report;
    }),
  ];
}
