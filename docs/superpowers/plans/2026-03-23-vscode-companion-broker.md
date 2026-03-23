# VS Code Companion Broker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a broker-attached backend that lets Happy attach to official VS Code Claude/Codex live sessions through a companion extension while preserving a single live session and shared control surface.

**Architecture:** Add a new `packages/happy-vscode-bridge` workspace that runs inside the VS Code extension host and exposes a loopback WebSocket/JSON-RPC broker backed by provider adapters. Extend `happy-wire` with broker schemas, then teach `happy-cli` to act as a broker client / attach worker and `happy-app` to discover and attach to broker-backed sessions without changing the existing `happy spawn` path.

**Tech Stack:** TypeScript, VS Code extension host APIs, `ws`, Zod, Vitest, Expo Router, existing Happy session sync/socket infrastructure.

---

## File Map

### Root workspace

- Modify: `package.json`
  Add `packages/happy-vscode-bridge` to Yarn workspaces.

### New package: `packages/happy-vscode-bridge`

- Create: `packages/happy-vscode-bridge/package.json`
- Create: `packages/happy-vscode-bridge/tsconfig.json`
- Create: `packages/happy-vscode-bridge/src/extension.ts`
- Create: `packages/happy-vscode-bridge/src/extension.test.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts`
- Create: `packages/happy-vscode-bridge/src/broker/SharedSessionStore.ts`
- Create: `packages/happy-vscode-bridge/src/broker/SharedSessionStore.test.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerServer.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts`
- Create: `packages/happy-vscode-bridge/src/broker/rpc.ts`
- Create: `packages/happy-vscode-bridge/src/context/EditorContextBridge.ts`
- Create: `packages/happy-vscode-bridge/src/context/EditorContextBridge.test.ts`
- Create: `packages/happy-vscode-bridge/src/artifacts/ArtifactBridge.ts`
- Create: `packages/happy-vscode-bridge/src/artifacts/ArtifactBridge.test.ts`
- Create: `packages/happy-vscode-bridge/src/providers/types.ts`
- Create: `packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.ts`
- Create: `packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts`
- Create: `packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.ts`
- Create: `packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.test.ts`
- Create: `packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.ts`
- Create: `packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.test.ts`

### Shared wire

- Create: `packages/happy-wire/src/brokerProtocol.ts`
- Create: `packages/happy-wire/src/brokerProtocol.test.ts`
- Modify: `packages/happy-wire/src/index.ts`

### CLI

- Create: `packages/happy-cli/src/broker/BrokerClient.ts`
- Create: `packages/happy-cli/src/broker/BrokerClient.test.ts`
- Create: `packages/happy-cli/src/broker/brokerManifest.ts`
- Create: `packages/happy-cli/src/broker/runBrokerAttachedSession.ts`
- Create: `packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts`
- Modify: `packages/happy-cli/src/index.ts`
- Modify: `packages/happy-cli/src/api/types.ts`
- Modify: `packages/happy-cli/src/api/apiMachine.ts`
- Modify: `packages/happy-cli/src/daemon/run.ts`
- Modify: `packages/happy-cli/src/daemon/types.ts`
- Modify: `packages/happy-cli/src/modules/common/registerCommonHandlers.ts`
- Modify: `packages/happy-cli/src/utils/createSessionMetadata.ts`

### App

- Modify: `packages/happy-app/sources/sync/storageTypes.ts`
- Modify: `packages/happy-app/sources/sync/ops.ts`
- Create: `packages/happy-app/sources/sync/ops.broker.test.ts`
- Create: `packages/happy-app/sources/utils/brokerSessionUtils.ts`
- Create: `packages/happy-app/sources/utils/brokerSessionUtils.test.ts`
- Modify: `packages/happy-app/sources/app/(app)/machine/[id].tsx`
- Modify: `packages/happy-app/sources/-session/SessionView.tsx`
- Modify: `packages/happy-app/sources/text/_default.ts`
- Modify: `packages/happy-app/sources/text/translations/en.ts`

### Explicitly out of scope for MVP

- No planned file changes in `packages/happy-server/**`.
  Rationale: session metadata and state already move through encrypted opaque payloads; server edits should only happen if CLI/app integration exposes a concrete validation or routing failure.

