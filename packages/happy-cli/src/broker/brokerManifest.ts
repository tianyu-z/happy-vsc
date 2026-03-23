import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { z } from 'zod';

const brokerInstanceManifestSchema = z.object({
  port: z.number(),
  token: z.string(),
  address: z.string().optional(),
  version: z.string().optional(),
});

export type BrokerInstanceManifest = z.infer<typeof brokerInstanceManifestSchema>;

export type BrokerManifestConnection = BrokerInstanceManifest & {
  url: string;
};

export async function loadBrokerManifest(rootDir: string): Promise<BrokerManifestConnection> {
  const manifestPath = join(rootDir, 'broker', 'instance.json');
  const raw = await readFile(manifestPath, 'utf8');
  const manifest = brokerInstanceManifestSchema.parse(JSON.parse(raw));

  return {
    ...manifest,
    url: manifest.address ?? `ws://127.0.0.1:${manifest.port}?token=${manifest.token}`,
  };
}
