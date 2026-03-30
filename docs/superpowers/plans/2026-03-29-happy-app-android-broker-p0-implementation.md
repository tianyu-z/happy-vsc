# Happy App Android Broker P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Android P0 broker control loop in `happy-app` so a user can discover broker-backed VS Code sessions, attach successfully, send a message from mobile, and see the reply flow back through the existing Happy session sync path.

**Architecture:** Keep one session truth source. The machine page still discovers broker sessions through `machineListBrokerSessions(...)` and attaches through `machineAttachBrokerSession(...)`; the session page still sends through `sync.sendOrQueueMessage(...)` and reads back from Happy session storage. The implementation only hardens the attach handoff, adds a broker-specific “still syncing” empty-state guard for freshly attached sessions, and locks the behavior with focused route/component tests.

**Tech Stack:** TypeScript, Expo Router, React Native, Zustand storage hooks, Vitest, React Test Renderer

---

## Scope Check

This plan covers one subsystem only: the Android/mobile-facing broker attach and message-loop UX in `packages/happy-app`.

It does **not**:

- create new VS Code sessions from mobile
- add broker diagnostics panels
- change broker DTO shape or server protocol
- redesign pending queue behavior
- introduce a second mobile-only broker message path

## File Map

### Existing files to modify

- `packages/happy-app/sources/app/(app)/machine/[id].tsx`
  - Harden attach success handling so a broker attach explicitly refreshes session data before opening the chat page.
- `packages/happy-app/sources/tests/routes/machineDetailRoute.test.tsx`
  - Add machine-page attach tests for broker success and broker failure handling.
- `packages/happy-app/sources/-session/SessionView.tsx`
  - Replace the misleading broker-empty-state path with a broker-specific hydration placeholder for freshly attached sessions.
- `packages/happy-app/sources/text/_default.ts`
  - Add fallback copy for the broker hydration placeholder.
- `packages/happy-app/sources/text/translations/en.ts`
  - Add English broker hydration strings.
- `packages/happy-app/sources/text/translations/zh-Hans.ts`
  - Add Simplified Chinese broker hydration strings.

### New files to create

- `packages/happy-app/sources/utils/brokerSessionHydration.ts`
  - Own the pure rules for when a broker-attached session with zero messages should still be treated as “syncing” instead of “empty”.
- `packages/happy-app/sources/utils/brokerSessionHydration.test.ts`
  - Lock the hydration window, failure fallback, and non-broker behavior.
- `packages/happy-app/sources/-session/SessionView.brokerHydration.test.tsx`
  - Assert the session page renders the broker hydration placeholder for a freshly attached broker session and falls back to the regular empty state when the hydration window is over.

### Files intentionally left untouched

- `packages/happy-app/sources/sync/ops.ts`
  - Existing list/attach RPC wrappers are already sufficient for this scope.
- `packages/happy-app/sources/sync/ops.broker.test.ts`
  - No DTO contract changes are planned in this implementation.
- `packages/happy-app/sources/sync/sync.ts`
  - Existing `sendOrQueueMessage(...)` remains the only message send path; the work here is UI handoff and empty-state correctness.

## Task Order

### Task 1: Harden Broker Attach Handoff On The Machine Page

**Files:**
- Modify: `packages/happy-app/sources/app/(app)/machine/[id].tsx`
- Modify: `packages/happy-app/sources/tests/routes/machineDetailRoute.test.tsx`

- [ ] **Step 1: Write the failing machine-page tests**

Extend `packages/happy-app/sources/tests/routes/machineDetailRoute.test.tsx` so it covers the two behaviors the current code does not lock down:

```tsx
it('refreshes sessions before navigating after a successful broker attach', async () => {
  machineState = onlineMachine();
  machineListBrokerSessionsMock.mockResolvedValue({
    sessions: [attachableBrokerSession()],
  });
  machineAttachBrokerSessionMock.mockResolvedValue({
    type: 'success',
    sessionId: 'session-broker-1',
  });

  const screen = renderer.create(<MachineDetailScreen />);
  const attachRow = screen.root.findByProps({ title: 'Claude live session' });

  await renderer.act(async () => {
    await attachRow.props.onPress();
  });

  expect(sync.refreshSessions).toHaveBeenCalledTimes(1);
  expect(navigateToSessionMock).toHaveBeenCalledWith('session-broker-1');
});
```

