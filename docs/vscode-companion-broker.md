# VS Code Companion Broker

This document explains how to operate the broker-backed VS Code attach flow added for Happy Next. The broker lets Happy attach to an already-running official Claude or Codex VS Code session instead of creating a parallel twin session.

## Scope

Current MVP scope:

- Official `Claude Code` and `Codex` VS Code sessions
- One VS Code window / workspace scope
- One external Happy attach client
- Shared messages, turn state, approvals, interrupts, attachments, and editor context when the provider bridge supports them
- Visible degraded mode when a capability is unavailable

Out of scope for this phase:

- Creating new official plugin sessions from Happy
- Multi-window aggregation
- Multi-client concurrent control
- Gemini

## Provider Evidence Baseline (Recon Fixtures)

The companion extension intentionally avoids guessing private provider internals (entrypoints, hidden commands, storage layouts). Before implementing or upgrading any provider RuntimeProbe/StorageProbe, capture recon evidence in stable fixtures and keep it versioned in-repo.

Full-control evidence baseline keys (per provider):

- `extensionId`
- `extensionVersion`
- `exportsShape`
- `commands`
- `contextKeys`
- `storagePath`
- `workspaceBinding`

Failure policy if the evidence is missing or unverified:

- `compatibility=unknown`
- `attachability=attachable_with_degraded_capabilities`
- degraded flags include `runtime_probe_unverified`

Operationally: if you see `runtime_probe_unverified`, treat it as "needs recon". Confirm the official extension version and runtime markers, then update the recon fixtures before attempting full-control support.

## Manual Verification Checklist

Run this checklist before calling the flow production-ready:

1. Launch the companion extension in an Extension Development Host.
2. Start an official Claude or Codex session in the same VS Code window.
3. Verify `broker-list-sessions` returns an attachable session in Happy's `VS Code Companion Sessions` UI / machine RPC path.
4. Attach from Happy and confirm the new Happy session is marked as broker-backed (`sessionSource=broker_attached`).
5. Send a message from Happy and confirm it appears inside the official VS Code session.
6. Trigger approval and interrupt from each side and confirm both surfaces update.

## Operator Setup

Use this startup order. The broker only discovers sessions that were started in the official plugin first.

1. Launch the `happy-vscode-bridge` companion extension in an Extension Development Host or install it into the same VS Code window as the official plugin.
2. In that same VS Code window, start an official `Claude Code` or `Codex` session.
3. Confirm the broker manifest exists at `~/.happy-vsc/broker/instance.json`.
4. Make sure the target Happy machine is online and the Happy daemon is running.
5. Open the machine detail view in Happy.
6. Under `VS Code Companion Sessions`, attach one of the discovered sessions.

The companion extension is the only local broker. Happy should connect to the broker manifest instead of trying to talk to the official plugin directly.

## Attach Flow

At a high level:

1. The official VS Code plugin owns the live session.
2. The companion extension discovers that live session and exposes it through the broker manifest and loopback WebSocket/JSON-RPC server.
3. Happy lists broker sessions from the machine screen.
4. Happy attaches to one `brokerSessionId` and creates a broker-backed Happy session with `sessionSource=broker_attached`.
5. The attached Happy session mirrors the live VS Code session and shares subsequent controls through the broker.

Attachability states:

- `attachable`: full attach path is available.
- `attachable_with_degraded_capabilities`: attach still works, but some shared controls remain limited.
- `not_attachable`: discovery succeeded, but the live session should not be attached.

## Degraded Mode

If attach succeeds with degraded capabilities, Happy should still show the session, but the metadata/status row will explain which controls are limited.

Current degraded flags:

- `read_only_attach`: Happy is attached in read-only mode.
- `interrupt_bridge_unavailable`: interrupts stay in VS Code.
- `approval_bridge_unavailable`: approval requests stay in VS Code.
- `attachment_bridge_unavailable`: attachments stay in VS Code.
- `selection_context_stale`: editor selection context may be stale.

Treat degraded mode as productized behavior, not a hidden partial success.

## Troubleshooting

If no broker sessions appear:

- Confirm the official Claude/Codex session was started before attaching from Happy.
- Confirm the companion extension and official plugin are running in the same VS Code window.
- Confirm `~/.happy-vsc/broker/instance.json` exists and was written recently.
- Confirm the Happy machine is online.

If attach works but capabilities are limited:

- Read the degraded flags shown in the attached Happy session.
- Use VS Code for any capability that the degraded flags say is still local to VS Code.
- Recheck provider / plugin versions if degraded flags appear unexpectedly.

If discovery fails after a code update:

- Rebuild or reload the companion extension.
- Make sure `happy-wire`, `happy-vscode-bridge`, `happy-cli`, and `happy-app` come from the same branch state.
- Regenerate the broker manifest by restarting the companion extension host.

## Verification Commands

Run these checks from the repo root:

```bash
COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-wire typecheck
COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-vscode-bridge typecheck
COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-cli typecheck
COREPACK_HOME=/tmp/corepack corepack yarn --cwd packages/happy-app typecheck

npx vitest run packages/happy-wire/src/brokerProtocol.test.ts
npx vitest run packages/happy-vscode-bridge/src/extension.test.ts packages/happy-vscode-bridge/src/broker/BrokerServer.test.ts
npx vitest run packages/happy-cli/src/broker/BrokerClient.test.ts packages/happy-cli/src/api/apiMachine.test.ts
npx vitest run packages/happy-app/sources/sync/ops.broker.test.ts packages/happy-app/sources/utils/brokerSessionUtils.test.ts
```

Expected result: every command exits successfully.
