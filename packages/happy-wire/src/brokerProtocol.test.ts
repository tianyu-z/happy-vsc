import { describe, it, expect } from 'vitest';
import {
  brokerInstanceManifestSchema,
  brokerInventorySummarySchema,
  brokerDiscoveredSessionSchema,
  brokerSnapshotSchema,
  brokerEventSchema,
  brokerRpcContract,
  brokerSendMessageIntentSchema,
  brokerInterruptIntentSchema,
  brokerResolveApprovalIntentSchema,
  brokerSetDesiredModeIntentSchema,
  brokerAttachmentRefSchema,
} from './brokerProtocol';

describe('broker protocol', () => {
  it('parses a discovered session (with mode + probe metadata)', () => {
    const session = brokerDiscoveredSessionSchema.parse({
      brokerSessionId: 'sess_123',
      provider: 'claude',
      title: 'Attach me',
      attachability: 'attachable',
      capabilities: ['sendUserMessage'],
      degradedFlags: [],
      desiredMode: 'runtime_preferred',
      effectiveMode: 'runtime',
      modeReason: 'mode.selected.by.default',
      compatibility: 'supported',
      providerExtension: { id: 'vscode-companion', version: '0.1.0' },
      probeHealth: { runtime: 'ready', storage: 'ready' },
    });

    expect(session.provider).toBe('claude');
    expect(session.desiredMode).toBe('runtime_preferred');
    expect(session.effectiveMode).toBe('runtime');
    expect(session.compatibility).toBe('supported');
    expect(session.probeHealth.runtime).toBe('ready');
  });

  it('parses a bridge instance manifest for a workspace-host broker', () => {
    const manifest = brokerInstanceManifestSchema.parse({
      installationId: 'install-1',
      instanceId: 'instance-1',
      logicalWindowKey: 'window-1',
      editorSessionId: 'editor-1',
      machineId: 'machine-1',
      windowLabel: 'api',
      workspaceFolders: ['/workspace/api'],
      runtimeKind: 'ssh',
      runtimeLabel: 'ssh:gpu-1',
      bridgeHostIps: ['10.0.0.2'],
      preferredHostIp: '10.0.0.2',
      runtimeIp: '10.0.0.2',
      providerKinds: ['claude', 'codex'],
      brokerEndpoint: 'ws://127.0.0.1:7777',
      brokerAuthToken: 'broker-token',
      pid: 1234,
      startedAt: 1,
      lastHeartbeatAt: 2,
      ttlMs: 10_000,
    });

    expect(manifest.runtimeKind).toBe('ssh');
    expect(manifest.providerKinds).toEqual(['claude', 'codex']);
    expect(manifest.brokerEndpoint).toBe('ws://127.0.0.1:7777');
  });

  it('parses a broker inventory summary with canonical session keys', () => {
    const summary = brokerInventorySummarySchema.parse({
      updatedAt: 123,
      instances: [
        {
          installationId: 'install-1',
          instanceId: 'instance-1',
          logicalWindowKey: 'window-1',
          editorSessionId: 'editor-1',
          machineId: 'machine-1',
          windowLabel: 'api',
          workspaceFolders: ['/workspace/api'],
          runtimeKind: 'ssh',
          runtimeLabel: 'ssh:gpu-1',
          bridgeHostIps: ['10.0.0.2'],
          preferredHostIp: '10.0.0.2',
          runtimeIp: '10.0.0.2',
          providerKinds: ['codex'],
          startedAt: 100,
          lastSeenAt: 123,
          ttlMs: 10_000,
          status: 'online',
        },
      ],
      sessions: [
        {
          canonicalSessionKey: 'machine-1:instance-1:sess-1',
          instanceId: 'instance-1',
          brokerSessionId: 'sess-1',
          providerSessionKey: 'provider-key-1',
          provider: 'codex',
          title: 'Fix API',
          attachability: 'attachable',
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
          desiredMode: 'runtime_preferred',
          effectiveMode: 'runtime',
          modeReason: 'runtime_ready',
          compatibility: 'supported',
          providerExtension: { id: 'openai.chatgpt', version: '1.0.0' },
          probeHealth: { runtime: 'ready', storage: 'ready' },
          lastActiveAt: 120,
          messagePreview: 'Need to fix the API',
        },
      ],
    });

    expect(summary.instances[0]?.status).toBe('online');
    expect(summary.sessions[0]?.canonicalSessionKey).toBe(
      'machine-1:instance-1:sess-1',
    );
  });

  it('parses a snapshot (with runtime metadata)', () => {
    const snapshot = brokerSnapshotSchema.parse({
      brokerSessionId: 'sess_123',
      provider: 'codex',
      latestSeq: 42,
      capabilities: ['sendUserMessage'],
      degradedFlags: ['selection_context_stale'],
      desiredMode: 'storage_preferred',
      effectiveMode: 'storage',
      modeReason: 'mode.forced.by.compat',
      compatibility: 'unknown',
      providerExtension: { id: 'vscode-companion', version: '0.1.0' },
      probeHealth: { runtime: 'degraded', storage: 'stale' },
    });

    expect(snapshot.latestSeq).toBe(42);
    expect(snapshot.desiredMode).toBe('storage_preferred');
    expect(snapshot.effectiveMode).toBe('storage');
    expect(snapshot.compatibility).toBe('unknown');
    expect(snapshot.probeHealth.storage).toBe('stale');
  });

  it('rejects a snapshot with negative latestSeq and extra fields', () => {
    expect(() =>
      brokerSnapshotSchema.parse({
        brokerSessionId: 'sess_123',
        provider: 'codex',
        latestSeq: -1,
        capabilities: ['sendUserMessage'],
        degradedFlags: [],
        desiredMode: 'runtime_preferred',
        effectiveMode: 'runtime',
        modeReason: 'mode.selected.by.default',
        compatibility: 'supported',
        providerExtension: { id: 'vscode-companion', version: '0.1.0' },
        probeHealth: { runtime: 'ready', storage: 'ready' },
        extra: 'nope',
      }),
    ).toThrow();

    expect(() =>
      brokerSnapshotSchema.parse({
        brokerSessionId: 'sess_123',
        provider: 'codex',
        latestSeq: 1.1,
        capabilities: ['sendUserMessage'],
        degradedFlags: [],
        desiredMode: 'runtime_preferred',
        effectiveMode: 'runtime',
        modeReason: 'mode.selected.by.default',
        compatibility: 'supported',
        providerExtension: { id: 'vscode-companion', version: '0.1.0' },
        probeHealth: { runtime: 'ready', storage: 'ready' },
      }),
    ).toThrow();
  });

  it('parses an attachment ref (kind enum)', () => {
    expect(
      brokerAttachmentRefSchema.parse({
        id: 'att_1',
        kind: 'image',
        label: 'foo.png',
        openRef: 'vscode://file/foo.png',
      }).kind,
    ).toBe('image');
  });

  it('rejects an empty brokerSessionId in intents', () => {
    expect(() =>
      brokerSendMessageIntentSchema.parse({
        brokerSessionId: '',
        text: '',
      }),
    ).toThrow();
  });

  it('parses event: session.message.delta', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.message.delta',
      brokerSessionId: 'sess_123',
      payload: { role: 'assistant', text: 'Hello' },
    });
    if (evt.type !== 'session.message.delta') throw new Error('unexpected event type');
    expect(evt.payload.role).toBe('assistant');
    expect(evt.payload.text).toBe('Hello');
  });

  it('rejects extra fields in a live event payload', () => {
    expect(() =>
      brokerEventSchema.parse({
        type: 'session.message.delta',
        brokerSessionId: 'sess_123',
        payload: { role: 'assistant', text: 'Hello', extra: 123 },
      }),
    ).toThrow();
  });

  it('parses event: session.run.status', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.run.status',
      brokerSessionId: 'sess_123',
      payload: {
        status: 'waiting_approval',
        reason: 'needs_user_approval',
      },
    });
    if (evt.type !== 'session.run.status') throw new Error('unexpected event type');
    expect(evt.payload.status).toBe('waiting_approval');
    expect(evt.payload.reason).toBe('needs_user_approval');
  });

  it('parses event: session.approval.requested', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.approval.requested',
      brokerSessionId: 'sess_123',
      payload: {
        approvalId: 'appr_1',
        label: 'Apply patch?',
        description: 'Wants to edit files',
      },
    });
    if (evt.type !== 'session.approval.requested') throw new Error('unexpected event type');
    expect(evt.payload.approvalId).toBe('appr_1');
  });

  it('parses event: session.approval.resolved', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.approval.resolved',
      brokerSessionId: 'sess_123',
      payload: { approvalId: 'appr_1', decision: 'approve' },
    });
    if (evt.type !== 'session.approval.resolved') throw new Error('unexpected event type');
    expect(evt.payload.decision).toBe('approve');
  });

  it('parses event: session.approval.dismissed', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.approval.dismissed',
      brokerSessionId: 'sess_123',
      payload: { approvalId: 'appr_1' },
    });
    if (evt.type !== 'session.approval.dismissed') throw new Error('unexpected event type');
    expect(evt.payload.approvalId).toBe('appr_1');
  });

  it('parses event: session.interrupt', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.interrupt',
      brokerSessionId: 'sess_123',
      payload: { outcome: 'accepted', reason: 'user_requested' },
    });
    if (evt.type !== 'session.interrupt') throw new Error('unexpected event type');
    expect(evt.payload.outcome).toBe('accepted');
    expect(evt.payload.reason).toBe('user_requested');
  });

  it('parses event: session.attachment.added', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.attachment.added',
      brokerSessionId: 'sess_123',
      payload: { attachment: { id: 'att_1', kind: 'image', label: 'foo.png' } },
    });
    if (evt.type !== 'session.attachment.added') throw new Error('unexpected event type');
    expect(evt.payload.attachment.id).toBe('att_1');
    expect(evt.payload.attachment.kind).toBe('image');
  });

  it('parses a broker event envelope: session.snapshot', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.snapshot',
      snapshot: {
        brokerSessionId: 'sess_123',
        provider: 'claude',
        latestSeq: 7,
        capabilities: ['sendUserMessage'],
        degradedFlags: [],
        desiredMode: 'runtime_preferred',
        effectiveMode: 'runtime',
        modeReason: 'mode.selected.by.default',
        compatibility: 'supported',
        providerExtension: { id: 'vscode-companion', version: '0.1.0' },
        probeHealth: { runtime: 'ready', storage: 'ready' },
      },
    });

    if (evt.type !== 'session.snapshot') throw new Error('unexpected event type');
    expect(evt.snapshot.desiredMode).toBe('runtime_preferred');
    expect(evt.snapshot.probeHealth.runtime).toBe('ready');
  });

  it('parses a broker event envelope: session.discovered', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.discovered',
      session: {
        brokerSessionId: 'sess_123',
        provider: 'claude',
        title: 'Attach me',
        attachability: 'attachable',
        capabilities: ['sendUserMessage'],
        degradedFlags: [],
        desiredMode: 'runtime_preferred',
        effectiveMode: 'runtime',
        modeReason: 'mode.selected.by.default',
        compatibility: 'supported',
        providerExtension: { id: 'vscode-companion', version: '0.1.0' },
        probeHealth: { runtime: 'ready', storage: 'ready' },
      },
    });
    if (evt.type !== 'session.discovered') throw new Error('unexpected event type');
    expect(evt.session.provider).toBe('claude');
    expect(evt.session.modeReason).toBe('mode.selected.by.default');
  });

  it('exposes an RPC contract with parseable intent schemas', () => {
    expect(Object.keys(brokerRpcContract).sort()).toEqual(
      [
        'discoverSessions',
        'attachSession',
        'sendMessage',
        'interruptSession',
        'resolveApproval',
        'captureEditorContext',
        'listAttachments',
        'setSessionDesiredMode',
        'subscribeEvents',
      ].sort(),
    );

    const send = brokerSendMessageIntentSchema.parse({
      brokerSessionId: 'sess_123',
      text: 'Hi',
    });
    brokerRpcContract.sendMessage.params.parse(send);
    brokerRpcContract.sendMessage.result.parse(true);

    const interrupt = brokerInterruptIntentSchema.parse({
      brokerSessionId: 'sess_123',
      reason: 'user_clicked_stop',
    });
    brokerRpcContract.interruptSession.params.parse(interrupt);
    brokerRpcContract.interruptSession.result.parse(true);

    const resolve = brokerResolveApprovalIntentSchema.parse({
      brokerSessionId: 'sess_123',
      approvalId: 'appr_1',
      decision: 'approve',
    });
    brokerRpcContract.resolveApproval.params.parse(resolve);
    brokerRpcContract.resolveApproval.result.parse(true);

    const setMode = brokerSetDesiredModeIntentSchema.parse({
      brokerSessionId: 'sess_123',
      desiredMode: 'runtime_preferred',
    });
    brokerRpcContract.setSessionDesiredMode.params.parse(setMode);

    brokerRpcContract.attachSession.params.parse({ brokerSessionId: 'sess_123' });
    brokerRpcContract.attachSession.result.parse(null);
    brokerRpcContract.attachSession.result.parse({
      brokerSessionId: 'sess_123',
      provider: 'codex',
      latestSeq: 42,
      capabilities: ['sendUserMessage'],
      degradedFlags: [],
      desiredMode: 'runtime_preferred',
      effectiveMode: 'runtime',
      modeReason: 'mode.selected.by.default',
      compatibility: 'supported',
      providerExtension: { id: 'vscode-companion', version: '0.1.0' },
      probeHealth: { runtime: 'ready', storage: 'ready' },
    });

    brokerRpcContract.discoverSessions.params.parse({});
    brokerRpcContract.discoverSessions.result.parse([
      {
        brokerSessionId: 'sess_123',
        provider: 'claude',
        title: 'Attach me',
        attachability: 'attachable',
        capabilities: ['sendUserMessage'],
        degradedFlags: [],
        desiredMode: 'runtime_preferred',
        effectiveMode: 'runtime',
        modeReason: 'mode.selected.by.default',
        compatibility: 'supported',
        providerExtension: { id: 'vscode-companion', version: '0.1.0' },
        probeHealth: { runtime: 'ready', storage: 'ready' },
      },
    ]);

    brokerRpcContract.captureEditorContext.params.parse({ brokerSessionId: 'sess_123' });
    brokerRpcContract.captureEditorContext.result.parse(null);
    brokerRpcContract.captureEditorContext.result.parse({
      activeFilePath: '/home/work/happy-vsc/README.md',
      selectedText: 'hello',
      selectionRanges: [
        { startLine: 0, startCharacter: 0, endLine: 0, endCharacter: 5 },
      ],
      workspaceRoots: ['/home/work/happy-vsc'],
      diagnosticsSummary: { errors: 1, warnings: 2, infos: 3, hints: 4 },
    });

    brokerRpcContract.listAttachments.params.parse({ brokerSessionId: 'sess_123' });
    brokerRpcContract.listAttachments.result.parse([
      { id: 'att_1', kind: 'image', label: 'foo.png' },
    ]);

    brokerRpcContract.subscribeEvents.params.parse({ brokerSessionId: 'sess_123' });
    brokerRpcContract.subscribeEvents.result.parse(true);

    expect(() =>
      brokerRpcContract.subscribeEvents.params.parse({
        brokerSessionId: 'sess_123',
        extra: true,
      }),
    ).toThrow();

    const discovered = brokerDiscoveredSessionSchema.parse({
      brokerSessionId: 'sess_123',
      provider: 'claude',
      title: 'Attach me',
      attachability: 'attachable',
      capabilities: ['sendUserMessage'],
      degradedFlags: [],
      desiredMode: 'runtime_preferred',
      effectiveMode: 'runtime',
      modeReason: 'mode.selected.by.default',
      compatibility: 'supported',
      providerExtension: { id: 'vscode-companion', version: '0.1.0' },
      probeHealth: { runtime: 'ready', storage: 'ready' },
    });
    brokerRpcContract.setSessionDesiredMode.result.parse(discovered);
  });
});
