import WebSocket from 'ws';
import { z } from 'zod';

import {
  brokerEventNotificationSchema,
  type BrokerEventLogEntry,
} from './brokerTypes';

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

const DEFAULT_SUBSCRIBE_TIMEOUT_MS = 10_000;

export class BrokerEventStream {
  private socket: WebSocket | null = null;
  private messageListener: ((raw: WebSocket.RawData) => void) | null = null;

  constructor(
    private readonly url: string,
    private readonly subscribeTimeoutMs = DEFAULT_SUBSCRIBE_TIMEOUT_MS,
  ) {}

  async subscribeEvents(
    brokerSessionId: string,
    onEvent: (event: BrokerEventLogEntry) => void,
  ): Promise<void> {
    if (this.socket) {
      throw new Error('Broker event stream already subscribed');
    }

    const socket = new WebSocket(this.url);
    const id = `subscribeEvents-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.socket = socket;

    try {
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const timeout = setTimeout(() => {
          fail(new Error('Broker event subscription timed out'));
        }, this.subscribeTimeoutMs);

        const cleanupSubscribeHandlers = () => {
          clearTimeout(timeout);
          socket.off('open', handleOpen);
          socket.off('error', handleError);
          socket.off('close', handleCloseBeforeSubscribed);
        };

        const succeed = () => {
          if (settled) {
            return;
          }

          settled = true;
          cleanupSubscribeHandlers();
          resolve();
        };

        const fail = (error: unknown) => {
          if (settled) {
            return;
          }

          settled = true;
          cleanupSubscribeHandlers();
          reject(error instanceof Error ? error : new Error(String(error)));
        };

        const handleOpen = () => {
          try {
            socket.send(JSON.stringify({ id, method: 'subscribeEvents', params: { brokerSessionId } }));
          } catch (error) {
            fail(error);
          }
        };

        const handleMessage = (raw: WebSocket.RawData) => {
          try {
            const message = JSON.parse(String(raw)) as Partial<RpcSuccess & RpcError>;

            if (message.id === id) {
              if (message.error) {
                fail(
                  new Error(
                    message.error.message ?? 'Broker subscribeEvents request failed',
                  ),
                );
                return;
              }

              z.literal(true).parse(message.result);
              succeed();
              return;
            }

            const notification = brokerEventNotificationSchema.parse(message);
            if (notification.params.brokerSessionId === brokerSessionId) {
              onEvent(notification.params.entry);
            }
          } catch {
            // Ignore unrelated and malformed messages.
          }
        };

        const handleError = (error: Error) => {
          fail(error);
        };

        const handleCloseBeforeSubscribed = () => {
          fail(new Error('Broker event stream closed before subscribeEvents acknowledged'));
        };

        this.messageListener = handleMessage;
        socket.on('message', handleMessage);
        socket.once('open', handleOpen);
        socket.once('error', handleError);
        socket.once('close', handleCloseBeforeSubscribed);
      });
    } catch (error) {
      this.detachAndCloseSocket();
      throw error;
    }
  }

  async close(): Promise<void> {
    if (!this.socket) {
      return;
    }

    const socket = this.socket;
    this.detachSocketListeners(socket);
    this.socket = null;

    if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
      return;
    }

    await new Promise<void>((resolve) => {
      socket.once('close', () => resolve());
      socket.close();
    });
  }

  private detachAndCloseSocket(): void {
    if (!this.socket) {
      return;
    }

    const socket = this.socket;
    this.detachSocketListeners(socket);
    this.socket = null;

    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  }

  private detachSocketListeners(socket: WebSocket): void {
    if (this.messageListener) {
      socket.off('message', this.messageListener);
      this.messageListener = null;
    }

    socket.removeAllListeners('open');
    socket.removeAllListeners('error');
    socket.removeAllListeners('close');
  }
}