```tsx
it('keeps the user on the machine page when broker attach fails', async () => {
  machineState = onlineMachine();
  machineListBrokerSessionsMock.mockResolvedValue({
    sessions: [attachableBrokerSession()],
  });
  machineAttachBrokerSessionMock.mockResolvedValue({
    type: 'error',
    errorMessage: 'Bridge unreachable',
  });

  const screen = renderer.create(<MachineDetailScreen />);
  const attachRow = screen.root.findByProps({ title: 'Claude live session' });

  await renderer.act(async () => {
    await attachRow.props.onPress();
  });

  expect(navigateToSessionMock).not.toHaveBeenCalled();
  expect(Modal.alert).toHaveBeenCalledWith('common.error', 'Bridge unreachable');
});
```

Test scaffolding adjustments to make first:

- replace the bare `@/sync/ops` mock with named hoisted mocks such as `machineListBrokerSessionsMock` and `machineAttachBrokerSessionMock`
- replace `useNavigateToSession: () => vi.fn()` with a stable `navigateToSessionMock`
- extend the mocked `sync` object to include `refreshSessions: vi.fn(async () => undefined)`
- make `isMachineOnline()` return `true` for the online machine fixture used by the attach tests

- [ ] **Step 2: Run the route test to verify it fails**

Run:

```bash
npx vitest run packages/happy-app/sources/tests/routes/machineDetailRoute.test.tsx
```

Expected:

- the new success test fails because `sync.refreshSessions()` is never called before navigation
- the failure test may pass immediately, which is acceptable; keep it because it locks the no-navigation regression

- [ ] **Step 3: Implement the attach refresh handoff**

In `packages/happy-app/sources/app/(app)/machine/[id].tsx`, change the success path inside `handleAttachBroker(...)` from:

```ts
case 'success':
  navigateToSession(result.sessionId);
  break;
```

to:

```ts
case 'success':
  try {
    await sync.refreshSessions();
  } catch {
    // SessionView will still do its own refresh on focus; do not block navigation.
  }
  navigateToSession(result.sessionId);
  break;
```

Do **not** add a second attach code path or a polling loop here. The goal is only:

- make the successful attach path explicitly populate local session state first
- keep failure behavior unchanged
- rely on the existing session-page focus refresh as the fallback

- [ ] **Step 4: Re-run the route test to verify it passes**

Run:

```bash
npx vitest run packages/happy-app/sources/tests/routes/machineDetailRoute.test.tsx
```

Expected:

- PASS for the new broker attach success test
- PASS for the broker attach failure regression test

- [ ] **Step 5: Commit**

```bash
git add \
  "packages/happy-app/sources/app/(app)/machine/[id].tsx" \
  "packages/happy-app/sources/tests/routes/machineDetailRoute.test.tsx"
git commit -m "fix(app): refresh sessions before broker attach navigation"
```

### Task 2: Add A Broker Session Hydration Rule For Freshly Attached Empty Sessions

**Files:**
- Create: `packages/happy-app/sources/utils/brokerSessionHydration.ts`
- Create: `packages/happy-app/sources/utils/brokerSessionHydration.test.ts`
- Modify: `packages/happy-app/sources/-session/SessionView.tsx`
- Modify: `packages/happy-app/sources/text/_default.ts`
- Modify: `packages/happy-app/sources/text/translations/en.ts`
- Modify: `packages/happy-app/sources/text/translations/zh-Hans.ts`

- [ ] **Step 1: Write the failing hydration-rule tests**

Create `packages/happy-app/sources/utils/brokerSessionHydration.test.ts` with focused pure-function coverage:

