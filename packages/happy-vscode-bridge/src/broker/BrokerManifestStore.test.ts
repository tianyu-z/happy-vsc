import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { BrokerManifestStore } from './BrokerManifestStore';

describe('BrokerManifestStore', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it('writes and reads broker manifest metadata', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'happy-vscode-bridge-'));
    tempDirs.push(dir);

    const store = new BrokerManifestStore(dir);

    await store.write({ port: 40123, token: 'secret' });

    await expect(store.read()).resolves.toMatchObject({ port: 40123, token: 'secret' });
  });
});
