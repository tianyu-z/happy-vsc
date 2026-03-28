import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

type ResolveBrokerRootDirDeps = {
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
  exists?: (path: string) => boolean;
};

export function resolveBrokerRootDir(
  deps: ResolveBrokerRootDirDeps = {},
): string {
  const env = deps.env ?? process.env;
  const exists = deps.exists ?? existsSync;
  const homeDir = deps.homeDir ?? homedir();
  const explicitRoot = env.HAPPY_VSCODE_BRIDGE_ROOT?.trim();

  if (explicitRoot) {
    return explicitRoot;
  }

  for (const candidate of listBrokerRootCandidates(homeDir)) {
    if (exists(join(candidate, 'broker', 'instance.json'))) {
      return candidate;
    }
  }

  return join(homeDir, '.happy-vsc');
}

function listBrokerRootCandidates(homeDir: string): string[] {
  return [
    join(
      homeDir,
      '.vscode-server',
      'data',
      'User',
      'globalStorage',
      'happy.happy-vscode-bridge',
    ),
    join(
      homeDir,
      '.vscode-server',
      'data',
      'User',
      'globalStorage',
      'undefined_publisher.happy-vscode-bridge',
    ),
    join(
      homeDir,
      '.vscode-server-insiders',
      'data',
      'User',
      'globalStorage',
      'happy.happy-vscode-bridge',
    ),
    join(
      homeDir,
      '.config',
      'Code',
      'User',
      'globalStorage',
      'happy.happy-vscode-bridge',
    ),
    join(
      homeDir,
      '.config',
      'Code - Insiders',
      'User',
      'globalStorage',
      'happy.happy-vscode-bridge',
    ),
    join(
      homeDir,
      '.config',
      'VSCodium',
      'User',
      'globalStorage',
      'happy.happy-vscode-bridge',
    ),
  ];
}
