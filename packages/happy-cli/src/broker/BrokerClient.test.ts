import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';
import { WebSocketServer } from 'ws';

import { BrokerClient } from './BrokerClient';
import { loadBrokerManifest } from './brokerManifest';

type RpcRequest = {
  id: string;
  method: string;
  params: unknown;
};

async function createBrokerRpcServer(handlers: {
  discoverSessions: () => unknown;
  attachSession: (brokerSessionId: string) => unknown;
}) {
  const httpServer = createServer();
  const wsServer = new WebSocketServer({ server: httpServer });
  const calls: RpcRequest[] = [];

  wsServer.on('connection', (socket) => {
    socket.on('message', (raw) => {
      const request = JSON.parse(String(raw)) as RpcRequest;
      calls.push(request);

      if (request.method === 'discoverSessions') {
        socket.send(JSON.stringify({ id: request.id, result: handlers.discoverSessions() }));
        return;
      }

      if (request.method === 'attachSession') {
        const params = request.params as { brokerSessionId: string };
        socket.send(
          JSON.stringify({ id: request.id, result: handlers.attachSession(params.brokerSessionId) }),
        );
        return;
      }

      socket.send(JSON.stringify({ id: request.id, error: { message: `unknown method: ${request.method}` } }));
    });
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(0, '127.0.0.1', () => resolve());
  });

  const address = httpServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to bind broker rpc test server');
  }

  return {
    url: `ws://127.0.0.1:${address.port}`,
    calls,
    async close() {
      for (const socket of wsServer.clients) {
        socket.close();
      }

      await new Promise<void>((resolve) => wsServer.close(() => resolve()));
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    },
  };
}

describe('brokerManifest', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('loads broker connection info from the local manifest', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'happy-broker-manifest-'));
    tempDirs.push(rootDir);
    await mkdir(join(rootDir, 'broker'), { recursive: true });
    await writeFile(
      join(rootDir, 'broker', 'instance.json'),
      JSON.stringify({ port: 40123, token: 'test-token' }),
      'utf8',
    );

    await expect(loadBrokerManifest(rootDir)).resolves.toMatchObject({
      port: 40123,
      token: 'test-token',
      url: 'ws://127.0.0.1:40123?token=test-token',
    });
  });

  it('prefers manifest address when provided', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'happy-broker-manifest-'));
    tempDirs.push(rootDir);
    await mkdir(join(rootDir, 'broker'), { recursive: true });
    await writeFile(
      join(rootDir, 'broker', 'instance.json'),
      JSON.stringify({ port: 40123, token: 'test-token', address: 'ws://10.0.0.2:40123?token=test-token' }),
      'utf8',
    );

    await expect(loadBrokerManifest(rootDir)).resolves.toMatchObject({
      url: 'ws://10.0.0.2:40123?token=test-token',
    });
  });
});

describe('BrokerClient', () => {
  it('calls discoverSessions over broker ws/json-rpc', async () => {
    const server = await createBrokerRpcServer({
      discoverSessions: () => [
        {
          brokerSessionId: 'broker-sess-1',
          provider: 'claude',
          title: 'Attach me',
          attachability: 'attachable',
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
        },
      ],
      attachSession: () => null,
    });

    try {
      const client = new BrokerClient(server.url);
      await expect(client.discoverSessions()).resolves.toMatchObject([
        {
          brokerSessionId: 'broker-sess-1',
        },
      ]);
      expect(server.calls).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            method: 'discoverSessions',
          }),
        ]),
      );
    } finally {
      await server.close();
    }
  });

  it('calls attachSession over broker ws/json-rpc', async () => {
    const server = await createBrokerRpcServer({
      discoverSessions: () => [],
      attachSession: (brokerSessionId) => ({
        brokerSessionId,
        provider: 'codex',
        latestSeq: 4,
        capabilities: ['sendUserMessage'],
        degradedFlags: ['missing_editor_context'],
      }),
    });

    try {
      const client = new BrokerClient(server.url);
      await expect(client.attachSession('broker-sess-1')).resolves.toMatchObject({
        latestSeq: 4,
        degradedFlags: ['missing_editor_context'],
      });
      expect(server.calls).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            method: 'attachSession',
            params: { brokerSessionId: 'broker-sess-1' },
          }),
        ]),
      );
    } finally {
      await server.close();
    }
  });
});