## Task 1: Scaffold The VS Code Bridge Workspace

**Files:**
- Modify: `package.json`
- Create: `packages/happy-vscode-bridge/package.json`
- Create: `packages/happy-vscode-bridge/tsconfig.json`
- Create: `packages/happy-vscode-bridge/src/extension.ts`
- Test: `packages/happy-vscode-bridge/src/extension.test.ts`

- [ ] **Step 1: Write the failing workspace smoke test**

```ts
import { describe, it, expect } from 'vitest';
import { activate, deactivate } from './extension';

describe('bridge extension entrypoint', () => {
  it('exports VS Code lifecycle hooks', () => {
    expect(typeof activate).toBe('function');
    expect(typeof deactivate).toBe('function');
  });
});
```

- [ ] **Step 2: Run the smoke test and verify it fails**

Run: `npx vitest run packages/happy-vscode-bridge/src/extension.test.ts`
Expected: FAIL because the workspace/package/files do not exist yet.

- [ ] **Step 3: Create the workspace package and minimal extension entrypoint**

```ts
export async function activate() {
  return { started: false };
}

export async function deactivate() {
  return;
}
```

```json
{
  "name": "happy-vscode-bridge",
  "private": true,
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

- [ ] **Step 4: Run the smoke test and verify it passes**

Run: `npx vitest run packages/happy-vscode-bridge/src/extension.test.ts`
Expected: PASS with 1 test passing.

- [ ] **Step 5: Typecheck the new package**

Run: `yarn --cwd packages/happy-vscode-bridge typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit the scaffolding**

```bash
git add package.json packages/happy-vscode-bridge
git commit -m "feat(bridge): scaffold VS Code broker workspace"
```

## Task 2: Add Shared Broker Wire Schemas

**Files:**
- Create: `packages/happy-wire/src/brokerProtocol.ts`
- Modify: `packages/happy-wire/src/index.ts`
- Test: `packages/happy-wire/src/brokerProtocol.test.ts`

- [ ] **Step 1: Write failing schema tests for broker discovery, snapshot, and event envelopes**

```ts
import { describe, it, expect } from 'vitest';
import {
  brokerDiscoveredSessionSchema,
  brokerSnapshotSchema,
  brokerEventSchema,
} from './brokerProtocol';

describe('broker protocol', () => {
  it('parses a discovered session', () => {
    expect(brokerDiscoveredSessionSchema.parse({
      brokerSessionId: 'sess_123',
      provider: 'claude',
      title: 'Attach me',
      attachability: 'attachable',
      capabilities: ['sendUserMessage'],
      degradedFlags: [],
    }).provider).toBe('claude');
  });
});
```

- [ ] **Step 2: Run the schema test and verify it fails**

Run: `npx vitest run packages/happy-wire/src/brokerProtocol.test.ts`
Expected: FAIL because `brokerProtocol.ts` does not exist.

- [ ] **Step 3: Implement the broker protocol schemas and exports**

```ts
export const brokerProviderSchema = z.enum(['claude', 'codex']);
export const brokerAttachabilitySchema = z.enum([
  'attachable',
  'attachable_with_degraded_capabilities',
  'not_attachable',
]);
export const brokerEventSchema = z.discriminatedUnion('type', [/* ... */]);
export const brokerSnapshotSchema = z.object({
  brokerSessionId: z.string(),
  provider: brokerProviderSchema,
  latestSeq: z.number(),
  capabilities: z.array(z.string()),
  degradedFlags: z.array(z.string()),
});
```

- [ ] **Step 4: Run the schema test and verify it passes**

Run: `npx vitest run packages/happy-wire/src/brokerProtocol.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the shared wire package**

Run: `yarn --cwd packages/happy-wire typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit the shared protocol**

```bash
git add packages/happy-wire/src/index.ts packages/happy-wire/src/brokerProtocol.ts packages/happy-wire/src/brokerProtocol.test.ts
git commit -m "feat(wire): add broker attach protocol schemas"
```

## Task 3: Build SharedSessionStore And Manifest Persistence

**Files:**
- Create: `packages/happy-vscode-bridge/src/broker/SharedSessionStore.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.ts`
- Test: `packages/happy-vscode-bridge/src/broker/SharedSessionStore.test.ts`
- Test: `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts`

