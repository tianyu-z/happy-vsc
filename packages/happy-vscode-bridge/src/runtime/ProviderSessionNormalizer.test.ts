import { describe, expect, it } from 'vitest';

import { ProviderSessionNormalizer } from './ProviderSessionNormalizer';

describe('ProviderSessionNormalizer', () => {
  it('builds a stable providerSessionKey from workspace file and runtime identity', () => {
    const normalizer = new ProviderSessionNormalizer();

    const session = normalizer.normalize({
      provider: 'claude',
      providerExtensionId: 'anthropic.claude-code',
      runtime: {
        providerSessionRef: 'runtime-ref-1',
        title: 'Claude Session',
        sessionId: 'session-1',
        workspace: {
          workspaceFileUri: 'file:///Users/work/project.code-workspace',
          folderUris: ['file:///Users/work/project'],
        },
      },
    });

    expect(session.workspaceIdentity).toBe(
      'workspace-file:file:///Users/work/project.code-workspace',
    );
    expect(session.conversationIdentity).toBe('session-1');
    expect(session.providerSessionKey).toBe(
      'v1|anthropic.claude-code|workspace-file:file:///Users/work/project.code-workspace|session-1',
    );
    expect(session.attachability).toBe('attachable');
  });

  it('normalizes remote multiroot workspaces deterministically on Windows-style file URIs', () => {
    const normalizer = new ProviderSessionNormalizer();

    const session = normalizer.normalize({
      provider: 'codex',
      providerExtensionId: 'openai.chatgpt',
      storage: {
        providerSessionRef: 'storage-ref-1',
        recordId: 'record-1',
        workspace: {
          remoteAuthority: 'ssh-remote+box',
          folderUris: ['file:///C:/Zoo', 'file:///c:/alpha'],
        },
      },
    });

    expect(session.workspaceIdentity).toBe(
      'remote:ssh-remote+box|multiroot:file:///c:/alpha,file:///c:/zoo',
    );
    expect(session.conversationIdentity).toBe('record-1');
  });

  it('reuses alias mapping when a storage conversation id later appears without runtime evidence', () => {
    const normalizer = new ProviderSessionNormalizer();

    const first = normalizer.normalize({
      provider: 'claude',
      providerExtensionId: 'anthropic.claude-code',
      runtime: {
        providerSessionRef: 'runtime-ref-1',
        sessionId: 'runtime-1',
        workspace: {
          folderUris: ['file:///workspace'],
        },
      },
      storage: {
        providerSessionRef: 'storage-ref-1',
        conversationId: 'legacy-1',
        recordId: 'record-1',
        workspace: {
          folderUris: ['file:///workspace'],
        },
      },
    });

    const second = normalizer.normalize({
      provider: 'claude',
      providerExtensionId: 'anthropic.claude-code',
      storage: {
        providerSessionRef: 'storage-ref-2',
        conversationId: 'legacy-1',
        recordId: 'record-1',
        workspace: {
          folderUris: ['file:///workspace'],
        },
      },
    });

    expect(second.conversationIdentity).toBe('runtime-1');
    expect(second.providerSessionKey).toBe(first.providerSessionKey);
  });

  it('marks sessions without a stable identity as not attachable', () => {
    const normalizer = new ProviderSessionNormalizer();

    const session = normalizer.normalize({
      provider: 'codex',
      providerExtensionId: 'openai.chatgpt',
      runtime: {
        providerSessionRef: 'runtime-ref-unstable',
        title: 'Ephemeral Session',
        workspace: {
          folderUris: ['file:///workspace'],
        },
      },
    });

    expect(session.conversationIdentity).toBeNull();
    expect(session.attachability).toBe('not_attachable');
    expect(session.degradedFlags).toContain('unstable_session_identity');
    expect(session.providerSessionKey).toContain('|unstable:');
  });
});
