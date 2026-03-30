# Happy App Broker Attach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the broker-backed mobile attach flow end-to-end so Happy can group discovered VS Code live sessions by window, attach the correct Claude/Codex session across multiple windows, and keep a stable broker identity strip inside the attached session view.

**Architecture:** Keep the broker protocol focused on live session control, and move window identity into the per-window broker manifest plus the Happy session metadata written during attach. `happy-vscode-bridge` publishes one manifest per VS Code window, `happy-cli` aggregates all manifests into one flat machine RPC `sessions[]` payload and resolves attach targets back to the right broker instance, and `happy-app` uses the enriched discover DTO for grouped attach while using persisted session metadata for the post-attach strip/read-only UX.

**Tech Stack:** TypeScript, Vitest, Node fs APIs, Expo/React Native, Zod, existing broker relay/session sync code in `happy-vscode-bridge`, `happy-cli`, and `happy-app`

---

## Scope Check

This plan covers one subsystem only: the app-facing broker attach UX and the minimum data plumbing it depends on. It does **not** change broker live-event semantics, create new official VS Code sessions from Happy, add replay/history recovery, or redesign server-side session sync.

## File Map

### Existing files to modify

- `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.ts`
  - Expand the manifest format from one anonymous `instance.json` into a per-window manifest writer that still preserves the legacy compatibility file.
- `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts`
  - Lock the new manifest layout, compatibility write, and window metadata fields.
- `packages/happy-vscode-bridge/src/extension.ts`
  - Compute current-window broker identity fields and pass them into the manifest writer at broker startup.
- `packages/happy-vscode-bridge/src/integration/extensionHost.test.ts`
  - Assert the smoke manifest contains the new window metadata contract.
- `packages/happy-cli/src/broker/brokerManifest.ts`
  - Load all broker manifests under the shared broker root, keep legacy fallback behavior, and expose typed window metadata.
- `packages/happy-cli/src/api/apiMachine.ts`
  - Replace single-manifest discovery/attach with aggregated multi-manifest lookup and attach-target resolution.
- `packages/happy-cli/src/api/apiMachine.test.ts`
  - Cover aggregated list results, attach routing to the correct broker URL, and explicit failure on ambiguous session IDs.
- `packages/happy-cli/src/modules/common/registerCommonHandlers.ts`
  - Extend broker-attached spawn options with window identity fields that must survive into the child relay process.
- `packages/happy-cli/src/daemon/run.ts`
  - Pass the selected broker window metadata into the spawned `broker-attached-session` child.
- `packages/happy-cli/src/index.ts`
  - Parse the new broker window attach CLI flags and forward them into `runBrokerAttachedSession(...)`.
- `packages/happy-cli/src/broker/runBrokerAttachedSession.ts`
  - Thread window identity options into the relay runner wrapper.
- `packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts`
  - Lock wrapper forwarding of broker window metadata and metadata projection defaults.
- `packages/happy-cli/src/broker/BrokerRelayRunner.ts`
  - Include broker window metadata in the session metadata passed to `getOrCreateSession(...)`.
- `packages/happy-cli/src/broker/BrokerRelayRunner.test.ts`
  - Assert the attached Happy session receives `windowInstanceId`, broker window labels, and read-only relevant metadata.
- `packages/happy-cli/src/utils/createSessionMetadata.ts`
  - Persist broker window/session metadata on broker-backed Happy sessions.
- `packages/happy-cli/src/api/types.ts`
  - Extend `Metadata` with the broker window fields consumed by the app session page.
- `packages/happy-app/sources/sync/brokerTypes.ts`
  - Parse broker discover DTOs that include window identity fields.
- `packages/happy-app/sources/sync/ops.broker.test.ts`
  - Lock parsing and compatibility behavior for grouped-vs-flat broker list responses.
- `packages/happy-app/sources/sync/storageTypes.ts`
  - Add the broker window metadata fields persisted on attached Happy sessions.
- `packages/happy-app/sources/utils/brokerSessionUtils.ts`
  - Add row labels, disable reasons, read-only gating, and strip/detail summary helpers.
- `packages/happy-app/sources/utils/brokerSessionUtils.test.ts`
  - Cover new disable reasons, storage/read-only summaries, and strip text generation.
- `packages/happy-app/sources/app/(app)/machine/[id].tsx`
  - Replace the flat broker attach list with grouped-by-window rendering and compatibility fallback.
- `packages/happy-app/sources/-session/SessionView.tsx`
  - Insert the broker attached strip/details layer and enforce read-only broker input behavior.
- `packages/happy-app/sources/components/AgentInput.tsx`
  - Support a true input-disabled mode for broker read-only attach, not just send-button disablement.
- `packages/happy-app/sources/components/MultiTextInput.tsx`
  - Thread `editable={false}` through to the native input when broker attach is read-only.
- `packages/happy-app/sources/text/_default.ts`
  - Add fallback strings for grouped broker windows, strip labels, upgrade hints, and read-only/session-state copy.