- [ ] **Step 1: Write failing tests for event sequencing, snapshot projection, and manifest round-trip**

```ts
it('assigns monotonically increasing seq values', () => {
  const store = new SharedSessionStore();
  const first = store.append('session-1', { type: 'session.discovered' });
  const second = store.append('session-1', { type: 'message.user_submitted' });
  expect(second.seq).toBe(first.seq + 1);
});
```

```ts
it('writes and reads broker manifest metadata', async () => {
  const store = new BrokerManifestStore('/tmp/happy-vsc-test');
  await store.write({ port: 40123, token: 'secret' });
  await expect(store.read()).resolves.toMatchObject({ port: 40123 });
});
```

- [ ] **Step 2: Run the store tests and verify they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/broker/SharedSessionStore.test.ts packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts`
Expected: FAIL because the store classes do not exist yet.

- [ ] **Step 3: Implement append-only state and manifest persistence**

```ts
type BrokerLogEntry = { seq: number; at: number; event: BrokerEvent };

export class SharedSessionStore {
  private seq = 0;
  append(sessionId: string, event: BrokerEvent) {
    const entry = { seq: ++this.seq, at: Date.now(), event };
    // persist entry, update projection, notify listeners
    return entry;
  }
}
```

```ts
export class BrokerManifestStore {
  async write(manifest: BrokerInstanceManifest) {
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, JSON.stringify(manifest, null, 2));
  }
}
```

- [ ] **Step 4: Run the store tests and verify they pass**

Run: `npx vitest run packages/happy-vscode-bridge/src/broker/SharedSessionStore.test.ts packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the bridge package**

Run: `yarn --cwd packages/happy-vscode-bridge typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit the broker core storage**

```bash
git add packages/happy-vscode-bridge/src/broker
git commit -m "feat(bridge): add shared session store and manifest persistence"
```

## Task 4: Expose Discover / Attach / Event Streaming Over Broker Transport

**Files:**
- Create: `packages/happy-vscode-bridge/src/broker/rpc.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerServer.ts`
- Modify: `packages/happy-vscode-bridge/src/extension.ts`
- Test: `packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts`

- [ ] **Step 1: Write failing transport tests for `discoverSessions`, `attachSession`, and event subscription**

```ts
it('returns discoverable sessions from the adapter host', async () => {
  const server = await startTestBrokerServer(/* fake adapter host */);
  const sessions = await server.client.call('discoverSessions', {});
  expect(sessions[0].brokerSessionId).toBe('broker-sess-1');
});
```

- [ ] **Step 2: Run the transport test and verify it fails**

Run: `npx vitest run packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts`
Expected: FAIL because the broker server is not implemented.

- [ ] **Step 3: Implement the loopback WebSocket/JSON-RPC server and activation boot path**

```ts
const handlers = {
  discoverSessions: async () => adapterHost.discover(),
  attachSession: async ({ brokerSessionId }) => store.attach(brokerSessionId),
  sendUserMessage: async (intent) => intentQueue.enqueue(intent),
};
```

```ts
export async function activate(context: vscode.ExtensionContext) {
  const manifestStore = new BrokerManifestStore(context.globalStorageUri.fsPath);
  const server = await BrokerServer.start({ manifestStore, /* ... */ });
  context.subscriptions.push({ dispose: () => void server.stop() });
  return { started: true };
}
```

- [ ] **Step 4: Run the transport test and verify it passes**

Run: `npx vitest run packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the bridge package**

