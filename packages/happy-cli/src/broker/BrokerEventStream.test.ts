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
});
