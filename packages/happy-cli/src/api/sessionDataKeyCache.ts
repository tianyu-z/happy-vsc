import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

import { configuration } from '@/configuration';
import { decodeBase64, encodeBase64 } from './encryption';

type SessionDataKeyCachePayload = Record<string, string>;

async function readCache(): Promise<SessionDataKeyCachePayload> {
  if (!existsSync(configuration.sessionDataKeysFile)) {
    return {};
  }

  try {
    const raw = await readFile(configuration.sessionDataKeysFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === 'string' && typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
}

export async function readSessionDataKey(tag: string): Promise<Uint8Array | null> {
  const cache = await readCache();
  const encodedKey = cache[tag];
  if (!encodedKey) {
    return null;
  }

  try {
    return decodeBase64(encodedKey);
  } catch {
    return null;
  }
}

export async function writeSessionDataKey(tag: string, key: Uint8Array): Promise<void> {
  const cache = await readCache();
  cache[tag] = encodeBase64(key);
  await writeFile(
    configuration.sessionDataKeysFile,
    JSON.stringify(cache, null, 2),
    'utf8',
  );
}