Run: `yarn --cwd packages/happy-vscode-bridge typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit the broker transport**

```bash
git add packages/happy-vscode-bridge/src/extension.ts packages/happy-vscode-bridge/src/broker/rpc.ts packages/happy-vscode-bridge/src/broker/BrokerServer.ts packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts
git commit -m "feat(bridge): expose discover and attach broker transport"
```

## Task 5: Implement Context Bridges And The Provider Adapter Contract

**Files:**
- Create: `packages/happy-vscode-bridge/src/context/EditorContextBridge.ts`
- Create: `packages/happy-vscode-bridge/src/context/EditorContextBridge.test.ts`
- Create: `packages/happy-vscode-bridge/src/artifacts/ArtifactBridge.ts`
- Create: `packages/happy-vscode-bridge/src/artifacts/ArtifactBridge.test.ts`
- Create: `packages/happy-vscode-bridge/src/providers/types.ts`
- Create: `packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.ts`
- Test: `packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts`

- [ ] **Step 1: Write failing tests for normalized editor context, artifact staging, and degraded capability merging**

```ts
it('projects the active editor into a provider-agnostic context snapshot', () => {
  const ctx = bridge.project({
    fileName: '/repo/src/app.ts',
    selectionText: 'const a = 1;',
  });
  expect(ctx.activeFilePath).toBe('/repo/src/app.ts');
});
```

```ts
it('merges adapter health into degraded flags', () => {
  expect(host.getCapabilities('session-1').degradedFlags).toContain('approval_bridge_unavailable');
});
```

- [ ] **Step 2: Run the bridge/adapter tests and verify they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/context/EditorContextBridge.test.ts packages/happy-vscode-bridge/src/artifacts/ArtifactBridge.test.ts packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts`
Expected: FAIL because the bridge/adapter classes do not exist.

- [ ] **Step 3: Implement the context/artifact bridges and adapter host**

```ts
export interface ProviderAdapter {
  discover(): Promise<DiscoveredBrokerSession[]>;
  attach(ref: string): Promise<ProviderAttachment>;
  sendUserMessage(intent: SendUserMessageIntent): Promise<void>;
  interrupt(intent: InterruptIntent): Promise<void>;
  resolveApproval(intent: ApprovalIntent): Promise<void>;
}
```

```ts
export class EditorContextBridge {
  snapshot(): BrokerEditorContext {
    return {
      activeFilePath,
      selectedText,
      selectionRanges,
      openTabs,
      workspaceRoots,
      diagnosticsSummary,
    };
  }
}
```

- [ ] **Step 4: Run the bridge/adapter tests and verify they pass**

Run: `npx vitest run packages/happy-vscode-bridge/src/context/EditorContextBridge.test.ts packages/happy-vscode-bridge/src/artifacts/ArtifactBridge.test.ts packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the bridge package**

Run: `yarn --cwd packages/happy-vscode-bridge typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit the bridge abstractions**

```bash
git add packages/happy-vscode-bridge/src/context packages/happy-vscode-bridge/src/artifacts packages/happy-vscode-bridge/src/providers
git commit -m "feat(bridge): add provider contract and context bridges"
```

## Task 6: Add The Claude Adapter

**Files:**
- Create: `packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.ts`
- Test: `packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.test.ts`

- [ ] **Step 1: Write failing Claude adapter tests for discovery normalization, live attachability, and degraded reporting**

```ts
it('maps a live Claude session candidate into an attachable broker session', async () => {
  const sessions = await adapter.discover();
  expect(sessions[0]).toMatchObject({
    provider: 'claude',
    attachability: 'attachable',
  });
});
```

```ts
it('marks approval bridging gaps as degraded instead of hiding them', async () => {
  const sessions = await adapter.discover();
  expect(sessions[0].degradedFlags).toContain('approval_bridge_unavailable');
});
```

- [ ] **Step 2: Run the Claude adapter test and verify it fails**

Run: `npx vitest run packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.test.ts`
Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the Claude adapter using official APIs first and local observables second**

```ts
export class ClaudeAdapter implements ProviderAdapter {
  async discover() {
    // inspect live Claude session candidates from the current VS Code window
    // fall back to local session metadata / transcript discovery only to enrich state
  }
}
```

Implementation rules:

- Prefer documented extension/session APIs if available.
- If approval/interrupt hooks are unavailable, emit degraded flags rather than pretending support.
- Keep all Claude-specific heuristics inside this adapter only.

- [ ] **Step 4: Run the Claude adapter test and verify it passes**

Run: `npx vitest run packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the bridge package**

Run: `yarn --cwd packages/happy-vscode-bridge typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit the Claude adapter**

```bash
git add packages/happy-vscode-bridge/src/providers/claude
git commit -m "feat(bridge): add Claude session adapter"
```

## Task 7: Add The Codex Adapter

**Files:**
- Create: `packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.ts`
- Test: `packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.test.ts`

