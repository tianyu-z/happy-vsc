import { EventEmitter } from 'node:events';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TrackedSession } from './types';
import { buildSpawnEnvironment, waitForSessionWebhook } from './sessionStartup';

describe('buildSpawnEnvironment', () => {
  it('merges extra environment variables over the daemon environment', () => {
    expect(
      buildSpawnEnvironment(
        {
          KEEP_ME: '1',
          OVERRIDE_ME: 'old-value',
        },
        {
          OVERRIDE_ME: 'new-value',
          EXTRA_VALUE: 'set',
        },
      ),
    ).toMatchObject({
      KEEP_ME: '1',
      OVERRIDE_ME: 'new-value',
      EXTRA_VALUE: 'set',
    });
  });
});

describe('waitForSessionWebhook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves with the reported session id when the webhook arrives', async () => {
    const pidToAwaiter = new Map<number, (session: TrackedSession) => void>();
    const childProcess = new EventEmitter();

    const resultPromise = waitForSessionWebhook({
      pid: 42,
      pidToAwaiter,
      childProcess: childProcess as any,
      timeoutMs: 1_000,
      label: 'broker-attached',
    });

    pidToAwaiter.get(42)?.({
      startedBy: 'daemon',
      pid: 42,
      happySessionId: 'happy-sess-1',
    });

    await expect(resultPromise).resolves.toEqual({
      type: 'success',
      sessionId: 'happy-sess-1',
    });
    expect(pidToAwaiter.has(42)).toBe(false);
  });

  it('fails immediately when the child exits before the webhook arrives', async () => {
    const pidToAwaiter = new Map<number, (session: TrackedSession) => void>();
    const childProcess = new EventEmitter();

    const resultPromise = waitForSessionWebhook({
      pid: 52,
      pidToAwaiter,
      childProcess: childProcess as any,
      timeoutMs: 1_000,
      label: 'broker-attached',
    });

    childProcess.emit('exit', 9, null);

    await expect(resultPromise).resolves.toMatchObject({
      type: 'error',
      errorMessage: expect.stringContaining('exit code 9'),
    });
    expect(pidToAwaiter.has(52)).toBe(false);
  });

  it('times out when no webhook arrives', async () => {
    const pidToAwaiter = new Map<number, (session: TrackedSession) => void>();

    const resultPromise = waitForSessionWebhook({
      pid: 62,
      pidToAwaiter,
      timeoutMs: 1_000,
      label: 'broker-attached',
    });

    await vi.advanceTimersByTimeAsync(1_000);

    await expect(resultPromise).resolves.toEqual({
      type: 'error',
      errorMessage: 'Session webhook timeout for PID 62 (broker-attached)',
    });
    expect(pidToAwaiter.has(62)).toBe(false);
  });
});
