import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrokerManifestStore } from './BrokerManifestStore';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';

describe('BrokerManifestStore', () => {
  afterEach(() => {
    vi.doUnmock('fs/promises');
    vi.resetModules();
  });

  it('writes full manifest to instance alias and per-window file', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'happy-vsc-test-'));
    const store = new BrokerManifestStore(rootDir);
    const manifest = {
      port: 40123,
      token: 'secret',
      windowInstanceId: 'window-a',
      windowLabel: 'Window A',
      workspaceLabel: 'Workspace A',
      workspacePath: '/tmp/workspace-a',
      isActiveWindow: true,
      windowLastActiveAt: '2026-03-25T09:00:00.000Z',
    };

    await store.write(manifest);

    await expect(store.read()).resolves.toMatchObject(manifest);

    const perWindowPath = join(rootDir, 'broker', 'instances', 'window-a.json');
    const aliasPath = join(rootDir, 'broker', 'instance.json');
    const perWindowManifest = JSON.parse(await readFile(perWindowPath, 'utf8'));
    const aliasManifest = JSON.parse(await readFile(aliasPath, 'utf8'));

    expect(perWindowManifest).toMatchObject(manifest);
    expect(aliasManifest).toMatchObject(manifest);

    await rm(rootDir, { recursive: true, force: true });
  });

  it('resolves to undefined when manifest does not exist', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'happy-vsc-missing-'));
    const store = new BrokerManifestStore(rootDir);
    await expect(store.read()).resolves.toBeUndefined();
    await rm(rootDir, { recursive: true, force: true });
  });

  it('does not create a default per-window instance file for compatibility writes', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'happy-vsc-compat-'));
    const store = new BrokerManifestStore(rootDir);

    await store.write({ port: 40123, token: 'secret' });

    const aliasPath = join(rootDir, 'broker', 'instance.json');
    const defaultInstancePath = join(
      rootDir,
      'broker',
      'instances',
      'default-window.json',
    );

    await expect(access(aliasPath)).resolves.toBeUndefined();
    await expect(access(defaultInstancePath)).rejects.toBeTruthy();
    await rm(rootDir, { recursive: true, force: true });
  });

  it('keeps the existing alias manifest when atomic replacement fails', async () => {
    vi.resetModules();
    const fsActual =
      await vi.importActual<typeof import('node:fs/promises')>('fs/promises');
    vi.doMock('fs/promises', () => ({
      ...fsActual,
      rename: vi.fn(async () => {
        throw new Error('rename failed');
      }),
    }));
    const { BrokerManifestStore: AtomicBrokerManifestStore } = await import(
      './BrokerManifestStore'
    );

    const rootDir = await mkdtemp(join(tmpdir(), 'happy-vsc-atomic-'));
    const aliasPath = join(rootDir, 'broker', 'instance.json');
    await fsActual.mkdir(join(rootDir, 'broker'), { recursive: true });
    await fsActual.writeFile(
      aliasPath,
      JSON.stringify({ port: 40100, token: 'existing-token' }),
      'utf8',
    );

    const store = new AtomicBrokerManifestStore(rootDir);

    await expect(
      store.write({ port: 40123, token: 'replacement-token' }),
    ).rejects.toThrow('rename failed');
    await expect(readFile(aliasPath, 'utf8')).resolves.toContain('existing-token');

    await rm(rootDir, { recursive: true, force: true });
  });
});
