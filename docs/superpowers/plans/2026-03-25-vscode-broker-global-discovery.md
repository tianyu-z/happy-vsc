# VS Code Broker Global Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-machine, multi-window VS Code broker discovery so Happy can show a single global active list of attachable Claude/Codex live sessions and map an attach into a stable Happy wrapper session.

**Architecture:** Extend the existing companion-broker direction with a machine-scoped broker inventory summary. Each `happy-vscode-bridge` instance writes its own manifest and heartbeat from the workspace extension host; `happy-cli` scans those manifests, projects a deduplicated broker inventory into encrypted `daemonState`, exposes attach/debug RPCs, and runs broker-attached wrapper sessions. `happy-app` reads all machines' broker inventory summaries, flattens them into a global “Live Sessions” view, and attaches into wrapper sessions instead of treating discoverable broker sessions as native Happy sessions.

**Tech Stack:** TypeScript, VS Code extension host APIs, `ws`, Zod, Vitest, Expo Router, existing Happy machine/session sync stack, encrypted daemon state.

---

## Scope Note

This plan extends and partially supersedes [2026-03-23-vscode-companion-broker.md](/home/work/happy-vsc/docs/superpowers/plans/2026-03-23-vscode-companion-broker.md) for the multi-machine, multi-instance, global-discovery path approved in [2026-03-25-vscode-broker-global-discovery-design.md](/home/work/happy-vsc/docs/superpowers/specs/2026-03-25-vscode-broker-global-discovery-design.md).

The implementation should still reuse any valid groundwork from the earlier plan, but the resource model in this document is authoritative for:

- `machine -> bridgeInstance -> brokerSession`
- per-instance manifests and heartbeats
- machine-scoped broker inventory summaries
- app-level global active list
- broker-attached wrapper sessions

## File Map

### Root workspace

- Modify: `package.json`
  Add `packages/happy-vscode-bridge` to Yarn workspaces.

### New package: `packages/happy-vscode-bridge`

- Create: `packages/happy-vscode-bridge/package.json`
- Create: `packages/happy-vscode-bridge/tsconfig.json`
- Create: `packages/happy-vscode-bridge/src/extension.ts`
- Create: `packages/happy-vscode-bridge/src/extension.test.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BridgeInstanceIdentity.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BridgeInstanceIdentity.test.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts`
- Create: `packages/happy-vscode-bridge/src/broker/HeartbeatService.ts`
- Create: `packages/happy-vscode-bridge/src/broker/HeartbeatService.test.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerServer.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts`
- Create: `packages/happy-vscode-bridge/src/broker/rpc.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/runtimeLabel.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/runtimeLabel.test.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/ipAddress.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/ipAddress.test.ts`
- Create: `packages/happy-vscode-bridge/src/providers/types.ts`
- Create: `packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.ts`
- Create: `packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts`
- Create: `packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.ts`
- Create: `packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.ts`

### Shared wire

- Create: `packages/happy-wire/src/brokerProtocol.ts`
- Create: `packages/happy-wire/src/brokerProtocol.test.ts`
- Modify: `packages/happy-wire/src/index.ts`

### CLI / daemon

- Create: `packages/happy-cli/src/broker/brokerManifest.ts`
- Create: `packages/happy-cli/src/broker/brokerManifest.test.ts`
- Create: `packages/happy-cli/src/broker/BrokerInventoryManager.ts`
- Create: `packages/happy-cli/src/broker/BrokerInventoryManager.test.ts`
- Create: `packages/happy-cli/src/broker/BrokerClient.ts`
- Create: `packages/happy-cli/src/broker/BrokerClient.test.ts`
- Create: `packages/happy-cli/src/broker/BrokerAttachedSessionRunner.ts`
- Create: `packages/happy-cli/src/broker/BrokerAttachedSessionRunner.test.ts`
- Modify: `packages/happy-cli/src/api/types.ts`
- Modify: `packages/happy-cli/src/api/apiMachine.ts`
- Modify: `packages/happy-cli/src/daemon/run.ts`
- Modify: `packages/happy-cli/src/index.ts`
- Modify: `packages/happy-cli/src/utils/createSessionMetadata.ts`

### App

