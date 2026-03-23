import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export type BrokerInstanceManifest = {
  port: number;
  token: string;
};

export class BrokerManifestStore {
  private readonly file: string;

  constructor(rootDir: string) {
    this.file = join(rootDir, 'broker', 'instance.json');
  }

  async write(manifest: BrokerInstanceManifest): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, JSON.stringify(manifest, null, 2), 'utf8');
  }

  async read(): Promise<BrokerInstanceManifest | null> {
    try {
      const raw = await readFile(this.file, 'utf8');
      return JSON.parse(raw) as BrokerInstanceManifest;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }

      throw error;
    }
  }
}
