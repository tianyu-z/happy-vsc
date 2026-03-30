import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

export type BridgeInstallationIdStore = {
  read(): Promise<string | undefined>;
  write(value: string): Promise<void>;
};

export type BridgeInstanceIdentity = {
  installationId: string;
  instanceId: string;
  logicalWindowKey: string;
  editorSessionId?: string;
};

type BuildBridgeInstanceIdentityInput = {
  remoteName?: string | null;
  workspaceFolders: string[];
  extensionKind: 'workspace' | 'ui';
  editorSessionId?: string;
  providerHostFingerprint?: string;
  installationIdStore: BridgeInstallationIdStore;
};

export class FileBridgeInstallationIdStore implements BridgeInstallationIdStore {
  constructor(private readonly filePath: string) {}

  async read(): Promise<string | undefined> {
    try {
      const value = await readFile(this.filePath, 'utf8');
      const trimmed = value.trim();
      return trimmed || undefined;
    } catch (error: unknown) {
      if (isErrnoException(error) && error.code === 'ENOENT') {
        return undefined;
      }
      throw error;
    }
  }

  async write(value: string): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${value}\n`, 'utf8');
  }
}

export function resolveBridgeHappyHomeDir(happyHomeDir?: string): string {
  return happyHomeDir ?? process.env.HAPPY_HOME_DIR ?? join(homedir(), '.happy');
}

export function getBridgeInstallationIdPath(happyHomeDir?: string): string {
  return join(
    resolveBridgeHappyHomeDir(happyHomeDir),
    'bridges',
    'vscode',
    'installation-id',
  );
}

export async function buildBridgeInstanceIdentity(
  input: BuildBridgeInstanceIdentityInput,
): Promise<BridgeInstanceIdentity> {
  const existingInstallationId = await input.installationIdStore.read();
  const installationId = existingInstallationId ?? randomUUID();

  if (!existingInstallationId) {
    await input.installationIdStore.write(installationId);
  }

  const logicalWindowKey = createHash('sha256')
    .update(
      JSON.stringify([
        input.remoteName ?? 'local',
        [...input.workspaceFolders].sort(),
        input.extensionKind,
        input.providerHostFingerprint ?? 'unknown',
      ]),
    )
    .digest('hex');

  return {
    installationId,
    instanceId: randomUUID(),
    logicalWindowKey,
    ...(input.editorSessionId ? { editorSessionId: input.editorSessionId } : {}),
  };
}

function isErrnoException(
  error: unknown,
): error is NodeJS.ErrnoException & { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as NodeJS.ErrnoException).code === 'string'
  );
}