- Modify: `packages/happy-app/sources/sync/storageTypes.ts`
- Modify: `packages/happy-app/sources/sync/ops.ts`
- Create: `packages/happy-app/sources/sync/ops.broker.test.ts`
- Create: `packages/happy-app/sources/utils/brokerSessionUtils.ts`
- Create: `packages/happy-app/sources/utils/brokerSessionUtils.test.ts`
- Create: `packages/happy-app/sources/app/(app)/session/live.tsx`
- Modify: `packages/happy-app/sources/app/(app)/_layout.tsx`
- Modify: `packages/happy-app/sources/app/(app)/machine/[id].tsx`
- Modify: `packages/happy-app/sources/-session/SessionView.tsx`
- Modify: `packages/happy-app/sources/app/(app)/session/[id]/info.tsx`
- Modify: `packages/happy-app/sources/text/_default.ts`
- Modify: `packages/happy-app/sources/text/translations/en.ts`

### Explicitly out of scope for MVP

- No planned file changes in `packages/happy-server/**`.
  Rationale: machine metadata/daemon state already sync as encrypted opaque blobs; use that existing path first.

## Task 1: Scaffold The Bridge Workspace And Shared Wire

**Files:**
- Modify: `package.json`
- Create: `packages/happy-vscode-bridge/package.json`
- Create: `packages/happy-vscode-bridge/tsconfig.json`
- Create: `packages/happy-vscode-bridge/src/extension.ts`
- Create: `packages/happy-vscode-bridge/src/extension.test.ts`
- Create: `packages/happy-wire/src/brokerProtocol.ts`
- Create: `packages/happy-wire/src/brokerProtocol.test.ts`
- Modify: `packages/happy-wire/src/index.ts`

- [ ] **Step 1: Write failing tests for the bridge entrypoint and broker wire schemas**

```ts
import { describe, expect, it } from 'vitest';
import { activate, deactivate } from './extension';

describe('bridge extension entrypoint', () => {
  it('exports lifecycle hooks', () => {
    expect(typeof activate).toBe('function');
    expect(typeof deactivate).toBe('function');
  });
});
```

```ts
import { describe, expect, it } from 'vitest';
import {
  brokerInstanceManifestSchema,
  brokerInventorySummarySchema,
} from './brokerProtocol';

describe('broker protocol', () => {
  it('parses an inventory summary', () => {
    expect(
      brokerInventorySummarySchema.parse({
        updatedAt: Date.now(),
        instances: [],
        sessions: [],
      }).sessions,
    ).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the new tests and verify they fail because the workspace and schemas do not exist**

Run: `npx vitest run packages/happy-vscode-bridge/src/extension.test.ts packages/happy-wire/src/brokerProtocol.test.ts`
Expected: FAIL with missing file/module errors.

- [ ] **Step 3: Add the workspace package and the first-pass broker protocol types**

```ts
export const brokerRuntimeKindSchema = z.enum([
  'local',
  'wsl',
  'ssh',
  'dev-container',
  'codespace',
  'tunnel',
  'unknown',
]);

export const brokerInstanceManifestSchema = z.object({
  installationId: z.string(),
  instanceId: z.string(),
  logicalWindowKey: z.string(),
  editorSessionId: z.string().optional(),
  machineId: z.string().optional(),
  windowLabel: z.string(),
  workspaceFolders: z.array(z.string()),
  runtimeKind: brokerRuntimeKindSchema,
  runtimeLabel: z.string(),
  bridgeHostIps: z.array(z.string()),
  preferredHostIp: z.string().optional(),
  runtimeIp: z.string().optional(),
  providerKinds: z.array(z.enum(['claude', 'codex'])),
  brokerEndpoint: z.string(),
  brokerAuthToken: z.string(),
  pid: z.number(),
  startedAt: z.number(),
  lastHeartbeatAt: z.number(),
  ttlMs: z.number(),
});
```

- [ ] **Step 4: Re-run the focused tests and verify they pass**

Run: `npx vitest run packages/happy-vscode-bridge/src/extension.test.ts packages/happy-wire/src/brokerProtocol.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the two workspaces**

Run: `yarn --cwd packages/happy-wire typecheck`
Expected: exits `0`.

Run: `yarn --cwd packages/happy-vscode-bridge typecheck`
Expected: exits `0`.

- [ ] **Step 6: Commit the scaffold and shared schemas**

