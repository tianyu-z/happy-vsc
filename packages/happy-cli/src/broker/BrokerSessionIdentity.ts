export function buildBrokerSessionTag(opts: {
  machineId: string;
  canonicalSessionKey: string;
}): string {
  return `vscode-broker:${opts.machineId}:${opts.canonicalSessionKey}`;
}
