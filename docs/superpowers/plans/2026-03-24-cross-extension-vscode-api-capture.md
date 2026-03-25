# Cross-Extension VS Code API Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture Claude/Codex provider registrations by intercepting the ext-host layer that hands `vscode` API objects to other extensions, so Happy can observe live session providers across extension boundaries.

**Architecture:** Replace the current host-local `registerWebviewViewProvider` patch with an API-dispatch interceptor. For CommonJS extensions, wrap `Module._load('vscode')`; for ESM extensions, wrap `globalThis._VSCODE_IMPORT_VSCODE_API`. Both paths feed a shared `decorateVscodeApiHost()` function that patches `window.registerWebviewViewProvider` and `window.registerCustomEditorProvider` on every delivered API host. Diagnostics must report whether the CJS and ESM distribution hooks are installed, how many API hosts were decorated, and which capture path actually observed provider registration.

**Tech Stack:** TypeScript, VS Code extension host runtime, Node `module`, dynamic import, Vitest.

---

## Root Cause Summary

- The current implementation in `src/runtime/ProviderRuntimeCapture.ts` patches only the `vscode` host visible to Happy itself plus one locally resolved `require('vscode')` host.
- VS Code does **not** share one `vscode.window` object across extensions. It manufactures per-extension API objects in the extension host and returns them through two internal dispatch paths:
- CommonJS path: `Module._load('vscode')`
- ESM path: `globalThis._VSCODE_IMPORT_VSCODE_API(...)`
- Evidence from `/home/work/.vscode-server/bin/07ff9d6178ede9a1bd12ad3399074d726ebe6e43/out/vs/workbench/api/node/extensionHostProcess.js` shows:
- CJS `vscode` API creation is handled by the ext-host `module._load` interceptor.
- ESM `vscode` API creation is handled by `_VSCODE_IMPORT_VSCODE_API`.
- Current diagnostics already prove activation order is not the root cause in the observed repro; provider capture remains `captured=no` even when Happy activates first.
- Therefore the next patch should target the **API distribution seam**, not the provider bundle and not the currently patched host object.

## Scope

- In scope:
- Intercept `vscode` API distribution for other extensions.
- Reuse existing provider view-type capture rules for Claude/Codex.
- Add diagnostics that prove whether API interception actually fired.
- Preserve current degraded-mode behavior while runtime capture is being improved.
- Out of scope:
- Editing VS Code’s own `extensionHostProcess.js` on disk.
- Patching `Function.prototype`, `Object.prototype`, or unrelated globals.
- Reverse-engineering private Claude/Codex runtime classes unless API-dispatch interception fails.

## File Structure

- Create: `packages/happy-vscode-bridge/src/runtime/VscodeApiInterception.ts`
  Responsibility: install and remove the CJS/ESM `vscode` API dispatch hooks, decorate every delivered API host exactly once, and expose diagnostics about hook state.
- Modify: `packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.ts`
  Responsibility: narrow this file to provider capture mechanics and a reusable `decorateVscodeApiHost()` helper instead of owning cross-extension interception itself.
- Modify: `packages/happy-vscode-bridge/src/runtime/types.ts`
  Responsibility: extend runtime capture diagnostics with dispatch-hook state and decorated-host evidence.
- Modify: `packages/happy-vscode-bridge/src/extension.ts`
  Responsibility: install the new interception layer before eager provider activation and dispose it on shutdown.
- Modify: `packages/happy-vscode-bridge/src/ui/BridgeCommands.ts`
  Responsibility: surface the new diagnostics in `Diagnose Providers`.
- Test: `packages/happy-vscode-bridge/src/runtime/VscodeApiInterception.test.ts`
  Responsibility: prove CJS/ESM interception decorates foreign API objects and cleans up correctly.
- Modify/Test: `packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts`
  Responsibility: keep capture logic covered after extraction/refactor.
- Modify/Test: `packages/happy-vscode-bridge/src/extension.test.ts`
  Responsibility: assert interception installs before provider eager activation.
- Modify/Test: `packages/happy-vscode-bridge/src/ui/ui.test.ts`
  Responsibility: assert new diagnostics render correctly.

