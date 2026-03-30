import { createServer, type Server as HttpServer } from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';

import type {
  BridgeAttachmentRef,
  BridgeCaptureEditorContextResult,
  BridgeDesiredMode,
} from './bridgeTypes';
import type {
  BridgeBrokerDiscoveredSession,
  BridgeBrokerSnapshot,
} from '../runtime/types';

import {
  createBrokerRpcError,
  createBrokerRpcNotification,
  createBrokerRpcSuccess,
  parseBrokerRpcRequest,
} from './rpc';
import type { BrokerLogEntry, SharedSessionStore } from './SharedSessionStore';

export type BrokerAdapterHost = {
  discover():
    | Promise<BridgeBrokerDiscoveredSession[]>
    | BridgeBrokerDiscoveredSession[];
  attach(
    brokerSessionId: string,
  ): Promise<BridgeBrokerSnapshot | null> | BridgeBrokerSnapshot | null;
  sendMessage?(brokerSessionId: string, text: string): Promise<boolean> | boolean;
  interruptSession?(brokerSessionId: string, reason: string): Promise<boolean> | boolean;
  resolveApproval?(
    brokerSessionId: string,
    approvalId: string,
    decision: 'approve' | 'deny',
  ): Promise<boolean> | boolean;
  captureEditorContext?(
    brokerSessionId: string,
  ):
    | Promise<BridgeCaptureEditorContextResult | null>
    | BridgeCaptureEditorContextResult
    | null;
  listAttachments?(
    brokerSessionId: string,
  ): Promise<BridgeAttachmentRef[]> | BridgeAttachmentRef[];
  setSessionDesiredMode?(
    brokerSessionId: string,
    desiredMode: BridgeDesiredMode,
  ): Promise<BridgeBrokerDiscoveredSession> | BridgeBrokerDiscoveredSession;
  subscribeEvents?(brokerSessionId: string): Promise<boolean> | boolean;
};

export type BrokerServerOptions = {
  adapterHost: BrokerAdapterHost;
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
            const brokerSessionId = (
              message.params as { brokerSessionId?: string } | undefined
            )?.brokerSessionId;
            if (!brokerSessionId) {
              throw new Error('attachSession requires brokerSessionId');
            }
            const result = await options.adapterHost.attach(brokerSessionId);
            socket.send(JSON.stringify(createBrokerRpcSuccess(message.id, result)));
            return;
          }

          if (message.method === 'sendMessage') {
            if (!options.adapterHost.sendMessage) {
              throw new Error('sendMessage is not supported by this broker');
            }

            const params = message.params as
              | { brokerSessionId?: string; text?: string }
              | undefined;
            if (!params?.brokerSessionId || typeof params.text !== 'string') {
              throw new Error('sendMessage requires brokerSessionId and text');
            }
            const { brokerSessionId, text } = params;
            const result = await options.adapterHost.sendMessage(brokerSessionId, text);
            socket.send(
              JSON.stringify(createBrokerRpcSuccess(message.id, result ?? true)),
            );
            return;
          }

          if (message.method === 'interruptSession') {
            if (!options.adapterHost.interruptSession) {
              throw new Error('interruptSession is not supported by this broker');
            }

            const params = message.params as
              | { brokerSessionId?: string; reason?: string }
              | undefined;
            if (!params?.brokerSessionId || typeof params.reason !== 'string') {
              throw new Error('interruptSession requires brokerSessionId and reason');
            }
            const { brokerSessionId, reason } = params;
            const result = await options.adapterHost.interruptSession(
              brokerSessionId,
              reason,
            );
            socket.send(
              JSON.stringify(createBrokerRpcSuccess(message.id, result ?? true)),
            );
            return;
          }

          if (message.method === 'resolveApproval') {
            if (!options.adapterHost.resolveApproval) {
              throw new Error('resolveApproval is not supported by this broker');
            }

            const params = message.params as
              | {
                  brokerSessionId?: string;
                  approvalId?: string;
                  decision?: 'approve' | 'deny';
                }
              | undefined;
            if (
              !params?.brokerSessionId ||
              !params.approvalId ||
              (params.decision !== 'approve' && params.decision !== 'deny')
            ) {
              throw new Error(
                'resolveApproval requires brokerSessionId, approvalId, and decision',
              );
            }
            const { brokerSessionId, approvalId, decision } = params;
            const result = await options.adapterHost.resolveApproval(
              brokerSessionId,
              approvalId,
              decision,
            );
            socket.send(
              JSON.stringify(createBrokerRpcSuccess(message.id, result ?? true)),
            );
            return;
          }

          if (message.method === 'captureEditorContext') {
            const brokerSessionId = (
              message.params as { brokerSessionId?: string } | undefined
            )?.brokerSessionId;
            if (!brokerSessionId) {
              throw new Error('captureEditorContext requires brokerSessionId');
            }
            const result = options.adapterHost.captureEditorContext
              ? await options.adapterHost.captureEditorContext(brokerSessionId)
              : null;
            socket.send(JSON.stringify(createBrokerRpcSuccess(message.id, result)));
            return;
          }

          if (message.method === 'listAttachments') {
            const brokerSessionId = (
              message.params as { brokerSessionId?: string } | undefined
            )?.brokerSessionId;
            if (!brokerSessionId) {
              throw new Error('listAttachments requires brokerSessionId');
            }
            const result = options.adapterHost.listAttachments
              ? await options.adapterHost.listAttachments(brokerSessionId)
              : [];
            socket.send(JSON.stringify(createBrokerRpcSuccess(message.id, result)));
            return;
          }

          if (message.method === 'setSessionDesiredMode') {
            if (!options.adapterHost.setSessionDesiredMode) {
              throw new Error('setSessionDesiredMode is not supported by this broker');
            }

            const params = message.params as
              | {
                  brokerSessionId?: string;
                  desiredMode?: BridgeDesiredMode;
                }
              | undefined;
            if (
              !params?.brokerSessionId ||
              (params.desiredMode !== 'runtime_preferred' &&
                params.desiredMode !== 'storage_preferred')
            ) {
              throw new Error(
                'setSessionDesiredMode requires brokerSessionId and desiredMode',
              );
            }
            const { brokerSessionId, desiredMode } = params;
            const result = await options.adapterHost.setSessionDesiredMode(
              brokerSessionId,
              desiredMode,
            );
            socket.send(JSON.stringify(createBrokerRpcSuccess(message.id, result)));
            return;
          }

          if (message.method === 'subscribeEvents') {
            const brokerSessionId = (
              message.params as { brokerSessionId?: string } | undefined
            )?.brokerSessionId;
            if (!brokerSessionId) {
              throw new Error('subscribeEvents requires brokerSessionId');
            }
            await options.adapterHost.subscribeEvents?.(brokerSessionId);
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