- `packages/happy-app/sources/text/translations/en.ts`
  - Add English copy for the new broker attach UI.
- `packages/happy-app/sources/text/translations/zh-Hans.ts`
  - Add Simplified Chinese copy for the new broker attach UI.

### New files to create

- `packages/happy-cli/src/broker/brokerSessionCatalog.ts`
  - Aggregate all broker manifests, discover sessions from each broker instance, enrich them with window metadata, and resolve a selected `brokerSessionId` back to one concrete attach target.
- `packages/happy-cli/src/broker/brokerSessionCatalog.test.ts`
  - Cover multi-window aggregation, window ordinal assignment, legacy single-manifest fallback, and duplicate-session detection.
- `packages/happy-cli/src/daemon/brokerAttachArgs.ts`
  - Build the broker-attached child-process CLI args in one place so window metadata forwarding is unit-testable.
- `packages/happy-cli/src/daemon/brokerAttachArgs.test.ts`
  - Lock argument generation for all required broker window fields.
- `packages/happy-app/sources/utils/brokerWindowGroups.ts`
  - Group/sort enriched broker sessions by `windowInstanceId` and expose the compatibility fallback model used by the machine page.
- `packages/happy-app/sources/utils/brokerWindowGroups.test.ts`
  - Cover active-window sorting, same-name workspace disambiguation, same-window Claude/Codex rows, and flat fallback when window fields are missing.
- `packages/happy-app/sources/utils/brokerStripState.ts`
  - Own the expand-to-strip collapse timing and first-interaction rules for attached broker sessions.
- `packages/happy-app/sources/utils/brokerStripState.test.ts`
  - Cover 3-second auto-collapse, collapse on scroll/message/delta, and “collapse once only” semantics.
- `packages/happy-app/sources/components/BrokerWindowGroupHeader.tsx`
  - Render the grouped machine-page broker window header with activity and degraded counters.
- `packages/happy-app/sources/components/BrokerAttachedStrip.tsx`
  - Render the session-page expanded confirmation state and collapsed strip state.
- `packages/happy-app/sources/components/BrokerAttachedDetailsSheet.tsx`
  - Show the broker metadata details layer opened from the strip.
- `packages/happy-app/sources/components/agentInputReadOnly.test.tsx`
  - Verify the agent input and underlying text input become non-editable for broker read-only attach.

### Files intentionally left untouched in v1

- `packages/happy-wire`
  - The broker RPC protocol stays unchanged in this plan; window identity comes from broker manifests and attached Happy session metadata instead of new live RPC fields.
- `packages/happy-server`
  - Existing session metadata persistence and session event sync are reused unchanged.
- `packages/happy-app/sources/sync/ops.ts`
  - The machine RPC call sites stay the same; only the parsed DTO shape and consuming UI change.

## Task Order

### Task 1: Publish Per-Window Broker Manifests And Aggregate Them In `happy-cli`

**Files:**
- Modify: `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.ts`
- Modify: `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts`
- Modify: `packages/happy-vscode-bridge/src/extension.ts`
- Modify: `packages/happy-vscode-bridge/src/integration/extensionHost.test.ts`
- Modify: `packages/happy-cli/src/broker/brokerManifest.ts`
- Create: `packages/happy-cli/src/broker/brokerSessionCatalog.ts`
- Create: `packages/happy-cli/src/broker/brokerSessionCatalog.test.ts`
- Modify: `packages/happy-cli/src/api/apiMachine.ts`
- Modify: `packages/happy-cli/src/api/apiMachine.test.ts`

- [ ] **Step 1: Write the failing manifest + aggregation tests**

Extend `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts` with a case like:

```ts
it('writes a per-window manifest and updates the legacy compatibility file', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'happy-vsc-bridge-'));
  const store = new BrokerManifestStore(rootDir);

  await store.write({
    port: 40123,
    token: 'secret',
    windowInstanceId: 'win-a',
    windowLabel: 'api-repo.code-workspace',
    workspaceLabel: 'api-repo',
    workspacePath: '/home/work/api-repo',
    isActiveWindow: true,
    windowLastActiveAt: '2026-03-26T15:00:00.000Z',
  });

  await expect(readJson(join(rootDir, 'broker', 'instances', 'win-a.json'))).resolves.toMatchObject({
    windowInstanceId: 'win-a',
    windowLabel: 'api-repo.code-workspace',
  });
  await expect(readJson(join(rootDir, 'broker', 'instance.json'))).resolves.toMatchObject({
    windowInstanceId: 'win-a',
  });
});
```

Create `packages/happy-cli/src/broker/brokerSessionCatalog.test.ts` with these behaviors:

