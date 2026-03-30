import { describe, expect, it } from 'vitest';

import { buildBridgeInstanceIdentity } from './BridgeInstanceIdentity';

function createMemoryInstallationIdStore() {
  let value: string | undefined;
  return {
    async read() {
      return value;
    },
    async write(nextValue: string) {
      value = nextValue;
    },
  };
}

describe('buildBridgeInstanceIdentity', () => {
  it('creates a fresh instanceId but stable logicalWindowKey for the same workspace', async () => {
    const installationIdStore = createMemoryInstallationIdStore();

    const first = await buildBridgeInstanceIdentity({
      remoteName: 'ssh-remote',
      workspaceFolders: ['/workspace/app'],
      extensionKind: 'workspace',
      editorSessionId: 'editor-a',
      installationIdStore,
      providerHostFingerprint: 'claude,codex',
    });
    const second = await buildBridgeInstanceIdentity({
      remoteName: 'ssh-remote',
      workspaceFolders: ['/workspace/app'],
      extensionKind: 'workspace',
      editorSessionId: 'editor-b',
      installationIdStore,
      providerHostFingerprint: 'claude,codex',
    });

    expect(first.instanceId).not.toBe(second.instanceId);
    expect(first.logicalWindowKey).toBe(second.logicalWindowKey);
    expect(first.installationId).toBe(second.installationId);
  });

  it('changes the logicalWindowKey when the runtime host fingerprint changes', async () => {
    const installationIdStore = createMemoryInstallationIdStore();

    const claudeOnly = await buildBridgeInstanceIdentity({
      remoteName: 'ssh-remote',
      workspaceFolders: ['/workspace/app'],
      extensionKind: 'workspace',
      installationIdStore,
      providerHostFingerprint: 'claude',
    });
    const claudeAndCodex = await buildBridgeInstanceIdentity({
      remoteName: 'ssh-remote',
      workspaceFolders: ['/workspace/app'],
      extensionKind: 'workspace',
      installationIdStore,
      providerHostFingerprint: 'claude,codex',
    });

    expect(claudeOnly.logicalWindowKey).not.toBe(
      claudeAndCodex.logicalWindowKey,
    );
  });
});
