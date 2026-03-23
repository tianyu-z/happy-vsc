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

export class BrokerClient {
  constructor(private readonly url: string) {}

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

    await new Promise<void>((resolve, reject) => {
      socket.once('open', () => resolve());
      socket.once('error', reject);
    });

    const id = `${method}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const responsePromise = new Promise<unknown>((resolve, reject) => {
      socket.on('message', (raw) => {
        const message = JSON.parse(String(raw)) as Partial<RpcSuccess & RpcError>;
        if (message.id !== id) {
          return;
        }

        if (message.error) {
          reject(new Error(message.error.message ?? `Broker RPC failed for method: ${method}`));
          return;
        }

        resolve(message.result);
      });

      socket.once('error', (error) => {
        reject(error);
      });
    });

    socket.send(JSON.stringify({ id, method, params }));

    try {
      return await responsePromise;
    } finally {
      socket.close();
    }
  }
}
