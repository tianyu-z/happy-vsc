# Ext-Host Shared Registration Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Patch the real cross-extension webview registration seam inside the VS Code extension host, so Happy can capture Claude/Codex provider instances without relying on per-extension `vscode.window` objects.

**Architecture:** Treat the current failure as a root-cause problem, not a timing problem. The public `window.registerWebviewViewProvider(...)` API is per-extension, but its implementation delegates into one shared ext-host registrar. The plan is to locate that shared registrar reflectively, patch its instance or prototype once, and feed registrations into the existing provider capture registry. If the shared registrar cannot be proven reachable from extension code, stop and fall back to the existing API-dispatch interception plan instead of layering more heuristics onto the current patch.

**Tech Stack:** TypeScript, VS Code extension host runtime, Node reflection, Vitest.

---

## Root Cause Summary

- Current capture fails because Happy patches only its own `vscode` API host plus one locally resolved host object.
- Static evidence from `/home/work/.vscode-server/bin/07ff9d6178ede9a1bd12ad3399074d726ebe6e43/out/vs/workbench/api/node/extensionHostProcess.js` shows two separate facts:
- `oO.load(...)` manufactures per-extension `vscode` API objects, so `require('vscode')` is not a single shared export.
- The public window API delegates registrations into one shared registrar method: `M.registerWebviewViewProvider(k, ...)`, backed by the ext-host webview views service (`nk.registerWebviewViewProvider(...)` in the built file).
- That means the true shared seam is the registrar service, not Happy’s local `window` object.
- Activation order is already ruled out by diagnostics and `remoteexthost.log`: Happy activates before Claude in the failing repro, but capture still reports `captured=no`.

## Scope

- In scope:
- Reflectively locate the shared registrar used by `window.registerWebviewViewProvider` and `window.registerCustomEditorProvider`.
- Patch the shared instance or prototype exactly once.
- Extend diagnostics so they prove whether the shared hook was installed, where it landed, and whether it observed target registrations.
- Keep current degraded behavior intact if the shared hook is unavailable.
- Out of scope:
- Editing VS Code’s shipped `extensionHostProcess.js`.
- Patching unrelated globals like `Function.prototype` or `Object.prototype`.
- Claiming Claude interrupt/approval support from this work alone.

## File Structure

- Create: `packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.ts`
  Responsibility: locate the shared ext-host webview registrar, patch/unpatch its registration methods, and expose diagnostics about discovery and hook installation.
- Modify: `packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.ts`
  Responsibility: keep provider/view-type capture rules and expose a reusable capture entrypoint invoked by the shared registrar hook.
- Modify: `packages/happy-vscode-bridge/src/runtime/types.ts`
  Responsibility: extend runtime capture diagnostics with shared-hook state, target kind, and failure reason.
- Modify: `packages/happy-vscode-bridge/src/extension.ts`
  Responsibility: install the shared registrar hook before eager provider activation and dispose it on shutdown.
- Modify: `packages/happy-vscode-bridge/src/ui/BridgeCommands.ts`
  Responsibility: surface the new shared-hook diagnostics in `Diagnose Providers`.
- Test: `packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.test.ts`
  Responsibility: prove locator and hook behavior against fake ext-host registrar shapes.
- Modify/Test: `packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts`
  Responsibility: verify shared-hook callbacks still capture Claude/Codex providers correctly.
- Modify/Test: `packages/happy-vscode-bridge/src/extension.test.ts`
  Responsibility: assert shared-hook installation happens before eager provider activation.
- Modify/Test: `packages/happy-vscode-bridge/src/ui/ui.test.ts`
  Responsibility: assert diagnostics render the new shared-hook evidence.

### Task 1: Prove the Shared Registrar Shape in Tests

**Files:**
- Create: `packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.test.ts`
- Modify: `packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts`

- [ ] **Step 1: Write failing tests for reflective discovery**

```ts
it('locates a shared registrar behind two per-extension window APIs', () => {
  const fixture = createSharedRegistrarFixture();

  const located = locateSharedWebviewRegistrar({
    vscodeHost: fixture.happyApi,
    functionSource: fixture.happyApi.window.registerWebviewViewProvider?.toString(),
    candidates: fixture.candidates,
  });

  expect(located?.targetKind).toBe('instance');
  expect(located?.registerWebviewViewProvider).toBe(fixture.sharedRegistrar.registerWebviewViewProvider);
});
```

