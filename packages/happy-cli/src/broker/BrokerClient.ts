import WebSocket from 'ws';

import {
  brokerDiscoveredSessionSchema,
  brokerSnapshotSchema,
  type BrokerDiscoveredSession,
  type BrokerSnapshot,
} from 'happy-wire';

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

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

export class BrokerClient {
  constructor(
    private readonly url: string,
    private readonly requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  ) {}

  async discoverSessions(): Promise<BrokerDiscoveredSession[]> {
    const result = await this.request('discoverSessions', {});
    return brokerDiscoveredSessionSchema.array().parse(result);
  }

  async attachSession(brokerSessionId: string): Promise<BrokerSnapshot | null> {
    const result = await this.request('attachSession', { brokerSessionId });
    return brokerSnapshotSchema.nullable().parse(result);
  }

  private async request(method: string, params: unknown): Promise<unknown> {
    const socket = new WebSocket(this.url);
    const id = `${method}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      return await new Promise<unknown>((resolve, reject) => {
        let settled = false;
        const timeout = setTimeout(() => {
          fail(new Error(`Broker RPC request timed out for method: ${method}`));
        }, this.requestTimeoutMs);

        const cleanup = () => {
          clearTimeout(timeout);
          socket.off('open', handleOpen);
          socket.off('message', handleMessage);
          socket.off('error', handleError);
          socket.off('close', handleClose);
        };

        const succeed = (result: unknown) => {
          if (settled) {
            return;
          }

          settled = true;
          cleanup();
          resolve(result);
        };

        const fail = (error: unknown) => {
          if (settled) {
            return;
          }

          settled = true;
          cleanup();
          reject(error instanceof Error ? error : new Error(String(error)));
        };

        const handleOpen = () => {
          try {
            socket.send(JSON.stringify({ id, method, params }));
          } catch (error) {
            fail(error);
          }
        };

        const handleMessage = (raw: WebSocket.RawData) => {
          try {
            const message = JSON.parse(String(raw)) as Partial<RpcSuccess & RpcError>;
            if (message.id !== id) {
              return;
            }

            if (message.error) {
              fail(new Error(message.error.message ?? `Broker RPC failed for method: ${method}`));
              return;
            }

            succeed(message.result);
          } catch (error) {
            fail(error);
          }
        };

        const handleError = (error: Error) => {
          fail(error);
        };

        const handleClose = () => {
          fail(new Error(`Broker RPC connection closed before response for method: ${method}`));
        };

        socket.once('open', handleOpen);
        socket.on('message', handleMessage);
        socket.once('error', handleError);
        socket.once('close', handleClose);
      });
    } finally {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    }
  }
}
