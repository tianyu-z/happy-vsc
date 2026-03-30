import type { BrokerRuntimeKind } from 'happy-wire';

type RuntimeInfoInput = {
  remoteName?: string | null;
  remoteAuthority?: string | null;
};

type RuntimeInfo = {
  runtimeKind: BrokerRuntimeKind;
  runtimeLabel: string;
};

function decodeRemoteTarget(remoteAuthority?: string | null): string | undefined {
  if (!remoteAuthority) {
    return undefined;
  }

  const separatorIndex = remoteAuthority.indexOf('+');
  const rawTarget =
    separatorIndex >= 0 ? remoteAuthority.slice(separatorIndex + 1) : remoteAuthority;

  if (!rawTarget) {
    return undefined;
  }

  try {
    return decodeURIComponent(rawTarget);
  } catch {
    return rawTarget;
  }
}

function buildRuntimeLabel(prefix: string, target?: string): string {
  return target ? `${prefix}:${target}` : prefix;
}

export function deriveRuntimeInfo(input: RuntimeInfoInput): RuntimeInfo {
  const target = decodeRemoteTarget(input.remoteAuthority);

  switch (input.remoteName) {
    case undefined:
    case null:
    case '':
      return {
        runtimeKind: 'local',
        runtimeLabel: 'local',
      };
    case 'ssh-remote':
      return {
        runtimeKind: 'ssh',
        runtimeLabel: buildRuntimeLabel('ssh', target),
      };
    case 'wsl':
      return {
        runtimeKind: 'wsl',
        runtimeLabel: buildRuntimeLabel('wsl', target),
      };
    case 'dev-container':
      return {
        runtimeKind: 'dev-container',
        runtimeLabel: buildRuntimeLabel('dev-container', target),
      };
    case 'codespaces':
      return {
        runtimeKind: 'codespace',
        runtimeLabel: buildRuntimeLabel('codespace', target),
      };
    case 'tunnel':
      return {
        runtimeKind: 'tunnel',
        runtimeLabel: buildRuntimeLabel('tunnel', target),
      };
    default:
      return {
        runtimeKind: 'unknown',
        runtimeLabel: target ? `unknown:${target}` : input.remoteName,
      };
  }
}
