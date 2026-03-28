export type BrokerAttachArgsOptions = {
  startedBy: 'daemon' | 'terminal';
  brokerSessionId: string;
  brokerRootDir?: string;
  brokerUrl?: string;
  windowInstanceId?: string;
  brokerWindowLabel?: string;
  brokerWorkspaceLabel?: string;
  brokerWorkspacePath?: string;
  brokerWindowOrdinal?: number;
  brokerWindowIsActive?: boolean;
  brokerWindowLastActiveAt?: string;
};

export function buildBrokerAttachArgs(options: BrokerAttachArgsOptions): string[] {
  const args: string[] = [
    'broker-attached-session',
    '--started-by',
    options.startedBy,
    '--broker-session-id',
    options.brokerSessionId,
  ];

  if (options.brokerRootDir) {
    args.push('--broker-root-dir', options.brokerRootDir);
  }
  if (options.brokerUrl) {
    args.push('--broker-url', options.brokerUrl);
  }

  if (options.windowInstanceId) {
    args.push('--window-instance-id', options.windowInstanceId);
  }
  if (options.brokerWindowLabel) {
    args.push('--broker-window-label', options.brokerWindowLabel);
  }
  if (options.brokerWorkspaceLabel) {
    args.push('--broker-workspace-label', options.brokerWorkspaceLabel);
  }
  if (options.brokerWorkspacePath) {
    args.push('--broker-workspace-path', options.brokerWorkspacePath);
  }
  if (typeof options.brokerWindowOrdinal === 'number') {
    args.push('--broker-window-ordinal', String(options.brokerWindowOrdinal));
  }
  if (typeof options.brokerWindowIsActive === 'boolean') {
    args.push('--broker-window-is-active', options.brokerWindowIsActive ? 'true' : 'false');
  }
  if (options.brokerWindowLastActiveAt) {
    args.push('--broker-window-last-active-at', options.brokerWindowLastActiveAt);
  }

  return args;
}