```ts
it('aggregates sessions from multiple broker manifests and assigns window ordinals', async () => {
  const catalog = await discoverBrokerSessions('/broker-root', fakeClientFactory({
    'ws://broker-a': [{ brokerSessionId: 'claude-a', provider: 'claude', title: 'Claude A', attachability: 'attachable', capabilities: [], degradedFlags: [], ...runtimeMeta }],
    'ws://broker-b': [{ brokerSessionId: 'codex-b', provider: 'codex', title: 'Codex B', attachability: 'attachable', capabilities: [], degradedFlags: [], ...runtimeMeta }],
  }));

  expect(catalog.sessions).toEqual(expect.arrayContaining([
    expect.objectContaining({ brokerSessionId: 'claude-a', windowInstanceId: 'win-a', windowOrdinal: 1 }),
    expect.objectContaining({ brokerSessionId: 'codex-b', windowInstanceId: 'win-b', windowOrdinal: 2 }),
  ]));
});
```

```ts
it('fails attach target resolution when two broker instances expose the same brokerSessionId', async () => {
  await expect(catalog.resolveAttachTarget('shared-session')).rejects.toThrow(
    'Duplicate brokerSessionId across broker instances: shared-session',
  );
});
```

Extend `packages/happy-cli/src/api/apiMachine.test.ts` so:

- `broker-list-sessions` returns sessions enriched with `windowInstanceId`, `windowLabel`, `workspaceLabel`, `windowOrdinal`, and `isActiveWindow`
- `broker-attach-session` selects the correct broker URL/root/window metadata for the chosen session

- [ ] **Step 2: Run the failing bridge + CLI tests**

Run:

```bash
npx vitest run \
  packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts \
  packages/happy-cli/src/broker/brokerSessionCatalog.test.ts \
  packages/happy-cli/src/api/apiMachine.test.ts
```

Expected:

- bridge tests fail because manifests only write `broker/instance.json`
- CLI tests fail because only one manifest can be loaded and no window metadata is added to sessions

- [ ] **Step 3: Implement per-window manifest writing in the bridge**

Implementation notes:

1. Expand the manifest schema written by `BrokerManifestStore` to include:

```ts
type BrokerInstanceManifest = {
  port: number;
  token: string;
  address?: string;
  version?: string;
  windowInstanceId: string;
  windowLabel: string;
  workspaceLabel: string;
  workspacePath?: string | null;
  isActiveWindow: boolean;
  windowLastActiveAt?: string | null;
};
```

2. Write the full manifest to:

```ts
join(rootDir, 'broker', 'instances', `${windowInstanceId}.json`)
```

3. Keep writing `broker/instance.json` as a compatibility alias that mirrors the current window manifest so older clients still work.
4. In `extension.ts`, gather window metadata once at broker startup from the current VS Code window/workspace context and pass it into `manifestStore.write(...)`.
5. Update the extension-host smoke harness expectations so the existing smoke script can assert `windowInstanceId`, `windowLabel`, and `workspaceLabel` in the written manifest.

- [ ] **Step 4: Implement CLI manifest aggregation and attach-target resolution**

Implementation notes:

1. Add multi-manifest loading to `packages/happy-cli/src/broker/brokerManifest.ts`:

```ts
export async function loadBrokerManifestConnections(rootDir: string): Promise<BrokerManifestConnection[]> {
  // read broker/instances/*.json, fall back to broker/instance.json when the directory is absent,
  // parse the new window metadata, and compute brokerUrl for each manifest
}
```

2. Add `brokerSessionCatalog.ts` as the only place that:
   - discovers sessions from every broker instance
   - merges the broker session DTO with the manifest window metadata
   - computes `windowOrdinal` after sorting windows by `isActiveWindow`, `windowLastActiveAt`, then label
   - resolves one `brokerSessionId` back to exactly one `{ brokerUrl, brokerRootDir, session, manifest }`
3. Update `apiMachine.ts`:
   - `broker-list-sessions` returns `catalog.sessions`
   - `broker-attach-session` reuses `catalog.resolveAttachTarget(...)` and passes the chosen window metadata into `spawnSession(...)`
4. If duplicate `brokerSessionId` values are found across broker instances, fail attach explicitly instead of guessing.

- [ ] **Step 5: Re-run the bridge + CLI discovery tests**

Run:

```bash
npx vitest run \
  packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts \
  packages/happy-cli/src/broker/brokerSessionCatalog.test.ts \
  packages/happy-cli/src/api/apiMachine.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit the manifest/discovery slice**

```bash
git add \
  packages/happy-vscode-bridge/src/broker/BrokerManifestStore.ts \
  packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts \
  packages/happy-vscode-bridge/src/extension.ts \
  packages/happy-cli/src/broker/brokerManifest.ts \
  packages/happy-cli/src/broker/brokerSessionCatalog.ts \
  packages/happy-cli/src/broker/brokerSessionCatalog.test.ts \
  packages/happy-cli/src/api/apiMachine.ts \
  packages/happy-cli/src/api/apiMachine.test.ts
