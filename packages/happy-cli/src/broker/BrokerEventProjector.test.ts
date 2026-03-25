import { describe, expect, it, vi } from 'vitest';

import { BrokerEventProjector } from './BrokerEventProjector';

describe('BrokerEventProjector', () => {
  it('projects assistant deltas into ACP messages', () => {
    const sendAgentMessage = vi.fn();
    const projector = new BrokerEventProjector({
      sendAgentMessage,
      keepAlive: vi.fn(),
      updateAgentState: vi.fn(),
    });

    projector.applyEvent({
      type: 'session.message.delta',
      brokerSessionId: 'broker-sess-1',
      payload: { role: 'assistant', text: 'done' },
    });

    expect(sendAgentMessage).toHaveBeenCalledWith('claude', {
      type: 'message',
      message: 'done',
    });
  });

  it('suppresses user echoes that match outbound text', () => {
    const sendAgentMessage = vi.fn();
    const projector = new BrokerEventProjector({
      sendAgentMessage,
      keepAlive: vi.fn(),
      updateAgentState: vi.fn(),
    });

    projector.rememberOutboundUserText('continue');
    projector.applyEvent({
      type: 'session.message.delta',
      brokerSessionId: 'broker-sess-1',
      payload: { role: 'user', text: 'continue' },
    });

    expect(sendAgentMessage).not.toHaveBeenCalled();
  });

  it('moves approvals from pending to completed when resolved', () => {
    let state: any = {};
    const updateAgentState = vi.fn((handler: (currentState: any) => any) => {
      state = handler(state);
    });

    const projector = new BrokerEventProjector({
      sendAgentMessage: vi.fn(),
      keepAlive: vi.fn(),
      updateAgentState,
    });

    projector.applyEvent({
      type: 'session.approval.requested',
      brokerSessionId: 'broker-sess-1',
      payload: {
        approvalId: 'approval-1',
        label: 'Write',
        description: 'Apply patch',
      },
    });

    expect(state.requests?.['approval-1']).toMatchObject({
      tool: 'Write',
    });

    projector.applyEvent({
      type: 'session.approval.resolved',
      brokerSessionId: 'broker-sess-1',
      payload: { approvalId: 'approval-1', decision: 'approve' },
    });

    expect(state.requests?.['approval-1']).toBeUndefined();
    expect(state.completedRequests?.['approval-1']).toMatchObject({
      status: 'approved',
    });
  });

  it('dedupes repeated run statuses', () => {
    const keepAlive = vi.fn();
    const projector = new BrokerEventProjector({
      sendAgentMessage: vi.fn(),
      keepAlive,
      updateAgentState: vi.fn(),
    });

    projector.applyEvent({
      type: 'session.run.status',
      brokerSessionId: 'broker-sess-1',
      payload: { status: 'running' },
    });

    projector.applyEvent({
      type: 'session.run.status',
      brokerSessionId: 'broker-sess-1',
      payload: { status: 'running' },
    });

    expect(keepAlive).toHaveBeenCalledTimes(1);
  });
});
