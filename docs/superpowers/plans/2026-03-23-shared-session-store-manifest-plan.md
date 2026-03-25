# Shared Session Store & Manifest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build SharedSessionStore sequencing/projection logic and BrokerManifestStore persistence so the VS Code broker can track shared session snapshots and publish its manifest.

**Architecture:** An in-memory SharedSessionStore maintains append-only logs, per-session projections, and subscription hooks for transport consumers, while BrokerManifestStore writes/reads JSON manifest files for discovery.

**Tech Stack:** TypeScript (ESNext) inside `packages/happy-vscode-bridge` plus Vitest for unit tests and Node fs APIs for manifest persistence.

---

### Task 1: SharedSessionStore core behavior

**Files:**
- Create: `packages/happy-vscode-bridge/src/broker/SharedSessionStore.ts`
- Test: `packages/happy-vscode-bridge/src/broker/SharedSessionStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('assigns monotonically increasing seq values', () => {
  const store = new SharedSessionStore();
  const first = store.append('session-1', { type: 'session.discovered' });
  const second = store.append('session-1', { type: 'message.user_submitted' });
  expect(second.seq).toBe(first.seq + 1);
});
```

```ts
it('projects snapshots and returns them', () => {
  const store = new SharedSessionStore();
  store.append('session-1', {
    type: 'session.snapshot',
    snapshot: { brokerSessionId: 'session-1', provider: 'claude', latestSeq: 1, capabilities: [], degradedFlags: [] },
  });
  expect(store.getSnapshot('session-1')?.latestSeq).toBe(1);
});
```

- [ ] **Step 2: Run the shared store tests**

Run: `npx vitest run packages/happy-vscode-bridge/src/broker/SharedSessionStore.test.ts`
Expected: FAIL (files/classes undefined initially).

- [ ] **Step 3: Implement minimal append-only store**

Implementation guidance:
1. `SharedSessionStore` keeps `seq` counter and `logs: BrokerLogEntry[]`.
2. `append` increments counter, records `{ seq, at: Date.now(), sessionId, event }`, updates per-session projections when `event.type` is snapshot/discovered, and notifies subscribers returned by `subscribe`.
3. Provide `getSnapshot(sessionId)` and `listSnapshots()` plus `subscribe(callback)`/`unsubscribe(token)` helpers if needed by later transport.

- [ ] **Step 4: Run the shared store tests again**

Run: `npx vitest run packages/happy-vscode-bridge/src/broker/SharedSessionStore.test.ts`
Expected: PASS.

### Task 2: BrokerManifestStore persistence

**Files:**
- Create: `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.ts`
- Test: `packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('writes and reads broker manifest metadata', async () => {
  const tmp = path.join(tmpdir(), 'happy-vsc-test.json');
  const store = new BrokerManifestStore(tmp);
  await store.write({ port: 40123, token: 'secret' });
  await expect(store.read()).resolves.toMatchObject({ port: 40123 });
});
```

- [ ] **Step 2: Run the manifest tests**

Run: `npx vitest run packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts`
Expected: FAIL initially (class missing).

- [ ] **Step 3: Implement manifest persistence**

Implementation guidance:
1. `BrokerManifestStore` accepts a path in constructor and exposes `write(manifest)`/`read()` returning `BrokerInstanceManifest | undefined`.
2. `write` uses `mkdir(dirname(this.file), { recursive: true })` and `writeFile(this.file, JSON.stringify(manifest, null, 2))`.
3. `read` tries `readFile`; on `ENOENT` return `undefined`, otherwise parse JSON and return object.

- [ ] **Step 4: Run manifest tests again**

Run: `npx vitest run packages/happy-vscode-bridge/src/broker/BrokerManifestStore.test.ts`
Expected: PASS.

### Task 3: Bridge package verification & commit

**Files:**
- Typecheck: `packages/happy-vscode-bridge`
- Git: add broker files

- [ ] **Step 1:** Run bridge typecheck

Command: `COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck`
Expected: exit 0.

- [ ] **Step 2:** Commit changes

```bash
git add packages/happy-vscode-bridge/src/broker
git commit -m "feat(bridge): add shared session store and manifest persistence"
```
