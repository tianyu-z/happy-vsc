# Happy CLI Broker Relay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a broker-backed Happy session relay in `happy-cli` so one `machineId + brokerSessionId` maps to one stable Happy session with text streaming, interrupt, approval, and run-status sync.

**Architecture:** Keep `happy-vscode-bridge` as the local broker of truth, then add a `happy-cli` relay layer that owns the stable Happy session identity, consumes broker event notifications, and reuses existing `ApiSessionClient` message/RPC flows. Decompose the work into transport helpers, stable identity, event projection, relay lifecycle, and daemon attach reuse so each slice is testable on its own.

**Tech Stack:** TypeScript, Vitest, WebSocket (`ws`), Socket.IO session RPC via `ApiSessionClient`, existing Happy daemon/session bootstrap code

---

## Scope Check

This plan intentionally covers one subsystem only: the `happy-cli` broker relay path for broker-backed sessions. It does **not** include attachment UI, tool-card reconstruction, editor context UX, or broker replay/history APIs. Those should stay out of the implementation unless a failing test from this plan proves they are required for the v1 text/control loop.

## File Map

### Existing files to modify

- `packages/happy-cli/src/broker/BrokerClient.ts`
  - Add typed broker RPC helpers for `interruptSession` and `resolveApproval`.
- `packages/happy-cli/src/broker/BrokerClient.test.ts`
  - Lock the new RPC helper payloads and parsed return values.
- `packages/happy-cli/src/broker/brokerTypes.ts`
  - Add schemas/types for broker event notifications used by the relay.
- `packages/happy-cli/src/broker/runBrokerAttachedSession.ts`
  - Replace one-shot attach bootstrap with stable-tag relay bootstrap.
- `packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts`
  - Assert stable session tags and relay bootstrap behavior.
- `packages/happy-cli/src/daemon/run.ts`
  - Reuse an existing broker-backed session/relay when the same `brokerSessionId` is attached again.
- `packages/happy-cli/src/daemon/types.ts`
  - Track any extra broker-backed relay metadata needed by reuse logic.

### New files to create

- `packages/happy-cli/src/broker/BrokerEventStream.ts`
  - Manage a long-lived broker WebSocket subscription and emit parsed `brokerEvent` notifications.
- `packages/happy-cli/src/broker/BrokerEventStream.test.ts`
  - Cover subscribe ack, notification parsing, and stream shutdown.
- `packages/happy-cli/src/broker/BrokerSessionIdentity.ts`
  - Build the stable Happy session tag from `machineId + brokerSessionId`.
- `packages/happy-cli/src/broker/BrokerSessionIdentity.test.ts`
  - Lock stable tag format and edge cases.
- `packages/happy-cli/src/broker/BrokerEventProjector.ts`
  - Project broker events into Happy messages, keep-alives, and `AgentState` request/completed-request updates.
- `packages/happy-cli/src/broker/BrokerEventProjector.test.ts`
  - Cover assistant/user/tool deltas, echo suppression, approval state transitions, and run-status dedupe.
- `packages/happy-cli/src/broker/BrokerRelayRunner.ts`
  - Orchestrate attach, session bootstrap/reconnection, inbound message forwarding, event subscription, and session RPC handlers.
- `packages/happy-cli/src/broker/BrokerRelayRunner.test.ts`
  - Cover the fake end-to-end relay loop with broker messages, approval, interrupt, and completion.
- `packages/happy-cli/src/daemon/brokerSessionReuse.ts`
  - Pure helper that finds a reusable broker-backed tracked session by `brokerSessionId`.
- `packages/happy-cli/src/daemon/brokerSessionReuse.test.ts`
  - Lock reuse rules for active, missing, and incomplete tracked sessions.

### Files intentionally left untouched in v1

- `packages/happy-app/sources/app/(app)/machine/[id].tsx`
  - Existing attach UI is already present; no UI redesign in this plan.
