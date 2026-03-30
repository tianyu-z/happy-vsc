export function buildBrokerSessionTag(opts: {
  machineId: string;
  brokerSessionId: string;
}): string {
  return `broker:${opts.machineId}:${opts.brokerSessionId}`;
}