```ts
it('captures Claude and Codex when the shared registrar is patched once', () => {
  const fixture = createSharedRegistrarFixture();
  const capture = createProviderRuntimeCaptureRegistry();

  const hook = installExtHostSharedRegistrationCapture({
    vscodeHost: fixture.happyApi,
    capture,
    candidates: fixture.candidates,
  });

  fixture.claudeApi.window.registerWebviewViewProvider?.('claudeVSCodeSidebar', claudeProvider);
  fixture.codexApi.window.registerWebviewViewProvider?.('chatgpt.sidebarView', codexProvider);

  expect(capture.getCapturedProvider('claude')).toBe(claudeProvider);
  expect(capture.getCapturedProvider('codex')).toBe(codexProvider);
  expect(hook.diagnostics.installed).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.test.ts packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts`
Expected: FAIL because the shared registrar locator/hook does not exist yet.

- [ ] **Step 3: Implement the shared-registrar locator**

Implementation notes:
- Prefer explicit discovery helpers over magic one-off probing.
- Support two targets only:
- instance method patch
- prototype method patch
- Record a structured failure reason when discovery fails:
- `no_candidate_found`
- `method_shape_mismatch`
- `unsafe_patch_target`
- Do not mutate anything during pure discovery.

- [ ] **Step 4: Re-run the focused tests**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.test.ts packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.ts \
  packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.test.ts \
  packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts
git commit -m "test: prove ext-host shared registrar discovery"
```

### Task 2: Patch the Shared Registrar Once

**Files:**
- Create: `packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.ts`
- Modify: `packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.ts`

- [ ] **Step 1: Write failing tests for registration interception**

```ts
expect(hook.diagnostics.installed).toBe(true);
expect(hook.diagnostics.targetKind).toBe('instance');

fixture.claudeApi.window.registerWebviewViewProvider?.('claudeVSCodeSidebar', provider);

expect(capture.getCaptureDiagnostic('claude')).toEqual(
  expect.objectContaining({
    captured: true,
    capturePath: 'shared_ext_host_instance',
  }),
);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.test.ts`
Expected: FAIL because no shared interception is wired yet.

- [ ] **Step 3: Implement the hook**

Suggested shape:

```ts
export function installExtHostSharedRegistrationCapture(options: InstallOptions): Disposable & {
  diagnostics: ExtHostSharedRegistrationDiagnostic;
}
```

Implementation notes:
- Patch both `registerWebviewViewProvider` and `registerCustomEditorProvider` when present.
- Delegate to the original method transparently.
- Reuse the existing Claude/Codex view-type matcher from `ProviderRuntimeCapture.ts`.
- Guard against double-install with a symbol or weak set.
- Dispose by restoring the original method(s).
- If discovery fails, return `installed: false` and preserve current behavior.

- [ ] **Step 4: Re-run the focused tests**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.test.ts packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.ts \
  packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.ts \
  packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.test.ts \
  packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts
git commit -m "feat: patch ext-host shared webview registrar"
```

### Task 3: Install the Shared Hook Before Provider Activation

**Files:**
- Modify: `packages/happy-vscode-bridge/src/extension.ts`
- Modify: `packages/happy-vscode-bridge/src/extension.test.ts`

- [ ] **Step 1: Write a failing activation-order test**

```ts
it('installs shared registrar capture before eager provider activation', async () => {
  const order: string[] = [];

  await activate(context, {
    installSharedCapture: () => {
      order.push('capture');
      return fakeDisposable;
    },
    eagerlyActivateProviders: async () => {
      order.push('providers');
    },
  });

  expect(order).toEqual(['capture', 'providers']);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npx vitest run packages/happy-vscode-bridge/src/extension.test.ts`
Expected: FAIL because activation does not expose or assert the new order yet.

- [ ] **Step 3: Wire the hook into activation**

Implementation notes:
- Install shared capture immediately after `loadVscodeHost()`.
- Keep existing local provider capture registry, but let the shared hook feed into it.
- Dispose the shared hook on extension shutdown.
- Do not delete current degraded storage/runtime paths in this task.

- [ ] **Step 4: Re-run the focused test**

