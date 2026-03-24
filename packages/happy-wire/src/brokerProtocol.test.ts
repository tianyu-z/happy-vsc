import { describe, it, expect } from 'vitest';
import {
  brokerDiscoveredSessionSchema,
  brokerSnapshotSchema,
  brokerEventSchema,
  brokerRpcContract,
  brokerSendMessageIntentSchema,
  brokerInterruptIntentSchema,
  brokerResolveApprovalIntentSchema,
  brokerSetDesiredModeIntentSchema,
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

  it('parses event: session.message.delta', () => {
    expect(
      brokerEventSchema.parse({
        type: 'session.message.delta',
        brokerSessionId: 'sess_123',
        role: 'assistant',
        text: 'Hello',
      }).type,
    ).toBe('session.message.delta');
  });

  it('parses event: session.run.status', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.run.status',
      brokerSessionId: 'sess_123',
      status: 'waiting_approval',
      reason: 'needs_user_approval',
    });
    if (evt.type !== 'session.run.status') throw new Error('unexpected event type');
    expect(evt.status).toBe('waiting_approval');
  });

  it('parses event: session.approval.requested', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.approval.requested',
      brokerSessionId: 'sess_123',
      approvalId: 'appr_1',
      label: 'Apply patch?',
      description: 'Wants to edit files',
    });
    if (evt.type !== 'session.approval.requested') throw new Error('unexpected event type');
    expect(evt.approvalId).toBe('appr_1');
  });

  it('parses event: session.approval.dismissed', () => {
    expect(
      brokerEventSchema.parse({
        type: 'session.approval.dismissed',
        brokerSessionId: 'sess_123',
        approvalId: 'appr_1',
      }).type,
    ).toBe('session.approval.dismissed');
  });

  it('parses event: session.interrupt', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.interrupt',
      brokerSessionId: 'sess_123',
      outcome: 'accepted',
      reason: 'user_requested',
    });
    if (evt.type !== 'session.interrupt') throw new Error('unexpected event type');
    expect(evt.outcome).toBe('accepted');
  });

  it('parses event: session.attachment.added', () => {
    const evt = brokerEventSchema.parse({
      type: 'session.attachment.added',
      brokerSessionId: 'sess_123',
      attachment: { id: 'att_1', kind: 'file', label: 'foo.ts' },
    });
    if (evt.type !== 'session.attachment.added') throw new Error('unexpected event type');
    expect(evt.attachment.id).toBe('att_1');
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

  it('exposes an RPC contract with parseable intent schemas', () => {
    const methods = [
      'discoverSessions',
      'attachSession',
      'sendMessage',
      'interruptSession',
      'resolveApproval',
      'captureEditorContext',
      'listAttachments',
      'setSessionDesiredMode',
      'subscribeEvents',
    ] as const;
    for (const m of methods) {
      expect(brokerRpcContract[m].request).toBeDefined();
      expect(brokerRpcContract[m].response).toBeDefined();
    }

    const send = brokerSendMessageIntentSchema.parse({
      brokerSessionId: 'sess_123',
      text: 'Hi',
    });
    brokerRpcContract.sendMessage.request.parse(send);

    const interrupt = brokerInterruptIntentSchema.parse({
      brokerSessionId: 'sess_123',
      reason: 'user_clicked_stop',
    });
    brokerRpcContract.interruptSession.request.parse(interrupt);

    const resolve = brokerResolveApprovalIntentSchema.parse({
      brokerSessionId: 'sess_123',
      approvalId: 'appr_1',
      decision: 'approve',
    });
    brokerRpcContract.resolveApproval.request.parse(resolve);

    const setMode = brokerSetDesiredModeIntentSchema.parse({
      brokerSessionId: 'sess_123',
      desiredMode: 'runtime_preferred',
    });
    brokerRpcContract.setSessionDesiredMode.request.parse(setMode);

    brokerRpcContract.captureEditorContext.response.parse({
      activeFilePath: '/home/work/happy-vsc/README.md',
      selectedText: 'hello',
      selectionRanges: [
        { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
      ],
      workspaceRoots: ['/home/work/happy-vsc'],
      diagnosticsSummary: { errors: 1, warnings: 2, infos: 3, hints: 4 },
    });

    brokerRpcContract.listAttachments.response.parse({
      attachments: [{ id: 'att_1', kind: 'file', label: 'foo.ts' }],
    });
  });
});
