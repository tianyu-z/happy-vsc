# VS Code Companion Extension Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `packages/happy-vscode-bridge` into a real VS Code extension that can be launched with `F5`, packaged as `.vsix`, discover official Claude/Codex live sessions in the current VS Code window, and expose stable broker-backed full-control attach with runtime/storage mode handling.

**Architecture:** Keep the existing broker server and provider adapters, then add a new extension runtime layer around them: extension packaging/debug scaffolding, unified session runtime state, provider host registry, RuntimeProbe + StorageProbe pairs, session normalization/mode resolution, and a small VS Code UI layer. Extend the broker wire contract so Happy CLI/App can understand mode, compatibility, and degraded capability metadata without learning provider internals.

**Tech Stack:** TypeScript, Vitest, Zod, VS Code extension API, esbuild, `@vscode/test-electron`, WebSocket/JSON-RPC

---

## File Map

### Existing files to modify

- `packages/happy-wire/src/brokerProtocol.ts`
  - Extend broker discovery/snapshot/event schemas with mode, compatibility, provider extension metadata, probe health, and broker intent payloads.
- `packages/happy-wire/src/brokerProtocol.test.ts`
  - Lock schema compatibility and new fields with parsing tests.
- `packages/happy-vscode-bridge/package.json`
  - Add VS Code extension manifest fields, build/package scripts, dev dependencies.
- `packages/happy-vscode-bridge/tsconfig.json`
  - Keep source/test typecheck aligned with new runtime files.
- `packages/happy-vscode-bridge/src/extension.ts`
  - Replace `emptyAdapterHost` activation with the real companion runtime bootstrap.
- `packages/happy-vscode-bridge/src/extension.test.ts`
  - Assert activation registers broker runtime, commands, and disposables.
- `packages/happy-vscode-bridge/src/broker/BrokerServer.ts`
  - Add full-control RPC methods and event stream registration against the unified adapter facade.
- `packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts`
  - Cover new RPC methods, auth, and event subscription behavior.
- `packages/happy-vscode-bridge/src/providers/types.ts`
  - Extend provider interfaces with mode/provider-extension metadata and runtime health reporting.
- `packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.ts`
  - Consume unified runtime metadata and pass richer attachment/snapshot shapes through broker transport.
- `packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts`
  - Lock attachability/degraded-flag behavior after richer metadata arrives.
- `packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.ts`
  - Accept facade-fed metadata and stable provider session keys.
- `packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.test.ts`
  - Update expectations for new mode/compatibility metadata.
- `packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.ts`
  - Accept facade-fed metadata and stable provider session keys.
- `packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.test.ts`
  - Update expectations for new mode/compatibility metadata.
- `packages/happy-cli/src/broker/BrokerClient.ts`
  - Add typed calls for full-control RPC and richer discovered session parsing.
- `packages/happy-cli/src/broker/BrokerClient.test.ts`
  - Cover new RPC methods and metadata fields.
- `packages/happy-cli/src/broker/runBrokerAttachedSession.ts`
  - Persist mode/capability metadata into Happy session metadata when attaching.
- `packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts`
  - Assert broker-attached metadata includes new runtime fields.
- `packages/happy-cli/src/api/types.ts`
  - Add broker mode/provider metadata fields to machine/session metadata types.
- `packages/happy-cli/src/utils/createSessionMetadata.ts`
  - Persist new broker metadata.
- `packages/happy-app/sources/utils/brokerSessionUtils.ts`
  - Add formatting helpers for desired/effective mode, compatibility, and mode reason.
- `packages/happy-app/sources/utils/brokerSessionUtils.test.ts`
  - Lock UI formatting and fallback behavior.
- `packages/happy-app/sources/app/(app)/machine/[id].tsx`
  - Show per-session mode status, compatibility, and degraded/read-only reasons in the machine attach UI.
- `packages/happy-app/sources/sync/storageTypes.ts`
  - Persist new broker metadata fields in local storage.
- `packages/happy-app/sources/sync/ops.broker.test.ts`
  - Assert machine broker session RPC still parses richer session payloads.
- `docs/vscode-companion-broker.md`
  - Add extension host, `.vsix`, mode switching, and fallback verification instructions.
- `docs/README.md`
  - Link the new extension runtime workflow and operator guide.

### New files to create

- `.vscode/launch.json`
  - F5 profile for `happy-vscode-bridge` Extension Development Host.
- `.vscode/tasks.json`
  - Prelaunch build/typecheck tasks for the extension.
- `packages/happy-vscode-bridge/.vscodeignore`
  - Keep packaged `.vsix` lean and deterministic.
- `packages/happy-vscode-bridge/tsconfig.build.json`
  - Build-only config for extension output.
- `packages/happy-vscode-bridge/esbuild.mjs`
  - Bundle `src/extension.ts` to extension-host-compatible output.
- `packages/happy-vscode-bridge/src/runtime/types.ts`
  - Shared runtime/session/probe type definitions.
- `packages/happy-vscode-bridge/src/runtime/modeReason.ts`
  - Central machine-readable `modeReason` constants and helpers.
- `packages/happy-vscode-bridge/src/runtime/ProviderSessionNormalizer.ts`
  - Build stable `workspaceIdentity`, `conversationIdentity`, `providerSessionKey`, and alias merges.
- `packages/happy-vscode-bridge/src/runtime/ProviderSessionNormalizer.test.ts`
  - Cover stable ID generation, multiroot handling, remote authority, and unresolved identity cases.
- `packages/happy-vscode-bridge/src/runtime/SessionModeResolver.ts`
  - Compute `desiredMode`, `effectiveMode`, `modeReason`, degraded flags, and throttle/rebound behavior.
- `packages/happy-vscode-bridge/src/runtime/SessionModeResolver.test.ts`
  - Cover runtime fallback, storage stale, and rebound throttling.
