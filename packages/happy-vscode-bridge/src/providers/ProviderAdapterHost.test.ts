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
});
