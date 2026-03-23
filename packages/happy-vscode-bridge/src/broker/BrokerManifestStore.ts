import { dirname } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';

export interface BrokerInstanceManifest {
  port: number;
  token: string;
  address?: string;
  version?: string;
}

export class BrokerManifestStore {
  constructor(private readonly file: string) {}

  async write(manifest: BrokerInstanceManifest) {
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, JSON.stringify(manifest, null, 2));
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