- `packages/happy-vscode-bridge/src/runtime/UnifiedSessionRuntimeStore.ts`
  - Store per-session normalized provider refs, probe health, capabilities, and snapshots.
- `packages/happy-vscode-bridge/src/runtime/UnifiedSessionRuntimeStore.test.ts`
  - Assert stable `brokerSessionId` and projection behavior.
- `packages/happy-vscode-bridge/src/runtime/ProviderHostRegistry.ts`
  - Locate official provider extensions, versions, exports, commands, and private probe hooks.
- `packages/happy-vscode-bridge/src/runtime/ProviderHostRegistry.test.ts`
  - Cover activation, missing extensions, and unsupported-version diagnostics.
- `packages/happy-vscode-bridge/src/runtime/CompanionRuntime.ts`
  - Orchestrate registry, probes, normalizer, mode resolver, runtime store, and adapter facade refresh.
- `packages/happy-vscode-bridge/src/runtime/CompanionRuntime.test.ts`
  - Assert end-to-end runtime/store projection with fake probes.
- `packages/happy-vscode-bridge/src/runtime/AdapterFacade.ts`
  - Feed unified runtime state into `ClaudeAdapter` / `CodexAdapter` and broker transport.
- `packages/happy-vscode-bridge/src/runtime/AdapterFacade.test.ts`
  - Cover discovery, attach, send, interrupt, approval, and editor context routing.
- `packages/happy-vscode-bridge/src/runtime/probes/types.ts`
  - Probe contracts, health models, and provider-specific evidence shapes.
- `packages/happy-vscode-bridge/src/runtime/probes/claude/ClaudeRuntimeProbe.ts`
  - Runtime-first Claude live session observation and action bridge.
- `packages/happy-vscode-bridge/src/runtime/probes/claude/ClaudeStorageProbe.ts`
  - Claude storage-backed discovery/metadata fallback.
- `packages/happy-vscode-bridge/src/runtime/probes/claude/ClaudeProbes.test.ts`
  - Verify Claude runtime/storage mapping into unified evidence.
- `packages/happy-vscode-bridge/src/runtime/probes/codex/CodexRuntimeProbe.ts`
  - Runtime-first Codex live session observation and action bridge.
- `packages/happy-vscode-bridge/src/runtime/probes/codex/CodexStorageProbe.ts`
  - Codex storage-backed discovery/metadata fallback.
- `packages/happy-vscode-bridge/src/runtime/probes/ProbeFixtures.test.ts`
  - Lock provider recon evidence requirements before provider-specific probes are implemented.
- `packages/happy-vscode-bridge/src/runtime/probes/codex/CodexProbes.test.ts`
  - Verify Codex runtime/storage mapping into unified evidence.
- `packages/happy-vscode-bridge/src/ui/BridgeSessionTreeDataProvider.ts`
  - Back the tree view with provider/mode/degraded session rows.
- `packages/happy-vscode-bridge/src/ui/BridgeCommands.ts`
  - Register broker start/stop/refresh/mode-switch commands.
- `packages/happy-vscode-bridge/src/ui/BridgeStatusBar.ts`
  - Surface broker status and degraded session count.
- `packages/happy-vscode-bridge/src/ui/ui.test.ts`
  - Lock command registration and session presentation logic.
- `packages/happy-vscode-bridge/src/integration/extensionHost.test.ts`
  - Smoke-test activation inside a VS Code Extension Development Host.
- `packages/happy-vscode-bridge/scripts/runExtensionHostTests.mjs`
  - Launch extension-host smoke tests under `@vscode/test-electron`.

## Task Order

### Task 0: Provider Recon And Stable Fixtures

**Files:**
- Create: `packages/happy-vscode-bridge/src/runtime/probes/claude/claudeProbeFixtures.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/probes/codex/codexProbeFixtures.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/probes/ProbeFixtures.test.ts`
- Modify: `docs/vscode-companion-broker.md`

- [ ] **Step 1: Capture provider evidence requirements in failing fixture tests**

```ts
it('documents the provider evidence required for claude full-control', () => {
  expect(readFixtureChecklist('claude')).toEqual(
    expect.arrayContaining([
      'extensionId',
      'extensionVersion',
      'exportsShape',
      'commands',
      'contextKeys',
      'storagePath',
      'workspaceBinding',
    ]),
  );
});
```

- [ ] **Step 2: Run the fixture tests and confirm they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/probes/ProbeFixtures.test.ts`

Expected: FAIL because fixture/evidence helpers do not exist yet.

- [ ] **Step 3: Create provider recon fixtures and failure policy**

Each provider fixture must record:

- official extension id
- installed version under test
- exported runtime hook shape
- command ids used for smoke checks
- context keys or runtime markers used by live-session detection
- storage path(s), file format, and workspace linkage evidence

Also codify the stop condition:

```ts
if (!evidence.supportsFullControl) {
  return {
    compatibility: 'unknown',
    degradedFlags: ['runtime_probe_unverified'],
    attachability: 'attachable_with_degraded_capabilities',
  };
}
```

- [ ] **Step 4: Re-run fixture tests and bridge typecheck**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/probes/ProbeFixtures.test.ts`

