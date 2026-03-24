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

function makeRuntimeMetadata() {
  return {
    desiredMode: 'runtime_preferred',
    effectiveMode: 'runtime',
    modeReason: 'runtime_ready',
    compatibility: 'supported',
    providerExtension: {
      id: 'anthropic.claude-code',
      version: '1.0.0',
    },
    probeHealth: {
      runtime: 'ready',
      storage: 'ready',
    },
  };
}

async function createBrokerRpcServer(handlers: Record<string, (params: any) => unknown>) {
  const httpServer = createServer();
  const wsServer = new WebSocketServer({ server: httpServer });
  const calls: RpcRequest[] = [];

  wsServer.on('connection', (socket) => {
    socket.on('message', (raw) => {
      const request = JSON.parse(String(raw)) as RpcRequest;
      calls.push(request);

      const handler = handlers[request.method];
      if (handler) {
        socket.send(JSON.stringify({ id: request.id, result: handler(request.params) }));
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
          ...makeRuntimeMetadata(),
        },
      ],
      attachSession: () => null,
    });

    try {
      const client = new BrokerClient(server.url);
      await expect(client.discoverSessions()).resolves.toMatchObject([
        {
          brokerSessionId: 'broker-sess-1',
          desiredMode: 'runtime_preferred',
          effectiveMode: 'runtime',
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
      attachSession: (params) => ({
        brokerSessionId: params.brokerSessionId,
        provider: 'codex',
        latestSeq: 4,
        capabilities: ['sendUserMessage'],
        degradedFlags: ['missing_editor_context'],
        ...makeRuntimeMetadata(),
      }),
    });

    try {
      const client = new BrokerClient(server.url);
      await expect(client.attachSession('broker-sess-1')).resolves.toMatchObject({
        latestSeq: 4,
        degradedFlags: ['missing_editor_context'],
        desiredMode: 'runtime_preferred',
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

  it('fails when the broker closes before replying', async () => {
    const httpServer = createServer();
    const wsServer = new WebSocketServer({ server: httpServer });

    wsServer.on('connection', (socket) => {
      socket.on('message', () => {
        socket.close();
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

    try {
      const client = new BrokerClient(`ws://127.0.0.1:${address.port}`, 200);
      await expect(client.discoverSessions()).rejects.toThrow('closed');
    } finally {
      for (const socket of wsServer.clients) {
        socket.close();
      }

      await new Promise<void>((resolve) => wsServer.close(() => resolve()));
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });

  it('fails when the broker does not reply before the request timeout', async () => {
    const httpServer = createServer();
    const wsServer = new WebSocketServer({ server: httpServer });

    wsServer.on('connection', (socket) => {
      socket.on('message', () => {
        // Intentionally leave the request hanging to exercise the timeout path.
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

    try {
      const client = new BrokerClient(`ws://127.0.0.1:${address.port}`, 50);
      await expect(client.discoverSessions()).rejects.toThrow('timed out');
    } finally {
      for (const socket of wsServer.clients) {
        socket.close();
      }

      await new Promise<void>((resolve) => wsServer.close(() => resolve()));
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });

  it('calls full-control broker rpc helpers and parses runtime metadata', async () => {
    const server = await createBrokerRpcServer({
      discoverSessions: () => [],
      attachSession: () => null,
      sendMessage: () => true,
      listAttachments: () => [
        {
          id: 'artifact-1',
          kind: 'image',
          label: 'preview.png',
        },
      ],
      setSessionDesiredMode: (params) => ({
        brokerSessionId: params.brokerSessionId,
        provider: 'claude',
        title: 'Attach me',
        attachability: 'attachable_with_degraded_capabilities',
        capabilities: ['sendUserMessage'],
        degradedFlags: ['read_only_attach'],
        desiredMode: params.desiredMode,
        effectiveMode: 'storage',
        modeReason: 'storage_preferred_selected',
        compatibility: 'supported',
        providerExtension: {
          id: 'anthropic.claude-code',
          version: '1.0.0',
        },
        probeHealth: {
          runtime: 'degraded',
          storage: 'ready',
        },
      }),
    });

    try {
      const client = new BrokerClient(server.url);
      await expect(client.sendMessage('broker-sess-1', 'continue')).resolves.toBe(true);
      await expect(client.listAttachments('broker-sess-1')).resolves.toMatchObject([
        {
          id: 'artifact-1',
          kind: 'image',
        },
      ]);
      await expect(
        client.setSessionDesiredMode('broker-sess-1', 'storage_preferred'),
      ).resolves.toMatchObject({
        desiredMode: 'storage_preferred',
        effectiveMode: 'storage',
      });
      expect(server.calls).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            method: 'sendMessage',
            params: {
              brokerSessionId: 'broker-sess-1',
              text: 'continue',
            },
          }),
          expect.objectContaining({
            method: 'listAttachments',
            params: {
              brokerSessionId: 'broker-sess-1',
            },
          }),
          expect.objectContaining({
            method: 'setSessionDesiredMode',
            params: {
              brokerSessionId: 'broker-sess-1',
              desiredMode: 'storage_preferred',
            },
          }),
        ]),
      );
    } finally {
      await server.close();
    }
  });
});