```bash
git add package.json packages/happy-vscode-bridge packages/happy-wire/src
git commit -m "feat: scaffold vscode bridge workspace and broker schemas"
```

## Task 2: Implement Bridge Instance Identity, Runtime Labels, IP Detection, And Manifest Heartbeats

**Files:**
- Create: `packages/happy-vscode-bridge/src/broker/BridgeInstanceIdentity.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BridgeInstanceIdentity.test.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts`
- Create: `packages/happy-vscode-bridge/src/broker/HeartbeatService.ts`
- Create: `packages/happy-vscode-bridge/src/broker/HeartbeatService.test.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/runtimeLabel.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/runtimeLabel.test.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/ipAddress.ts`
- Create: `packages/happy-vscode-bridge/src/runtime/ipAddress.test.ts`
- Modify: `packages/happy-vscode-bridge/src/extension.ts`

- [ ] **Step 1: Write failing tests for stable identity derivation, runtime labeling, and heartbeat refresh**

```ts
it('creates a fresh instanceId but stable logicalWindowKey for the same workspace', async () => {
  const first = buildBridgeInstanceIdentity({
    remoteName: 'ssh-remote',
    workspaceFolders: ['/workspace/app'],
    extensionKind: 'workspace',
    editorSessionId: 'editor-a',
  });
  const second = buildBridgeInstanceIdentity({
    remoteName: 'ssh-remote',
    workspaceFolders: ['/workspace/app'],
    extensionKind: 'workspace',
    editorSessionId: 'editor-b',
  });

  expect(first.instanceId).not.toBe(second.instanceId);
  expect(first.logicalWindowKey).toBe(second.logicalWindowKey);
});
```

- [ ] **Step 2: Run the bridge unit tests and verify they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/broker/BridgeInstanceIdentity.test.ts packages/happy-vscode-bridge/src/runtime/runtimeLabel.test.ts packages/happy-vscode-bridge/src/broker/HeartbeatService.test.ts`
Expected: FAIL because the modules are not implemented yet.

- [ ] **Step 3: Implement identity creation, manifest persistence, and heartbeat**

```ts
export function buildBridgeInstanceIdentity(input: {
  remoteName?: string;
  workspaceFolders: string[];
  extensionKind: 'workspace' | 'ui';
  editorSessionId?: string;
}) {
  const logicalWindowKey = createHash('sha256')
    .update(JSON.stringify([
      input.remoteName ?? 'local',
      input.workspaceFolders,
      input.extensionKind,
    ]))
    .digest('hex');

  return {
    installationId: loadOrCreateInstallationId(),
    instanceId: randomUUID(),
    logicalWindowKey,
    editorSessionId: input.editorSessionId,
  };
}
```

- [ ] **Step 4: Wire the extension entrypoint to create an identity, write the manifest, and start heartbeat updates**

Run: `npx vitest run packages/happy-vscode-bridge/src/extension.test.ts packages/happy-vscode-bridge/src/broker/BridgeInstanceIdentity.test.ts packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts packages/happy-vscode-bridge/src/broker/HeartbeatService.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the bridge package**

Run: `yarn --cwd packages/happy-vscode-bridge typecheck`
Expected: exits `0`.

- [ ] **Step 6: Commit the identity and heartbeat layer**

```bash
git add packages/happy-vscode-bridge/src
git commit -m "feat(bridge): add instance identity and manifest heartbeat"
```

## Task 3: Add Broker Discovery, Per-Instance Snapshots, And Attach RPCs In The Bridge

**Files:**
- Create: `packages/happy-vscode-bridge/src/providers/types.ts`
- Create: `packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.ts`
- Create: `packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts`
- Create: `packages/happy-vscode-bridge/src/providers/claude/ClaudeAdapter.ts`
- Create: `packages/happy-vscode-bridge/src/providers/codex/CodexAdapter.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerServer.ts`
- Create: `packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts`
- Create: `packages/happy-vscode-bridge/src/broker/rpc.ts`
- Modify: `packages/happy-vscode-bridge/src/extension.ts`

- [ ] **Step 1: Write failing tests for per-instance discovery and attach RPC handling**