Expected: PASS or at least compile against concrete fixture data structures.

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck`

Expected: PASS

- [ ] **Step 5: Commit the provider recon groundwork**

```bash
git add packages/happy-vscode-bridge/src/runtime/probes/ProbeFixtures.test.ts packages/happy-vscode-bridge/src/runtime/probes/claude/claudeProbeFixtures.ts packages/happy-vscode-bridge/src/runtime/probes/codex/codexProbeFixtures.ts docs/vscode-companion-broker.md
git commit -m "docs(bridge): add provider probe fixture requirements"
```

### Task 1: Lock The Broker Wire Contract

**Files:**
- Modify: `packages/happy-wire/src/brokerProtocol.ts`
- Modify: `packages/happy-wire/src/brokerProtocol.test.ts`
- Test: `packages/happy-wire/src/brokerProtocol.test.ts`

- [ ] **Step 1: Write the failing schema tests**

```ts
it('parses a discovered session with mode and probe metadata', () => {
  expect(
    brokerDiscoveredSessionSchema.parse({
      brokerSessionId: 'broker-sess-1',
      provider: 'claude',
      title: 'Claude Session',
      attachability: 'attachable_with_degraded_capabilities',
      capabilities: ['sendUserMessage', 'interrupt'],
      degradedFlags: ['event_stream_unavailable'],
      desiredMode: 'runtime_preferred',
      effectiveMode: 'storage',
      modeReason: 'runtime_unavailable_fallback_to_storage',
      compatibility: 'supported',
      providerExtension: { id: 'provider.extension', version: '1.2.3' },
      probeHealth: { runtime: 'unavailable', storage: 'ready' },
    }),
  ).toMatchObject({
    effectiveMode: 'storage',
  });
});

it('parses an attach snapshot with runtime metadata', () => {
  expect(
    brokerSnapshotSchema.parse({
      brokerSessionId: 'broker-sess-1',
      provider: 'claude',
      latestSeq: 42,
      capabilities: ['sendUserMessage', 'interrupt'],
      degradedFlags: [],
      desiredMode: 'runtime_preferred',
      effectiveMode: 'runtime',
      modeReason: 'runtime_ready',
      compatibility: 'supported',
      providerExtension: { id: 'provider.extension', version: '1.2.3' },
      probeHealth: { runtime: 'ready', storage: 'ready' },
    }),
  ).toMatchObject({ latestSeq: 42 });
});

it('parses the minimal full-control broker event envelope', () => {
  expect(
    brokerEventSchema.parse({
      type: 'session.message.delta',
      brokerSessionId: 'broker-sess-1',
      payload: { role: 'assistant', text: 'hello' },
    }),
  ).toMatchObject({ type: 'session.message.delta' });
});

it('parses approval dismissal explicitly', () => {
  expect(
    brokerEventSchema.parse({
      type: 'session.approval.dismissed',
      brokerSessionId: 'broker-sess-1',
      payload: { approvalId: 'approval-1' },
    }),
  ).toMatchObject({ type: 'session.approval.dismissed' });
});

it('parses attachment refs returned by the broker', () => {
  expect(
    brokerAttachmentRefSchema.parse({
      id: 'artifact-1',
      kind: 'image',
      label: 'screenshot.png',
      openRef: 'file:///tmp/screenshot.png',
    }),
  ).toMatchObject({ kind: 'image' });
});

it('parses run status, approval request, interrupt, and attachment events', () => {
  expect(
    brokerEventSchema.parse({
      type: 'session.run.status',
      brokerSessionId: 'broker-sess-1',
      payload: { status: 'running', reason: 'tool_call' },
    }),
  ).toMatchObject({ type: 'session.run.status' });

  expect(
    brokerEventSchema.parse({
      type: 'session.approval.requested',
      brokerSessionId: 'broker-sess-1',
      payload: { approvalId: 'approval-1', label: 'Apply patch' },
    }),
  ).toMatchObject({ type: 'session.approval.requested' });

  expect(
    brokerEventSchema.parse({
      type: 'session.interrupt',
      brokerSessionId: 'broker-sess-1',
      payload: { outcome: 'accepted', reason: 'user_requested' },
    }),
  ).toMatchObject({ type: 'session.interrupt' });

  expect(
    brokerEventSchema.parse({
      type: 'session.attachment.added',
      brokerSessionId: 'broker-sess-1',
      payload: {
        attachment: { id: 'artifact-1', kind: 'image', label: 'screenshot.png' },
      },
    }),
  ).toMatchObject({ type: 'session.attachment.added' });
});
```

- [ ] **Step 2: Run the wire tests and confirm they fail on missing fields**

Run: `npx vitest run packages/happy-wire/src/brokerProtocol.test.ts`

Expected: FAIL with schema parse errors or missing enum definitions for mode/probe/event metadata.

- [ ] **Step 3: Extend the broker protocol schema**

```ts
export const brokerDesiredModeSchema = z.enum(['runtime_preferred', 'storage_preferred']);
export const brokerEffectiveModeSchema = z.enum(['runtime', 'storage']);
export const brokerCompatibilitySchema = z.enum(['supported', 'unknown', 'incompatible']);

export const brokerProbeHealthSchema = z.object({
  runtime: z.enum(['ready', 'degraded', 'unavailable']),
  storage: z.enum(['ready', 'stale', 'unavailable']),
});
```

Also add typed payload schemas for broker actions that the bridge/CLI will share:

```ts
export const brokerSendMessageIntentSchema = z.object({
  brokerSessionId: z.string(),
  text: z.string(),
});

export const brokerInterruptIntentSchema = z.object({
  brokerSessionId: z.string(),
  reason: z.string(),
});

export const brokerResolveApprovalIntentSchema = z.object({
  brokerSessionId: z.string(),
  approvalId: z.string(),
  decision: z.enum(['approve', 'deny']),
});

export const brokerSetDesiredModeIntentSchema = z.object({
  brokerSessionId: z.string(),
  desiredMode: brokerDesiredModeSchema,
});

export const brokerCaptureEditorContextResultSchema = z.object({
  activeFilePath: z.string().nullable(),
  selectedText: z.string().nullable(),
  selectionRanges: z.array(
    z.object({
      startLine: z.number(),
      startCharacter: z.number(),
      endLine: z.number(),
      endCharacter: z.number(),
    }),
  ),
  workspaceRoots: z.array(z.string()),
  diagnosticsSummary: z.object({
    errors: z.number(),
    warnings: z.number(),
    infos: z.number(),
    hints: z.number(),
  }),
});

