import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';

import { BrokerManifestStore } from './BrokerManifestStore';
import { BrokerServer } from './BrokerServer';
import { SharedSessionStore } from './SharedSessionStore';

type RpcSuccess = {
  id: string;
  result: unknown;
};

type RpcNotification = {
  method: string;
  params: unknown;
};

async function createRpcClient(url: string) {
  const socket = new WebSocket(url);
  const pending = new Map<string, (value: unknown) => void>();
  const notifications: RpcNotification[] = [];

  await new Promise<void>((resolve, reject) => {
    socket.once('open', () => resolve());
    socket.once('error', reject);
  });

  socket.on('message', (raw) => {
    const message = JSON.parse(String(raw)) as Partial<RpcSuccess & RpcNotification>;

    if (message.id && pending.has(message.id)) {
      pending.get(message.id)!(message.result);
      pending.delete(message.id);
      return;
    }

    if (message.method) {
      notifications.push({
        method: message.method,
        params: message.params,
      });
    }
  });

  return {
    async call(method: string, params: unknown) {
      const id = `${method}-${pending.size + 1}`;
      const result = new Promise<unknown>((resolve) => {
        pending.set(id, resolve);
      });

      socket.send(JSON.stringify({ id, method, params }));

      return result;
    },
    async nextNotification() {
      while (notifications.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      return notifications.shift()!;
    },
    close() {
      socket.close();
    },
  };
}

describe('BrokerServer', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it('returns discoverable sessions from the adapter host', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'happy-vscode-broker-'));
    tempDirs.push(dir);

    const store = new SharedSessionStore();
    const server = await BrokerServer.start({
      adapterHost: {
        discover: async () => [
          {
            brokerSessionId: 'broker-sess-1',
            provider: 'claude',
            title: 'Attach me',
            attachability: 'attachable',
            capabilities: ['sendUserMessage'],
            degradedFlags: [],
          },
        ],
        attach: async () => null,
      },
      manifestStore: new BrokerManifestStore(dir),
      store,
      token: 'test-token',
    });

    const client = await createRpcClient(server.url);
    const sessions = (await client.call('discoverSessions', {})) as Array<{
      brokerSessionId: string;
    }>;

    expect(sessions[0].brokerSessionId).toBe('broker-sess-1');

    client.close();
    await server.stop();
  });

  it('attaches to an existing broker session through the adapter host', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'happy-vscode-broker-'));
    tempDirs.push(dir);

    const store = new SharedSessionStore();
    const server = await BrokerServer.start({
      adapterHost: {
        discover: async () => [],
        attach: async () => ({
          brokerSessionId: 'broker-sess-1',
          provider: 'codex',
          latestSeq: 4,
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
        }),
      },
      manifestStore: new BrokerManifestStore(dir),
      store,
      token: 'test-token',
    });

    const client = await createRpcClient(server.url);
    const snapshot = (await client.call('attachSession', {
      brokerSessionId: 'broker-sess-1',
    })) as { latestSeq: number };

    expect(snapshot.latestSeq).toBe(4);

    client.close();
    await server.stop();
  });

  it('streams broker events to subscribers', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'happy-vscode-broker-'));
    tempDirs.push(dir);

    const store = new SharedSessionStore();
    const server = await BrokerServer.start({
      adapterHost: {
        discover: async () => [],
        attach: async () => null,
      },
      manifestStore: new BrokerManifestStore(dir),
      store,
      token: 'test-token',
    });

    const client = await createRpcClient(server.url);

    await client.call('subscribeEvents', { brokerSessionId: 'broker-sess-1' });

    store.append('broker-sess-1', {
      type: 'session.snapshot',
      snapshot: {
        brokerSessionId: 'broker-sess-1',
        provider: 'claude',
        latestSeq: 8,
        capabilities: ['sendUserMessage'],
        degradedFlags: [],
      },
    });

    await expect(client.nextNotification()).resolves.toMatchObject({
      method: 'brokerEvent',
      params: {
        brokerSessionId: 'broker-sess-1',
        entry: {
          seq: 1,
          event: {
            type: 'session.snapshot',
          },
        },
      },
    });

    client.close();
    await server.stop();
  });
});