- `packages/happy-app/sources/sync/ops.ts`
  - Existing `sessionAbort` / `sessionAllow` / `sessionDeny` flows are reused unchanged.
- `packages/happy-server`
  - No server protocol changes are planned for the relay v1.

## Task Order

### Task 1: Lock Broker Control RPC And Event Subscription

**Files:**
- Modify: `packages/happy-cli/src/broker/BrokerClient.ts`
- Modify: `packages/happy-cli/src/broker/BrokerClient.test.ts`
- Modify: `packages/happy-cli/src/broker/brokerTypes.ts`
- Create: `packages/happy-cli/src/broker/BrokerEventStream.ts`
- Create: `packages/happy-cli/src/broker/BrokerEventStream.test.ts`

- [ ] **Step 1: Write the failing tests for control RPC helpers**

Add these cases to `packages/happy-cli/src/broker/BrokerClient.test.ts`:

```ts
it('sends interruptSession with brokerSessionId and reason', async () => {
  const client = new BrokerClient(server.url);
  await expect(
    client.interruptSession('broker-sess-1', 'user_abort'),
  ).resolves.toBe(true);

  expect(server.calls).toContainEqual(
    expect.objectContaining({
      method: 'interruptSession',
      params: {
        brokerSessionId: 'broker-sess-1',
        reason: 'user_abort',
      },
    }),
  );
});
```

```ts
it('sends resolveApproval with approve/deny decisions', async () => {
  const client = new BrokerClient(server.url);
  await expect(
    client.resolveApproval('broker-sess-1', 'approval-1', 'approve'),
  ).resolves.toBe(true);
});
```

- [ ] **Step 2: Write the failing tests for the long-lived event stream**

Create `packages/happy-cli/src/broker/BrokerEventStream.test.ts` with a broker stub that sends:

```ts
socket.send(JSON.stringify({
  method: 'brokerEvent',
  params: {
    brokerSessionId: 'broker-sess-1',
    entry: {
      seq: 7,
      at: 123,
      sessionId: 'broker-sess-1',
      event: {
        type: 'session.message.delta',
        brokerSessionId: 'broker-sess-1',
        payload: { role: 'assistant', text: 'hello from broker' },
      },
    },
  },
}));
```

Assert that:

- `subscribeEvents()` sends the broker RPC request once
- notifications are parsed into a typed callback payload
- `close()` stops delivering any further events

- [ ] **Step 3: Run the new broker transport tests and confirm they fail**

Run:

```bash
npx vitest run \
  packages/happy-cli/src/broker/BrokerClient.test.ts \
  packages/happy-cli/src/broker/BrokerEventStream.test.ts
```

Expected:

- `BrokerClient.test.ts` fails because `interruptSession` and `resolveApproval` do not exist
- `BrokerEventStream.test.ts` fails because the stream helper does not exist

- [ ] **Step 4: Implement the minimal broker transport additions**

Implementation notes:

1. Extend `brokerTypes.ts` with the notification payload shape used by `BrokerServer`:

```ts
export const brokerEventNotificationSchema = z.object({
  method: z.literal('brokerEvent'),
  params: z.object({
    brokerSessionId: z.string().min(1),
    entry: z.object({
      seq: z.number().int().nonnegative(),
      at: z.number().int().nonnegative(),
      sessionId: z.string().min(1),
      event: brokerEventSchema,
    }).strict(),
  }).strict(),
}).strict();
```

2. Add request helpers in `BrokerClient.ts`:

```ts
async interruptSession(brokerSessionId: string, reason: string): Promise<boolean> {
  const result = await this.request('interruptSession', { brokerSessionId, reason });
  return z.boolean().parse(result);
}

async resolveApproval(
  brokerSessionId: string,
  approvalId: string,
  decision: 'approve' | 'deny',
): Promise<boolean> {
  const result = await this.request('resolveApproval', {
    brokerSessionId,
    approvalId,
    decision,
  });
  return z.boolean().parse(result);
}
```