export const brokerAttachmentRefSchema = z.object({
  id: z.string(),
  kind: z.enum(['image', 'file', 'patch', 'diff', 'artifact']),
  label: z.string(),
  openRef: z.string().optional(),
});
```

Add event contracts for the minimum live stream:

```ts
export const sessionMessageDeltaEventSchema = z.object({
  type: z.literal('session.message.delta'),
  brokerSessionId: z.string(),
  payload: z.object({
    role: z.enum(['user', 'assistant', 'tool']),
    text: z.string(),
  }),
});

export const sessionRunStatusEventSchema = z.object({
  type: z.literal('session.run.status'),
  brokerSessionId: z.string(),
  payload: z.object({
    status: z.enum(['idle', 'running', 'waiting_approval', 'interrupted', 'completed', 'failed']),
    reason: z.string().optional(),
  }),
});

export const sessionApprovalRequestedEventSchema = z.object({
  type: z.literal('session.approval.requested'),
  brokerSessionId: z.string(),
  payload: z.object({
    approvalId: z.string(),
    label: z.string(),
    description: z.string().optional(),
  }),
});

export const sessionApprovalResolvedEventSchema = z.object({
  type: z.literal('session.approval.resolved'),
  brokerSessionId: z.string(),
  payload: z.object({
    approvalId: z.string(),
    decision: z.enum(['approve', 'deny']),
  }),
});

export const sessionApprovalDismissedEventSchema = z.object({
  type: z.literal('session.approval.dismissed'),
  brokerSessionId: z.string(),
  payload: z.object({
    approvalId: z.string(),
  }),
});

export const sessionInterruptEventSchema = z.object({
  type: z.literal('session.interrupt'),
  brokerSessionId: z.string(),
  payload: z.object({
    outcome: z.enum(['requested', 'accepted', 'rejected', 'completed']),
    reason: z.string().optional(),
  }),
});

export const sessionAttachmentAddedEventSchema = z.object({
  type: z.literal('session.attachment.added'),
  brokerSessionId: z.string(),
  payload: z.object({
    attachment: brokerAttachmentRefSchema,
  }),
});

export const brokerEventSchema = z.discriminatedUnion('type', [
  sessionDiscoveredEventSchema,
  sessionSnapshotEventSchema,
  sessionMessageDeltaEventSchema,
  sessionRunStatusEventSchema,
  sessionApprovalRequestedEventSchema,
  sessionApprovalResolvedEventSchema,
  sessionApprovalDismissedEventSchema,
  sessionAttachmentAddedEventSchema,
  sessionInterruptEventSchema,
]);
```

Also lock request/response shapes for every broker RPC used later in the plan:

```ts
export const brokerRpcContract = {
  discoverSessions: {
    params: z.object({}),
    result: brokerDiscoveredSessionSchema.array(),
  },
  attachSession: {
    params: z.object({ brokerSessionId: z.string() }),
    result: brokerSnapshotSchema.nullable(),
  },
  sendMessage: {
    params: brokerSendMessageIntentSchema,
    result: z.literal(true),
  },
  interruptSession: {
    params: brokerInterruptIntentSchema,
    result: z.literal(true),
  },
  resolveApproval: {
    params: brokerResolveApprovalIntentSchema,
    result: z.literal(true),
  },
  captureEditorContext: {
    params: z.object({ brokerSessionId: z.string() }),
    result: brokerCaptureEditorContextResultSchema.nullable(),
  },
  listAttachments: {
    params: z.object({ brokerSessionId: z.string() }),
    result: brokerAttachmentRefSchema.array(),
  },
  setSessionDesiredMode: {
    params: brokerSetDesiredModeIntentSchema,
    result: brokerDiscoveredSessionSchema,
  },
  subscribeEvents: {
    params: z.object({ brokerSessionId: z.string() }),
    result: z.literal(true),
  },
};
```

- [ ] **Step 4: Re-run the wire tests and typecheck**

Run: `npx vitest run packages/happy-wire/src/brokerProtocol.test.ts`

Expected: PASS

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-wire typecheck`

Expected: PASS

- [ ] **Step 5: Commit the contract change**

```bash
git add packages/happy-wire/src/brokerProtocol.ts packages/happy-wire/src/brokerProtocol.test.ts
git commit -m "feat(wire): extend broker runtime schemas"
```

### Task 2: Convert `happy-vscode-bridge` Into A Real VS Code Extension

**Files:**
- Modify: `packages/happy-vscode-bridge/package.json`
- Modify: `packages/happy-vscode-bridge/tsconfig.json`
- Create: `packages/happy-vscode-bridge/tsconfig.build.json`
- Create: `packages/happy-vscode-bridge/esbuild.mjs`
- Create: `packages/happy-vscode-bridge/.vscodeignore`
- Create: `.vscode/launch.json`
- Create: `.vscode/tasks.json`
- Test: `packages/happy-vscode-bridge/src/extension.test.ts`

- [ ] **Step 1: Add a failing extension-packaging assertion**

```ts
it('declares a VS Code extension entrypoint', async () => {
  const pkg = await import('../package.json');
  expect(pkg.engines.vscode).toBeTruthy();
  expect(pkg.main).toContain('dist/');
});
```

- [ ] **Step 2: Run the bridge tests and confirm packaging assertions fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/extension.test.ts`

Expected: FAIL because `package.json` lacks `engines.vscode`, `main`, and build scripts.

- [ ] **Step 3: Add extension build/debug/package scaffolding**

```json
{
  "main": "./dist/extension.cjs",
  "engines": { "vscode": "^1.100.0" },
  "activationEvents": ["onStartupFinished", "onCommand:happyVscodeBridge.refreshSessions"],
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        { "id": "happyVscodeBridge", "title": "Happy Companion", "icon": "resources/bridge.svg" }
      ]
    },
    "views": {
      "happyVscodeBridge": [
        { "id": "happyVscodeBridge.sessions", "name": "Sessions" }
      ]
    },
    "commands": [
      { "command": "happyVscodeBridge.startBroker", "title": "Happy Companion: Start Broker" },
      { "command": "happyVscodeBridge.stopBroker", "title": "Happy Companion: Stop Broker" },
      { "command": "happyVscodeBridge.refreshSessions", "title": "Happy Companion: Refresh Sessions" },
      { "command": "happyVscodeBridge.switchSessionMode", "title": "Happy Companion: Switch Session Mode" }
    ]
  },
  "scripts": {
    "build": "node ./esbuild.mjs",
    "package:vsix": "vsce package --no-dependencies"
  }
}
```

Bundle the extension host entry as CommonJS-compatible output via `esbuild`, and add root `.vscode` launch/tasks so `F5` opens an Extension Development Host against the workspace package.

- [ ] **Step 4: Verify the extension package can build and typecheck**

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck`

