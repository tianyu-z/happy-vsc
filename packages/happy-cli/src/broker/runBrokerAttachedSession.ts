import { ApiClient } from '../api/api';
import type { Metadata } from '../api/types';
import { notifyDaemonSessionStarted } from '../daemon/controlClient';
import { initialMachineMetadata } from '../daemon/run';
import type { Credentials } from '../persistence';
import { readSettings } from '../persistence';
import { setupOfflineReconnection } from '../utils/setupOfflineReconnection';

import { BrokerClient } from './BrokerClient';
import type { BrokerEventStream } from './BrokerEventStream';
import { BrokerRelayRunner, type BrokerRelayRunnerOptions } from './BrokerRelayRunner';
import { loadBrokerManifest } from './brokerManifest';

type BrokerAttachClient = Pick<
  BrokerClient,
  'attachSession' | 'interruptSession' | 'resolveApproval' | 'sendMessage'
>;
type BrokerAttachApi = Pick<ApiClient, 'getOrCreateMachine' | 'getOrCreateSession' | 'sessionSyncClient'>;

export type RunBrokerAttachedSessionOptions = {
  credentials?: Credentials;
  api?: BrokerAttachApi;
  brokerClient?: BrokerAttachClient;
  brokerEventStream?: Pick<BrokerEventStream, 'close' | 'subscribeEvents'>;
  brokerRootDir?: string;
  brokerUrl?: string;
  brokerSessionId: string;
  startedBy?: 'daemon' | 'terminal';
  machineId?: string;
  brokerMachineId?: string;
  brokerInstanceId?: string;
  canonicalBrokerSessionKey?: string;
  runtimeKind?: string;
  runtimeLabel?: string;
  windowLabel?: string;
  preferredHostIp?: string;
  notifyDaemonSessionStarted?: (sessionId: string, metadata: Metadata) => Promise<unknown>;
  sessionTag?: string;
};

export async function runBrokerAttachedSession(options: RunBrokerAttachedSessionOptions): Promise<void> {
  const api = await resolveApi(options);
  const machineId = await resolveMachineId(options.machineId);
  const brokerClient = await resolveBrokerClient(options);
  const brokerUrl = await resolveBrokerUrl(options);
  const setupReconnect: BrokerRelayRunnerOptions['setupOfflineReconnection'] = (runnerOptions) =>
    setupOfflineReconnection({
      ...runnerOptions,
      api: runnerOptions.api as ApiClient,
    });
  const runner = new BrokerRelayRunner({
    api,
    brokerClient,
    brokerEventStream: options.brokerEventStream,
    brokerSessionId: options.brokerSessionId,
    brokerUrl,
    machineMetadata: initialMachineMetadata,
    machineId,
    brokerMachineId: options.brokerMachineId,
    brokerInstanceId: options.brokerInstanceId,
    canonicalBrokerSessionKey: options.canonicalBrokerSessionKey,
    runtimeKind: options.runtimeKind,
    runtimeLabel: options.runtimeLabel,
    windowLabel: options.windowLabel,
    preferredHostIp: options.preferredHostIp,
    notifyDaemonSessionStarted:
      options.notifyDaemonSessionStarted ?? notifyDaemonSessionStarted,
    sessionTag: options.sessionTag,
    setupOfflineReconnection: setupReconnect,
    startedBy: options.startedBy,
  });

  await runner.start();
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

async function resolveBrokerUrl(options: RunBrokerAttachedSessionOptions): Promise<string | undefined> {
  if (options.brokerUrl) {
    return options.brokerUrl;
  }

  if (options.brokerEventStream) {
    return undefined;
  }

  const manifest = await loadBrokerManifest(options.brokerRootDir ?? process.cwd());
  return manifest.url;
}
