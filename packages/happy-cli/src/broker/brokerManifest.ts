import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { z } from 'zod';

const brokerInstanceManifestSchema = z.object({
  port: z.number(),
  token: z.string(),
  address: z.string().optional(),
  version: z.string().optional(),
  windowInstanceId: z.string().min(1).default('default-window'),
  windowLabel: z.string().min(1).default('VS Code Window'),
  workspaceLabel: z.string().min(1).default('No Workspace'),
  workspacePath: z.string().min(1).nullable().optional().default(null),
  isActiveWindow: z.boolean().default(true),
  windowLastActiveAt: z.string().min(1).nullable().optional().default(null),
});

export type BrokerInstanceManifest = z.infer<typeof brokerInstanceManifestSchema>;

export type BrokerManifestConnection = BrokerInstanceManifest & {
  url: string;
};

async function loadManifestFile(path: string): Promise<BrokerManifestConnection> {
  const raw = await readFile(path, 'utf8');
  const manifest = brokerInstanceManifestSchema.parse(JSON.parse(raw));
  return {
    ...manifest,
    url: manifest.address ?? `ws://127.0.0.1:${manifest.port}?token=${manifest.token}`,
  };
}

export async function loadBrokerManifests(
  rootDir: string,
): Promise<BrokerManifestConnection[]> {
  const instancesDir = join(rootDir, 'broker', 'instances');
  const instanceEntries = await readdir(instancesDir, { withFileTypes: true }).catch(
    (error: unknown) => {
      if (isErrnoException(error) && error.code === 'ENOENT') {
        return [];
      }
      throw error;
    },
  );
  const instanceFiles = instanceEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => join(instancesDir, entry.name))
    .sort();

  if (instanceFiles.length > 0) {
    return await Promise.all(instanceFiles.map((path) => loadManifestFile(path)));
  }

  return [await loadManifestFile(join(rootDir, 'broker', 'instance.json'))];
}

export async function loadBrokerManifest(rootDir: string): Promise<BrokerManifestConnection> {
  return await loadManifestFile(join(rootDir, 'broker', 'instance.json'));
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