```ts
import { describe, expect, it } from 'vitest';
import { shouldShowBrokerHydrationPlaceholder } from './brokerSessionHydration';

describe('shouldShowBrokerHydrationPlaceholder', () => {
  it('returns true for a freshly attached broker session with zero messages', () => {
    expect(
      shouldShowBrokerHydrationPlaceholder({
        sessionSource: 'broker_attached',
        createdAt: 1_700_000_000_000,
        now: 1_700_000_010_000,
        isLoaded: true,
        messageCount: 0,
        silentRefreshPhase: 'idle',
      }),
    ).toBe(true);
  });

  it('returns false after the refresh flow has already failed', () => {
    expect(
      shouldShowBrokerHydrationPlaceholder({
        sessionSource: 'broker_attached',
        createdAt: 1_700_000_000_000,
        now: 1_700_000_010_000,
        isLoaded: true,
        messageCount: 0,
        silentRefreshPhase: 'failed',
      }),
    ).toBe(false);
  });

  it('returns false for non-broker sessions', () => {
    expect(
      shouldShowBrokerHydrationPlaceholder({
        sessionSource: 'direct',
        createdAt: 1_700_000_000_000,
        now: 1_700_000_010_000,
        isLoaded: true,
        messageCount: 0,
        silentRefreshPhase: 'idle',
      }),
    ).toBe(false);
  });

  it('returns false once the hydration window expires', () => {
    expect(
      shouldShowBrokerHydrationPlaceholder({
        sessionSource: 'broker_attached',
        createdAt: 1_700_000_000_000,
        now: 1_700_000_030_500,
        isLoaded: true,
        messageCount: 0,
        silentRefreshPhase: 'idle',
      }),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run the hydration-rule test to verify it fails**

Run:

```bash
npx vitest run packages/happy-app/sources/utils/brokerSessionHydration.test.ts
```

Expected:

- FAIL with module-not-found because `brokerSessionHydration.ts` does not exist yet

- [ ] **Step 3: Implement the pure hydration rule and wire it into SessionView**

Create `packages/happy-app/sources/utils/brokerSessionHydration.ts` with a tiny, pure API:

```ts
export const BROKER_SESSION_HYDRATION_WINDOW_MS = 15_000;

export function shouldShowBrokerHydrationPlaceholder(args: {
  sessionSource?: string | null;
  createdAt: number;
  now?: number;
  isLoaded: boolean;
  messageCount: number;
  silentRefreshPhase: 'idle' | 'refreshing' | 'failed';
}): boolean {
  if (args.sessionSource !== 'broker_attached') return false;
  if (!args.isLoaded) return false;
  if (args.messageCount > 0) return false;
  if (args.silentRefreshPhase === 'failed') return false;

  const now = args.now ?? Date.now();
  return now - args.createdAt <= BROKER_SESSION_HYDRATION_WINDOW_MS;
}
```

Then in `packages/happy-app/sources/-session/SessionView.tsx`:

1. import the helper
2. compute:

```ts
const showBrokerHydrationPlaceholder = React.useMemo(
  () => shouldShowBrokerHydrationPlaceholder({
    sessionSource: session.metadata?.sessionSource,
    createdAt: session.createdAt,
    isLoaded,
    messageCount: messages.length,
    silentRefreshPhase,
  }),
  [session.createdAt, session.metadata?.sessionSource, isLoaded, messages.length, silentRefreshPhase],
);
```

3. replace the current `messages.length === 0 ? isLoaded ? <EmptyMessages ...` branch with:

```tsx
const placeholder = messages.length === 0 ? (
  showBrokerHydrationPlaceholder ? (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
      <ActivityIndicator size="small" color={theme.colors.textSecondary} />
      <Text style={{ color: theme.colors.text, marginTop: 12, fontSize: 18, fontWeight: '600' }}>
        {t('sessionInfo.brokerHydratingTitle')}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
        {t('sessionInfo.brokerHydratingDescription')}
      </Text>
    </View>
  ) : isLoaded ? (
    <EmptyMessages session={session} />
  ) : (
    <ActivityIndicator size="small" color={theme.colors.textSecondary} />
  )
) : null;
```

4. add translation keys in `_default.ts`, `translations/en.ts`, and `translations/zh-Hans.ts`:

```ts
brokerHydratingTitle: 'Connecting to live session…',
brokerHydratingDescription: 'Syncing the VS Code conversation context before showing the chat history.',
```

Simplified Chinese:

```ts
brokerHydratingTitle: '正在连接实时会话…',
brokerHydratingDescription: '正在同步 VS Code 会话上下文，稍后显示聊天记录。',
```

- [ ] **Step 4: Re-run the hydration-rule test**

Run:

```bash
npx vitest run packages/happy-app/sources/utils/brokerSessionHydration.test.ts
```

Expected:

- PASS for all four pure hydration-rule cases

- [ ] **Step 5: Commit**

```bash
git add \
  "packages/happy-app/sources/utils/brokerSessionHydration.ts" \
  "packages/happy-app/sources/utils/brokerSessionHydration.test.ts" \
  "packages/happy-app/sources/-session/SessionView.tsx" \
  "packages/happy-app/sources/text/_default.ts" \
  "packages/happy-app/sources/text/translations/en.ts" \
  "packages/happy-app/sources/text/translations/zh-Hans.ts"
