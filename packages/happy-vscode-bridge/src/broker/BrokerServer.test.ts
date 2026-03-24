import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';

import { BrokerManifestStore } from './BrokerManifestStore';
import { BrokerServer } from './BrokerServer';
import { SharedSessionStore } from './SharedSessionStore';

type RpcSuccess = {
  id: string;
  result: unknown;
};

type RpcError = {
  id: string;
  error: {
    message?: string;
  };
};

type RpcNotification = {
  method: string;
  params: unknown;
};

function makeRuntimeMetadata() {
  return {
    desiredMode: 'runtime_preferred' as const,
    effectiveMode: 'runtime' as const,
    modeReason: 'runtime_ready',
    compatibility: 'supported' as const,
    providerExtension: {
      id: 'vscode-companion',
      version: '0.1.0',
    },
    probeHealth: {
      runtime: 'ready' as const,
      storage: 'ready' as const,
    },
  };
}

async function createRpcClient(url: string) {
  const socket = new WebSocket(url);
  const pending = new Map<
    string,
    {
      resolve(value: unknown): void;
      reject(error: unknown): void;
    }
  >();
  const notifications: RpcNotification[] = [];

  await new Promise<void>((resolve, reject) => {
    socket.once('open', () => resolve());
    socket.once('error', reject);
  });

  socket.on('message', (raw) => {
    const message = JSON.parse(String(raw)) as Partial<
      RpcSuccess & RpcError & RpcNotification
    >;

    if (message.id && pending.has(message.id)) {
      if (message.error) {
        pending.get(message.id)!.reject(
          new Error(message.error.message ?? 'Broker RPC failed'),
        );
      } else {
        pending.get(message.id)!.resolve(message.result);
      }
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
      const result = new Promise<unknown>((resolve, reject) => {
        pending.set(id, {
          resolve,
          reject,
        });
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
            ...makeRuntimeMetadata(),
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
          ...makeRuntimeMetadata(),
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
        ...makeRuntimeMetadata(),
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

  it('routes full-control rpc methods through the adapter host', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'happy-vscode-broker-'));
    tempDirs.push(dir);

    const sendMessage = vi.fn(async () => true);
    const listAttachments = vi.fn(async () => [
      {
        id: 'artifact-1',
        kind: 'image',
        label: 'preview.png',
      },
    ]);
    const setSessionDesiredMode = vi.fn(async () => ({
      brokerSessionId: 'broker-sess-1',
      provider: 'claude' as const,
      title: 'Attach me',
      attachability: 'attachable_with_degraded_capabilities' as const,
      capabilities: ['sendUserMessage'],
      degradedFlags: ['read_only_attach'],
      desiredMode: 'storage_preferred' as const,
      effectiveMode: 'storage' as const,
      modeReason: 'storage_preferred_selected',
      compatibility: 'supported' as const,
      providerExtension: { id: 'anthropic.claude-code', version: '1.0.0' },
      probeHealth: { runtime: 'degraded' as const, storage: 'ready' as const },
    }));

    const server = await BrokerServer.start({
      adapterHost: {
        discover: async () => [],
        attach: async () => null,
        sendMessage,
        interruptSession: async () => true,
        resolveApproval: async () => true,
        captureEditorContext: async () => null,
        listAttachments,
        setSessionDesiredMode,
        subscribeEvents: async () => true,
      },
      manifestStore: new BrokerManifestStore(dir),
      store: new SharedSessionStore(),
      token: 'test-token',
    });

    const client = await createRpcClient(server.url);
    const sendResult = await client.call('sendMessage', {
      brokerSessionId: 'broker-sess-1',
      text: 'hello',
    });
    const attachments = await client.call('listAttachments', {
      brokerSessionId: 'broker-sess-1',
    });
    const switched = await client.call('setSessionDesiredMode', {
      brokerSessionId: 'broker-sess-1',
      desiredMode: 'storage_preferred',
    });

    expect(sendResult).toBe(true);
    expect(sendMessage).toHaveBeenCalledWith('broker-sess-1', 'hello');
    expect(attachments).toMatchObject([
      {
        id: 'artifact-1',
        kind: 'image',
      },
    ]);
    expect(switched).toMatchObject({
      effectiveMode: 'storage',
      desiredMode: 'storage_preferred',
    });

    client.close();
    await server.stop();
  });
});