git commit -m "feat(broker): aggregate window manifests for app attach"
```

### Task 2: Carry Broker Window Identity Through The Attach Spawn And Relay Metadata

**Files:**
- Modify: `packages/happy-cli/src/modules/common/registerCommonHandlers.ts`
- Create: `packages/happy-cli/src/daemon/brokerAttachArgs.ts`
- Create: `packages/happy-cli/src/daemon/brokerAttachArgs.test.ts`
- Modify: `packages/happy-cli/src/daemon/run.ts`
- Modify: `packages/happy-cli/src/index.ts`
- Modify: `packages/happy-cli/src/broker/runBrokerAttachedSession.ts`
- Modify: `packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts`
- Modify: `packages/happy-cli/src/broker/BrokerRelayRunner.ts`
- Modify: `packages/happy-cli/src/broker/BrokerRelayRunner.test.ts`
- Modify: `packages/happy-cli/src/utils/createSessionMetadata.ts`
- Modify: `packages/happy-cli/src/api/types.ts`
- Modify: `packages/happy-app/sources/sync/storageTypes.ts`

- [ ] **Step 1: Write the failing metadata-forwarding tests**

Create `packages/happy-cli/src/daemon/brokerAttachArgs.test.ts`:

```ts
it('builds broker-attached child args with window metadata', () => {
  expect(buildBrokerAttachArgs({
    brokerSessionId: 'broker-sess-1',
    brokerUrl: 'ws://broker-a',
    brokerRootDir: '/broker-root',
    windowInstanceId: 'win-a',
    brokerWindowLabel: 'api-repo.code-workspace',
    brokerWorkspaceLabel: 'api-repo',
    brokerWorkspacePath: '/home/work/api-repo',
    brokerWindowOrdinal: 1,
  })).toEqual([
    'broker-attached-session',
    '--started-by', 'daemon',
    '--broker-session-id', 'broker-sess-1',
    '--broker-root-dir', '/broker-root',
    '--broker-url', 'ws://broker-a',
    '--window-instance-id', 'win-a',
    '--broker-window-label', 'api-repo.code-workspace',
    '--broker-workspace-label', 'api-repo',
    '--broker-workspace-path', '/home/work/api-repo',
    '--broker-window-ordinal', '1',
  ]);
});
```

Extend `packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts`:

```ts
it('marks broker-attached sessions with window metadata', () => {
  const { metadata } = createSessionMetadata({
    flavor: 'codex',
    machineId: 'machine-1',
    source: 'broker_attached',
    brokerSessionId: 'broker-sess-1',
    windowInstanceId: 'win-a',
    brokerWindowLabel: 'api-repo.code-workspace',
    brokerWorkspaceLabel: 'api-repo',
    brokerWorkspacePath: '/home/work/api-repo',
    brokerWindowOrdinal: 1,
  });

  expect(metadata.windowInstanceId).toBe('win-a');
  expect(metadata.brokerWindowLabel).toBe('api-repo.code-workspace');
  expect(metadata.brokerWindowOrdinal).toBe(1);
});
```

Extend `packages/happy-cli/src/broker/BrokerRelayRunner.test.ts` so the `getOrCreateSession(...)` metadata includes the same fields after `attachSession`.

- [ ] **Step 2: Run the failing attach metadata tests**

Run:

```bash
npx vitest run \
  packages/happy-cli/src/daemon/brokerAttachArgs.test.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts \
  packages/happy-cli/src/broker/BrokerRelayRunner.test.ts
```

Expected:

- helper test fails because the builder does not exist
- wrapper/relay tests fail because broker window fields are not parsed or persisted

- [ ] **Step 3: Implement typed broker window attach arguments**

Implementation notes:

1. Extend `SpawnSessionOptions` in `registerCommonHandlers.ts` with:

```ts
windowInstanceId?: string;
brokerWindowLabel?: string;
brokerWorkspaceLabel?: string;
brokerWorkspacePath?: string;
brokerWindowOrdinal?: number;
```

2. Create `brokerAttachArgs.ts` so `daemon/run.ts` only calls:

```ts
const brokerAttachArgs = buildBrokerAttachArgs({
  startedBy: 'daemon',
  brokerSessionId: options.brokerSessionId,
  brokerUrl: options.brokerUrl,
  brokerRootDir: options.brokerRootDir,
  windowInstanceId: options.windowInstanceId,
  brokerWindowLabel: options.brokerWindowLabel,
  brokerWorkspaceLabel: options.brokerWorkspaceLabel,
  brokerWorkspacePath: options.brokerWorkspacePath,
  brokerWindowOrdinal: options.brokerWindowOrdinal,
});
```

3. Update `index.ts` to parse the new CLI flags and pass them into `runBrokerAttachedSession(...)`.
4. Extend `RunBrokerAttachedSessionOptions`, `BrokerRelayRunnerOptions`, `createSessionMetadata(...)`, and `Metadata` to carry the new fields end-to-end.

- [ ] **Step 4: Persist broker window metadata on attached Happy sessions**

Implementation notes:

1. Add these fields to CLI and app metadata types:

```ts
windowInstanceId?: string;
brokerWindowLabel?: string;
brokerWorkspaceLabel?: string;
brokerWorkspacePath?: string;
brokerWindowOrdinal?: number;
```

2. In `BrokerRelayRunner.start()`, include them before `getOrCreateSession(...)`:

```ts
const { metadata, state } = createSessionMetadata({
  flavor: snapshot.provider,
  machineId: this.options.machineId,
  source: 'broker_attached',
  brokerSessionId: snapshot.brokerSessionId,
  brokerCapabilities: snapshot.capabilities,
  brokerDegradedFlags: snapshot.degradedFlags,
  brokerDesiredMode: snapshot.desiredMode,
  brokerEffectiveMode: snapshot.effectiveMode,
  brokerModeReason: snapshot.modeReason,
  brokerCompatibility: snapshot.compatibility,
  brokerProviderExtension: snapshot.providerExtension,
  brokerProbeHealth: snapshot.probeHealth,
  windowInstanceId: this.options.windowInstanceId,
  brokerWindowLabel: this.options.brokerWindowLabel,
  brokerWorkspaceLabel: this.options.brokerWorkspaceLabel,
  brokerWorkspacePath: this.options.brokerWorkspacePath,
  brokerWindowOrdinal: this.options.brokerWindowOrdinal,
});
```

3. Keep `flavor` as the provider source for the app strip; do **not** add a duplicate `brokerProvider` field.

- [ ] **Step 5: Re-run the attach metadata tests**

Run:

```bash
npx vitest run \
  packages/happy-cli/src/daemon/brokerAttachArgs.test.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts \
  packages/happy-cli/src/broker/BrokerRelayRunner.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit the attach metadata slice**