3. Implement `BrokerEventStream` as a separate focused class:

```ts
export class BrokerEventStream {
  async subscribeEvents(
    brokerSessionId: string,
    onEvent: (event: BrokerEventLogEntry) => void,
  ): Promise<void> { /* open socket, send subscribeEvents RPC, parse notifications */ }

  async close(): Promise<void> { /* remove listeners and close socket */ }
}
```

Keep `BrokerClient` as short-lived request/response transport and keep the long-lived socket logic isolated in the new file.

- [ ] **Step 5: Re-run the broker transport tests**

Run:

```bash
npx vitest run \
  packages/happy-cli/src/broker/BrokerClient.test.ts \
  packages/happy-cli/src/broker/BrokerEventStream.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit the transport layer**

```bash
git add \
  packages/happy-cli/src/broker/BrokerClient.ts \
  packages/happy-cli/src/broker/BrokerClient.test.ts \
  packages/happy-cli/src/broker/brokerTypes.ts \
  packages/happy-cli/src/broker/BrokerEventStream.ts \
  packages/happy-cli/src/broker/BrokerEventStream.test.ts
git commit -m "feat(cli): add broker control rpc and event stream"
```

### Task 2: Introduce Stable Broker Session Identity

**Files:**
- Create: `packages/happy-cli/src/broker/BrokerSessionIdentity.ts`
- Create: `packages/happy-cli/src/broker/BrokerSessionIdentity.test.ts`
- Modify: `packages/happy-cli/src/broker/runBrokerAttachedSession.ts`
- Modify: `packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts`

- [ ] **Step 1: Write the failing identity tests**

Create `packages/happy-cli/src/broker/BrokerSessionIdentity.test.ts`:

```ts
it('builds a stable broker-backed Happy session tag', () => {
  expect(buildBrokerSessionTag({
    machineId: 'machine-1',
    brokerSessionId: 'broker-sess-1',
  })).toBe('broker:machine-1:broker-sess-1');
});
```

Also extend `runBrokerAttachedSession.test.ts`:

```ts
expect(getOrCreateSession).toHaveBeenCalledWith(
  expect.objectContaining({
    tag: 'broker:machine-1:broker-sess-1',
  }),
);
```

- [ ] **Step 2: Run the identity/bootstrap tests and confirm they fail**

Run:

```bash
npx vitest run \
  packages/happy-cli/src/broker/BrokerSessionIdentity.test.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts
```

Expected:

- missing `BrokerSessionIdentity`
- `runBrokerAttachedSession` still uses a random tag

- [ ] **Step 3: Implement stable-tag generation and wire it into bootstrap**

Implementation notes:

1. Add a tiny pure helper:

```ts
export function buildBrokerSessionTag(opts: {
  machineId: string;
  brokerSessionId: string;
}): string {
  return `broker:${opts.machineId}:${opts.brokerSessionId}`;
}
```

2. Update `runBrokerAttachedSession.ts` so that broker-backed sessions always call:

```ts
const sessionTag = options.sessionTag ?? buildBrokerSessionTag({
  machineId,
  brokerSessionId: snapshot.brokerSessionId,
});
```

3. Keep the existing metadata projection behavior intact; the only semantic change in this task is stable identity, not relay lifecycle yet.

- [ ] **Step 4: Re-run the identity/bootstrap tests**

Run:

```bash
npx vitest run \
  packages/happy-cli/src/broker/BrokerSessionIdentity.test.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the stable identity slice**

```bash
git add \
  packages/happy-cli/src/broker/BrokerSessionIdentity.ts \
  packages/happy-cli/src/broker/BrokerSessionIdentity.test.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts
git commit -m "feat(cli): add stable broker-backed session tags"
```

### Task 3: Project Broker Events Into Happy Messages And AgentState

**Files:**
- Create: `packages/happy-cli/src/broker/BrokerEventProjector.ts`
- Create: `packages/happy-cli/src/broker/BrokerEventProjector.test.ts`

