import { describe, expect, it, vi } from 'vitest';

import { createSessionMetadata } from '../utils/createSessionMetadata';
import { runBrokerAttachedSession } from './runBrokerAttachedSession';

const { mockApiClientCreate, mockNotifyDaemonSessionStarted, mockReadSettings } = vi.hoisted(
  () => ({
    mockApiClientCreate: vi.fn(),
    mockNotifyDaemonSessionStarted: vi.fn(),
    mockReadSettings: vi.fn(),
  }),
);

vi.mock('../api/api', () => ({
  ApiClient: {
    create: mockApiClientCreate,
  },
}));

vi.mock('../daemon/controlClient', () => ({
  notifyDaemonSessionStarted: mockNotifyDaemonSessionStarted,
}));

vi.mock('../daemon/run', () => ({
  initialMachineMetadata: {
    host: 'localhost',
    platform: 'darwin',
    happyCliVersion: '0.0.0-test',
    homeDir: '/tmp',
    happyHomeDir: '/tmp/.happy',
    happyLibDir: '/tmp/.happy/lib',
  },
}));

vi.mock('../persistence', () => ({
  readSettings: mockReadSettings,
}));

describe('createSessionMetadata broker projection', () => {
  it('does not stamp a direct session source for existing session paths', () => {
    const { metadata } = createSessionMetadata({
      flavor: 'claude',
      machineId: 'machine-1',
      startedBy: 'terminal',
    });

    expect(metadata.sessionSource).toBeUndefined();
  });

  it('marks broker-attached sessions with source metadata', () => {
    const { metadata } = createSessionMetadata({
      flavor: 'claude',
      machineId: 'machine-1',
      startedBy: 'terminal',
      source: 'broker_attached',
      brokerSessionId: 'broker-sess-1',
      brokerCapabilities: ['sendUserMessage'],
      brokerDegradedFlags: ['missing_editor_context'],
    });

    expect(metadata.sessionSource).toBe('broker_attached');
    expect(metadata.brokerSessionId).toBe('broker-sess-1');
    expect(metadata.brokerCapabilities).toEqual(['sendUserMessage']);
    expect(metadata.brokerDegradedFlags).toEqual(['missing_editor_context']);
  });
});

describe('runBrokerAttachedSession', () => {
  it('calls broker attach and starts a happy session with broker metadata', async () => {
    const discoverSessions = vi.fn();
    const attachSession = vi.fn().mockResolvedValue({
      brokerSessionId: 'broker-sess-1',
      provider: 'claude',
      latestSeq: 5,
      capabilities: ['sendUserMessage', 'interrupt'],
      degradedFlags: ['missing_editor_context'],
    });

    const getOrCreateMachine = vi.fn().mockResolvedValue({});
    const getOrCreateSession = vi.fn().mockResolvedValue({
      id: 'happy-session-1',
    });
    const notifyDaemonSessionStarted = vi.fn().mockResolvedValue({});

    const api = {
      getOrCreateMachine,
      getOrCreateSession,
    };

    await runBrokerAttachedSession({
      api: api as any,
      machineId: 'machine-1',
      startedBy: 'terminal',
      brokerSessionId: 'broker-sess-1',
      brokerClient: { discoverSessions, attachSession } as any,
      notifyDaemonSessionStarted,
    });

    expect(discoverSessions).not.toHaveBeenCalled();
    expect(attachSession).toHaveBeenCalledWith('broker-sess-1');
    expect(getOrCreateMachine).toHaveBeenCalledTimes(1);
    expect(getOrCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          sessionSource: 'broker_attached',
          brokerSessionId: 'broker-sess-1',
          brokerCapabilities: ['sendUserMessage', 'interrupt'],
          brokerDegradedFlags: ['missing_editor_context'],
        }),
      }),
    );
    expect(notifyDaemonSessionStarted).toHaveBeenCalledWith(
      'happy-session-1',
      expect.objectContaining({
        sessionSource: 'broker_attached',
      }),
    );
  });
});
