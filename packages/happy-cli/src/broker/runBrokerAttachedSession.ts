import { randomUUID } from 'node:crypto';

import { ApiClient } from '../api/api';
import type { Metadata } from '../api/types';
import { notifyDaemonSessionStarted } from '../daemon/controlClient';
import { initialMachineMetadata } from '../daemon/run';
import type { Credentials } from '../persistence';
import { readSettings } from '../persistence';
import { createSessionMetadata } from '../utils/createSessionMetadata';

import { BrokerClient } from './BrokerClient';
import { loadBrokerManifest } from './brokerManifest';

type BrokerAttachClient = Pick<BrokerClient, 'attachSession'>;
type BrokerAttachApi = Pick<ApiClient, 'getOrCreateMachine' | 'getOrCreateSession'>;

export type RunBrokerAttachedSessionOptions = {
  credentials?: Credentials;
  api?: BrokerAttachApi;
  brokerClient?: BrokerAttachClient;
  brokerRootDir?: string;
  brokerUrl?: string;
  brokerSessionId: string;
  startedBy?: 'daemon' | 'terminal';
  machineId?: string;
  notifyDaemonSessionStarted?: (sessionId: string, metadata: Metadata) => Promise<unknown>;
  sessionTag?: string;
};

export async function runBrokerAttachedSession(options: RunBrokerAttachedSessionOptions): Promise<void> {
  const api = await resolveApi(options);
  const machineId = await resolveMachineId(options.machineId);
  const brokerClient = await resolveBrokerClient(options);
  const notify = options.notifyDaemonSessionStarted ?? notifyDaemonSessionStarted;

  await api.getOrCreateMachine({
    machineId,
    metadata: initialMachineMetadata,
  });

  const snapshot = await brokerClient.attachSession(options.brokerSessionId);
  if (!snapshot) {
    throw new Error(`Broker session not found: ${options.brokerSessionId}`);
  }

  const { state, metadata } = createSessionMetadata({
    flavor: snapshot.provider,
    machineId,
    startedBy: options.startedBy,
    source: 'broker_attached',
    brokerSessionId: snapshot.brokerSessionId,
    brokerCapabilities: snapshot.capabilities,
    brokerDegradedFlags: snapshot.degradedFlags,
  });

  const response = await api.getOrCreateSession({
    tag: options.sessionTag ?? randomUUID(),
    metadata,
    state,
  });

  if (response) {
    await notify(response.id, metadata);
  }
}

async function resolveApi(options: RunBrokerAttachedSessionOptions): Promise<BrokerAttachApi> {
  if (options.api) {
    return options.api;
  }
  if (!options.credentials) {
    throw new Error('credentials are required when api is not provided');
  }
  return ApiClient.create(options.credentials);
}

async function resolveMachineId(machineId?: string): Promise<string> {
  if (machineId) {
    return machineId;
  }
  const settings = await readSettings();
  if (!settings?.machineId) {
    throw new Error('No machine ID found in settings');
  }
  return settings.machineId;
}

async function resolveBrokerClient(options: RunBrokerAttachedSessionOptions): Promise<BrokerAttachClient> {
  if (options.brokerClient) {
    return options.brokerClient;
  }

  if (options.brokerUrl) {
    return new BrokerClient(options.brokerUrl);
  }

  const manifest = await loadBrokerManifest(options.brokerRootDir ?? process.cwd());
  return new BrokerClient(manifest.url);
}