Expected: PASS

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge build`

Expected: PASS and emit `packages/happy-vscode-bridge/dist/extension.cjs`

- [ ] **Step 5: Commit the extension scaffold**

```bash
git add .vscode/launch.json .vscode/tasks.json packages/happy-vscode-bridge/package.json packages/happy-vscode-bridge/tsconfig.json packages/happy-vscode-bridge/tsconfig.build.json packages/happy-vscode-bridge/esbuild.mjs packages/happy-vscode-bridge/.vscodeignore packages/happy-vscode-bridge/src/extension.test.ts
git commit -m "feat(bridge): add vscode extension scaffold"
```

### Task 3: Implement Unified Runtime Core

**Files:**
- Create: `packages/happy-vscode-bridge/src/runtime/types.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/modeReason.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/ProviderSessionNormalizer.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/ProviderSessionNormalizer.test.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/SessionModeResolver.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/SessionModeResolver.test.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/UnifiedSessionRuntimeStore.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/UnifiedSessionRuntimeStore.test.ts`

- [ ] **Step 1: Write failing tests for stable IDs and mode resolution**

```ts
it('keeps brokerSessionId stable across runtime/storage transitions', () => {
  const store = new UnifiedSessionRuntimeStore();
  const first = store.upsert(makeSession({ effectiveMode: 'runtime' }));
  const second = store.upsert(makeSession({ effectiveMode: 'storage' }));
  expect(second.brokerSessionId).toBe(first.brokerSessionId);
});

it('throttles automatic rebound after fallback', () => {
  const resolver = new SessionModeResolver({ reboundDelayMs: 5000 });
  expect(resolver.resolve(makeRuntimeUnavailable())).toMatchObject({
    effectiveMode: 'storage',
    modeReason: 'runtime_unavailable_fallback_to_storage',
  });
});

it('requires two matching samples before changing runtime health', () => {
  const resolver = new SessionModeResolver();
  resolver.resolve(makeProbeState({ runtime: 'unavailable' }));
  expect(resolver.resolve(makeProbeState({ runtime: 'ready' })).effectiveMode).toBe('storage');
});

it('marks storage older than 60s as stale', () => {
  const resolver = new SessionModeResolver({ now: () => 61_000 });
  expect(
    resolver.resolve(
      makeProbeState({
        runtime: 'unavailable',
        storage: { status: 'ready', lastUpdatedAt: 0 },
      }),
    ).probeHealth.storage,
  ).toBe('stale');
});
```

- [ ] **Step 2: Run the new runtime tests and confirm they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/ProviderSessionNormalizer.test.ts packages/happy-vscode-bridge/src/runtime/SessionModeResolver.test.ts packages/happy-vscode-bridge/src/runtime/UnifiedSessionRuntimeStore.test.ts`

Expected: FAIL with missing files/types.

- [ ] **Step 3: Add the runtime core**

```ts
export type UnifiedSessionRecord = {
  providerSessionKey: string;
  brokerSessionId: string;
  desiredMode: 'runtime_preferred' | 'storage_preferred';
  effectiveMode: 'runtime' | 'storage';
  modeReason: BrokerModeReason;
  probeHealth: { runtime: RuntimeHealth; storage: StorageHealth };
};
```

Implement:

- `workspaceIdentity` and `conversationIdentity` normalization
- alias merge support
- `unstable_session_identity` handling
- fallback/rebound throttling
- two-sample health debounce
- storage freshness window handling
- projection helpers for broker snapshots and discovered sessions

- [ ] **Step 4: Re-run runtime tests and bridge typecheck**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/ProviderSessionNormalizer.test.ts packages/happy-vscode-bridge/src/runtime/SessionModeResolver.test.ts packages/happy-vscode-bridge/src/runtime/UnifiedSessionRuntimeStore.test.ts`

Expected: PASS

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck`

Expected: PASS

- [ ] **Step 5: Commit the runtime core**

```bash
git add packages/happy-vscode-bridge/src/runtime
git commit -m "feat(bridge): add unified session runtime core"
```

### Task 4: Add Provider Registry And Probe Contracts

**Files:**
- Create: `packages/happy-vscode-bridge/src/runtime/ProviderHostRegistry.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/ProviderHostRegistry.test.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/probes/types.ts`
- Modify: `packages/happy-vscode-bridge/src/providers/types.ts`

- [ ] **Step 1: Write failing tests for provider host discovery**

```ts
it('reports missing provider extensions as incompatible', async () => {
  const registry = new ProviderHostRegistry(makeVscodeHost({ extensions: [] }));
  await expect(registry.resolve('claude')).resolves.toMatchObject({
    compatibility: 'incompatible',
  });
});
```

- [ ] **Step 2: Run the registry tests and confirm they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/ProviderHostRegistry.test.ts`

Expected: FAIL with missing registry/probe contract files.

- [ ] **Step 3: Implement provider host resolution and probe interfaces**

```ts
export interface RuntimeProbe {
  discoverSessions(): Promise<RuntimeProbeSessionEvidence[]>;
  watchSession(ref: string, onEvent: (event: ProviderEvent) => void): Promise<() => void>;
  sendMessage?(ref: string, text: string): Promise<void>;
}
```

`ProviderHostRegistry` should:

- locate installed provider extension IDs
- activate the target extension on demand
- expose version/exports/commands/context keys
- hand provider probes the narrow host surface they need

- [ ] **Step 4: Re-run registry tests and bridge typecheck**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/ProviderHostRegistry.test.ts`

