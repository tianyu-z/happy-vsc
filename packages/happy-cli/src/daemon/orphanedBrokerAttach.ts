import psList from 'ps-list';

type ListedProcess = {
  pid: number;
  cmd?: string;
};

type CleanupOptions = {
  currentPid?: number;
  listProcesses?: () => Promise<ListedProcess[]>;
  kill?: (pid: number, signal: NodeJS.Signals) => void;
};

const brokerAttachedSessionMarker = 'broker-attached-session';
const daemonStartedMarker = '--started-by daemon';

export function findOrphanedDaemonBrokerAttachedPids(
  processes: ListedProcess[],
  currentPid: number = process.pid,
): number[] {
  return processes
    .filter((processInfo) => {
      const command = processInfo.cmd ?? '';
      return (
        processInfo.pid !== currentPid &&
        command.includes(brokerAttachedSessionMarker) &&
        command.includes(daemonStartedMarker)
      );
    })
    .map((processInfo) => processInfo.pid);
}

export async function cleanupOrphanedDaemonBrokerAttachedProcesses(
  options: CleanupOptions = {},
): Promise<{
  attempted: number[];
  killed: number[];
  failed: Array<{ pid: number; error: string }>;
}> {
  const listProcesses = options.listProcesses ?? psList;
  const kill = options.kill ?? ((pid: number, signal: NodeJS.Signals) => process.kill(pid, signal));
  const attempted = findOrphanedDaemonBrokerAttachedPids(
    await listProcesses(),
    options.currentPid ?? process.pid,
  );
  const killed: number[] = [];
  const failed: Array<{ pid: number; error: string }> = [];

  for (const pid of attempted) {
    try {
      kill(pid, 'SIGTERM');
      killed.push(pid);
    } catch (error) {
      failed.push({
        pid,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { attempted, killed, failed };
}
