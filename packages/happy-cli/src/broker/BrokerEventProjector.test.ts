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

  it('resolves approvals after restart when pending in state', () => {
    let state: any = {
      requests: {
        'approval-2': {
          tool: 'Write',
          arguments: { description: 'Apply patch', brokerApprovalId: 'approval-2' },
          createdAt: 123,
        },
      },
      completedRequests: {},
    };
    const updateAgentState = vi.fn((handler: (currentState: any) => any) => {
      state = handler(state);
    });

    const projector = new BrokerEventProjector({
      sendAgentMessage: vi.fn(),
      keepAlive: vi.fn(),
      updateAgentState,
    });

    projector.applyEvent({
      type: 'session.approval.resolved',
      brokerSessionId: 'broker-sess-1',
      payload: { approvalId: 'approval-2', decision: 'approve' },
    });

    expect(state.requests?.['approval-2']).toBeUndefined();
    expect(state.completedRequests?.['approval-2']).toMatchObject({
      status: 'approved',
    });
  });

  it('dismisses approvals after restart when pending in state', () => {
    let state: any = {
      requests: {
        'approval-3': {
          tool: 'Read',
          arguments: { description: 'Inspect file', brokerApprovalId: 'approval-3' },
          createdAt: 456,
        },
      },
      completedRequests: {},
    };
    const updateAgentState = vi.fn((handler: (currentState: any) => any) => {
      state = handler(state);
    });

    const projector = new BrokerEventProjector({
      sendAgentMessage: vi.fn(),
      keepAlive: vi.fn(),
      updateAgentState,
    });

    projector.applyEvent({
      type: 'session.approval.dismissed',
      brokerSessionId: 'broker-sess-1',
      payload: { approvalId: 'approval-3' },
    });

    expect(state.requests?.['approval-3']).toBeUndefined();
    expect(state.completedRequests?.['approval-3']).toMatchObject({
      status: 'canceled',
      reason: 'dismissed',
    });
  });

  it('dedupes duplicate approval requests already pending in state', () => {
    const initialRequest = {
      tool: 'Write',
      arguments: { description: 'Apply patch', brokerApprovalId: 'approval-4' },
      createdAt: 111,
    };
    let state: any = {
      requests: {
        'approval-4': { ...initialRequest },
      },
      completedRequests: {},
    };
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
        approvalId: 'approval-4',
        label: 'Write',
        description: 'Apply patch',
      },
    });

    expect(state.requests?.['approval-4']).toEqual(initialRequest);
    expect(state.completedRequests?.['approval-4']).toBeUndefined();
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
