import { dirname, join } from 'path';
import { homedir } from 'os';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';

import {
  brokerInstanceManifestSchema,
  type BrokerInstanceManifest,
} from '../../../happy-wire/src/brokerProtocol';

type BrokerManifestStoreOptions = {
  happyHomeDir?: string;
};

function resolveManifestPath(
  pathOrDir: string,
): string {
  return pathOrDir.endsWith('.json')
    ? pathOrDir
    : join(pathOrDir, 'broker', 'instance.json');
}

export class BrokerManifestStore {
  private readonly file: string;

  constructor(pathOrDir: string) {
    this.file = resolveManifestPath(pathOrDir);
  }

  static forInstance(
    instanceId: string,
    options?: BrokerManifestStoreOptions,
  ): BrokerManifestStore {
    const happyHomeDir =
      options?.happyHomeDir ?? process.env.HAPPY_HOME_DIR ?? join(homedir(), '.happy');
    return new BrokerManifestStore(
      join(happyHomeDir, 'bridges', 'vscode', 'instances', `${instanceId}.json`),
    );
  }

  getPath() {
    return this.file;
  }

  async write(manifest: BrokerInstanceManifest) {
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, JSON.stringify(manifest, null, 2));
  }

  async read(): Promise<BrokerInstanceManifest | undefined> {
    try {
      const contents = await readFile(this.file, 'utf-8');
      return brokerInstanceManifestSchema.parse(JSON.parse(contents));
    } catch (error: unknown) {
      if (isErrnoException(error) && error.code === 'ENOENT') {
        return undefined;
      }
      throw error;
    }
  }

  async delete(): Promise<void> {
    await rm(this.file, { force: true });
  }
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