```ts
it('returns a broker inventory snapshot for the current instance', async () => {
  const server = new BrokerServer({
    instanceId: 'inst-1',
    providerHost: fakeProviderHost({
      sessions: [{ brokerSessionId: 'sess-1', provider: 'codex', title: 'app', attachability: 'attachable', capabilities: ['send'], degradedFlags: [] }],
    }),
  });

  await expect(server.handleRpc('discover', {})).resolves.toMatchObject({
    instance: { instanceId: 'inst-1' },
    sessions: [{ brokerSessionId: 'sess-1' }],
  });
});
```

- [ ] **Step 2: Run the focused bridge server/provider tests and verify they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts`
Expected: FAIL because the provider host and broker RPC layer are missing.

- [ ] **Step 3: Implement the provider adapter contracts and broker RPC surface**

```ts
export interface ProviderAdapter {
  provider: 'claude' | 'codex';
  discover(): Promise<BrokerDiscoveredSession[]>;
  attach(input: { brokerSessionId: string }): Promise<AttachedBrokerHandle>;
}

export const brokerRpcRequestSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('discover'), params: z.object({}) }),
  z.object({ method: z.literal('attach'), params: z.object({ brokerSessionId: z.string() }) }),
]);
```

- [ ] **Step 4: Expose `discover` and `attach` from the extension entrypoint server**

Run: `npx vitest run packages/happy-vscode-bridge/src/providers/ProviderAdapterHost.test.ts packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the bridge package**

Run: `yarn --cwd packages/happy-vscode-bridge typecheck`
Expected: exits `0`.

- [ ] **Step 6: Commit the bridge discovery and attach layer**

```bash
git add packages/happy-vscode-bridge/src
git commit -m "feat(bridge): expose broker discovery and attach rpc"
```

## Task 4: Build CLI Manifest Scanning, Inventory Projection, And Machine RPCs

**Files:**
- Create: `packages/happy-cli/src/broker/brokerManifest.ts`
- Create: `packages/happy-cli/src/broker/brokerManifest.test.ts`
- Create: `packages/happy-cli/src/broker/BrokerInventoryManager.ts`
- Create: `packages/happy-cli/src/broker/BrokerInventoryManager.test.ts`
- Create: `packages/happy-cli/src/broker/BrokerClient.ts`
- Create: `packages/happy-cli/src/broker/BrokerClient.test.ts`
- Modify: `packages/happy-cli/src/api/types.ts`
- Modify: `packages/happy-cli/src/api/apiMachine.ts`
- Modify: `packages/happy-cli/src/daemon/run.ts`
- Modify: `packages/happy-cli/src/index.ts`

- [ ] **Step 1: Write failing tests for manifest scanning, stale filtering, and shadowed instance dedupe**

```ts
it('drops stale manifests and keeps the freshest instance per logicalWindowKey', async () => {
  const manager = new BrokerInventoryManager({ now: () => 10_000 });
  manager.loadManifests([
    { instanceId: 'old', logicalWindowKey: 'workspace-1', lastHeartbeatAt: 1_000, ttlMs: 2_000 },
    { instanceId: 'new', logicalWindowKey: 'workspace-1', lastHeartbeatAt: 9_500, ttlMs: 2_000 },
  ] as any);

  const summary = await manager.buildSummary();
  expect(summary.instances).toHaveLength(1);
  expect(summary.instances[0]?.instanceId).toBe('new');
});
```

- [ ] **Step 2: Run the CLI broker tests and verify they fail**

Run: `npx vitest run packages/happy-cli/src/broker/brokerManifest.test.ts packages/happy-cli/src/broker/BrokerInventoryManager.test.ts packages/happy-cli/src/broker/BrokerClient.test.ts`
Expected: FAIL because the broker inventory layer does not exist.

- [ ] **Step 3: Extend CLI machine daemon state types with a typed broker inventory summary**

```ts
export const BrokerInventorySummarySchema = z.object({
  updatedAt: z.number(),
  instances: z.array(BrokerInventoryInstanceSchema),
  sessions: z.array(BrokerInventorySessionSchema),
});

export const DaemonStateSchema = z.object({
  status: z.union([z.enum(['running', 'shutting-down']), z.string()]),
  pid: z.number().optional(),
  httpPort: z.number().optional(),
  startedAt: z.number().optional(),
  brokerInventory: BrokerInventorySummarySchema.optional(),
});
```

