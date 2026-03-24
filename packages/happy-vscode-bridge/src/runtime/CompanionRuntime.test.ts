import { describe, expect, it, vi } from 'vitest';

import type { BrokerEvent } from 'happy-wire';

import type { BrokerEditorContext } from '../providers/types';
import type { ProviderHostResolution, RuntimeProbe, StorageProbe } from './probes/types';
import { CompanionRuntime } from './CompanionRuntime';

function makeHostResolution(): ProviderHostResolution {
  return {
    provider: 'claude',
    compatibility: 'supported',
    activationState: 'active',
    providerExtension: {
      id: 'anthropic.claude-code',
      version: '1.0.0',
    },
    commands: ['claude.resume'],
    contextKeys: ['claude.sessionActive'],
    exportKeys: ['runtimeBridge'],
    host: null,
  };
}

function makeEditorContext(): BrokerEditorContext {
  return {
    activeFilePath: '/workspace/src/index.ts',
    selectedText: 'const value = 1;',
    selectionRanges: [
      {
        startLine: 1,
        startCharacter: 0,
        endLine: 1,
        endCharacter: 16,
      },
    ],
    visibleFilePaths: ['/workspace/src/index.ts'],
    openTabs: ['/workspace/src/index.ts'],
    workspaceRoots: ['/workspace'],
    gitBranch: 'main',
    diagnosticsSummary: {
      errors: 0,
      warnings: 1,
      infos: 0,
      hints: 0,
    },
  };
}

function makeRuntimeProbe() {
  let eventListener: ((event: BrokerEvent) => void) | null = null;

  const probe: RuntimeProbe & {
    emit(event: BrokerEvent): void;
    listAttachments: ReturnType<typeof vi.fn>;
    sendMessage: ReturnType<typeof vi.fn>;
    interrupt: ReturnType<typeof vi.fn>;
    resolveApproval: ReturnType<typeof vi.fn>;
    captureEditorContext: ReturnType<typeof vi.fn>;
  } = {
    discoverSessions: async () => [
      {
        providerSessionRef: 'runtime-ref-1',
        conversationId: 'conv-1',
        title: 'Runtime Title',
        latestSeq: 2,
        workspace: {
          folderUris: ['file:///workspace'],
        },
        capabilities: ['sendUserMessage', 'interrupt', 'resolveApproval'],
        degradedFlags: ['runtime_probe_unverified'],
        attachability: 'attachable_with_degraded_capabilities',
      },
    ],
    watchSession: vi.fn(async (_ref, onEvent) => {
      eventListener = onEvent as (event: BrokerEvent) => void;
      return () => {
        eventListener = null;
      };
    }),
    sendMessage: vi.fn(async () => {}),
    interrupt: vi.fn(async () => {}),
    resolveApproval: vi.fn(async () => {}),
    captureEditorContext: vi.fn(async () => makeEditorContext()),
    listAttachments: vi.fn(async () => [
      {
        id: 'artifact-1',
        kind: 'image',
        label: 'artifact.png',
      },
    ]),
    emit(event: BrokerEvent) {
      eventListener?.(event);
    },
  };

  return probe;
}

function makeStorageProbe(): StorageProbe {
  return {
    discoverSessions: async () => [
      {
        providerSessionRef: 'storage-ref-1',
        conversationId: 'conv-1',
        title: 'Storage Title',
        latestSeq: 7,
        workspace: {
          folderUris: ['file:///workspace'],
        },
        capabilities: [],
        degradedFlags: ['read_only_attach'],
        attachability: 'attachable_with_degraded_capabilities',
      },
    ],
  };
}

describe('CompanionRuntime', () => {
  it('projects unified sessions and allows desired mode switching', async () => {
    const runtime = new CompanionRuntime({
      providerStates: {
        claude: {
          resolution: makeHostResolution(),
          runtimeProbe: makeRuntimeProbe(),
          storageProbe: makeStorageProbe(),
        },
      },
    });

    const discovered = await runtime.refresh();

    expect(discovered).toHaveLength(1);
    expect(discovered[0]).toMatchObject({
      provider: 'claude',
      title: 'Runtime Title',
      desiredMode: 'runtime_preferred',
      effectiveMode: 'runtime',
      modeReason: 'runtime_degraded',
      compatibility: 'supported',
      providerExtension: {
        id: 'anthropic.claude-code',
      },
    });

    const snapshot = await runtime.attachSession(discovered[0].brokerSessionId);
    expect(snapshot).toMatchObject({
      brokerSessionId: discovered[0].brokerSessionId,
      latestSeq: 7,
      effectiveMode: 'runtime',
    });

    const switched = await runtime.setSessionDesiredMode(
      discovered[0].brokerSessionId,
      'storage_preferred',
    );

    expect(switched).toMatchObject({
      brokerSessionId: discovered[0].brokerSessionId,
      desiredMode: 'storage_preferred',
      effectiveMode: 'storage',
      modeReason: 'storage_preferred_selected',
    });
    expect(switched.degradedFlags).toContain('read_only_attach');
  });

  it('routes runtime actions and normalizes broker events', async () => {
    const runtimeProbe = makeRuntimeProbe();
    const runtime = new CompanionRuntime({
      providerStates: {
        claude: {
          resolution: makeHostResolution(),
          runtimeProbe,
          storageProbe: makeStorageProbe(),
        },
      },
    });

    const [session] = await runtime.refresh();
    const events: BrokerEvent[] = [];
    const dispose = await runtime.watchBrokerEvents(session.brokerSessionId, (event) => {
      events.push(event);
    });

    await runtime.sendMessage(session.brokerSessionId, 'continue');
    await runtime.interruptSession(session.brokerSessionId, 'user_cancelled');
    await runtime.resolveApproval(session.brokerSessionId, 'approval-1', 'approve');
    await runtime.captureEditorContext(session.brokerSessionId);

    runtimeProbe.emit({
      type: 'session.attachment.added',
      brokerSessionId: session.brokerSessionId,
      payload: {
        attachment: {
          id: 'artifact-2',
          kind: 'image',
          label: 'preview.png',
        },
      },
    });

    await expect(runtime.listAttachments(session.brokerSessionId)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'artifact-1' }),
        expect.objectContaining({ id: 'artifact-2' }),
      ]),
    );

    expect(runtimeProbe.sendMessage).toHaveBeenCalledWith('runtime-ref-1', 'continue');
    expect(runtimeProbe.interrupt).toHaveBeenCalledWith('runtime-ref-1', 'user_cancelled');
    expect(runtimeProbe.resolveApproval).toHaveBeenCalledWith(
      'runtime-ref-1',
      'approval-1',
      'approve',
    );
    expect(runtimeProbe.captureEditorContext).toHaveBeenCalledWith('runtime-ref-1');
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'session.attachment.added',
          brokerSessionId: session.brokerSessionId,
        }),
      ]),
    );

    dispose();
  });
});
