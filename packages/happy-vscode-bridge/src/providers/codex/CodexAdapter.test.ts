import { describe, expect, it, vi } from 'vitest';

import { CodexAdapter } from './CodexAdapter';

describe('CodexAdapter', () => {
  it('maps a live Codex session candidate into an attachable broker session', async () => {
    const adapter = new CodexAdapter({
      liveSource: {
        listLiveSessions: async () => [
          {
            providerSessionRef: 'codex-live-1',
            title: 'Codex Live Session',
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
      attachmentBridgeAvailable: true,
    });

    const sessions = await adapter.discover();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      providerSessionRef: 'codex-live-1',
      provider: 'codex',
      title: 'Codex Live Session',
      attachability: 'attachable',
    });
    expect(sessions[0].brokerSessionId).toEqual(expect.any(String));
    expect(sessions[0].brokerSessionId).not.toBe('codex-live-1');
  });

  it('surfaces attachment bridge gaps explicitly with degraded attachability', async () => {
    const adapter = new CodexAdapter({
      liveSource: {
        listLiveSessions: async () => [
          {
            providerSessionRef: 'codex-live-2',
            title: 'Needs Attachment Bridge',
            isLive: true,
            canAttach: true,
            supportsApprovals: false,
            supportsInterrupt: false,
          },
        ],
      },
      actions: {
        sendUserMessage: async () => {},
      },
      attachmentBridgeAvailable: false,
    });

    const sessions = await adapter.discover();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].attachability).toBe('attachable_with_degraded_capabilities');
    expect(sessions[0].degradedFlags).toContain('attachment_bridge_unavailable');
  });

  it('surfaces missing approval and interrupt bridges explicitly', async () => {
    const adapter = new CodexAdapter({
      liveSource: {
        listLiveSessions: async () => [
          {
            providerSessionRef: 'codex-live-bridge-gaps',
            title: 'Needs Approval And Interrupt Bridges',
            isLive: true,
            canAttach: true,
            supportsApprovals: true,
            supportsInterrupt: true,
          },
        ],
      },
      actions: {
        sendUserMessage: async () => {},
      },
      attachmentBridgeAvailable: true,
    });

    const sessions = await adapter.discover();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].attachability).toBe('attachable_with_degraded_capabilities');
    expect(sessions[0].degradedFlags).toEqual(
      expect.arrayContaining([
        'approval_bridge_unavailable',
        'interrupt_bridge_unavailable',
      ]),
    );
    expect(sessions[0].capabilities).not.toContain('resolveApproval');
    expect(sessions[0].capabilities).not.toContain('interrupt');
  });

  it('marks sessions without send bridge as read-only degraded attach', async () => {
    const adapter = new CodexAdapter({
      liveSource: {
        listLiveSessions: async () => [
          {
            providerSessionRef: 'codex-live-read-only',
            title: 'Read Only Attach',
            isLive: true,
            canAttach: true,
            supportsApprovals: false,
            supportsInterrupt: false,
          },
        ],
      },
      actions: {},
      attachmentBridgeAvailable: true,
    });

    const sessions = await adapter.discover();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].attachability).toBe('attachable_with_degraded_capabilities');
    expect(sessions[0].degradedFlags).toContain('read_only_attach');
    expect(sessions[0].capabilities).not.toContain('sendUserMessage');
    expect(adapter.getHealth('codex-live-read-only')).toMatchObject({
      readOnlyAttach: true,
    });
  });

  it('uses metadata as enrichment only and does not discover metadata-only sessions', async () => {
    const listSessionMetadata = vi.fn(async () => [
      {
        providerSessionRef: 'metadata-only',
        title: 'Metadata Orphan',
        latestSeq: 99,
      },
      {
        providerSessionRef: 'codex-live-3',
        title: 'Enriched Title',
        latestSeq: 7,
      },
    ]);

    const adapter = new CodexAdapter({
      liveSource: {
        listLiveSessions: async () => [
          {
            providerSessionRef: 'codex-live-3',
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
      attachmentBridgeAvailable: true,
    });

    const sessions = await adapter.discover();
    expect(listSessionMetadata).toHaveBeenCalledTimes(1);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      providerSessionRef: 'codex-live-3',
      provider: 'codex',
      title: 'Enriched Title',
    });
    expect(sessions.find((session) => session.providerSessionRef === 'metadata-only')).toBe(
      undefined,
    );
  });

  it('keeps live discovery working when metadata enrichment throws', async () => {
    const adapter = new CodexAdapter({
      liveSource: {
        listLiveSessions: async () => [
          {
            providerSessionRef: 'codex-live-4',
            title: 'Live Title Fallback',
            isLive: true,
            canAttach: true,
            supportsApprovals: false,
            supportsInterrupt: false,
          },
        ],
      },
      metadataSource: {
        listSessionMetadata: async () => {
          throw new Error('metadata unavailable');
        },
      },
      actions: {
        sendUserMessage: async () => {},
      },
      attachmentBridgeAvailable: true,
    });

    await expect(adapter.discover()).resolves.toMatchObject([
      {
        providerSessionRef: 'codex-live-4',
        title: 'Live Title Fallback',
        provider: 'codex',
        attachability: 'attachable',
      },
    ]);
  });

  it('returns null from attach when a discovered session is not attachable and does not report attachment bridge outage', async () => {
    const adapter = new CodexAdapter({
      liveSource: {
        listLiveSessions: async () => [
          {
            providerSessionRef: 'codex-live-5',
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
      attachmentBridgeAvailable: true,
    });

    const sessions = await adapter.discover();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].attachability).toBe('not_attachable');
    expect(sessions[0].degradedFlags).not.toContain('attachment_bridge_unavailable');
    expect(adapter.getHealth('codex-live-5')).toMatchObject({
      attachmentBridgeAvailable: true,
    });

    await expect(adapter.attach('codex-live-5')).resolves.toBeNull();
  });
});
