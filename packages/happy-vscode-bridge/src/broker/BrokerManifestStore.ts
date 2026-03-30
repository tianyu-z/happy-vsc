import { dirname, join } from 'path';
import { mkdir, readFile, rename, unlink, writeFile } from 'fs/promises';

export interface BrokerInstanceManifest {
  port: number;
  token: string;
  address?: string;
  version?: string;
  windowInstanceId: string;
  windowLabel: string;
  workspaceLabel: string;
  workspacePath?: string | null;
  isActiveWindow: boolean;
  windowLastActiveAt?: string | null;
}

type BrokerInstanceManifestWrite = {
  port: number;
  token: string;
  address?: string;
  version?: string;
  windowInstanceId?: string;
  windowLabel?: string;
  workspaceLabel?: string;
  workspacePath?: string | null;
  isActiveWindow?: boolean;
  windowLastActiveAt?: string | null;
};

export class BrokerManifestStore {
  private readonly file: string;
  private readonly instancesDir: string;

  constructor(rootDir: string) {
    this.file = join(rootDir, 'broker', 'instance.json');
    this.instancesDir = join(rootDir, 'broker', 'instances');
  }

  getPath() {
    return this.file;
  }

  async write(manifest: BrokerInstanceManifestWrite) {
    const normalizedManifest = normalizeManifest(manifest);
    const serializedManifest = JSON.stringify(normalizedManifest, null, 2);

    await mkdir(dirname(this.file), { recursive: true });
    if (hasRealWindowInstanceId(manifest.windowInstanceId)) {
      const perWindowPath = join(
        this.instancesDir,
        `${normalizedManifest.windowInstanceId}.json`,
      );
      await mkdir(this.instancesDir, { recursive: true });
      await writeJsonAtomic(perWindowPath, serializedManifest);
    }
    await writeJsonAtomic(this.file, serializedManifest);
  }

  async read(): Promise<BrokerInstanceManifest | undefined> {
    try {
      const contents = await readFile(this.file, 'utf-8');
      return JSON.parse(contents) as BrokerInstanceManifest;
    } catch (error: unknown) {
      if (isErrnoException(error) && error.code === 'ENOENT') {
        return undefined;
      }
      throw error;
    }
  }
}

function hasRealWindowInstanceId(windowInstanceId: string | undefined): boolean {
  return typeof windowInstanceId === 'string' && windowInstanceId.trim().length > 0;
}

function normalizeManifest(
  manifest: BrokerInstanceManifestWrite,
): BrokerInstanceManifest {
  return {
    port: manifest.port,
    token: manifest.token,
    address: manifest.address,
    version: manifest.version,
    windowInstanceId: manifest.windowInstanceId ?? 'default-window',
    windowLabel: manifest.windowLabel ?? 'VS Code Window',
    workspaceLabel: manifest.workspaceLabel ?? 'No Workspace',
    workspacePath: manifest.workspacePath ?? null,
    isActiveWindow: manifest.isActiveWindow ?? true,
    windowLastActiveAt: manifest.windowLastActiveAt ?? null,
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

async function writeJsonAtomic(path: string, json: string): Promise<void> {
  const tempPath = `${path}.tmp-${process.pid}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;

  try {
    await writeFile(tempPath, json, 'utf8');
    await rename(tempPath, path);
  } catch (error) {
    await unlink(tempPath).catch(() => {});
    throw error;
  }
}