### Task 1: Extract Provider Host Decoration

**Files:**
- Modify: `packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.ts`
- Test: `packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts`

- [ ] **Step 1: Write failing tests for reusable host decoration**

```ts
it('captures Claude registration from a decorated foreign vscode host', () => {
  const host = createFakeVscodeHost();
  const capture = createProviderRuntimeCaptureRegistry();

  decorateVscodeApiHost(host, capture);

  host.window.registerWebviewViewProvider?.('claudeVSCodeSidebar', provider);

  expect(capture.getCapturedProvider('claude')).toBe(provider);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts`
Expected: FAIL because `decorateVscodeApiHost` does not exist yet.

- [ ] **Step 3: Refactor capture logic into a reusable decorator**

```ts
export function decorateVscodeApiHost(
  vscodeHost: CaptureVscodeHost,
  registry: MutableProviderRuntimeCaptureRegistry,
  metadata?: HostDecorationMetadata,
): boolean
```

Implementation notes:
- Keep existing view-type matching logic.
- Guard with a symbol so the same API host is only patched once.
- Return whether a new host was actually decorated.
- Preserve a disposable restore path for patched methods.

- [ ] **Step 4: Run the focused tests**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.ts \
  packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts
git commit -m "refactor: extract reusable vscode api host capture"
```

### Task 2: Install Cross-Extension API Dispatch Interception

**Files:**
- Create: `packages/happy-vscode-bridge/src/runtime/VscodeApiInterception.ts`
- Test: `packages/happy-vscode-bridge/src/runtime/VscodeApiInterception.test.ts`
- Modify: `packages/happy-vscode-bridge/src/extension.ts`

- [ ] **Step 1: Write failing tests for CJS and ESM interception**

```ts
it('decorates vscode hosts returned from Module._load(\"vscode\")', () => {
  const result = installVscodeApiInterception({ moduleHost, importHookHost, capture });
  const foreignApi = moduleHost._load('vscode', { filename: '/ext/claude/extension.js' }, false);

  foreignApi.window.registerWebviewViewProvider('claudeVSCodeSidebar', provider);

  expect(capture.getCapturedProvider('claude')).toBe(provider);
  expect(result.diagnostics.cjsHookInstalled).toBe(true);
});
```

```ts
it('decorates vscode hosts returned from _VSCODE_IMPORT_VSCODE_API', () => {
  const api = globalThis._VSCODE_IMPORT_VSCODE_API('esm-key');
  api.window.registerWebviewViewProvider('chatgpt.sidebarView', provider);

  expect(capture.getCapturedProvider('codex')).toBe(provider);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/VscodeApiInterception.test.ts`
Expected: FAIL because interception layer does not exist yet.

- [ ] **Step 3: Implement the interception layer**

Key requirements:
- Patch the current `Module._load` and delegate transparently for non-`vscode` requests.
- Patch `globalThis._VSCODE_IMPORT_VSCODE_API` only when present.
- On every `vscode` API object returned, call `decorateVscodeApiHost(...)`.
- Track:
- `cjsHookInstalled`
- `esmHookInstalled`
- `decoratedHostCount`
- `decoratedOrigins` or equivalent source evidence
- Restore original hooks on dispose.

Suggested shape:

```ts
export function installVscodeApiInterception(options: InstallOptions): Disposable & {
  registry: ProviderRuntimeCaptureRegistry;
  diagnostics: VscodeApiInterceptionDiagnostics;
}
```

- [ ] **Step 4: Wire activation order in the extension entrypoint**

Implementation notes:
- Install interception immediately after loading `vscode`.
- Keep it in place before `eagerlyActivateSupportedProviders(vscode)`.
- Dispose interception with the extension.
- Ensure existing runtime/probe factory plumbing still receives the same provider capture registry.

- [ ] **Step 5: Run focused tests**

Run: `npx vitest run packages/happy-vscode-bridge/src/runtime/VscodeApiInterception.test.ts packages/happy-vscode-bridge/src/extension.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/happy-vscode-bridge/src/runtime/VscodeApiInterception.ts \
  packages/happy-vscode-bridge/src/runtime/VscodeApiInterception.test.ts \
  packages/happy-vscode-bridge/src/extension.ts \
  packages/happy-vscode-bridge/src/extension.test.ts
git commit -m "feat: intercept cross-extension vscode api delivery"
```

### Task 3: Make Diagnostics Prove the Hook Fired

**Files:**
- Modify: `packages/happy-vscode-bridge/src/runtime/types.ts`
- Modify: `packages/happy-vscode-bridge/src/ui/BridgeCommands.ts`
- Modify: `packages/happy-vscode-bridge/src/ui/ui.test.ts`

- [ ] **Step 1: Write failing diagnostics rendering tests**

```ts
expect(report).toContain('- Runtime Dispatch Hooks: cjs=yes | esm=yes');
expect(report).toContain('- Runtime Decorated Origins: /ext/claude/extension.js');
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/happy-vscode-bridge/src/ui/ui.test.ts`
Expected: FAIL because diagnostics do not expose hook state yet.

- [ ] **Step 3: Extend capture diagnostics and rendering**

Implementation notes:
- Add hook-level fields to `ProviderRuntimeCaptureDiagnostic`.
- Keep `captured`, `providerKeys`, `providerMethods`, `knownChannelRefs`.
- Add enough evidence to distinguish:
- hook installed but target extension never requested `vscode`
- hook installed and target extension got a decorated API host
- hook installed and provider registration still never happened

- [ ] **Step 4: Run tests**

Run: `npx vitest run packages/happy-vscode-bridge/src/ui/ui.test.ts packages/happy-vscode-bridge/src/runtime/ProviderRuntimeCapture.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/happy-vscode-bridge/src/runtime/types.ts \
  packages/happy-vscode-bridge/src/ui/BridgeCommands.ts \
  packages/happy-vscode-bridge/src/ui/ui.test.ts
git commit -m "chore: expose api interception diagnostics"
```

### Task 4: End-to-End Verification and Decision Gate

**Files:**
- No new product files required unless failures force a follow-up.

- [ ] **Step 1: Run package verification**

Run: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck`
Expected: PASS

- [ ] **Step 2: Run non-integration tests for the package**

Run: `npx vitest run $(rg --files packages/happy-vscode-bridge/src -g '*.test.ts' | rg -v '/integration/')`
Expected: PASS

- [ ] **Step 3: Validate in a real Extension Host**

Manual verification:
- Launch VS Code with Happy Companion installed.
- Open Codex and Claude in the same window.
- Run `Happy Companion: Diagnose Providers`.
- Confirm diagnostics now show:
- CJS hook installed.
- At least one decorated origin for each target extension.
- `Runtime Capture: captured=yes` for any provider whose webview provider was actually registered after hook install.

- [ ] **Step 4: Decision gate**

If diagnostics show:
- Hook installed, decorated target extension origin observed, but `captured=no` remains:
  Stop and escalate to phase 2 investigation of VS Code private service instances or provider stores.
- No decorated target extension origin observed:
  Investigate activation timing or alternative loading path before attempting internal prototype patching.
- `captured=yes`:
  Continue to Claude-specific runtime bridge work on top of the new seam.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: verify cross-extension vscode api capture"
```

## Risk Notes

- Main risk: patching `Module._load` incorrectly could interfere with VS Code’s own loader chain. Mitigation: delegate to the current loader and special-case only `'vscode'`.
- Secondary risk: a target extension may already have loaded before Happy installs the hook. Mitigation: keep interception installation at the top of `activate()` and verify actual activation timing from diagnostics.
- Tertiary risk: even after API interception, some provider behavior may still depend on hidden internal runtime objects. Mitigation: diagnostics must prove whether we ever observed provider registration before attempting lower-level prototype work.

## Fallback Policy

- Preferred path: API-dispatch interception.
- Fallback path only if preferred path fails with evidence: reflective investigation of shared ext-host service instances.
- Do **not** jump directly to patching minified internal class names in `extensionHostProcess.js`; that is less stable than the dispatch seam and should only be considered with hard evidence that the dispatch seam is insufficient.
