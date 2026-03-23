export type BrokerRpcRequest = {
  id: string;
  method: string;
  params?: unknown;
};

export type BrokerRpcSuccess = {
  id: string;
  result: unknown;
};

export type BrokerRpcError = {
  id: string;
  error: {
    message: string;
  };
};

export type BrokerRpcNotification = {
  method: string;
  params: unknown;
};

export function parseBrokerRpcRequest(raw: string): BrokerRpcRequest {
  return JSON.parse(raw) as BrokerRpcRequest;
}

export function createBrokerRpcSuccess(id: string, result: unknown): BrokerRpcSuccess {
  return { id, result };
}

export function createBrokerRpcError(id: string, message: string): BrokerRpcError {
  return {
    id,
    error: {
      message,
    },
  };
}

export function createBrokerRpcNotification(
  method: string,
  params: unknown,
): BrokerRpcNotification {
  return { method, params };
}
