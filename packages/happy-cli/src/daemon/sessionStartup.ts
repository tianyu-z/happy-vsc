import type { ChildProcess } from 'child_process';

import type { SpawnSessionResult } from '@/modules/common/registerCommonHandlers';

import type { TrackedSession } from './types';

type SessionAwaiter = (completedSession: TrackedSession) => void;

type SessionLifecycleProcess = Pick<ChildProcess, 'once' | 'off'>;

function formatLabel(label?: string): string {
  return label ? ` (${label})` : '';
}

export function buildSpawnEnvironment(
  baseEnv: NodeJS.ProcessEnv,
  extraEnv: Record<string, string>,
): NodeJS.ProcessEnv {
  return {
    ...baseEnv,
    ...extraEnv,
  };
}

export function waitForSessionWebhook({
  pid,
  pidToAwaiter,
  childProcess,
  timeoutMs = 15_000,
  label,
}: {
  pid: number;
  pidToAwaiter: Map<number, SessionAwaiter>;
  childProcess?: SessionLifecycleProcess;
  timeoutMs?: number;
  label?: string;
}): Promise<SpawnSessionResult> {
  return new Promise((resolve) => {
    let settled = false;

    const cleanup = () => {
      pidToAwaiter.delete(pid);
      clearTimeout(timeout);
      childProcess?.off?.('exit', handleExit);
      childProcess?.off?.('error', handleError);
    };

    const finish = (result: SpawnSessionResult) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(result);
    };

    const handleExit = (code: number | null, signal: NodeJS.Signals | null) => {
      const details: string[] = [];
      if (code !== null) {
        details.push(`exit code ${code}`);
      }
      if (signal) {
        details.push(`signal ${signal}`);
      }

      finish({
        type: 'error',
        errorMessage: `Happy process exited before session webhook for PID ${pid}${formatLabel(label)}${details.length > 0 ? ` (${details.join(', ')})` : ''}`,
      });
    };

    const handleError = (error: Error) => {
      finish({
        type: 'error',
        errorMessage: `Happy process failed before session webhook for PID ${pid}${formatLabel(label)}: ${error.message}`,
      });
    };

    const timeout = setTimeout(() => {
      finish({
        type: 'error',
        errorMessage: `Session webhook timeout for PID ${pid}${formatLabel(label)}`,
      });
    }, timeoutMs);

    pidToAwaiter.set(pid, (completedSession) => {
      finish({
        type: 'success',
        sessionId: completedSession.happySessionId!,
      });
    });

    childProcess?.once('exit', handleExit);
    childProcess?.once('error', handleError);
  });
}