git commit -m "feat(app): show broker hydration state for fresh attached sessions"
```

### Task 3: Lock The Session Page Regression With A Focused SessionView Test

**Files:**
- Create: `packages/happy-app/sources/-session/SessionView.brokerHydration.test.tsx`
- Modify: `packages/happy-app/sources/-session/SessionView.tsx`

- [ ] **Step 1: Write the failing SessionView test**

Create `packages/happy-app/sources/-session/SessionView.brokerHydration.test.tsx` with a tight render harness that mocks:

- `useSession(...)`
- `useSessionMessages(...)`
- `useSessionPendingMessages(...)`
- `useFocusEffect(...)`
- `useRouter(...)`
- `useLocalSearchParams(...)`

Add the two core assertions:

```tsx
it('shows the broker hydration placeholder for a fresh broker-attached session with zero messages', () => {
  mockSession = brokerSession({ createdAt: Date.now() - 5_000 });
  mockMessages = { messages: [], isLoaded: true, fetchVersion: 1 };

  const tree = renderer.create(<SessionView id="session-1" />);

  expect(tree.root.findAllByProps({ children: 'sessionInfo.brokerHydratingTitle' }).length).toBe(1);
});
```

```tsx
it('falls back to the normal empty state after the broker hydration window expires', () => {
  mockSession = brokerSession({ createdAt: Date.now() - 20_000 });
  mockMessages = { messages: [], isLoaded: true, fetchVersion: 1 };

  const tree = renderer.create(<SessionView id="session-1" />);

  expect(tree.root.findAllByProps({ children: 'No messages yet' }).length).toBe(1);
});
```

Keep the mock surface narrow. Do **not** try to integration-test the entire chat stack here.

- [ ] **Step 2: Run the focused SessionView test to verify it fails**

Run:

```bash
npx vitest run packages/happy-app/sources/-session/SessionView.brokerHydration.test.tsx
```

Expected:

- FAIL because the new file does not exist yet, or because the broker hydration placeholder is not reachable from the rendered tree

- [ ] **Step 3: Finish any missing SessionView wiring the test exposes**

Only make the smallest changes needed for the new focused test to pass. Acceptable fixes:

- move the placeholder branch into a small local variable if the current render tree makes the assertion impossible
- keep `EmptyMessages` as the fallback for the non-hydrating path
- keep the existing `useFocusEffect(... sync.refreshSessions())` behavior unchanged

Do **not**:

- add a brand-new session refresh subsystem
- touch `sync.sendOrQueueMessage(...)`
- widen the broker hydration window to hide real failures

- [ ] **Step 4: Run the focused regression suite and package typecheck**

Run:

```bash
npx vitest run \
  packages/happy-app/sources/tests/routes/machineDetailRoute.test.tsx \
  packages/happy-app/sources/utils/brokerSessionHydration.test.ts \
  packages/happy-app/sources/-session/SessionView.brokerHydration.test.tsx
```

Expected:

- PASS for all route, utility, and SessionView hydration tests

Then run:

```bash
yarn typecheck
```

from:

```bash
cd packages/happy-app
```

Expected:

- `tsc --noEmit` completes without errors

- [ ] **Step 5: Commit**

```bash
git add \
  "packages/happy-app/sources/-session/SessionView.brokerHydration.test.tsx" \
  "packages/happy-app/sources/-session/SessionView.tsx"
git commit -m "test(app): lock broker hydration session regression"
```

## Final Verification

After Task 3, run the final package-level verification once more from `packages/happy-app`:

```bash
npx vitest run \
  sources/tests/routes/machineDetailRoute.test.tsx \
  sources/utils/brokerSessionHydration.test.ts \
  sources/-session/SessionView.brokerHydration.test.tsx
yarn typecheck
```

Manual smoke checklist on the Android emulator:

- log in against the intended environment
- open a machine that has live broker sessions
- tap `Attach`
- confirm the session page opens without landing on a misleading empty state
- send a short message such as `ping from android`
- confirm the VS Code session executes it
- confirm the reply appears back in the mobile UI