- [ ] **Step 4: Add `BrokerInventoryManager` to daemon startup and refresh machine daemon state when broker inventory changes**

Run: `npx vitest run packages/happy-cli/src/broker/brokerManifest.test.ts packages/happy-cli/src/broker/BrokerInventoryManager.test.ts packages/happy-cli/src/broker/BrokerClient.test.ts`
Expected: PASS.

- [ ] **Step 5: Register machine RPCs for broker listing, inspection, and attach initiation**

Run: `yarn --cwd packages/happy-cli typecheck`
Expected: exits `0`.

- [ ] **Step 6: Commit the CLI inventory and machine RPC layer**

```bash
git add packages/happy-cli/src
git commit -m "feat(cli): project broker inventory into machine state"
```

## Task 5: Implement Broker-Attached Wrapper Sessions And Stable Metadata

**Files:**
- Create: `packages/happy-cli/src/broker/BrokerAttachedSessionRunner.ts`
- Create: `packages/happy-cli/src/broker/BrokerAttachedSessionRunner.test.ts`
- Modify: `packages/happy-cli/src/utils/createSessionMetadata.ts`
- Modify: `packages/happy-cli/src/api/apiMachine.ts`
- Modify: `packages/happy-cli/src/daemon/run.ts`

- [ ] **Step 1: Write failing tests for stable wrapper tags and broker transport metadata**

```ts
it('uses a stable tag for the same broker session', () => {
  expect(buildBrokerWrapperTag({
    machineId: 'mach-1',
    canonicalSessionKey: 'mach-1:inst-1:sess-1',
  })).toBe('vscode-broker:mach-1:mach-1:inst-1:sess-1');
});
```

```ts
it('marks wrapper metadata as vscode-broker transport', () => {
  const { metadata } = createSessionMetadata({
    flavor: 'codex',
    machineId: 'mach-1',
    startedBy: 'daemon',
    transport: {
      kind: 'vscode-broker',
      brokerInstanceId: 'inst-1',
      brokerSessionId: 'sess-1',
      canonicalBrokerSessionKey: 'mach-1:inst-1:sess-1',
    },
  });

  expect(metadata.transportKind).toBe('vscode-broker');
});
```

- [ ] **Step 2: Run the wrapper-session tests and verify they fail**

Run: `npx vitest run packages/happy-cli/src/broker/BrokerAttachedSessionRunner.test.ts`
Expected: FAIL because the runner and transport metadata do not exist.

- [ ] **Step 3: Extend `createSessionMetadata` so daemon-spawned wrapper sessions can carry broker transport metadata**

```ts
export interface CreateSessionMetadataOptions {
  flavor: BackendFlavor;
  machineId: string;
  startedBy?: 'daemon' | 'terminal';
  transport?: {
    kind: 'vscode-broker';
    brokerMachineId?: string;
    brokerInstanceId: string;
    brokerSessionId: string;
    canonicalBrokerSessionKey: string;
    runtimeKind?: string;
    runtimeLabel?: string;
    windowLabel?: string;
    preferredHostIp?: string;
  };
}
```

- [ ] **Step 4: Implement `BrokerAttachedSessionRunner` so `broker-attach-session` creates or reuses a wrapper session tag and forwards broker events/messages**

