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

export type BrokerEventStreamDisconnectReason =
  | { kind: 'close' }
  | { kind: 'error'; error: Error };

export type BrokerEventStreamSubscribeOptions = {
  onDisconnect?: (reason: BrokerEventStreamDisconnectReason) => void;
};

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
    options: BrokerEventStreamSubscribeOptions = {},
  ): Promise<void> {
    if (this.socket) {
      throw new Error('Broker event stream already subscribed');
    }

    const socket = new WebSocket(this.url);
    const id = `subscribeEvents-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.socket = socket;
    const clearSocketIfCurrent = () => {
      if (this.socket !== socket) {
        return;
      }

      this.detachSocketListeners(socket);
      this.socket = null;
    };
    let disconnectNotified = false;
    const notifyDisconnect = (reason: BrokerEventStreamDisconnectReason) => {
      if (disconnectNotified) {
        return;
      }

      disconnectNotified = true;
      try {
        options.onDisconnect?.(reason);
      } catch {
        // Keep transport cleanup resilient even if consumer callback fails.
      }
    };

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
          socket.on('close', () => {
            try {
              notifyDisconnect({ kind: 'close' });
            } finally {
              clearSocketIfCurrent();
            }
          });
          socket.on('error', (error) => {
            try {
              notifyDisconnect({ kind: 'error', error });
            } finally {
              clearSocketIfCurrent();
            }
          });
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
          let message: Partial<RpcSuccess & RpcError>;
          try {
            message = JSON.parse(String(raw)) as Partial<RpcSuccess & RpcError>;
          } catch {
            // Ignore malformed frames that are unrelated to the subscription handshake.
            return;
          }

          if (message.id === id) {
            if (message.error) {
              fail(
                new Error(
                  message.error.message ?? 'Broker subscribeEvents request failed',
                ),
              );
              return;
            }

            try {
              z.literal(true).parse(message.result);
            } catch (error) {
              fail(error);
              return;
            }

            succeed();
            return;
          }

          let notification;
          try {
            notification = brokerEventNotificationSchema.parse(message);
          } catch {
            // Ignore unrelated and malformed notifications.
            return;
          }

          if (notification.params.brokerSessionId === brokerSessionId) {
            onEvent(notification.params.entry);
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