- [ ] **Step 1: Write failing Codex adapter tests for discovery normalization, attachability, and degraded fast-fail behavior**

```ts
it('maps a live Codex session candidate into an attachable broker session', async () => {
  const sessions = await adapter.discover();
  expect(sessions[0]).toMatchObject({
    provider: 'codex',
    attachability: 'attachable',
  });
});
```

```ts
it('surfaces attachment bridge gaps explicitly', async () => {
  const sessions = await adapter.discover();
  expect(sessions[0].degradedFlags).toContain('attachment_bridge_unavailable');
});
```

- [ ] **Step 2: Run the Codex adapter test and verify it fails**

Run: `npx vitest run packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.test.ts`
Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the Codex adapter with the same provider contract**

```ts
export class CodexAdapter implements ProviderAdapter {
  async discover() {
    // inspect current-window Codex live sessions
    // expose opaque providerSessionRef and broker capability set
  }
}
```

Implementation rules:

- Keep Codex-specific attach heuristics inside this adapter only.
- Normalize Codex live status, approvals, interrupts, and message deltas into broker events.
- Emit degraded flags as soon as an expected bridge path is missing.

- [ ] **Step 4: Run the Codex adapter test and verify it passes**

Run: `npx vitest run packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the bridge package**

Run: `yarn --cwd packages/happy-vscode-bridge typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit the Codex adapter**

```bash
git add packages/happy-vscode-bridge/src/providers/codex
git commit -m "feat(bridge): add Codex session adapter"
```

## Task 8: Add The CLI Broker Client And Attach Worker

**Files:**
- Create: `packages/happy-cli/src/broker/BrokerClient.ts`
- Create: `packages/happy-cli/src/broker/BrokerClient.test.ts`
- Create: `packages/happy-cli/src/broker/brokerManifest.ts`
- Create: `packages/happy-cli/src/broker/runBrokerAttachedSession.ts`
- Create: `packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts`
- Modify: `packages/happy-cli/src/index.ts`
- Modify: `packages/happy-cli/src/api/types.ts`
- Modify: `packages/happy-cli/src/utils/createSessionMetadata.ts`

- [ ] **Step 1: Write failing CLI-side tests for manifest discovery, broker RPC, and metadata projection**

```ts
it('loads broker connection info from the local manifest', async () => {
  await expect(loadBrokerManifest('/tmp/happy-broker')).resolves.toMatchObject({
    url: 'ws://127.0.0.1:40123',
  });
});
```

```ts
it('marks broker-attached sessions with source metadata', () => {
  const { metadata } = createSessionMetadata({
    flavor: 'claude',
    machineId: 'machine-1',
    startedBy: 'terminal',
    source: 'broker_attached',
  });
  expect(metadata.sessionSource).toBe('broker_attached');
});
```

- [ ] **Step 2: Run the CLI broker tests and verify they fail**

Run: `npx vitest run packages/happy-cli/src/broker/BrokerClient.test.ts packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts`
Expected: FAIL because the broker client/worker does not exist.

- [ ] **Step 3: Implement the broker client and attach worker path**

```ts
export class BrokerClient {
  async discoverSessions() { /* ws/json-rpc */ }
  async attachSession(brokerSessionId: string) { /* ws/json-rpc */ }
}
```

```ts
const metadata = {
  ...baseMetadata,
  sessionSource: 'broker_attached',
  brokerSessionId,
  brokerCapabilities,
  brokerDegradedFlags,
};
```

Implementation notes:

- Add a dedicated CLI run mode for broker-backed sessions instead of mutating `runClaude` / `runCodex`.
- Keep existing `happy`, `happy codex`, `happy gemini` behavior unchanged.
- Extend `Metadata` with `sessionSource`, `brokerSessionId`, `brokerCapabilities`, and `brokerDegradedFlags`.

- [ ] **Step 4: Run the CLI broker tests and verify they pass**

Run: `npx vitest run packages/happy-cli/src/broker/BrokerClient.test.ts packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the CLI package**

Run: `yarn --cwd packages/happy-cli typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit the CLI attach worker**

```bash
git add packages/happy-cli/src/broker packages/happy-cli/src/index.ts packages/happy-cli/src/api/types.ts packages/happy-cli/src/utils/createSessionMetadata.ts
git commit -m "feat(cli): add broker attach client and worker"
```