Expected: PASS

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck`

Expected: PASS

- [ ] **Step 5: Commit the registry layer**

```bash
git add packages/happy-vscode-bridge/src/runtime/ProviderHostRegistry.ts packages/happy-vscode-bridge/src/runtime/ProviderHostRegistry.test.ts packages/happy-vscode-bridge/src/runtime/probes/types.ts packages/happy-vscode-bridge/src/providers/types.ts
git commit -m "feat(bridge): add provider registry and probe contracts"
```

### Task 5: Implement Claude Runtime And Storage Probes

**Files:**
- Create: `packages/happy-vscode-bridge/src/runtime/probes/claude/ClaudeRuntimeProbe.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/probes/claude/ClaudeStorageProbe.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/probes/claude/ClaudeProbes.test.ts`

- [ ] **Step 1: Write failing Claude probe tests**

```ts
it('prefers runtime evidence and falls back to storage metadata', async () => {
  const probe = makeClaudeProbe({
    runtimeSessions: [{ conversationId: 'conv-1', supportsInterrupt: true }],
    storageSessions: [{ conversationId: 'conv-1', latestSeq: 42 }],
  });
  await expect(probe.discoverSessions()).resolves.toMatchObject([
    { conversationIdentity: 'conv-1', latestSeq: 42 },
  ]);
});
```

- [ ] **Step 2: Run the Claude probe tests and confirm they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/probes/claude/ClaudeProbes.test.ts`

Expected: FAIL with missing Claude probe files.

- [ ] **Step 3: Implement Claude runtime/storage probes**

```ts
export class ClaudeRuntimeProbe implements RuntimeProbe {
  async discoverSessions() { /* read live runtime state first */ }
  async sendMessage(ref: string, text: string) { /* call provider bridge */ }
}
```

Support:

- runtime discovery
- storage fallback metadata
- smoke-checked action bridges
- event subscription evidence
- provider-specific degraded flags when an action bridge is absent
- fixture-backed verification of extension id/version/exports/commands/context keys/storage shape before claiming `compatibility: 'supported'`
- hard stop to `compatibility: 'unknown' | 'incompatible'` when full-control evidence is incomplete

- [ ] **Step 4: Re-run Claude tests and bridge typecheck**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/probes/claude/ClaudeProbes.test.ts`

Expected: PASS

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck`

Expected: PASS

- [ ] **Step 5: Commit the Claude probes**

```bash
git add packages/happy-vscode-bridge/src/runtime/probes/claude
git commit -m "feat(bridge): add claude runtime probes"
```

### Task 6: Implement Codex Runtime And Storage Probes

**Files:**
- Create: `packages/happy-vscode-bridge/src/runtime/probes/codex/CodexRuntimeProbe.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/probes/codex/CodexStorageProbe.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/probes/codex/CodexProbes.test.ts`

- [ ] **Step 1: Write failing Codex probe tests**

```ts
it('marks storage-only codex sessions as read_only_attach', async () => {
  const session = await discoverCodexSession({
    runtime: [],
    storage: [{ conversationId: 'codex-1', recordId: 'state-1' }],
  });
  expect(session.degradedFlags).toContain('read_only_attach');
});
```

- [ ] **Step 2: Run the Codex probe tests and confirm they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/probes/codex/CodexProbes.test.ts`

Expected: FAIL with missing Codex probe files.

- [ ] **Step 3: Implement Codex runtime/storage probes**

```ts
export class CodexStorageProbe implements StorageProbe {
  async discoverSessions() { /* parse provider state files for current workspace */ }
}
```

Match the same health semantics as Claude:

- runtime preferred for full control
- storage fallback for discovery/metadata
- explicit `read_only_attach`, `attachment_bridge_unavailable`, or `event_stream_unavailable` flags when full-control paths are absent
- fixture-backed verification of extension id/version/exports/commands/context keys/storage shape before claiming `compatibility: 'supported'`
- hard stop to `compatibility: 'unknown' | 'incompatible'` when full-control evidence is incomplete

- [ ] **Step 4: Re-run Codex tests and bridge typecheck**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/probes/codex/CodexProbes.test.ts`

Expected: PASS

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck`

Expected: PASS

- [ ] **Step 5: Commit the Codex probes**

```bash
git add packages/happy-vscode-bridge/src/runtime/probes/codex
git commit -m "feat(bridge): add codex runtime probes"
```

### Task 7: Wire Companion Runtime, Broker RPC, And VS Code UI

**Files:**
- Modify: `packages/happy-vscode-bridge/package.json`
- Create: `packages/happy-vscode-bridge/src/runtime/CompanionRuntime.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/CompanionRuntime.test.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/AdapterFacade.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/AdapterFacade.test.ts`
- Create: `packages/happy-vscode-bridge/src/ui/BridgeSessionTreeDataProvider.ts`
- Create: `packages/happy-vscode-bridge/src/ui/BridgeCommands.ts`
- Create: `packages/happy-vscode-bridge/src/ui/BridgeStatusBar.ts`
- Create: `packages/happy-vscode-bridge/src/ui/ui.test.ts`
- Modify: `packages/happy-vscode-bridge/src/extension.ts`
- Modify: `packages/happy-vscode-bridge/src/extension.test.ts`
- Modify: `packages/happy-vscode-bridge/src/broker/BrokerServer.ts`
- Modify: `packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts`
- Modify: `packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.ts`
- Modify: `packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts`
- Modify: `packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.ts`
- Modify: `packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.test.ts`
- Modify: `packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.ts`
- Modify: `packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.test.ts`

- [ ] **Step 1: Write failing integration tests for activation and full-control broker RPC**

```ts
it('activates the broker with a real adapter facade', async () => {
  const result = await activate(makeExtensionContext(), { vscode: fakeVscode });
  expect(result.started).toBe(true);
  expect(result.commands).toContain('happyVscodeBridge.switchSessionMode');
});