```bash
git add \
  packages/happy-cli/src/modules/common/registerCommonHandlers.ts \
  packages/happy-cli/src/daemon/brokerAttachArgs.ts \
  packages/happy-cli/src/daemon/brokerAttachArgs.test.ts \
  packages/happy-cli/src/daemon/run.ts \
  packages/happy-cli/src/index.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts \
  packages/happy-cli/src/broker/BrokerRelayRunner.ts \
  packages/happy-cli/src/broker/BrokerRelayRunner.test.ts \
  packages/happy-cli/src/utils/createSessionMetadata.ts \
  packages/happy-cli/src/api/types.ts \
  packages/happy-app/sources/sync/storageTypes.ts
git commit -m "feat(cli): persist broker window identity on attached sessions"
```

### Task 3: Add App-Side Grouping, Disable Rules, And Compatibility Fallback Models

**Files:**
- Modify: `packages/happy-app/sources/sync/brokerTypes.ts`
- Modify: `packages/happy-app/sources/sync/ops.broker.test.ts`
- Create: `packages/happy-app/sources/utils/brokerWindowGroups.ts`
- Create: `packages/happy-app/sources/utils/brokerWindowGroups.test.ts`
- Modify: `packages/happy-app/sources/utils/brokerSessionUtils.ts`
- Modify: `packages/happy-app/sources/utils/brokerSessionUtils.test.ts`
- Modify: `packages/happy-app/sources/text/_default.ts`
- Modify: `packages/happy-app/sources/text/translations/en.ts`
- Modify: `packages/happy-app/sources/text/translations/zh-Hans.ts`

- [ ] **Step 1: Write the failing app model tests**

Extend `packages/happy-app/sources/sync/ops.broker.test.ts` with a grouped-session DTO:

```ts
it('parses broker session DTOs with window identity fields', async () => {
  machineRPCMock.mockResolvedValue({
    sessions: [{
      brokerSessionId: 'broker-sess-1',
      provider: 'codex',
      title: 'Codex in window A',
      attachability: 'attachable',
      capabilities: ['sendUserMessage', 'interrupt'],
      degradedFlags: [],
      desiredMode: 'runtime_preferred',
      effectiveMode: 'runtime',
      modeReason: 'runtime_ready',
      compatibility: 'supported',
      providerExtension: { id: 'openai.chatgpt', version: '1.2026.84' },
      probeHealth: { runtime: 'ready', storage: 'ready' },
      windowInstanceId: 'win-a',
      windowLabel: 'api-repo.code-workspace',
      workspaceLabel: 'api-repo',
      windowOrdinal: 1,
      isActiveWindow: true,
      workspacePath: '/home/work/api-repo',
    }],
  });

  const result = await machineListBrokerSessions('machine-1');
  expect(result.sessions[0].windowInstanceId).toBe('win-a');
});
```

Create `packages/happy-app/sources/utils/brokerWindowGroups.test.ts`:

```ts
it('groups sessions by window and keeps same-window Claude/Codex separate', () => {
  const result = groupBrokerSessionsByWindow([
    makeSession({ brokerSessionId: 'claude-1', provider: 'claude', windowInstanceId: 'win-a', windowLabel: 'api-repo', workspaceLabel: 'api-repo', windowOrdinal: 1, isActiveWindow: true }),
    makeSession({ brokerSessionId: 'codex-1', provider: 'codex', windowInstanceId: 'win-a', windowLabel: 'api-repo', workspaceLabel: 'api-repo', windowOrdinal: 1, isActiveWindow: true }),
  ]);

  expect(result.mode).toBe('grouped');
  expect(result.groups[0].sessions.map((session) => session.provider)).toEqual(['claude', 'codex']);
});
```

