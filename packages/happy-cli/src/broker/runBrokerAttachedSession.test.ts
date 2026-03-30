import { describe, expect, it, vi } from 'vitest';

import { createSessionMetadata } from '../utils/createSessionMetadata';
import { runBrokerAttachedSession } from './runBrokerAttachedSession';

const {
  mockApiClientCreate,
  mockBrokerRelayRunner,
  mockBrokerRelayRunnerStart,
  mockLoadBrokerManifest,
  mockNotifyDaemonSessionStarted,
  mockReadSettings,
  mockSetupOfflineReconnection,
} = vi.hoisted(
  () => ({
    mockApiClientCreate: vi.fn(),
    mockBrokerRelayRunner: vi.fn(),
    mockBrokerRelayRunnerStart: vi.fn(),
    mockLoadBrokerManifest: vi.fn(),
    mockNotifyDaemonSessionStarted: vi.fn(),
    mockReadSettings: vi.fn(),
    mockSetupOfflineReconnection: vi.fn(),
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

vi.mock('../utils/setupOfflineReconnection', () => ({
  setupOfflineReconnection: mockSetupOfflineReconnection,
}));

vi.mock('./BrokerRelayRunner', () => ({
  BrokerRelayRunner: mockBrokerRelayRunner.mockImplementation(() => ({
    start: mockBrokerRelayRunnerStart,
  })),
}));

vi.mock('./brokerManifest', () => ({
  loadBrokerManifest: mockLoadBrokerManifest,
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
      transport: {
        kind: 'vscode-broker',
        brokerMachineId: 'machine-1',
        brokerInstanceId: 'instance-1',
        brokerSessionId: 'broker-sess-1',
        canonicalBrokerSessionKey: 'machine-1:instance-1:broker-sess-1',
        runtimeKind: 'ssh',
        runtimeLabel: 'ssh:gpu-1',
        windowLabel: 'api',
        preferredHostIp: '10.0.0.2',
      },
      brokerCapabilities: ['sendUserMessage'],
      brokerDegradedFlags: ['missing_editor_context'],
      brokerDesiredMode: 'runtime_preferred',
      brokerEffectiveMode: 'runtime',
      brokerModeReason: 'runtime_ready',
      brokerCompatibility: 'supported',
      brokerProviderExtension: {
        id: 'anthropic.claude-code',
        version: '1.0.0',
      },
      brokerProbeHealth: {
        runtime: 'ready',
        storage: 'ready',
      },
    });

    expect(metadata.sessionSource).toBe('broker_attached');
    expect(metadata.brokerSessionId).toBe('broker-sess-1');
    expect(metadata.brokerCapabilities).toEqual(['sendUserMessage']);
    expect(metadata.brokerDegradedFlags).toEqual(['missing_editor_context']);
    expect(metadata.brokerDesiredMode).toBe('runtime_preferred');
    expect(metadata.brokerEffectiveMode).toBe('runtime');
    expect(metadata.brokerModeReason).toBe('runtime_ready');
    expect(metadata.transportKind).toBe('vscode-broker');
    expect(metadata.brokerMachineId).toBe('machine-1');
    expect(metadata.brokerInstanceId).toBe('instance-1');
    expect(metadata.canonicalBrokerSessionKey).toBe(
      'machine-1:instance-1:broker-sess-1',
    );
    expect(metadata.runtimeKind).toBe('ssh');
    expect(metadata.runtimeLabel).toBe('ssh:gpu-1');
    expect(metadata.windowLabel).toBe('api');
    expect(metadata.preferredHostIp).toBe('10.0.0.2');
  });
});

describe('runBrokerAttachedSession', () => {
  it('delegates broker-attached sessions to the long-lived relay runner', async () => {
    const discoverSessions = vi.fn();
    const attachSession = vi.fn();

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
      brokerUrl: 'ws://broker.test',
      machineId: 'machine-1',
      startedBy: 'terminal',
      brokerSessionId: 'broker-sess-1',
      brokerClient: { discoverSessions, attachSession } as any,
      notifyDaemonSessionStarted,
    });

    expect(discoverSessions).not.toHaveBeenCalled();
    expect(attachSession).not.toHaveBeenCalled();
    expect(getOrCreateMachine).not.toHaveBeenCalled();
    expect(getOrCreateSession).not.toHaveBeenCalled();
    expect(mockBrokerRelayRunner).toHaveBeenCalledWith(
      expect.objectContaining({
        api,
        brokerClient: { discoverSessions, attachSession },
        brokerSessionId: 'broker-sess-1',
        brokerUrl: 'ws://broker.test',
        machineId: 'machine-1',
        notifyDaemonSessionStarted,
        startedBy: 'terminal',
      }),
    );
    expect(mockBrokerRelayRunnerStart).toHaveBeenCalledTimes(1);
    expect(notifyDaemonSessionStarted).not.toHaveBeenCalled();
  });

  it('resolves brokerUrl from the manifest when the wrapper delegates to the runner', async () => {
    const brokerClient = {
      attachSession: vi.fn(),
      interruptSession: vi.fn(),
      resolveApproval: vi.fn(),
      sendMessage: vi.fn(),
    };
    const api = {
      getOrCreateMachine: vi.fn(),
      getOrCreateSession: vi.fn(),
      sessionSyncClient: vi.fn(),
    };

    mockLoadBrokerManifest.mockResolvedValueOnce({
      url: 'ws://broker.from.manifest',
    });

    await runBrokerAttachedSession({
      api: api as any,
      brokerClient: brokerClient as any,
      brokerRootDir: '/tmp/workspace',
      brokerSessionId: 'broker-sess-1',
      machineId: 'machine-1',
    });

    expect(mockLoadBrokerManifest).toHaveBeenCalledWith('/tmp/workspace');
    expect(mockBrokerRelayRunner).toHaveBeenCalledWith(
      expect.objectContaining({
        brokerClient,
        brokerSessionId: 'broker-sess-1',
        brokerUrl: 'ws://broker.from.manifest',
      }),
    );
  });
});
