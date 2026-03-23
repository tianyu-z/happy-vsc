import { describe, expect, it } from 'vitest';
import { BrokerManifestStore } from './BrokerManifestStore';
import { join } from 'path';
import { tmpdir } from 'os';
import { unlink } from 'fs/promises';

describe('BrokerManifestStore', () => {
  it('writes and reads broker manifest metadata', async () => {
    const file = join(tmpdir(), `happy-vsc-test.${Date.now()}.json`);
    const store = new BrokerManifestStore(file);
    const manifest = { port: 40123, token: 'secret' };
    await store.write(manifest);
    await expect(store.read()).resolves.toMatchObject({ port: 40123, token: 'secret' });
    await unlink(file).catch(() => {});
  });

  it('resolves to undefined when manifest does not exist', async () => {
    const file = join(tmpdir(), `happy-vsc-missing.${Date.now()}.json`);
    const store = new BrokerManifestStore(file);
    await expect(store.read()).resolves.toBeUndefined();
  });
});
