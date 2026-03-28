import { BrokerClient } from './BrokerClient';
import {
  loadBrokerManifests,
  type BrokerManifestConnection,
} from './brokerManifest';
import type { BrokerDiscoveredSession } from './brokerTypes';

export type BrokerCatalogSession = BrokerDiscoveredSession & {
  brokerUrl: string;
  brokerRootDir: string;
  windowOrdinal: number;
  windowInstanceId: string;
  windowLabel: string;
  workspaceLabel: string;
  workspacePath: string | null;
  isActiveWindow: boolean;
  windowLastActiveAt: string | null;
};

export type BrokerSessionCatalog = {
  sessions: BrokerCatalogSession[];
  entries: Array<{
    session: BrokerCatalogSession;
    manifest: BrokerManifestConnection;
  }>;
};

export type BrokerSessionAttachTarget = {
  brokerUrl: string;
  brokerRootDir: string;
  session: BrokerCatalogSession;
  manifest: BrokerManifestConnection;
};

type DiscoverCatalogDeps = {
  loadManifests?: (rootDir: string) => Promise<BrokerManifestConnection[]>;
  createBrokerClient?: (
    brokerUrl: string,
  ) => Pick<BrokerClient, 'discoverSessions'>;
};

export async function discoverBrokerSessionCatalog(
  brokerRootDir: string,
  deps: DiscoverCatalogDeps = {},
): Promise<BrokerSessionCatalog> {
  const loadManifests = deps.loadManifests ?? loadBrokerManifests;
  const createBrokerClient =
    deps.createBrokerClient ?? ((brokerUrl) => new BrokerClient(brokerUrl));
  const manifests = await loadManifests(brokerRootDir);
  const sortedManifests = [...manifests].sort(compareManifestsForOrdinal);

  const sessionsByManifest = await Promise.all(
    sortedManifests.map(async (manifest) => {
      const brokerClient = createBrokerClient(manifest.url);
      try {
        const sessions = await brokerClient.discoverSessions();
        return { manifest, sessions };
      } catch (error) {
        if (isIgnorableBrokerDiscoveryError(error)) {
          return null;
        }

        throw error;
      }
    }),
  );

  const reachableManifestSessions = sessionsByManifest.filter(
    (discovered): discovered is NonNullable<typeof discovered> => discovered !== null,
  );

  const entries = reachableManifestSessions.flatMap((discovered, index) => {
    const windowOrdinal = index + 1;

    return discovered.sessions.map((session) => ({
      session: {
        ...session,
        brokerUrl: discovered.manifest.url,
        brokerRootDir,
        windowOrdinal,
        windowInstanceId: discovered.manifest.windowInstanceId,
        windowLabel: discovered.manifest.windowLabel,
        workspaceLabel: discovered.manifest.workspaceLabel,
        workspacePath: discovered.manifest.workspacePath ?? null,
        isActiveWindow: discovered.manifest.isActiveWindow,
        windowLastActiveAt: discovered.manifest.windowLastActiveAt ?? null,
      },
      manifest: discovered.manifest,
    }));
  });

  return {
    sessions: entries.map((entry) => entry.session),
    entries,
  };
}

export function resolveBrokerSessionAttachTarget(
  catalog: BrokerSessionCatalog,
  brokerSessionId: string,
): BrokerSessionAttachTarget {
  const matches = catalog.entries.filter(
    (entry) => entry.session.brokerSessionId === brokerSessionId,
  );

  if (matches.length === 0) {
    throw new Error(`Broker session "${brokerSessionId}" was not found`);
  }

  if (matches.length > 1) {
    throw new Error(
      `Duplicate brokerSessionId "${brokerSessionId}" found across broker windows`,
    );
  }

  const match = matches[0];
  return {
    brokerUrl: match.session.brokerUrl,
    brokerRootDir: match.session.brokerRootDir,
    session: match.session,
    manifest: match.manifest,
  };
}

function compareManifestsForOrdinal(
  left: BrokerManifestConnection,
  right: BrokerManifestConnection,
): number {
  if (left.isActiveWindow !== right.isActiveWindow) {
    return left.isActiveWindow ? -1 : 1;
  }

  const leftActiveAt = Date.parse(left.windowLastActiveAt ?? '');
  const rightActiveAt = Date.parse(right.windowLastActiveAt ?? '');
  const leftHasActiveAt = Number.isFinite(leftActiveAt);
  const rightHasActiveAt = Number.isFinite(rightActiveAt);

  if (leftHasActiveAt && rightHasActiveAt && leftActiveAt !== rightActiveAt) {
    return rightActiveAt - leftActiveAt;
  }

  if (leftHasActiveAt !== rightHasActiveAt) {
    return leftHasActiveAt ? -1 : 1;
  }

  return left.windowLabel.localeCompare(right.windowLabel, undefined, {
    sensitivity: 'base',
  });
}

function isIgnorableBrokerDiscoveryError(error: unknown): boolean {
  if (hasErrorCode(error) && BROKER_NETWORK_ERROR_CODES.has(error.code)) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('timed out') ||
    message.includes('connection closed before response')
  );
}

const BROKER_NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
]);

function hasErrorCode(
  error: unknown,
): error is NodeJS.ErrnoException & { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as NodeJS.ErrnoException).code === 'string'
  );
}
