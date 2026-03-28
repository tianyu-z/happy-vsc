import { createHash } from 'node:crypto';

import type { BrokerAttachability } from 'happy-wire';

import type {
  NormalizedProviderSession,
  ProviderSessionNormalizeInput,
  RuntimeSessionEvidence,
  StorageSessionEvidence,
  WorkspaceLocator,
} from './types';

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function normalizeUriCase(uri: string): string {
  if (!/^file:\/\/\/[A-Za-z]:/.test(uri)) {
    return uri;
  }

  return uri.toLowerCase();
}

function normalizeFolderUris(folderUris: string[]): string[] {
  return [...folderUris].map(normalizeUriCase).sort();
}

function mergeWorkspaceEvidence(
  runtimeWorkspace: WorkspaceLocator | undefined,
  storageWorkspace: WorkspaceLocator | undefined,
): WorkspaceLocator {
  return {
    remoteAuthority: firstNonEmpty(
      runtimeWorkspace?.remoteAuthority,
      storageWorkspace?.remoteAuthority,
    ),
    workspaceFileUri: firstNonEmpty(
      runtimeWorkspace?.workspaceFileUri,
      storageWorkspace?.workspaceFileUri,
    ),
    folderUris: unique([
      ...(runtimeWorkspace?.folderUris ?? []),
      ...(storageWorkspace?.folderUris ?? []),
    ]),
  };
}

function buildWorkspaceIdentity(workspace: WorkspaceLocator): string {
  const prefix = workspace.remoteAuthority
    ? `remote:${workspace.remoteAuthority}|`
    : '';

  if (workspace.workspaceFileUri) {
    return `${prefix}workspace-file:${normalizeUriCase(workspace.workspaceFileUri)}`;
  }

  const folderUris = normalizeFolderUris(workspace.folderUris ?? []);
  if (folderUris.length <= 1) {
    return `${prefix}folder:${folderUris[0] ?? 'unknown'}`;
  }

  return `${prefix}multiroot:${folderUris.join(',')}`;
}

function runtimeIdentity(runtime: RuntimeSessionEvidence | undefined): string | null {
  if (!runtime) {
    return null;
  }

  return firstNonEmpty(
    runtime.sessionId,
    runtime.threadId,
    runtime.conversationId,
  );
}

function storageIdentity(storage: StorageSessionEvidence | undefined): string | null {
  if (!storage) {
    return null;
  }

  return firstNonEmpty(storage.conversationId);
}

function storageRecordIdentity(storage: StorageSessionEvidence | undefined): string | null {
  if (!storage) {
    return null;
  }

  return firstNonEmpty(storage.recordId);
}

function transcriptStateIdentity(
  runtime: RuntimeSessionEvidence | undefined,
  storage: StorageSessionEvidence | undefined,
): string | null {
  return firstNonEmpty(
    ...(runtime?.transcriptObjectIds ?? []),
    ...(storage?.transcriptObjectIds ?? []),
  );
}

function unstableConversationIdentity(input: ProviderSessionNormalizeInput): string {
  const fallbackSeed = firstNonEmpty(
    input.runtime?.providerSessionRef,
    input.storage?.providerSessionRef,
    input.storage?.recordId,
    input.runtime?.title,
    input.storage?.title,
    input.provider,
  );
  const digest = createHash('sha256')
    .update(fallbackSeed ?? 'unstable-session')
    .digest('hex')
    .slice(0, 16);

  return `unstable:${digest}`;
}

function canonicalConversationKey(
  providerExtensionId: string,
  workspaceIdentity: string,
  identity: string,
): string {
  return `${providerExtensionId}|${workspaceIdentity}|${identity}`;
}

function recordAliasKey(
  providerExtensionId: string,
  workspaceIdentity: string,
  recordId: string,
): string {
  return `${providerExtensionId}|${workspaceIdentity}|${recordId}`;
}

function resolveSourceAttachability(params: {
  runtime: RuntimeSessionEvidence | undefined;
  storage: StorageSessionEvidence | undefined;
}): BrokerAttachability {
  if (params.runtime?.attachability) {
    return params.runtime.attachability;
  }

  if ((params.runtime?.degradedFlags?.length ?? 0) > 0) {
    return 'attachable_with_degraded_capabilities';
  }

  if (params.storage?.attachability) {
    return params.storage.attachability;
  }

  if ((params.storage?.degradedFlags?.length ?? 0) > 0) {
    return 'attachable_with_degraded_capabilities';
  }

  return 'attachable';
}

export class ProviderSessionNormalizer {
  private readonly aliasToCanonical = new Map<string, string>();
  private readonly recordToCanonical = new Map<string, string>();

