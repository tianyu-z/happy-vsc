import { describe, expect, it, vi } from 'vitest';

import { ClaudeAdapter } from './ClaudeAdapter';

describe('ClaudeAdapter', () => {
  it('maps a live Claude session candidate into an attachable broker session', async () => {
    const adapter = new ClaudeAdapter({
      liveSource: {
        listLiveSessions: async () => [
          {
            providerSessionRef: 'claude-live-1',
            title: 'Claude Live Session',
            isLive: true,
            canAttach: true,
            supportsApprovals: true,
            supportsInterrupt: true,
          },
        ],
      },
      actions: {
        sendUserMessage: async () => {},
        interrupt: async () => {},
        resolveApproval: async () => {},
      },
    });

    const sessions = await adapter.discover();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].brokerSessionId).toEqual(expect.any(String));
    expect(sessions[0].brokerSessionId).not.toBe('claude-live-1');
    expect(sessions[0]).toMatchObject({
      providerSessionRef: 'claude-live-1',
      provider: 'claude',
      title: 'Claude Live Session',
      attachability: 'attachable',
    });
    expect(sessions[0].capabilities).toEqual(
      expect.arrayContaining(['sendUserMessage', 'interrupt', 'resolveApproval']),
    );
    expect(sessions[0].degradedFlags).toEqual([]);
  });

  it('marks approval bridging gaps as degraded instead of hiding them', async () => {
    const adapter = new ClaudeAdapter({
      liveSource: {
        listLiveSessions: async () => [
          {
            providerSessionRef: 'claude-live-2',
            title: 'Needs Approval Bridge',
            isLive: true,
            canAttach: true,
            supportsApprovals: true,
            supportsInterrupt: true,
          },
        ],
      },
      actions: {
        sendUserMessage: async () => {},
        interrupt: async () => {},
      },
    });

    const sessions = await adapter.discover();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].attachability).toBe('attachable_with_degraded_capabilities');
    expect(sessions[0].degradedFlags).toContain('approval_bridge_unavailable');
    expect(sessions[0].capabilities).not.toContain('resolveApproval');
  });

  it('uses local metadata as enrichment only and never as primary discovery', async () => {
    const listSessionMetadata = vi.fn(async () => [
      {
        providerSessionRef: 'metadata-only',
        title: 'Metadata Orphan',
        latestSeq: 99,
      },
      {
        providerSessionRef: 'live-3',
        title: 'Enriched Title',
        latestSeq: 7,
      },
    ]);

    const adapter = new ClaudeAdapter({
      liveSource: {
        listLiveSessions: async () => [
          {
            providerSessionRef: 'live-3',
            isLive: true,
            canAttach: true,
            supportsApprovals: false,
            supportsInterrupt: false,
          },
        ],
      },
      metadataSource: {
        listSessionMetadata,
      },
      actions: {
        sendUserMessage: async () => {},
      },
    });

    const sessions = await adapter.discover();
    expect(listSessionMetadata).toHaveBeenCalledTimes(1);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].brokerSessionId).toEqual(expect.any(String));
    expect(sessions[0]).toMatchObject({
      providerSessionRef: 'live-3',
      title: 'Enriched Title',
      provider: 'claude',
    });
    expect(sessions.find((session) => session.providerSessionRef === 'metadata-only')).toBe(
      undefined,
    );
  });

  it('returns not_attachable when core live attach preconditions fail', async () => {
    const adapter = new ClaudeAdapter({
      liveSource: {
        listLiveSessions: async () => [
          {
            providerSessionRef: 'claude-live-4',
            title: 'Not Attachable',
            isLive: true,
            canAttach: false,
            supportsApprovals: false,
            supportsInterrupt: false,
          },
        ],
      },
      actions: {
        sendUserMessage: async () => {},
      },
    });

    const sessions = await adapter.discover();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].attachability).toBe('not_attachable');
    expect(sessions[0].degradedFlags).toContain('attachment_bridge_unavailable');
  });
});