- [ ] **Step 1: Write the failing projector tests**

Create a fake session surface in `packages/happy-cli/src/broker/BrokerEventProjector.test.ts` and cover these cases:

```ts
it('projects assistant deltas into ACP message output', () => {
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
```

```ts
it('suppresses broker user echoes that match recently forwarded mobile text', () => {
  projector.rememberOutboundUserText('continue');
  projector.applyEvent({
    type: 'session.message.delta',
    brokerSessionId: 'broker-sess-1',
    payload: { role: 'user', text: 'continue' },
  });

  expect(sendAgentMessage).not.toHaveBeenCalled();
});
```

```ts
it('moves approval requests from pending to completed', () => {
  projector.applyEvent({
    type: 'session.approval.requested',
    brokerSessionId: 'broker-sess-1',
    payload: { approvalId: 'approval-1', label: 'Write file' },
  });
  projector.applyEvent({
    type: 'session.approval.resolved',
    brokerSessionId: 'broker-sess-1',
    payload: { approvalId: 'approval-1', decision: 'approve' },
  });
});
```

```ts
it('dedupes repeated run statuses', () => {
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
```

- [ ] **Step 2: Run the projector tests and confirm they fail**

Run:

```bash
npx vitest run packages/happy-cli/src/broker/BrokerEventProjector.test.ts
```

Expected: FAIL because the projector file does not exist.

- [ ] **Step 3: Implement the minimal projector**

Implementation notes:

1. Define a narrow session interface for the projector instead of depending on all of `ApiSessionClient`.
2. Keep only four kinds of mutable state:
   - recent outbound user texts for echo suppression
   - known pending approval ids
   - last run status
   - current provider flavor (`claude` or `codex`)
3. Project text deltas conservatively:

```ts
if (event.type === 'session.message.delta' && event.payload.role === 'assistant') {
  session.sendAgentMessage(provider, { type: 'message', message: event.payload.text });
}
```

4. Project approvals through `updateAgentState()` using the existing `requests` / `completedRequests` shape:

```ts
requests[approvalId] = {
  tool: payload.label,
  arguments: { description: payload.description ?? null, brokerApprovalId: approvalId },
  createdAt: now,
};
```

5. For `session.run.status`, map to `keepAlive()` and emit at most one update per status transition.

- [ ] **Step 4: Re-run the projector tests**

Run:

```bash
npx vitest run packages/happy-cli/src/broker/BrokerEventProjector.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the projector slice**

```bash
git add \
  packages/happy-cli/src/broker/BrokerEventProjector.ts \
  packages/happy-cli/src/broker/BrokerEventProjector.test.ts
git commit -m "feat(cli): project broker events into happy session state"
```

### Task 4: Build The Long-Lived Broker Relay Runner

**Files:**
- Create: `packages/happy-cli/src/broker/BrokerRelayRunner.ts`
- Create: `packages/happy-cli/src/broker/BrokerRelayRunner.test.ts`
- Modify: `packages/happy-cli/src/broker/runBrokerAttachedSession.ts`
- Modify: `packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts`

- [ ] **Step 1: Write the failing relay runner tests**

Create `packages/happy-cli/src/broker/BrokerRelayRunner.test.ts` with one focused fake-integration case:

```ts
it('forwards mobile text, receives broker output, handles approval, and interrupts', async () => {
  const runner = new BrokerRelayRunner(/* fake broker + fake session */);
  await runner.start();

  emitUserMessage({
    role: 'user',
    content: { type: 'text', text: 'continue' },
  });
  expect(sendMessage).toHaveBeenCalledWith('broker-sess-1', 'continue');

  emitBrokerEvent({
    type: 'session.message.delta',
    brokerSessionId: 'broker-sess-1',
    payload: { role: 'assistant', text: 'working' },
  });

  await rpcHandlers.abort({ reason: 'user_abort' });
  expect(interruptSession).toHaveBeenCalled();
});
```

Also extend `runBrokerAttachedSession.test.ts` to assert the wrapper no longer exits immediately after `getOrCreateSession`, but instead starts the runner with the stable tag and broker snapshot.

- [ ] **Step 2: Run the relay runner tests and confirm they fail**

Run:

```bash
npx vitest run \
  packages/happy-cli/src/broker/BrokerRelayRunner.test.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts
