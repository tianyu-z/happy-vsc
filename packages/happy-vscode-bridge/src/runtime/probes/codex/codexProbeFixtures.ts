import type { ProviderProbeFixture, ProviderFailurePolicy, FullControlEvidence } from '../claude/claudeProbeFixtures';

const failurePolicy: ProviderFailurePolicy = {
  compatibility: 'unknown',
  degradedFlags: ['runtime_probe_unverified'],
  attachability: 'attachable_with_degraded_capabilities',
};

const fullControlEvidence: FullControlEvidence = {
  extensionId: 'openai.chatgpt',
  extensionVersion: '1.0.0',
  exportsShape: {
    module: 'dist/extension.js (activation manager)',
    exportedHooks: [
      'createLiveChatPanel',
      'resolveWorkspaceSession',
      'reportSessionStatus',
    ],
    remark: 'Exports a live session registrar that wires the loopback broker receiver, storage helpers, and context-key setters.',
  },
  commands: {
    smokeCheckCommandIds: [
      'chatgpt.openSidebar',
      'chatgpt.openConversation',
      'chatgpt.newChat',
      'chatgpt.resetConversation',
    ],
  },
  contextKeys: ['chatgpt.isActive', 'chatgpt.sessionVisible', 'chatgpt.workspaceSessionId'],
  storagePath: [
    {
      path: '<vscode globalStorage>/openai.chatgpt/session-state.json',
      format: 'JSON object keyed by workspaceURI with sessionId/lastActive metadata',
      workspaceLinked: 'the workspace URI key ties each session-state entry to the running workspace that owns that session ID',
    },
    {
      path: '~/.chatgpt/vsc-session',
      format: 'per-workspace directory holding JSON session logs',
      workspaceLinked: 'each log file is named after the workspace identifier and includes workspace URI reference fields',
      notes: 'Referenced by extension telemetry as the workspace session cache when workspaces reopen.',
    },
  ],
  workspaceBinding:
    'Workspace linkage is confirmed when the globalStorage session-state entry matches the workspace URI of the live workspace and the external cache folder entry shares the same sessionId.',
};

export const codexProbeFixtures: ProviderProbeFixture = {
  providerName: 'Codex',
  fullControlEvidence,
  failurePolicy,
};
