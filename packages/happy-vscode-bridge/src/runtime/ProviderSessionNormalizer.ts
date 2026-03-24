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
    ...(runtime.transcriptObjectIds ?? []),
  );
}

function storageIdentity(storage: StorageSessionEvidence | undefined): string | null {
  if (!storage) {
    return null;
  }

  return firstNonEmpty(
    storage.conversationId,
    storage.recordId,
    ...(storage.transcriptObjectIds ?? []),
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

function mergeAttachability(
  attachability: BrokerAttachability,
  degradedFlags: string[],
): BrokerAttachability {
  if (attachability === 'not_attachable') {
    return attachability;
  }

  return degradedFlags.length > 0
    ? 'attachable_with_degraded_capabilities'
    : attachability;
}

export class ProviderSessionNormalizer {
  private readonly aliasToCanonical = new Map<string, string>();
  private readonly recordToCanonical = new Map<string, string>();

  normalize(input: ProviderSessionNormalizeInput): NormalizedProviderSession {
    const workspace = input.runtime?.workspace ?? input.storage?.workspace ?? {};
    const workspaceIdentity = buildWorkspaceIdentity(workspace);
    const runtimeConversationIdentity = runtimeIdentity(input.runtime);
    const storageConversationIdentity = storageIdentity(input.storage);

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
    const recordKey = input.storage?.recordId
      ? recordAliasKey(
          input.providerExtensionId,
          workspaceIdentity,
          input.storage.recordId,
        )
      : null;

    const runtimeCanonical = runtimeAliasKey
      ? this.aliasToCanonical.get(runtimeAliasKey) ?? runtimeConversationIdentity
      : null;
    const storageCanonical = storageAliasKey
      ? this.aliasToCanonical.get(storageAliasKey) ?? storageConversationIdentity
      : null;
    const recordCanonical = recordKey
      ? this.recordToCanonical.get(recordKey) ?? null
      : null;

    const stableConversationIdentity =
      runtimeCanonical ??
      storageCanonical ??
      recordCanonical ??
      runtimeConversationIdentity ??
      storageConversationIdentity;

    const identityStable = stableConversationIdentity !== null;
    const conversationIdentity = identityStable ? stableConversationIdentity : null;
    const canonicalConversationIdentity =
      stableConversationIdentity ?? unstableConversationIdentity(input);

    if (runtimeAliasKey && stableConversationIdentity) {
      this.aliasToCanonical.set(runtimeAliasKey, stableConversationIdentity);
    }

    if (storageAliasKey && stableConversationIdentity) {
      this.aliasToCanonical.set(storageAliasKey, stableConversationIdentity);
    }

    if (recordKey && stableConversationIdentity) {
      this.recordToCanonical.set(recordKey, stableConversationIdentity);
    }

    const degradedFlags = unique([
      ...(input.runtime?.degradedFlags ?? []),
      ...(input.storage?.degradedFlags ?? []),
      ...(!identityStable ? ['unstable_session_identity'] : []),
    ]);

    const attachability = !identityStable
      ? 'not_attachable'
      : mergeAttachability(
          input.runtime?.attachability ??
            input.storage?.attachability ??
            'attachable',
          degradedFlags,
        );

    return {
      provider: input.provider,
      providerExtensionId: input.providerExtensionId,
      providerSessionRef:
        input.runtime?.providerSessionRef ??
        input.storage?.providerSessionRef ??
        canonicalConversationIdentity,
      runtimeProviderSessionRef: input.runtime?.providerSessionRef ?? null,
      storageProviderSessionRef: input.storage?.providerSessionRef ?? null,
      workspaceIdentity,
      conversationIdentity,
      providerSessionKey: `v1|${input.providerExtensionId}|${workspaceIdentity}|${canonicalConversationIdentity}`,
      title: input.runtime?.title ?? input.storage?.title ?? 'Untitled session',
      latestSeq: Math.max(input.runtime?.latestSeq ?? 0, input.storage?.latestSeq ?? 0),
      attachability,
      capabilities: unique([
        ...(input.runtime?.capabilities ?? []),
        ...(input.storage?.capabilities ?? []),
      ]),
      degradedFlags,
      identityStable,
    };
  }
}