```ts
it('falls back to flat mode when window fields are missing', () => {
  const result = groupBrokerSessionsByWindow([
    makeLegacySession({ brokerSessionId: 'legacy-1', provider: 'claude' }),
  ]);

  expect(result.mode).toBe('flat');
  expect(result.upgradeHint).toBe('brokerWindowGroupingUpgradeRequired');
});
```

Extend `packages/happy-app/sources/utils/brokerSessionUtils.test.ts` with:

- `unstable_session_identity` disable reason
- `read_only_attach` input gating
- strip subtitle summaries such as `Window 1 · Runtime attached · interrupt + approval synced`

- [ ] **Step 2: Run the failing app model tests**

Run:

```bash
npx vitest run \
  packages/happy-app/sources/sync/ops.broker.test.ts \
  packages/happy-app/sources/utils/brokerWindowGroups.test.ts \
  packages/happy-app/sources/utils/brokerSessionUtils.test.ts
```

Expected:

- broker DTO parsing fails on unknown window fields
- grouping helpers do not exist
- disable/strip/read-only helpers do not exist

- [ ] **Step 3: Implement enriched broker DTO parsing and grouping helpers**

Implementation notes:

1. Extend `brokerDiscoveredSessionSchema` in `happy-app` with:

```ts
windowInstanceId: z.string().min(1).optional(),
windowLabel: z.string().optional(),
workspaceLabel: z.string().optional(),
windowOrdinal: z.number().int().positive().optional(),
isActiveWindow: z.boolean().optional(),
workspacePath: z.string().nullable().optional(),
windowLastActiveAt: z.string().nullable().optional(),
```

Keep them optional so older daemons still parse and the UI can fall back to flat mode.

2. Implement `groupBrokerSessionsByWindow(...)` so it returns either:

```ts
{ mode: 'grouped'; groups: BrokerWindowGroup[] }
```

or:

```ts
{ mode: 'flat'; sessions: BrokerDiscoveredSession[]; upgradeHint: 'brokerWindowGroupingUpgradeRequired' }
```

3. In `brokerSessionUtils.ts`, add helpers for:
   - `isBrokerSessionReadOnly(...)`
   - `getBrokerSessionDisabledReason(...)`
   - `getBrokerSessionStripSummary(...)`
   - `getBrokerWindowHeaderSummary(...)`

- [ ] **Step 4: Add the new attach/strip translation keys**

Add fallback/default/en/zh-Hans strings for:

- grouped window headers: `Active Window`, `N sessions`, `M degraded`, `Unavailable`
- compatibility hints: `Upgrade CLI / bridge to group by VS Code window`
- session strip labels: `Runtime attached`, `Runtime degraded`, `Storage fallback`, `Storage attached`
- read-only copy: `Read-only attach. You can inspect this session, but cannot send messages.`
- not-attachable copy: `Session identity is unstable. Reopen or refresh VS Code before attaching.`

Only add keys that the plan uses directly; do not bulk-translate unrelated broker strings.

- [ ] **Step 5: Re-run the app model tests**

Run:

```bash
npx vitest run \
  packages/happy-app/sources/sync/ops.broker.test.ts \
  packages/happy-app/sources/utils/brokerWindowGroups.test.ts \
  packages/happy-app/sources/utils/brokerSessionUtils.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit the app data-model slice**

```bash
git add \
  packages/happy-app/sources/sync/brokerTypes.ts \
  packages/happy-app/sources/sync/ops.broker.test.ts \
  packages/happy-app/sources/utils/brokerWindowGroups.ts \
  packages/happy-app/sources/utils/brokerWindowGroups.test.ts \
  packages/happy-app/sources/utils/brokerSessionUtils.ts \
  packages/happy-app/sources/utils/brokerSessionUtils.test.ts \
  packages/happy-app/sources/text/_default.ts \
  packages/happy-app/sources/text/translations/en.ts \
  packages/happy-app/sources/text/translations/zh-Hans.ts
