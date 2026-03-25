import { createServer } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';

import { BrokerEventStream } from './BrokerEventStream';

type RpcRequest = {
  id: string;
  method: string;
  params: unknown;
};

async function createBrokerEventServer() {
  const httpServer = createServer();
  const wsServer = new WebSocketServer({ server: httpServer });
  const calls: RpcRequest[] = [];
  const sockets = new Set<WebSocket>();

  wsServer.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('message', (raw) => {
      const request = JSON.parse(String(raw)) as RpcRequest;
      calls.push(request);

      if (request.method === 'subscribeEvents') {
        socket.send(JSON.stringify({ id: request.id, result: true }));
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(0, '127.0.0.1', () => resolve());
  });

  const address = httpServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to bind broker event test server');
  }

  return {
    url: `ws://127.0.0.1:${address.port}`,
    calls,
    sendBrokerEvent() {
      for (const socket of sockets) {
        if (socket.readyState !== WebSocket.OPEN) {
          continue;
        }

        socket.send(
          JSON.stringify({
            method: 'brokerEvent',
            params: {
              brokerSessionId: 'broker-sess-1',
              entry: {
                seq: 7,
                at: 123,
                sessionId: 'broker-sess-1',
                event: {
                  type: 'session.message.delta',
                  brokerSessionId: 'broker-sess-1',
                  payload: { role: 'assistant', text: 'hello from broker' },
                },
              },
            },
          }),
        );
      }
    },
    async closeActiveConnections() {
      const closeWaiters = [...sockets].map(
        (socket) =>
          new Promise<void>((resolve) => {
            if (socket.readyState === WebSocket.CLOSED) {
              resolve();
              return;
            }

            socket.once('close', () => resolve());
            socket.close();
          }),
      );

      await Promise.all(closeWaiters);
    },
    async close() {
      for (const socket of wsServer.clients) {
        socket.close();
      }

      await new Promise<void>((resolve) => wsServer.close(() => resolve()));
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    },
  };
}

describe('BrokerEventStream', () => {
  const servers: Array<Awaited<ReturnType<typeof createBrokerEventServer>>> = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
  });

  it('subscribes once and parses brokerEvent notifications', async () => {
    const server = await createBrokerEventServer();
    servers.push(server);

    const stream = new BrokerEventStream(server.url);
    const events: unknown[] = [];

    await stream.subscribeEvents('broker-sess-1', (entry) => {
      events.push(entry);
    });

    expect(
      server.calls.filter((call) => call.method === 'subscribeEvents'),
    ).toHaveLength(1);

    server.sendBrokerEvent();

    await expect
      .poll(() => events.length)
      .toBe(1);

    expect(events[0]).toMatchObject({
      seq: 7,
      at: 123,
      sessionId: 'broker-sess-1',
      event: {
        type: 'session.message.delta',
        brokerSessionId: 'broker-sess-1',
        payload: { role: 'assistant', text: 'hello from broker' },
      },
    });

    await stream.close();
  });

  it('close stops delivering further events', async () => {
    const server = await createBrokerEventServer();
    servers.push(server);

    const stream = new BrokerEventStream(server.url);
    const events: unknown[] = [];

    await stream.subscribeEvents('broker-sess-1', (entry) => {
      events.push(entry);
    });

    server.sendBrokerEvent();
    await expect.poll(() => events.length).toBe(1);

    await stream.close();
    server.sendBrokerEvent();

    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    expect(events).toHaveLength(1);
  });

  it('fails fast on malformed subscribe ack payload', async () => {
    const httpServer = createServer();
    const wsServer = new WebSocketServer({ server: httpServer });

    wsServer.on('connection', (socket) => {
      socket.on('message', (raw) => {
        const request = JSON.parse(String(raw)) as RpcRequest;
        if (request.method === 'subscribeEvents') {
          socket.send(JSON.stringify({ id: request.id, result: { ok: true } }));
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(0, '127.0.0.1', () => resolve());
    });

    const address = httpServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('failed to bind broker event test server');
    }

    const stream = new BrokerEventStream(`ws://127.0.0.1:${address.port}`, 5_000);
    const startedAt = Date.now();

    try {
      await expect(stream.subscribeEvents('broker-sess-1', () => {})).rejects.toThrow();
      expect(Date.now() - startedAt).toBeLessThan(1_000);
    } finally {
      await stream.close();
      for (const socket of wsServer.clients) {
        socket.close();
      }
      await new Promise<void>((resolve) => wsServer.close(() => resolve()));
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });

  it('allows re-subscribe after remote close', async () => {
    const server = await createBrokerEventServer();
    servers.push(server);

    const stream = new BrokerEventStream(server.url);
    await stream.subscribeEvents('broker-sess-1', () => {});

    await server.closeActiveConnections();

    await expect(stream.subscribeEvents('broker-sess-1', () => {})).resolves.toBeUndefined();
    expect(
      server.calls.filter((call) => call.method === 'subscribeEvents'),
    ).toHaveLength(2);

    await stream.close();
  });

  it('notifies caller when remote close happens after subscribe', async () => {
    const server = await createBrokerEventServer();
    servers.push(server);

    const stream = new BrokerEventStream(server.url);
    const disconnects: unknown[] = [];

    await stream.subscribeEvents(
      'broker-sess-1',
      () => {},
      {
        onDisconnect: (reason) => disconnects.push(reason),
      },
    );

    await server.closeActiveConnections();

    await expect
      .poll(() => disconnects.length)
      .toBe(1);
    expect(disconnects[0]).toMatchObject({ kind: 'close' });

    await stream.close();
  });

  it('notifies caller when socket errors after subscribe', async () => {
    const server = await createBrokerEventServer();
    servers.push(server);

    const stream = new BrokerEventStream(server.url);
    const disconnects: unknown[] = [];

    await stream.subscribeEvents(
      'broker-sess-1',
      () => {},
      {
        onDisconnect: (reason) => disconnects.push(reason),
      },
    );

    const socket = (stream as unknown as { socket: WebSocket | null }).socket;
    if (!socket) {
      throw new Error('expected stream socket');
    }
    socket.emit('error', new Error('simulated transport error'));

    await expect
      .poll(() => disconnects.length)
      .toBe(1);
    expect(disconnects[0]).toMatchObject({
      kind: 'error',
      error: expect.objectContaining({ message: 'simulated transport error' }),
    });
  });
});
