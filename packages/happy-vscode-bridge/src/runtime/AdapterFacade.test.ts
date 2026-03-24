import { describe, expect, it, vi } from 'vitest';

import { SharedSessionStore } from '../broker/SharedSessionStore';
import { AdapterFacade } from './AdapterFacade';

function makeDiscoveredSession() {
  return {
    brokerSessionId: 'broker-sess-1',
    provider: 'claude' as const,
    title: 'Claude Session',
    attachability: 'attachable_with_degraded_capabilities' as const,
    capabilities: ['sendUserMessage'],
    degradedFlags: ['runtime_probe_unverified'],
    desiredMode: 'runtime_preferred' as const,
    effectiveMode: 'runtime' as const,
    modeReason: 'runtime_degraded',
    compatibility: 'supported' as const,
    providerExtension: {
      id: 'anthropic.claude-code',
      version: '1.0.0',
    },
    probeHealth: {
      runtime: 'degraded' as const,
      storage: 'ready' as const,
    },
  };
}

function makeSnapshot() {
  return {
    brokerSessionId: 'broker-sess-1',
    provider: 'claude' as const,
    latestSeq: 42,
    capabilities: ['sendUserMessage'],
    degradedFlags: ['runtime_probe_unverified'],
    desiredMode: 'runtime_preferred' as const,
    effectiveMode: 'runtime' as const,
    modeReason: 'runtime_degraded',
    compatibility: 'supported' as const,
    providerExtension: {
      id: 'anthropic.claude-code',
      version: '1.0.0',
    },
    probeHealth: {
      runtime: 'degraded' as const,
      storage: 'ready' as const,
    },
  };
}

describe('AdapterFacade', () => {
  it('routes broker control methods through the companion runtime', async () => {
    const runtime = {
      refresh: vi.fn(async () => [makeDiscoveredSession()]),
      listDiscoveredSessions: vi.fn(() => [makeDiscoveredSession()]),
      attachSession: vi.fn(async () => makeSnapshot()),
      sendMessage: vi.fn(async () => {}),
      interruptSession: vi.fn(async () => {}),
      resolveApproval: vi.fn(async () => {}),
      captureEditorContext: vi.fn(async () => ({
        activeFilePath: '/workspace/index.ts',
        selectedText: 'hello',
        selectionRanges: [],
        visibleFilePaths: [],
        openTabs: [],
        workspaceRoots: ['/workspace'],
        gitBranch: 'main',
        diagnosticsSummary: {
          errors: 0,
          warnings: 0,
          infos: 0,
          hints: 0,
        },
      })),
      listAttachments: vi.fn(async () => [
        {
          id: 'artifact-1',
          kind: 'image',
          label: 'preview.png',
        },
      ]),
      setSessionDesiredMode: vi.fn(async () => ({
        ...makeDiscoveredSession(),
        desiredMode: 'storage_preferred',
        effectiveMode: 'storage',
        modeReason: 'storage_preferred_selected',
      })),
      watchBrokerEvents: vi.fn(async () => () => {}),
      subscribe: vi.fn(() => () => {}),
    };
    const store = new SharedSessionStore();
    const facade = new AdapterFacade({
      runtime: runtime as never,
      store,
    });

    await expect(facade.discover()).resolves.toEqual([makeDiscoveredSession()]);
    await expect(facade.attach('broker-sess-1')).resolves.toMatchObject({
      latestSeq: 42,
    });
    await expect(facade.sendMessage('broker-sess-1', 'hello')).resolves.toBe(true);
    await expect(facade.interruptSession('broker-sess-1', 'user_cancelled')).resolves.toBe(
      true,
    );
    await expect(
      facade.resolveApproval('broker-sess-1', 'approval-1', 'approve'),
    ).resolves.toBe(true);
    await expect(facade.captureEditorContext('broker-sess-1')).resolves.toMatchObject({
      activeFilePath: '/workspace/index.ts',
      workspaceRoots: ['/workspace'],
    });
    await expect(facade.listAttachments('broker-sess-1')).resolves.toMatchObject([
      { id: 'artifact-1', kind: 'image' },
    ]);
    await expect(
      facade.setSessionDesiredMode('broker-sess-1', 'storage_preferred'),
    ).resolves.toMatchObject({
      effectiveMode: 'storage',
    });

    expect(runtime.sendMessage).toHaveBeenCalledWith('broker-sess-1', 'hello');
    expect(runtime.interruptSession).toHaveBeenCalledWith(
      'broker-sess-1',
      'user_cancelled',
    );
    expect(runtime.resolveApproval).toHaveBeenCalledWith(
      'broker-sess-1',
      'approval-1',
      'approve',
    );
    expect(store.listSnapshots()).toHaveLength(1);
  });

  it('pipes runtime watch events into the shared session store when subscribeEvents is called', async () => {
    let forwardEvent: ((event: unknown) => void) | null = null;
    const runtime = {
      refresh: vi.fn(async () => []),
      listDiscoveredSessions: vi.fn(() => []),
      attachSession: vi.fn(async () => null),
      sendMessage: vi.fn(async () => {}),
      interruptSession: vi.fn(async () => {}),
      resolveApproval: vi.fn(async () => {}),
      captureEditorContext: vi.fn(async () => null),
      listAttachments: vi.fn(async () => []),
      setSessionDesiredMode: vi.fn(async () => makeDiscoveredSession()),
      watchBrokerEvents: vi.fn(async (_brokerSessionId, onEvent) => {
        forwardEvent = onEvent as (event: unknown) => void;
        return () => {
          forwardEvent = null;
        };
      }),
      subscribe: vi.fn(() => () => {}),
    };
    const store = new SharedSessionStore();
    const entries: string[] = [];
    store.subscribe((entry) => {
      entries.push(entry.event.type);
    });

    const facade = new AdapterFacade({
      runtime: runtime as never,
      store,
    });

    await expect(facade.subscribeEvents('broker-sess-1')).resolves.toBe(true);
    forwardEvent?.({
      type: 'session.attachment.added',
      brokerSessionId: 'broker-sess-1',
      payload: {
        attachment: {
          id: 'artifact-2',
          kind: 'image',
          label: 'preview.png',
        },
      },
    });

    expect(entries).toContain('session.attachment.added');
  });
});