git commit -m "feat(app): add broker window grouping models"
```

### Task 4: Render The Grouped Broker Attach List On The Machine Page

**Files:**
- Create: `packages/happy-app/sources/components/BrokerWindowGroupHeader.tsx`
- Modify: `packages/happy-app/sources/app/(app)/machine/[id].tsx`

- [ ] **Step 1: Write the failing machine-page presentation test**

Extend `packages/happy-app/sources/utils/brokerWindowGroups.test.ts` with a machine-page specific case:

```ts
it('sorts grouped sessions by attachability, then provider, then title', () => {
  const result = groupBrokerSessionsByWindow([
    makeSession({ brokerSessionId: 'z-not', provider: 'codex', title: 'Z', attachability: 'not_attachable', windowInstanceId: 'win-a', windowLabel: 'api-repo', workspaceLabel: 'api-repo', windowOrdinal: 1, isActiveWindow: true }),
    makeSession({ brokerSessionId: 'b-degraded', provider: 'codex', title: 'B', attachability: 'attachable_with_degraded_capabilities', windowInstanceId: 'win-a', windowLabel: 'api-repo', workspaceLabel: 'api-repo', windowOrdinal: 1, isActiveWindow: true }),
    makeSession({ brokerSessionId: 'a-attach', provider: 'claude', title: 'A', attachability: 'attachable', windowInstanceId: 'win-a', windowLabel: 'api-repo', workspaceLabel: 'api-repo', windowOrdinal: 1, isActiveWindow: true }),
  ]);

  expect(result.groups[0].sessions.map((session) => session.brokerSessionId)).toEqual([
    'a-attach',
    'b-degraded',
    'z-not',
  ]);
});
```

- [ ] **Step 2: Run the failing grouping test**

Run:

```bash
npx vitest run packages/happy-app/sources/utils/brokerWindowGroups.test.ts
```

Expected: FAIL until the sort order matches the design.

- [ ] **Step 3: Implement the grouped machine-page broker section**

Implementation notes:

1. In `machine/[id].tsx`, stop filtering down to `attachableBrokerSessions`; render all discovered sessions so `not_attachable` rows can stay visible inside the correct window group.
2. Use `groupBrokerSessionsByWindow(brokerSessions)`:
   - if `mode === 'grouped'`, render one `ItemGroup` per window with a custom `BrokerWindowGroupHeader`
   - if `mode === 'flat'`, preserve the existing flat list and show the upgrade hint at the top of the broker section
3. Row behavior:
   - attachable rows keep `onPress={() => handleAttachBroker(session)}`
   - not-attachable/unstable/read-only-disabled rows set `disabled` and show the reason in the subtitle
4. Keep one row per provider session. Same-window Claude/Codex must remain separate list items.

- [ ] **Step 4: Re-run the grouping test and manually sanity-check the render path**

Run:

```bash
npx vitest run packages/happy-app/sources/utils/brokerWindowGroups.test.ts
```

Expected: PASS

Manual sanity check while implementing:

- one active window with Claude + Codex shows one group and two rows
- two same-name windows show disambiguated headers
- old DTOs still render the flat list instead of crashing

- [ ] **Step 5: Commit the machine-page UI slice**

```bash
git add \
  packages/happy-app/sources/components/BrokerWindowGroupHeader.tsx \
  packages/happy-app/sources/app/(app)/machine/[id].tsx \
  packages/happy-app/sources/utils/brokerWindowGroups.ts \
  packages/happy-app/sources/utils/brokerWindowGroups.test.ts
git commit -m "feat(app): group broker attach sessions by vscode window"
```

### Task 5: Add The Attached Session Strip, Details Sheet, And True Read-Only Input Gating

**Files:**
- Create: `packages/happy-app/sources/utils/brokerStripState.ts`
- Create: `packages/happy-app/sources/utils/brokerStripState.test.ts`
- Create: `packages/happy-app/sources/components/BrokerAttachedStrip.tsx`
- Create: `packages/happy-app/sources/components/BrokerAttachedDetailsSheet.tsx`
- Create: `packages/happy-app/sources/components/agentInputReadOnly.test.tsx`
- Modify: `packages/happy-app/sources/components/AgentInput.tsx`
- Modify: `packages/happy-app/sources/components/MultiTextInput.tsx`
- Modify: `packages/happy-app/sources/-session/SessionView.tsx`

- [ ] **Step 1: Write the failing strip-state and read-only component tests**

Create `packages/happy-app/sources/utils/brokerStripState.test.ts`:

```ts
it('auto-collapses the expanded broker banner after 3 seconds with no interaction', async () => {
  vi.useFakeTimers();
  const state = createBrokerStripStateController();
  expect(state.mode).toBe('expanded');
  await vi.advanceTimersByTimeAsync(3_000);
  expect(state.mode).toBe('collapsed');
});
```

```ts
it('collapses once on first assistant delta and does not auto-expand again', () => {
  const state = createBrokerStripStateController();
  state.onAssistantDelta();
  expect(state.mode).toBe('collapsed');
  state.onEnter();
  expect(state.mode).toBe('collapsed');
});
```

Create `packages/happy-app/sources/components/agentInputReadOnly.test.tsx`:

```tsx
it('passes editable=false to the native text input when broker attach is read-only', () => {
  const tree = renderer.create(
    <AgentInput
      value=""
      placeholder="Message"
      onChangeText={() => {}}
      onSend={() => {}}
      autocompletePrefixes={[]}
      autocompleteSuggestions={async () => []}
      agentType="codex"
      isInputDisabled
    />,
  );

  expect(tree.root.findByType(TextInput).props.editable).toBe(false);
});
```

- [ ] **Step 2: Run the failing session-strip tests**

Run:

```bash
npx vitest run \
  packages/happy-app/sources/utils/brokerStripState.test.ts \
  packages/happy-app/sources/components/agentInputReadOnly.test.tsx