## Task 9: Teach The Daemon / Machine RPC Layer To List And Attach Broker Sessions

**Files:**
- Modify: `packages/happy-cli/src/api/apiMachine.ts`
- Modify: `packages/happy-cli/src/daemon/run.ts`
- Modify: `packages/happy-cli/src/daemon/types.ts`
- Modify: `packages/happy-cli/src/modules/common/registerCommonHandlers.ts`
- Test: `packages/happy-cli/src/api/apiMachine.test.ts`

- [ ] **Step 1: Write failing RPC tests for broker session listing and attach worker spawning**

```ts
it('registers a machine RPC that lists broker sessions', async () => {
  const result = await client.call('broker-list-sessions', {});
  expect(result.sessions[0].provider).toBe('claude');
});
```

```ts
it('spawns a broker-attached session worker', async () => {
  const result = await client.call('broker-attach-session', {
    brokerSessionId: 'broker-sess-1',
  });
  expect(result.type).toBe('success');
});
```

- [ ] **Step 2: Run the RPC tests and verify they fail**

Run: `npx vitest run packages/happy-cli/src/api/apiMachine.test.ts`
Expected: FAIL because broker RPC handlers are missing.

- [ ] **Step 3: Implement machine RPC handlers and daemon spawn plumbing**

```ts
this.rpcHandlerManager.registerHandler('broker-list-sessions', async () => {
  return brokerClient.discoverSessions();
});

this.rpcHandlerManager.registerHandler('broker-attach-session', async (params) => {
  return spawnSession({ source: 'broker_attached', ...params });
});
```

Implementation notes:

- Reuse existing daemon session tracking instead of inventing a parallel supervisor.
- Extend `SpawnSessionOptions` only with the minimum broker attach fields needed:
  - `source`
  - `brokerSessionId`
  - `provider`

- [ ] **Step 4: Run the RPC tests and verify they pass**

Run: `npx vitest run packages/happy-cli/src/api/apiMachine.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the CLI package**

Run: `yarn --cwd packages/happy-cli typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit the daemon/RPC integration**

```bash
git add packages/happy-cli/src/api/apiMachine.ts packages/happy-cli/src/daemon/run.ts packages/happy-cli/src/daemon/types.ts packages/happy-cli/src/modules/common/registerCommonHandlers.ts packages/happy-cli/src/api/apiMachine.test.ts
git commit -m "feat(cli): expose broker session machine RPCs"
```

## Task 10: Add App-Side Broker Attach Discovery And Session UX

**Files:**
- Modify: `packages/happy-app/sources/sync/storageTypes.ts`
- Modify: `packages/happy-app/sources/sync/ops.ts`
- Create: `packages/happy-app/sources/sync/ops.broker.test.ts`
- Create: `packages/happy-app/sources/utils/brokerSessionUtils.ts`
- Create: `packages/happy-app/sources/utils/brokerSessionUtils.test.ts`
- Modify: `packages/happy-app/sources/app/(app)/machine/[id].tsx`
- Modify: `packages/happy-app/sources/-session/SessionView.tsx`
- Modify: `packages/happy-app/sources/text/_default.ts`
- Modify: `packages/happy-app/sources/text/translations/en.ts`

- [ ] **Step 1: Write failing app-side tests for broker session DTOs and attach action helpers**

```ts
it('labels broker-attached sessions as broker-backed', () => {
  expect(getBrokerSessionBadge({
    sessionSource: 'broker_attached',
    brokerDegradedFlags: [],
  })).toBe('Broker');
});
```

```ts
it('calls the machine broker attach RPC with the selected broker session id', async () => {
  await machineAttachBrokerSession('machine-1', 'broker-sess-1');
  expect(apiSocket.machineRPC).toHaveBeenCalledWith(
    'machine-1',
    'broker-attach-session',
    { brokerSessionId: 'broker-sess-1' },
    expect.anything()
  );
});
```

- [ ] **Step 2: Run the app-side tests and verify they fail**

Run: `npx vitest run packages/happy-app/sources/sync/ops.broker.test.ts packages/happy-app/sources/utils/brokerSessionUtils.test.ts`
Expected: FAIL because the helper functions and metadata fields do not exist.