Run: `npx vitest run packages/happy-vscode-bridge/src/extension.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/happy-vscode-bridge/src/extension.ts \
  packages/happy-vscode-bridge/src/extension.test.ts
git commit -m "refactor: install shared capture before provider activation"
```

### Task 4: Make Diagnostics Distinguish Success, Failure, and Fallback Need

**Files:**
- Modify: `packages/happy-vscode-bridge/src/runtime/types.ts`
- Modify: `packages/happy-vscode-bridge/src/ui/BridgeCommands.ts`
- Modify: `packages/happy-vscode-bridge/src/ui/ui.test.ts`

- [ ] **Step 1: Write failing diagnostics tests**

```ts
expect(report).toContain('- Runtime Shared Hook: installed=yes | target=instance');
expect(report).toContain('- Runtime Shared Hook Reason: no_candidate_found');
expect(report).toContain('- Runtime Capture: captured=yes | path=shared_ext_host_instance');
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/ui/ui.test.ts`
Expected: FAIL because shared-hook diagnostics are not rendered yet.

- [ ] **Step 3: Extend diagnostics**

Implementation notes:
- Add shared-hook fields to `ProviderRuntimeCaptureDiagnostic`:
- `sharedHookInstalled`
- `sharedHookTargetKind`
- `sharedHookFailureReason`
- `capturePath`
- Keep existing fields like `captured`, `providerKeys`, `knownChannelRefs`.
- Make the report answer three operator questions:
- Did Happy find a shared registrar target?
- Did the hook install successfully?
- Did the hook actually observe a target provider registration?

- [ ] **Step 4: Re-run focused diagnostics tests**

Run: `npx vitest run packages/happy-vscode-bridge/src/ui/ui.test.ts packages/happy-vscode-bridge/src/runtime/ExtHostSharedRegistrationCapture.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/happy-vscode-bridge/src/runtime/types.ts \
  packages/happy-vscode-bridge/src/ui/BridgeCommands.ts \
  packages/happy-vscode-bridge/src/ui/ui.test.ts
git commit -m "chore: expose ext-host shared capture diagnostics"
```

### Task 5: Verify and Enforce the Decision Gate

**Files:**
- No new product files required unless the gate fails.

- [ ] **Step 1: Run package typecheck**

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck`
Expected: PASS

- [ ] **Step 2: Run non-integration tests**

Run: `npx vitest run $(rg --files packages/happy-vscode-bridge/src -g '*.test.ts' | rg -v '/integration/')`
Expected: PASS

- [ ] **Step 3: Validate in a real Extension Host**

Manual verification:
- Open a VS Code window with Happy Companion, Claude, and Codex installed.
- Start one Claude session and one Codex session in that same window.
- Run `Happy Companion: Diagnose Providers`.
- Confirm diagnostics show one of:
- `Runtime Shared Hook: installed=yes`
- `Runtime Capture: captured=yes`

- [ ] **Step 4: Apply the gate**

If diagnostics show:
- Shared hook installed and `captured=yes`:
  Continue on top of the shared-hook design.
- Shared hook discovery failed with `no_candidate_found` or `unsafe_patch_target`:
  Stop and switch to `/home/work/happy-vsc/.worktrees/vscode-companion-broker/docs/superpowers/plans/2026-03-24-cross-extension-vscode-api-capture.md`.
- Shared hook installed but `captured=no` for both providers:
  Stop and collect fresh evidence before any Claude/Codex-specific bridge work.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: verify ext-host shared registration capture"
```

## Risk Notes

- Main risk: the shared registrar is reachable in the built ext-host code but not safely reachable from extension sandbox code. Mitigation: treat discovery as a first-class decision gate, not an implicit assumption.
- Secondary risk: patching the wrong prototype could affect unrelated webview providers. Mitigation: allow only the exact registrar method shapes needed and record the chosen target kind.
- Tertiary risk: a successful shared hook still may not expose deeper provider internals needed by Claude interrupt/approval. Mitigation: this plan is only about provider registration capture, not all runtime bridge capabilities.

## Fallback Policy

- Preferred path: shared registrar instance/prototype patch.
- Automatic fallback is **not** part of this plan.
- If the preferred path fails, switch deliberately to `/home/work/happy-vsc/.worktrees/vscode-companion-broker/docs/superpowers/plans/2026-03-24-cross-extension-vscode-api-capture.md`, which targets the API-dispatch seam instead.