Run: `npx vitest run packages/happy-cli/src/broker/BrokerAttachedSessionRunner.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the CLI package**

Run: `yarn --cwd packages/happy-cli typecheck`
Expected: exits `0`.

- [ ] **Step 6: Commit the wrapper-session attach flow**

```bash
git add packages/happy-cli/src/utils/createSessionMetadata.ts packages/happy-cli/src/broker packages/happy-cli/src/api/apiMachine.ts packages/happy-cli/src/daemon/run.ts
git commit -m "feat(cli): attach broker sessions into wrapper happy sessions"
```

## Task 6: Add App-Side Broker Inventory Types, Flattening Utilities, And Attach Ops

**Files:**
- Modify: `packages/happy-app/sources/sync/storageTypes.ts`
- Modify: `packages/happy-app/sources/sync/ops.ts`
- Create: `packages/happy-app/sources/sync/ops.broker.test.ts`
- Create: `packages/happy-app/sources/utils/brokerSessionUtils.ts`
- Create: `packages/happy-app/sources/utils/brokerSessionUtils.test.ts`

- [ ] **Step 1: Write failing tests for flattening multi-machine inventories into a global active list**

```ts
it('flattens broker inventory across machines into a single active list', () => {
  const sessions = flattenBrokerSessions([
    {
      id: 'mach-1',
      metadata: { host: 'gpu-1', platform: 'linux', happyCliVersion: 'x', happyHomeDir: '~/.happy', homeDir: '/home/me' },
      daemonState: {
        brokerInventory: {
          updatedAt: 1,
          instances: [{ instanceId: 'inst-1', logicalWindowKey: 'win-1', windowLabel: 'api', runtimeKind: 'ssh', runtimeLabel: 'ssh:gpu-1', bridgeHostIps: ['10.0.0.2'], preferredHostIp: '10.0.0.2', lastSeenAt: 1, status: 'online' }],
          sessions: [{ canonicalSessionKey: 'mach-1:inst-1:sess-1', instanceId: 'inst-1', brokerSessionId: 'sess-1', provider: 'codex', title: 'Fix API', attachability: 'attachable', capabilities: ['send'], degradedFlags: [], lastActiveAt: 2 }],
        },
      },
    } as any,
  ]);

  expect(sessions[0]?.canonicalSessionKey).toBe('mach-1:inst-1:sess-1');
});
```

- [ ] **Step 2: Run the app broker utility tests and verify they fail**

Run: `npx vitest run packages/happy-app/sources/utils/brokerSessionUtils.test.ts packages/happy-app/sources/sync/ops.broker.test.ts`
Expected: FAIL because broker utilities and ops do not exist.

- [ ] **Step 3: Add typed broker inventory fields to `Machine.daemonState` and implement app-side flatten/filter helpers**

```ts
export const BrokerInventoryInstanceSchema = z.object({
  instanceId: z.string(),
  logicalWindowKey: z.string(),
  windowLabel: z.string(),
  runtimeKind: z.string(),
  runtimeLabel: z.string(),
  bridgeHostIps: z.array(z.string()),
  preferredHostIp: z.string().optional(),
  runtimeIp: z.string().optional(),
  lastSeenAt: z.number(),
  status: z.enum(['online', 'stale', 'shadowed']),
});
```

- [ ] **Step 4: Add app ops for `brokerAttachSession`, `brokerListLiveSessions`, and `brokerInspectInstance`**

Run: `npx vitest run packages/happy-app/sources/utils/brokerSessionUtils.test.ts packages/happy-app/sources/sync/ops.broker.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the app package**

Run: `yarn --cwd packages/happy-app typecheck`
Expected: exits `0`.

- [ ] **Step 6: Commit the app broker data layer**

```bash
git add packages/happy-app/sources/sync/storageTypes.ts packages/happy-app/sources/sync/ops.ts packages/happy-app/sources/sync/ops.broker.test.ts packages/happy-app/sources/utils/brokerSessionUtils.ts packages/happy-app/sources/utils/brokerSessionUtils.test.ts
git commit -m "feat(app): add broker inventory flattening and attach ops"
```

## Task 7: Build The Global Live Sessions Screen And Broker-Aware Session UI

**Files:**
- Create: `packages/happy-app/sources/app/(app)/session/live.tsx`
- Modify: `packages/happy-app/sources/app/(app)/_layout.tsx`
- Modify: `packages/happy-app/sources/app/(app)/machine/[id].tsx`
- Modify: `packages/happy-app/sources/-session/SessionView.tsx`
- Modify: `packages/happy-app/sources/app/(app)/session/[id]/info.tsx`
- Modify: `packages/happy-app/sources/text/_default.ts`
- Modify: `packages/happy-app/sources/text/translations/en.ts`

- [ ] **Step 1: Write failing UI tests or render helpers for the global live-session row model**

```ts
it('formats the live session subtitle as runtime, machine, window, and ip', () => {
  expect(formatBrokerRowSubtitle({
    runtimeLabel: 'ssh:gpu-1',
    machineLabel: 'gpu-1',
    windowLabel: 'api',
    preferredHostIp: '10.0.0.2',
  })).toContain('10.0.0.2');
});
```

- [ ] **Step 2: Create the `session/live` route and add it to the app stack**

