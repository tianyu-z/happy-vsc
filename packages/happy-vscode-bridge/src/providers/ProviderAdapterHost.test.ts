import { describe, expect, it, vi } from 'vitest';

import { ProviderAdapterHost } from './ProviderAdapterHost';
import type { ProviderAdapter } from './types';

describe('ProviderAdapterHost', () => {
  it('merges adapter health into degraded flags and marks degraded attachability', async () => {
    const adapter: ProviderAdapter = {
      discover: async () => [
        {
          brokerSessionId: 'session-1',
          providerSessionRef: 'provider-session-1',
          provider: 'claude',
          title: 'Session 1',
          attachability: 'attachable',
          capabilities: ['sendUserMessage', 'resolveApproval'],
          degradedFlags: [],
        },
      ],
      attach: async () => ({
        brokerSessionId: 'session-1',
        providerSessionRef: 'provider-session-1',
        provider: 'claude',
        latestSeq: 3,
        capabilities: ['sendUserMessage', 'resolveApproval'],
        degradedFlags: [],
      }),
      sendUserMessage: async () => {},
      interrupt: async () => {},
      resolveApproval: async () => {},
      getHealth: async () => ({
        approvalBridgeAvailable: false,
        degradedFlags: ['selection_context_stale'],
      }),
    };

    const host = new ProviderAdapterHost({
      claude: adapter,
    });

    const sessions = await host.discover();

    expect(host.getCapabilities('session-1').degradedFlags).toContain(
      'approval_bridge_unavailable',
    );
    expect(host.getCapabilities('session-1').degradedFlags).toContain('selection_context_stale');
    expect(sessions[0].attachability).toBe('attachable_with_degraded_capabilities');
  });

  it('routes send/interrupt/approval intents through the mapped adapter session', async () => {
    const sendUserMessage = vi.fn(async () => {});
    const interrupt = vi.fn(async () => {});
    const resolveApproval = vi.fn(async () => {});

    const adapter: ProviderAdapter = {
      discover: async () => [
        {
          brokerSessionId: 'session-2',
          providerSessionRef: 'provider-session-2',
          provider: 'codex',
          title: 'Session 2',
          attachability: 'attachable',
          capabilities: ['sendUserMessage', 'interrupt', 'resolveApproval'],
          degradedFlags: [],
        },
      ],
      attach: async () => ({
        brokerSessionId: 'session-2',
        providerSessionRef: 'provider-session-2',
        provider: 'codex',
        latestSeq: 1,
        capabilities: ['sendUserMessage', 'interrupt', 'resolveApproval'],
        degradedFlags: [],
      }),
      sendUserMessage,
      interrupt,
      resolveApproval,
    };

    const host = new ProviderAdapterHost({
      codex: adapter,
    });

    await host.discover();
    await host.sendMessage('session-2', { text: 'hello' });
    await host.interrupt('session-2', { reason: 'user_cancelled' });
    await host.resolveApproval('session-2', { approvalId: 'approval-1', decision: 'approve' });

    expect(sendUserMessage).toHaveBeenCalledWith({
      brokerSessionId: 'session-2',
      providerSessionRef: 'provider-session-2',
      text: 'hello',
    });
    expect(interrupt).toHaveBeenCalledWith({
      brokerSessionId: 'session-2',
      providerSessionRef: 'provider-session-2',
      reason: 'user_cancelled',
    });
    expect(resolveApproval).toHaveBeenCalledWith({
      brokerSessionId: 'session-2',
      providerSessionRef: 'provider-session-2',
      approvalId: 'approval-1',
      decision: 'approve',
    });
  });

  it('attaches with providerSessionRef while keeping broker session path', async () => {
    const attach = vi.fn(async () => ({
      brokerSessionId: 'session-3',
      providerSessionRef: 'provider-session-3',
      provider: 'claude' as const,
      latestSeq: 9,
      capabilities: ['sendUserMessage'],
      degradedFlags: [],
    }));

    const adapter: ProviderAdapter = {
      discover: async () => [
        {
          brokerSessionId: 'session-3',
          providerSessionRef: 'provider-session-3',
          provider: 'claude',
          title: 'Session 3',
          attachability: 'attachable',
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
        },
      ],
      attach,
      sendUserMessage: async () => {},
      interrupt: async () => {},
      resolveApproval: async () => {},
    };

    const host = new ProviderAdapterHost({
      claude: adapter,
    });

    await host.discover();

    await host.attach('session-3');
    await host.attach('provider-session-3');

    expect(attach).toHaveBeenNthCalledWith(1, 'provider-session-3');
    expect(attach).toHaveBeenNthCalledWith(2, 'provider-session-3');
  });

  it('updates binding to canonical providerSessionRef returned by attach', async () => {
    const sendUserMessage = vi.fn(async () => {});
    const attach = vi.fn(async () => ({
      brokerSessionId: 'session-4',
      providerSessionRef: 'provider-session-4-canonical',
      provider: 'claude' as const,
      latestSeq: 10,
      capabilities: ['sendUserMessage'],
      degradedFlags: [],
    }));

    const adapter: ProviderAdapter = {
      discover: async () => [
        {
          brokerSessionId: 'session-4',
          providerSessionRef: 'provider-session-4-tmp',
          provider: 'claude',
          title: 'Session 4',
          attachability: 'attachable',
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
        },
      ],
      attach,
      sendUserMessage,
      interrupt: async () => {},
      resolveApproval: async () => {},
    };

    const host = new ProviderAdapterHost({
      claude: adapter,
    });

    await host.discover();
    await host.attach('session-4');
    await host.sendMessage('session-4', { text: 'after-attach' });

    expect(attach).toHaveBeenCalledWith('provider-session-4-tmp');
    expect(sendUserMessage).toHaveBeenCalledWith({
      brokerSessionId: 'session-4',
      providerSessionRef: 'provider-session-4-canonical',
      text: 'after-attach',
    });
  });

  it('prunes stale discovered bindings when sessions disappear', async () => {
    const discover = vi
      .fn<ProviderAdapter['discover']>()
      .mockResolvedValueOnce([
        {
          brokerSessionId: 'session-stale',
          providerSessionRef: 'provider-stale',
          provider: 'codex',
          title: 'Stale Session',
          attachability: 'attachable',
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
        },
      ])
      .mockResolvedValueOnce([]);

    const adapter: ProviderAdapter = {
      discover,
      attach: async () => null,
      sendUserMessage: async () => {},
      interrupt: async () => {},
      resolveApproval: async () => {},
    };

    const host = new ProviderAdapterHost({
      codex: adapter,
    });

    await host.discover();
    expect(host.getCapabilities('session-stale').capabilities).toEqual(['sendUserMessage']);

    await host.discover();

    expect(host.getCapabilities('session-stale')).toEqual({
      capabilities: [],
      degradedFlags: [],
    });
    await expect(host.attach('session-stale')).rejects.toThrow('Unknown broker session');
  });

  it('routes attachment discovery through the mapped adapter session', async () => {
    const listAttachments = vi.fn(async () => [
      {
        id: 'artifact-1',
        kind: 'image',
        label: 'preview.png',
      },
    ]);

    const adapter: ProviderAdapter = {
      discover: async () => [
        {
          brokerSessionId: 'session-attachments',
          providerSessionRef: 'provider-session-attachments',
          provider: 'codex',
          title: 'Session Attachments',
          attachability: 'attachable',
          capabilities: ['sendUserMessage'],
          degradedFlags: [],
        },
      ],
      attach: async () => ({
        brokerSessionId: 'session-attachments',
        providerSessionRef: 'provider-session-attachments',
        provider: 'codex',
        latestSeq: 1,
        capabilities: ['sendUserMessage'],
        degradedFlags: [],
      }),
      sendUserMessage: async () => {},
      interrupt: async () => {},
      resolveApproval: async () => {},
      listAttachments,
    };

    const host = new ProviderAdapterHost({
      codex: adapter,
    });

    await host.discover();

    await expect(host.listAttachments('session-attachments')).resolves.toMatchObject([
      {
        id: 'artifact-1',
        kind: 'image',
      },
    ]);
    expect(listAttachments).toHaveBeenCalledWith('provider-session-attachments');
  });
});
