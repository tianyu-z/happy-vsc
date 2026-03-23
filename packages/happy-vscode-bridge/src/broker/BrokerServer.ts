import { createServer, type Server as HttpServer } from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';

import type { BrokerDiscoveredSession, BrokerSnapshot } from 'happy-wire';

import type { BrokerManifestStore } from './BrokerManifestStore';
import {
  createBrokerRpcError,
  createBrokerRpcNotification,
  createBrokerRpcSuccess,
  parseBrokerRpcRequest,
} from './rpc';
import type { BrokerLogEntry, SharedSessionStore } from './SharedSessionStore';

export type BrokerAdapterHost = {
  discover(): Promise<BrokerDiscoveredSession[]> | BrokerDiscoveredSession[];
  attach(brokerSessionId: string): Promise<BrokerSnapshot | null> | BrokerSnapshot | null;
};

export type BrokerServerOptions = {
  adapterHost: BrokerAdapterHost;
  manifestStore: BrokerManifestStore;
  store: SharedSessionStore;
  host?: string;
  port?: number;
  token?: string;
};

export class BrokerServer {
  private constructor(
    private readonly httpServer: HttpServer,
    private readonly socketServer: WebSocketServer,
    readonly port: number,
    readonly token: string,
    readonly url: string,
  ) {}

  static async start(options: BrokerServerOptions): Promise<BrokerServer> {
    const host = options.host ?? '127.0.0.1';
    const token = options.token ?? 'bridge-token';
    const httpServer = createServer();
    const socketServer = new WebSocketServer({ server: httpServer });
    const socketSubscriptions = new WeakMap<WebSocket, Array<() => void>>();

    socketServer.on('connection', (socket, request) => {
      const requestUrl = new URL(request.url ?? '/', `ws://${host}`);

      if (requestUrl.searchParams.get('token') !== token) {
        socket.close();
        return;
      }

      socketSubscriptions.set(socket, []);

      socket.on('message', async (raw) => {
        const message = parseBrokerRpcRequest(String(raw));

        try {
          if (message.method === 'discoverSessions') {
            const result = await options.adapterHost.discover();
            socket.send(JSON.stringify(createBrokerRpcSuccess(message.id, result)));
            return;
          }

          if (message.method === 'attachSession') {
            const brokerSessionId = (message.params as { brokerSessionId: string }).brokerSessionId;
            const result = await options.adapterHost.attach(brokerSessionId);
            socket.send(JSON.stringify(createBrokerRpcSuccess(message.id, result)));
            return;
          }

          if (message.method === 'subscribeEvents') {
            const brokerSessionId = (message.params as { brokerSessionId: string }).brokerSessionId;
            const unsubscribe = options.store.subscribe((entry: BrokerLogEntry) => {
              if (entry.sessionId !== brokerSessionId || socket.readyState !== WebSocket.OPEN) {
                return;
              }

              socket.send(
                JSON.stringify(
                  createBrokerRpcNotification('brokerEvent', {
                    brokerSessionId,
                    entry,
                  }),
                ),
              );
            });

            socketSubscriptions.get(socket)?.push(unsubscribe);
            socket.send(JSON.stringify(createBrokerRpcSuccess(message.id, true)));
            return;
          }

          socket.send(
            JSON.stringify(createBrokerRpcError(message.id, `Unknown method: ${message.method}`)),
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Broker RPC request failed';
          socket.send(JSON.stringify(createBrokerRpcError(message.id, errorMessage)));
        }
      });

      socket.on('close', () => {
        socketSubscriptions.get(socket)?.forEach((unsubscribe) => unsubscribe());
        socketSubscriptions.delete(socket);
      });
    });

    await new Promise<void>((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(options.port ?? 0, host, () => resolve());
    });

    const address = httpServer.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const url = `ws://${host}:${port}?token=${token}`;

    await options.manifestStore.write({ port, token });

    return new BrokerServer(httpServer, socketServer, port, token, url);
  }

  async stop(): Promise<void> {
    for (const socket of this.socketServer.clients) {
      socket.close();
    }

    await new Promise<void>((resolve) => {
      this.socketServer.close(() => resolve());
    });

    await new Promise<void>((resolve) => {
      this.httpServer.close(() => resolve());
    });
  }
}