Run: `yarn --cwd packages/happy-app typecheck`
Expected: FAIL until the route imports and translation keys are satisfied.

- [ ] **Step 3: Implement the global “Live Sessions” screen using flattened machine inventories**

```tsx
const liveSessions = useMemo(
  () => flattenBrokerSessions(machines).filter((item) => item.attachability !== 'not_attachable'),
  [machines],
);
```

- [ ] **Step 4: Add broker-specific session badges and info rows to `SessionView` and `session/[id]/info.tsx`**

Run: `yarn --cwd packages/happy-app typecheck`
Expected: exits `0`.

- [ ] **Step 5: Add machine debug rows for broker inventory summaries**

Run: `npx vitest run packages/happy-app/sources/utils/brokerSessionUtils.test.ts packages/happy-app/sources/sync/ops.broker.test.ts`
Expected: PASS with the UI route compiling cleanly.

- [ ] **Step 6: Commit the app UI**

```bash
git add packages/happy-app/sources/app/(app)/session/live.tsx packages/happy-app/sources/app/(app)/_layout.tsx packages/happy-app/sources/app/(app)/machine/[id].tsx packages/happy-app/sources/-session/SessionView.tsx packages/happy-app/sources/app/(app)/session/[id]/info.tsx packages/happy-app/sources/text/_default.ts packages/happy-app/sources/text/translations/en.ts
git commit -m "feat(app): add global live sessions screen"
```

## Task 8: End-To-End Verification And Rollout Guardrails

**Files:**
- Modify: `packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts`
- Modify: `packages/happy-cli/src/broker/BrokerInventoryManager.test.ts`
- Modify: `packages/happy-cli/src/broker/BrokerAttachedSessionRunner.test.ts`
- Modify: `packages/happy-app/sources/sync/ops.broker.test.ts`
- Modify: `packages/happy-app/sources/utils/brokerSessionUtils.test.ts`

- [ ] **Step 1: Add regression tests for stale manifests, shadowed instances, and disappearing broker sessions**

```ts
it('returns session_not_found when a broker session disappears before attach', async () => {
  await expect(runner.attach({
    canonicalSessionKey: 'mach-1:inst-1:sess-missing',
    instanceId: 'inst-1',
    brokerSessionId: 'sess-missing',
  })).rejects.toThrow('session_not_found');
});
```

- [ ] **Step 2: Add verification for wrapper-session tag reuse across repeated attach calls**

Run: `npx vitest run packages/happy-cli/src/broker/BrokerAttachedSessionRunner.test.ts`
Expected: PASS and repeated attaches reuse the same wrapper tag.

- [ ] **Step 3: Run focused broker tests across all touched workspaces**

Run: `npx vitest run packages/happy-wire/src/brokerProtocol.test.ts packages/happy-vscode-bridge/src/**/*.test.ts packages/happy-cli/src/broker/*.test.ts packages/happy-app/sources/utils/brokerSessionUtils.test.ts packages/happy-app/sources/sync/ops.broker.test.ts`
Expected: PASS.

- [ ] **Step 4: Run package typechecks**

Run: `yarn --cwd packages/happy-wire typecheck && yarn --cwd packages/happy-vscode-bridge typecheck && yarn --cwd packages/happy-cli typecheck && yarn --cwd packages/happy-app typecheck`
Expected: all exit `0`.

- [ ] **Step 5: Perform a manual smoke test on two machines**

Checklist:
- Open two machines with distinct `happy-vscode-bridge` instances.
- Ensure app shows both in the global list.
- Attach to one session and verify a wrapper session opens.
- Restart one VS Code window and confirm the stale instance disappears and the fresh instance replaces it.

- [ ] **Step 6: Commit verification fixes**

```bash
git add packages/happy-vscode-bridge packages/happy-cli/src/broker packages/happy-app/sources
git commit -m "test: verify broker global discovery and attach flow"
```

## Notes For Execution

- Keep broker inventory and wrapper sessions separate. Do not shortcut by pretending discoverable broker sessions are native Happy sessions.
- Do not use IP fields for identity or attach routing. They are display/debug fields only.
- Reuse the encrypted `daemonState` path before considering any server resource changes.
- When touching existing session UI, gate broker-specific behavior off `transportKind === "vscode-broker"` so normal Happy sessions do not regress.