  normalize(input: ProviderSessionNormalizeInput): NormalizedProviderSession {
    const workspace = mergeWorkspaceEvidence(
      input.runtime?.workspace,
      input.storage?.workspace,
    );
    const workspaceIdentity = buildWorkspaceIdentity(workspace);
    const runtimeConversationIdentity = runtimeIdentity(input.runtime);
    const storageConversationIdentity = storageIdentity(input.storage);
    const storageRecordConversationIdentity = storageRecordIdentity(input.storage);
    const transcriptConversationIdentity = transcriptStateIdentity(
      input.runtime,
      input.storage,
    );

    const runtimeAliasKey = runtimeConversationIdentity
      ? canonicalConversationKey(
          input.providerExtensionId,
          workspaceIdentity,
          runtimeConversationIdentity,
        )
      : null;
    const storageAliasKey = storageConversationIdentity
      ? canonicalConversationKey(
          input.providerExtensionId,
          workspaceIdentity,
          storageConversationIdentity,
        )
      : null;
    const recordKey = storageRecordConversationIdentity
      ? recordAliasKey(
          input.providerExtensionId,
          workspaceIdentity,
          storageRecordConversationIdentity,
        )
      : null;

    const runtimeCanonical = runtimeAliasKey
      ? this.aliasToCanonical.get(runtimeAliasKey) ?? null
      : null;
    const storageCanonical = storageAliasKey
      ? this.aliasToCanonical.get(storageAliasKey) ?? null
      : null;
    const recordCanonical = recordKey
      ? this.recordToCanonical.get(recordKey) ?? null
      : null;

    const identitiesMatch =
      runtimeConversationIdentity !== null &&
      storageConversationIdentity !== null &&
      runtimeConversationIdentity === storageConversationIdentity;
    const hasHistoricalMerge = runtimeCanonical !== null || storageCanonical !== null;
    const canMergeByRecord = recordCanonical !== null;
    const ambiguousCrossSource =
      input.runtime !== undefined &&
      input.storage !== undefined &&
      !identitiesMatch &&
      !hasHistoricalMerge &&
      !canMergeByRecord &&
      (runtimeConversationIdentity !== null ||
        storageConversationIdentity !== null ||
        storageRecordConversationIdentity !== null);
    const canUseStorageEvidence =
      input.storage !== undefined &&
      (input.runtime === undefined ||
        identitiesMatch ||
        hasHistoricalMerge ||
        canMergeByRecord);
    const mergedStorage = canUseStorageEvidence ? input.storage : undefined;

    const stableConversationIdentity = ambiguousCrossSource
      ? null
      : runtimeCanonical ??
        storageCanonical ??
        recordCanonical ??
        (identitiesMatch ? runtimeConversationIdentity : null) ??
        runtimeConversationIdentity ??
        storageConversationIdentity ??
        storageRecordConversationIdentity ??
        transcriptConversationIdentity;

    const identityStable = stableConversationIdentity !== null;
    const conversationIdentity = identityStable ? stableConversationIdentity : null;
    const canonicalConversationIdentity =
      stableConversationIdentity ?? unstableConversationIdentity(input);

    if (runtimeAliasKey && stableConversationIdentity) {
      this.aliasToCanonical.set(runtimeAliasKey, stableConversationIdentity);
    }

    if (
      storageAliasKey &&
      stableConversationIdentity &&
      (identitiesMatch || hasHistoricalMerge || canMergeByRecord)
    ) {
      this.aliasToCanonical.set(storageAliasKey, stableConversationIdentity);
    }

    if (
      recordKey &&
      stableConversationIdentity &&
      (identitiesMatch || hasHistoricalMerge || canMergeByRecord)
    ) {
      this.recordToCanonical.set(recordKey, stableConversationIdentity);
    }

    const degradedFlags = unique([
      ...(input.runtime?.degradedFlags ?? []),
      ...(mergedStorage?.degradedFlags ?? []),
      ...(!identityStable ? ['unstable_session_identity'] : []),
    ]);

    const attachability = !identityStable
      ? 'not_attachable'
      : resolveSourceAttachability({
          runtime: input.runtime,
          storage: mergedStorage,
        });

    return {
      provider: input.provider,
      providerExtensionId: input.providerExtensionId,
      providerSessionRef:
        input.runtime?.providerSessionRef ??
        mergedStorage?.providerSessionRef ??
        canonicalConversationIdentity,
      runtimeProviderSessionRef: input.runtime?.providerSessionRef ?? null,
      storageProviderSessionRef: mergedStorage?.providerSessionRef ?? null,
      workspaceIdentity,
      conversationIdentity,
      providerSessionKey: `v1|${input.providerExtensionId}|${workspaceIdentity}|${canonicalConversationIdentity}`,
      title: input.runtime?.title ?? mergedStorage?.title ?? 'Untitled session',
      latestSeq: Math.max(input.runtime?.latestSeq ?? 0, mergedStorage?.latestSeq ?? 0),
      attachability,
      capabilities: unique([
        ...(input.runtime?.capabilities ?? []),
        ...(mergedStorage?.capabilities ?? []),
      ]),
      degradedFlags,
      identityStable,
    };
  }
}