```

Expected: FAIL because the runner does not exist and the wrapper is still one-shot.

- [ ] **Step 3: Implement the relay runner**

Implementation notes:

1. `BrokerRelayRunner.start()` should perform:

```ts
const snapshot = await brokerClient.attachSession(brokerSessionId);
const tag = buildBrokerSessionTag({ machineId, brokerSessionId: snapshot.brokerSessionId });
const { session, reconnectionHandle } = setupOfflineReconnection({
  api,
  sessionTag: tag,
  metadata,
  state,
  response,
  onSessionSwap: (newSession) => { /* update current session + projector */ },
});
```

2. After session bootstrap:
   - register `onUserMessage()` forwarding to `brokerClient.sendMessage()`
   - register session RPC `abort`
   - register session RPC `permission`
   - start `BrokerEventStream.subscribeEvents()`
   - pass all broker events into `BrokerEventProjector`

3. Keep `runBrokerAttachedSession.ts` as the CLI-facing wrapper that:
   - resolves `api`, `machineId`, and `brokerClient`
   - creates/starts `BrokerRelayRunner`
   - only returns when the runner shuts down or throws

4. Do **not** add attachment UI or tool-card reconstruction here; keep the runner narrowly focused on text/control relay.

- [ ] **Step 4: Re-run the relay runner tests**

Run:

```bash
npx vitest run \
  packages/happy-cli/src/broker/BrokerRelayRunner.test.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the relay lifecycle slice**

```bash
git add \
  packages/happy-cli/src/broker/BrokerRelayRunner.ts \
  packages/happy-cli/src/broker/BrokerRelayRunner.test.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts
git commit -m "feat(cli): run broker-backed sessions through a long-lived relay"
```

### Task 5: Reuse Existing Broker-Backed Sessions In The Daemon

**Files:**
- Create: `packages/happy-cli/src/daemon/brokerSessionReuse.ts`
- Create: `packages/happy-cli/src/daemon/brokerSessionReuse.test.ts`
- Modify: `packages/happy-cli/src/daemon/run.ts`
- Modify: `packages/happy-cli/src/daemon/types.ts`

- [ ] **Step 1: Write the failing reuse helper tests**

Create `packages/happy-cli/src/daemon/brokerSessionReuse.test.ts`:

```ts
it('returns an existing happy session id for the same broker session', () => {
  const tracked = new Map([
    [11, {
      startedBy: 'daemon',
      source: 'broker_attached',
      brokerSessionId: 'broker-sess-1',
      happySessionId: 'happy-sess-1',
      pid: 11,
    }],
  ]);

  expect(findReusableBrokerSession(tracked, 'broker-sess-1')?.happySessionId)
    .toBe('happy-sess-1');
});
```

```ts
it('ignores tracked sessions that have no happy session id yet', () => {
  const tracked = new Map([
    [11, {
      startedBy: 'daemon',
      source: 'broker_attached',
      brokerSessionId: 'broker-sess-1',
      pid: 11,
    }],
  ]);

  expect(findReusableBrokerSession(tracked, 'broker-sess-1')).toBeUndefined();
});
```

- [ ] **Step 2: Run the daemon reuse tests and confirm they fail**

Run:

```bash
npx vitest run packages/happy-cli/src/daemon/brokerSessionReuse.test.ts
```

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement reuse lookup and wire it into `daemon/run.ts`**

Implementation notes:

1. Add a pure helper:

```ts
export function findReusableBrokerSession(
  tracked: Map<number, TrackedSession>,
  brokerSessionId: string,
): TrackedSession | undefined {
  return Array.from(tracked.values()).find((session) =>
    session.source === 'broker_attached'
    && session.brokerSessionId === brokerSessionId
    && !!session.happySessionId,
  );
}
```

2. In the `options.source === 'broker_attached'` branch of `daemon/run.ts`, short-circuit before spawning:

```ts
const existing = findReusableBrokerSession(pidToTrackedSession, options.brokerSessionId);
if (existing?.happySessionId) {
  return { type: 'success', sessionId: existing.happySessionId };
}
```

3. Only if no reusable session exists should the daemon spawn a new `broker-attached-session` child.

- [ ] **Step 4: Re-run the daemon reuse tests**

Run:

```bash
npx vitest run packages/happy-cli/src/daemon/brokerSessionReuse.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the daemon reuse slice**

```bash
git add \
  packages/happy-cli/src/daemon/brokerSessionReuse.ts \
  packages/happy-cli/src/daemon/brokerSessionReuse.test.ts \
  packages/happy-cli/src/daemon/run.ts \
  packages/happy-cli/src/daemon/types.ts
git commit -m "feat(cli): reuse existing broker-backed sessions in daemon"
```

### Task 6: Verify The Full Relay Slice And Lock Regression Coverage

**Files:**
- Test only: `packages/happy-cli/src/broker/*.test.ts`
- Test only: `packages/happy-cli/src/daemon/brokerSessionReuse.test.ts`
- Typecheck: `packages/happy-cli`

- [ ] **Step 1: Run the focused broker relay suite**

Run:

```bash
npx vitest run \
  packages/happy-cli/src/broker/BrokerClient.test.ts \
  packages/happy-cli/src/broker/BrokerEventStream.test.ts \
  packages/happy-cli/src/broker/BrokerSessionIdentity.test.ts \
  packages/happy-cli/src/broker/BrokerEventProjector.test.ts \
  packages/happy-cli/src/broker/BrokerRelayRunner.test.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts \
  packages/happy-cli/src/daemon/brokerSessionReuse.test.ts
```

Expected: PASS

- [ ] **Step 2: Run the package typecheck**

Run:

```bash
yarn --cwd packages/happy-cli typecheck
```

Expected: PASS

- [ ] **Step 3: If any implementation required app or wire changes, typecheck those packages too**

Only run these if you actually touched those packages:

```bash
yarn --cwd packages/happy-app typecheck
yarn --cwd packages/happy-wire typecheck
```

Expected: PASS

- [ ] **Step 4: Commit the final verified relay implementation**

```bash
git add packages/happy-cli/src/broker packages/happy-cli/src/daemon
git commit -m "feat(cli): relay broker-backed vscode sessions"
```

## Manual QA Checklist

- [ ] Start the local `happy-vscode-bridge` broker in a VS Code window that already has an official Claude or Codex live session.
- [ ] Open the machine page in `happy-app` and confirm the broker session is listed.
- [ ] Attach the broker session twice; confirm both attaches open the same `Happy session`.
- [ ] Send a text message from mobile; confirm the official VS Code live session receives it.
- [ ] Confirm assistant streaming text appears in the mobile session.
- [ ] Trigger a broker approval request; confirm mobile can approve or deny it.
- [ ] Trigger interrupt from mobile; confirm the broker run stops.
- [ ] Restart the daemon or relay process; confirm re-attach lands back in the same Happy session.

## Notes For The Implementer

- Keep the relay text-first. If you are tempted to reconstruct full tool cards, stop and add a note instead.
- Prefer narrow interfaces around `ApiSessionClient` in the new relay/projector files so the tests can stay small.
- Do not refactor `happy-app` UI in this plan unless manual QA finds an actual broker-backed regression.
- If the broker stream API shape differs from the current bridge notification format, update the tests first and then the transport code; do not hide protocol drift in ad-hoc parsing.