- [ ] **Step 3: Implement app discovery, attach actions, and session badges**

```ts
export async function machineListBrokerSessions(machineId: string) {
  return apiSocket.machineRPC(machineId, 'broker-list-sessions', {});
}

export async function machineAttachBrokerSession(machineId: string, brokerSessionId: string) {
  return apiSocket.machineRPC(machineId, 'broker-attach-session', { brokerSessionId });
}
```

Implementation notes:

- Show attachable broker sessions on `machine/[id].tsx`.
- Reuse existing session list UI patterns instead of creating a new navigator.
- In `SessionView.tsx`, show broker source / degraded flags in the existing metadata surface rather than creating a separate screen.
- Add translation strings for:
  - broker source label
  - attach session CTA
  - degraded capability warnings

- [ ] **Step 4: Run the app-side tests and verify they pass**

Run: `npx vitest run packages/happy-app/sources/sync/ops.broker.test.ts packages/happy-app/sources/utils/brokerSessionUtils.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the app package**

Run: `yarn --cwd packages/happy-app typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit the app attach UX**

```bash
git add packages/happy-app/sources/sync/storageTypes.ts packages/happy-app/sources/sync/ops.ts packages/happy-app/sources/sync/ops.broker.test.ts packages/happy-app/sources/utils/brokerSessionUtils.ts packages/happy-app/sources/utils/brokerSessionUtils.test.ts 'packages/happy-app/sources/app/(app)/machine/[id].tsx' packages/happy-app/sources/-session/SessionView.tsx packages/happy-app/sources/text/_default.ts packages/happy-app/sources/text/translations/en.ts
git commit -m "feat(app): attach to broker-backed VS Code sessions"
```

## Task 11: End-To-End Verification And Operator Documentation

**Files:**
- Modify: `docs/README.md`
- Create: `docs/vscode-companion-broker.md`

- [ ] **Step 1: Write the manual verification checklist before writing docs**

```md
1. Launch the VS Code companion extension in extension development host.
2. Start a Claude session from the official plugin.
3. Verify `broker-list-sessions` returns an attachable Claude session.
4. Attach from Happy and verify the new Happy session metadata shows `sessionSource=broker_attached`.
5. Send a message from Happy and confirm it appears in VS Code.
6. Trigger approval and interrupt from each side and verify both surfaces update.
```

- [ ] **Step 2: Run the final package checks**

Run:
- `yarn --cwd packages/happy-wire typecheck`
- `yarn --cwd packages/happy-vscode-bridge typecheck`
- `yarn --cwd packages/happy-cli typecheck`
- `yarn --cwd packages/happy-app typecheck`

Expected: all exit 0.

- [ ] **Step 3: Run focused Vitest suites**

Run:
- `npx vitest run packages/happy-wire/src/brokerProtocol.test.ts`
- `npx vitest run packages/happy-vscode-bridge/src/extension.test.ts packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts`
- `npx vitest run packages/happy-cli/src/broker/BrokerClient.test.ts packages/happy-cli/src/api/apiMachine.test.ts`
- `npx vitest run packages/happy-app/sources/sync/ops.broker.test.ts packages/happy-app/sources/utils/brokerSessionUtils.test.ts`

Expected: all PASS.

- [ ] **Step 4: Document operator setup and degraded-mode troubleshooting**

```md
## VS Code Companion Broker

- Install the `happy-vscode-bridge` extension in the same window as the official Claude/Codex plugin.
- Start the official plugin session first.
- Use Happy to list broker sessions and attach.
- If attach works in degraded mode, inspect the degraded flags shown in session metadata.
```

- [ ] **Step 5: Commit the docs and verification pass**

```bash
git add docs/README.md docs/vscode-companion-broker.md
git commit -m "docs: add VS Code broker setup and verification guide"
```

## Notes For Implementers

- Keep `packages/happy-server/**` untouched unless a concrete encrypted session transport gap appears during Task 8 or Task 10.
- Do not rewrite existing `runClaude` / `runCodex` behavior to force broker attach. Broker attach must remain a parallel backend.
- Prefer fixture-driven adapter tests over trying to stand up the real official plugins inside CI.
- Treat any provider capability gap as a productized degraded flag, not as a hidden partial success.