it('routes sendMessage through broker RPC', async () => {
  await brokerClient.sendMessage('broker-sess-1', 'hello');
  expect(fakeProbe.sendMessage).toHaveBeenCalledWith('provider-ref-1', 'hello');
});

it('routes attachment discovery through broker RPC', async () => {
  await expect(brokerClient.listAttachments('broker-sess-1')).resolves.toMatchObject([
    { id: 'artifact-1', kind: 'image' },
  ]);
});
```

- [ ] **Step 2: Run targeted bridge tests and confirm they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/extension.test.ts packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts`

Expected: FAIL with missing runtime facade/RPC methods/command registration.

- [ ] **Step 3: Implement runtime orchestration and VS Code UI**

Key code shape:

```ts
const runtime = await CompanionRuntime.create({ vscode, context });
const adapterHost = runtime.createBrokerAdapterHost();
await registerBridgeCommands({ vscode, runtime });
registerBridgeTreeView({ vscode, runtime });
```

Broker RPC must cover:

- `discoverSessions`
- `attachSession`
- `sendMessage`
- `interruptSession`
- `resolveApproval`
- `captureEditorContext`
- `listAttachments`
- `setSessionDesiredMode`
- `subscribeEvents`

The tree/status UI must show:

- provider
- title
- `RuntimeProbe (Recommended)` vs `StorageProbe`
- `desiredMode`
- `effectiveMode`
- degraded/read-only state

`subscribeEvents` must also surface `session.attachment.added` when a provider reports a newly shared attachment/artifact.

- [ ] **Step 4: Run bridge unit tests and typecheck**

Run: `npx vitest run packages/happy-vscode-bridge/src/extension.test.ts packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts packages/happy-vscode-bridge/src/runtime/CompanionRuntime.test.ts packages/happy-vscode-bridge/src/runtime/AdapterFacade.test.ts packages/happy-vscode-bridge/src/ui/ui.test.ts`

Expected: PASS

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck`

Expected: PASS

- [ ] **Step 5: Commit the companion runtime wiring**

```bash
git add packages/happy-vscode-bridge/src/extension.ts packages/happy-vscode-bridge/src/extension.test.ts packages/happy-vscode-bridge/src/broker/BrokerServer.ts packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.ts packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.ts packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.test.ts packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.ts packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.test.ts packages/happy-vscode-bridge/src/runtime/CompanionRuntime.ts packages/happy-vscode-bridge/src/runtime/CompanionRuntime.test.ts packages/happy-vscode-bridge/src/runtime/AdapterFacade.ts packages/happy-vscode-bridge/src/runtime/AdapterFacade.test.ts packages/happy-vscode-bridge/src/ui
git commit -m "feat(bridge): wire companion runtime and vscode ui"
```

### Task 8: Update Happy CLI For Full-Control Broker Sessions

**Files:**
- Modify: `packages/happy-cli/src/broker/BrokerClient.ts`
- Modify: `packages/happy-cli/src/broker/BrokerClient.test.ts`
- Modify: `packages/happy-cli/src/broker/runBrokerAttachedSession.ts`
- Modify: `packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts`
- Modify: `packages/happy-cli/src/api/types.ts`
- Modify: `packages/happy-cli/src/utils/createSessionMetadata.ts`
- Test: `packages/happy-cli/src/api/apiMachine.test.ts`

- [ ] **Step 1: Write failing CLI tests for richer broker metadata and new RPC calls**

```ts
it('persists desired/effective mode from broker attach metadata', async () => {
  await runBrokerAttachedSession({ brokerSessionId: 'broker-sess-1', brokerClient: fakeBroker });
  expect(createdSession.metadata).toMatchObject({
    brokerDesiredMode: 'runtime_preferred',
    brokerEffectiveMode: 'runtime',
  });
});
```

- [ ] **Step 2: Run CLI tests and confirm they fail**

Run: `npx vitest run packages/happy-cli/src/broker/BrokerClient.test.ts packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts packages/happy-cli/src/api/apiMachine.test.ts`

Expected: FAIL because CLI metadata and RPC helpers do not know the new schema.

- [ ] **Step 3: Extend `BrokerClient` and broker-attached metadata handling**

```ts
await client.setSessionDesiredMode('broker-sess-1', 'storage_preferred');
await client.sendMessage('broker-sess-1', 'continue');
await client.listAttachments('broker-sess-1');
```

Persist at minimum:

- `brokerDesiredMode`
- `brokerEffectiveMode`
- `brokerModeReason`
- `brokerCompatibility`
- `brokerProviderExtension`
- `brokerProbeHealth`

- [ ] **Step 4: Re-run CLI tests and typecheck**

Run: `npx vitest run packages/happy-cli/src/broker/BrokerClient.test.ts packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts packages/happy-cli/src/api/apiMachine.test.ts`

Expected: PASS

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-cli typecheck`

Expected: PASS

- [ ] **Step 5: Commit the CLI broker update**

```bash
git add packages/happy-cli/src/broker/BrokerClient.ts packages/happy-cli/src/broker/BrokerClient.test.ts packages/happy-cli/src/broker/runBrokerAttachedSession.ts packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts packages/happy-cli/src/api/types.ts packages/happy-cli/src/utils/createSessionMetadata.ts
git commit -m "feat(cli): consume companion runtime metadata"
```

### Task 9: Update Happy App Broker Attach UI

**Files:**
- Modify: `packages/happy-app/sources/utils/brokerSessionUtils.ts`
- Modify: `packages/happy-app/sources/utils/brokerSessionUtils.test.ts`
- Modify: `packages/happy-app/sources/app/(app)/machine/[id].tsx`
- Modify: `packages/happy-app/sources/sync/storageTypes.ts`
- Modify: `packages/happy-app/sources/sync/ops.broker.test.ts`

