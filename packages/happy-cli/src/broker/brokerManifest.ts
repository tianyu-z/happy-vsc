import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { z } from 'zod';

import {
  brokerInstanceManifestSchema,
  type BrokerInstanceManifest,
} from '../../../happy-wire/src/brokerProtocol';

const legacyBrokerInstanceManifestSchema = z
  .object({
    port: z.number(),
    token: z.string(),
    address: z.string().optional(),
    version: z.string().optional(),
  })
  .strict();

export type LegacyBrokerManifestConnection = z.infer<
  typeof legacyBrokerInstanceManifestSchema
> & {
  url: string;
};

export type BrokerManifestConnection = {
  manifestPath: string;
  manifest: BrokerInstanceManifest;
  brokerUrl: string;
};

export function getBrokerInstancesDir(happyHomeDir: string): string {
  return join(happyHomeDir, 'bridges', 'vscode', 'instances');
}

export function toBrokerUrl(input: {
  brokerEndpoint: string;
  brokerAuthToken: string;
}): string {
  const separator = input.brokerEndpoint.includes('?') ? '&' : '?';
  return `${input.brokerEndpoint}${separator}token=${encodeURIComponent(
    input.brokerAuthToken,
  )}`;
}

export async function loadBrokerManifestConnections(
  happyHomeDir: string,
): Promise<BrokerManifestConnection[]> {
  const instancesDir = getBrokerInstancesDir(happyHomeDir);
  let entries: string[];

  try {
    entries = await readdir(instancesDir);
  } catch (error: unknown) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const connections = await Promise.all(
    entries
      .filter((entry) => entry.endsWith('.json'))
      .map(async (entry) => {
        const manifestPath = join(instancesDir, entry);

        try {
          const raw = await readFile(manifestPath, 'utf8');
          const manifest = brokerInstanceManifestSchema.parse(JSON.parse(raw));
          return {
            manifestPath,
            manifest,
            brokerUrl: toBrokerUrl(manifest),
          } satisfies BrokerManifestConnection;
        } catch (error: unknown) {
          if (isErrnoException(error) && error.code === 'ENOENT') {
            return null;
          }
          return null;
        }
      }),
  );

  return connections
    .filter((connection): connection is BrokerManifestConnection => connection !== null)
    .sort(
      (left, right) =>
        right.manifest.lastHeartbeatAt - left.manifest.lastHeartbeatAt,
    );
}

export async function loadBrokerManifest(
  rootDir: string,
): Promise<LegacyBrokerManifestConnection> {
  const manifestPath = join(rootDir, 'broker', 'instance.json');
  const raw = await readFile(manifestPath, 'utf8');
  const manifest = legacyBrokerInstanceManifestSchema.parse(JSON.parse(raw));

  return {
    ...manifest,
    url:
      manifest.address ?? `ws://127.0.0.1:${manifest.port}?token=${manifest.token}`,
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