```

Expected:

- strip-state tests fail because the controller does not exist
- read-only test fails because `AgentInput` / `MultiTextInput` do not expose a true input-disabled path

- [ ] **Step 3: Implement the strip-state controller and broker strip components**

Implementation notes:

1. `brokerStripState.ts` should own exactly three collapse triggers:
   - timer after 3 seconds
   - first content scroll past 24 px
   - first sent user message or first assistant delta
2. It should expose a simple state machine:

```ts
type BrokerStripMode = 'expanded' | 'collapsed' | 'hidden';
```

3. Render `BrokerAttachedStrip.tsx` directly under the header inside `SessionView` only when:
   - `session.metadata?.sessionSource === 'broker_attached'`
   - `windowInstanceId`, `brokerWindowLabel`, and `brokerWorkspaceLabel` are all present
4. Render `BrokerAttachedDetailsSheet.tsx` from the strip tap action; it only reads attached session metadata and current agent/session state.

- [ ] **Step 4: Enforce read-only attach in the input stack**

Implementation notes:

1. Add `isInputDisabled?: boolean` and `inputDisabledReason?: string` to `AgentInput`.
2. Add `editable?: boolean` to `MultiTextInput` and pass it through to the underlying native `TextInput`.
3. In `SessionView`, compute:

```ts
const brokerReadOnly = isBrokerSessionReadOnly(session.metadata);
const showBrokerStrip = hasBrokerWindowAnchor(session.metadata);
```

4. When `brokerReadOnly` is true:
   - keep the conversation visible
   - show the read-only explanation above the input
   - pass `isInputDisabled` and `isSendDisabled`
   - never re-enable editing until metadata changes
5. When broker metadata is missing the anchor fields, skip the strip/details UI and show the upgrade hint text only.

- [ ] **Step 5: Re-run the strip/read-only tests**

Run:

```bash
npx vitest run \
  packages/happy-app/sources/utils/brokerStripState.test.ts \
  packages/happy-app/sources/components/agentInputReadOnly.test.tsx \
  packages/happy-app/sources/utils/brokerSessionUtils.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit the session-page UI slice**

```bash
git add \
  packages/happy-app/sources/utils/brokerStripState.ts \
  packages/happy-app/sources/utils/brokerStripState.test.ts \
  packages/happy-app/sources/components/BrokerAttachedStrip.tsx \
  packages/happy-app/sources/components/BrokerAttachedDetailsSheet.tsx \
  packages/happy-app/sources/components/agentInputReadOnly.test.tsx \
  packages/happy-app/sources/components/AgentInput.tsx \
  packages/happy-app/sources/components/MultiTextInput.tsx \
  packages/happy-app/sources/-session/SessionView.tsx
git commit -m "feat(app): add broker attached session strip and read-only gating"
```

### Task 6: Cross-Package Verification

**Files:**
- Verify: `packages/happy-vscode-bridge`
- Verify: `packages/happy-cli`
- Verify: `packages/happy-app`

- [ ] **Step 1: Run targeted tests for the broker attach UX**

Run:

```bash
npx vitest run \
  packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts \
  packages/happy-cli/src/broker/brokerSessionCatalog.test.ts \
  packages/happy-cli/src/api/apiMachine.test.ts \
  packages/happy-cli/src/daemon/brokerAttachArgs.test.ts \
  packages/happy-cli/src/broker/runBrokerAttachedSession.test.ts \
  packages/happy-cli/src/broker/BrokerRelayRunner.test.ts \
  packages/happy-app/sources/sync/ops.broker.test.ts \
  packages/happy-app/sources/utils/brokerWindowGroups.test.ts \
  packages/happy-app/sources/utils/brokerSessionUtils.test.ts \
  packages/happy-app/sources/utils/brokerStripState.test.ts \
  packages/happy-app/sources/components/agentInputReadOnly.test.tsx

node packages/happy-vscode-bridge/scripts/runExtensionHostTests.mjs
```

Expected: PASS

- [ ] **Step 2: Run package typechecks**

Run:

```bash
COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck
COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-cli typecheck
COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-app typecheck
```

Expected: every command exits 0.

- [ ] **Step 3: Manual broker UX verification**

Verify these manually against a live local setup:

1. Open two VS Code windows, each with one official live session.
2. Confirm the machine page groups discovered sessions by VS Code window.
3. Confirm a same-window Claude + Codex pair renders as two rows under one group.
4. Attach one row and verify the session strip shows the correct provider + window/workspace.
5. If one attach target is `read_only_attach`, verify the input becomes non-editable and the explanation text appears.
6. Re-open the attached session from recents and confirm the strip still renders without requiring another machine discover.

- [ ] **Step 4: Commit any verification-driven fixes**

If the verification steps above required follow-up code changes, commit them now. If verification passed without additional edits, skip this step.