- [ ] **Step 1: Write failing app tests for mode and compatibility summaries**

```ts
it('formats runtime preferred sessions without new translation keys', () => {
  expect(
    getBrokerSessionMetadataSummary(
      {
        sessionSource: 'broker_attached',
        brokerDesiredMode: 'runtime_preferred',
        brokerEffectiveMode: 'storage',
        brokerModeReason: 'runtime_unavailable_fallback_to_storage',
      },
      translate,
    ),
  ).toContain('Storage');
});
```

- [ ] **Step 2: Run app broker tests and confirm they fail**

Run: `npx vitest run packages/happy-app/sources/utils/brokerSessionUtils.test.ts packages/happy-app/sources/sync/ops.broker.test.ts`

Expected: FAIL because storage types and UI helpers do not include the new broker fields.

- [ ] **Step 3: Implement the machine-screen/UI updates**

Use existing helper structure and keep string expansion local:

```ts
const modeLabel = formatBrokerMode(session.effectiveMode);
const detail = [providerLabel, modeLabel, ...degradedMessages].join(' • ');
```

Show:

- desired mode
- effective mode
- compatibility/provider version
- degraded flags / read-only fallback reason
- mode-switch action state when the bridge reports storage fallback

- [ ] **Step 4: Re-run app tests and typecheck**

Run: `npx vitest run packages/happy-app/sources/utils/brokerSessionUtils.test.ts packages/happy-app/sources/sync/ops.broker.test.ts`

Expected: PASS

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-app typecheck`

Expected: PASS

- [ ] **Step 5: Commit the app UI update**

```bash
git add packages/happy-app/sources/utils/brokerSessionUtils.ts packages/happy-app/sources/utils/brokerSessionUtils.test.ts packages/happy-app/sources/app/(app)/machine/[id].tsx packages/happy-app/sources/sync/storageTypes.ts packages/happy-app/sources/sync/ops.broker.test.ts
git commit -m "feat(app): surface companion runtime state"
```

### Task 10: Final Docs, Extension Host Smoke Tests, And Verification

**Files:**
- Create: `packages/happy-vscode-bridge/src/integration/extensionHost.test.ts`
- Create: `packages/happy-vscode-bridge/scripts/runExtensionHostTests.mjs`
- Modify: `docs/vscode-companion-broker.md`
- Modify: `docs/README.md`

- [ ] **Step 1: Write the failing extension-host smoke test**

```ts
it('activates inside Extension Development Host and writes the broker manifest', async () => {
  const manifest = await runExtensionHostSmoke();
  expect(manifest.port).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run the smoke test command and confirm it fails before the harness exists**

Run: `node packages/happy-vscode-bridge/scripts/runExtensionHostTests.mjs`

Expected: FAIL because the test runner script and extension-host test do not exist yet.

- [ ] **Step 3: Add smoke test harness and operator docs**

Document:

- `F5` startup steps
- `.vsix` packaging
- runtime/storage desired vs effective mode behavior
- how to verify Claude and Codex full-control attach
- what degraded flags mean during fallback

- [ ] **Step 4: Run the full verification matrix**

Run:

```bash
COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-wire typecheck
COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck
COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-cli typecheck
COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-app typecheck

COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge build
COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge package:vsix

npx vitest run packages/happy-wire/src/brokerProtocol.test.ts
npx vitest run packages/happy-vscode-bridge/src/extension.test.ts \
  packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts \
  packages/happy-vscode-bridge/src/runtime/ProviderSessionNormalizer.test.ts \
  packages/happy-vscode-bridge/src/runtime/SessionModeResolver.test.ts \
  packages/happy-vscode-bridge/src/runtime/UnifiedSessionRuntimeStore.test.ts \
  packages/happy-vscode-bridge/src/runtime/ProviderHostRegistry.test.ts \
  packages/happy-vscode-bridge/src/runtime/CompanionRuntime.test.ts \
  packages/happy-vscode-bridge/src/runtime/AdapterFacade.test.ts \
  packages/happy-vscode-bridge/src/runtime/probes/claude/ClaudeProbes.test.ts \
  packages/happy-vscode-bridge/src/runtime/probes/codex/CodexProbes.test.ts \
  packages/happy-vscode-bridge/src/ui/ui.test.ts
npx vitest run packages/happy-cli/src/broker/BrokerClient.test.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts \
  packages/happy-cli/src/api/apiMachine.test.ts
npx vitest run packages/happy-app/sources/utils/brokerSessionUtils.test.ts \
  packages/happy-app/sources/sync/ops.broker.test.ts

node packages/happy-vscode-bridge/scripts/runExtensionHostTests.mjs
```

Expected: every command exits successfully; `.vsix` is emitted; the extension-host smoke test reports activation success.

- [ ] **Step 5: Commit docs and final verification artifacts**

```bash
git add packages/happy-vscode-bridge/src/integration/extensionHost.test.ts packages/happy-vscode-bridge/scripts/runExtensionHostTests.mjs docs/vscode-companion-broker.md docs/README.md
git commit -m "docs: add companion extension runtime verification"
```

## Notes For Execution

- Do not guess provider-specific private probe entrypoints in shared runtime code. Keep any private exports, storage paths, or commands inside the provider-specific probe files only.
- Keep `brokerSessionId` derivation inside the runtime store; no UI or CLI consumer should reconstruct it.
- Treat `storage` mode as read-only unless a provider-specific probe can prove a safe write bridge and the spec is updated accordingly.
- Prefer fake `vscode` hosts and fake provider probes in unit tests. Reserve `@vscode/test-electron` for the smallest possible smoke surface.
- If a provider probe cannot reach full-control on the current latest official extension, stop and surface the incompatibility instead of silently widening degraded behavior.
