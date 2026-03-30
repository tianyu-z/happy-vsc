import type { ProviderProbeFixture, ProviderFailurePolicy, ReconEvidenceBaseline } from '../claude/claudeProbeFixtures';

const failurePolicy: ProviderFailurePolicy = {
  compatibility: 'unknown',
  degradedFlags: ['runtime_probe_unverified'],
  attachability: 'attachable_with_degraded_capabilities',
};

const reconBaseline: ReconEvidenceBaseline = {
  verificationState: 'unverified',
  sources: [
    {
      kind: 'provider_docs',
      ref: 'https://developers.openai.com/codex/ide/commands',
      notes: 'Command ids are taken from the official IDE commands page; other fields remain pending recon.',
    },
    {
      kind: 'plan',
      ref: 'docs/superpowers/plans/2026-03-24-vscode-companion-extension-runtime-implementation.md#task-0-provider-recon-and-stable-fixtures',
      notes: 'Unverified baseline fixture. Replace placeholders with live recon artifacts from the locally installed VS Code extension.',
    },
  ],
  extensionId: 'openai.chatgpt',
  extensionVersion: 'PENDING_RECON',
  exportsShape: {
    module: 'PENDING_RECON: extension entrypoint/module path (unverified baseline)',
    exportedHooks: ['PENDING_RECON: exported hook names (unverified baseline)'],
    remark: 'Unverified baseline. Do not assume these hook names exist until recon validates the installed extension exports.',
  },
  commands: {
    smokeCheckCommandIds: [
      'chatgpt.addToThread',
      'chatgpt.addFileToThread',
      'chatgpt.openSidebar',
      'chatgpt.newChat',
      'chatgpt.implementTodo',
      'chatgpt.newCodexPanel',
    ],
  },
  contextKeys: ['PENDING_RECON: context keys used for live-session detection (unverified baseline)'],
  storagePath: [
    {
      path: 'PENDING_RECON: storage location(s) used by the OpenAI Codex/ChatGPT VS Code extension (unverified baseline)',
      format: 'PENDING_RECON: file/directory format',
      workspaceLinked: 'PENDING_RECON: how storage entries link to workspace/session identity',
      notes: 'Replace with observed storage paths and file formats captured during recon.',
    },
  ],
  workspaceBinding:
    'PENDING_RECON: how the Codex extension binds runtime sessions to the current VS Code workspace (unverified baseline).',
};

export const codexProbeFixtures: ProviderProbeFixture = {
  providerName: 'Codex',
  reconBaseline,
  failurePolicy,
};
