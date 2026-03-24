export type StorageEvidence = {
  path: string;
  format: string;
  workspaceLinked: string;
  notes?: string;
};

export type ReconEvidenceSource = {
  // e.g. "provider_docs", "plan", "operator_recon_required"
  kind: string;
  ref: string;
  notes?: string;
};

export type ProviderFailurePolicy = {
  compatibility: 'unknown';
  degradedFlags: readonly ['runtime_probe_unverified'];
  attachability: 'attachable_with_degraded_capabilities';
};

export type ProviderKey = 'claude' | 'codex';

export type ReconBaselineKey =
  | 'extensionId'
  | 'extensionVersion'
  | 'exportsShape'
  | 'commands'
  | 'contextKeys'
  | 'storagePath'
  | 'workspaceBinding';

export type ReconEvidenceBaseline = {
  verificationState: 'unverified';
  sources: ReconEvidenceSource[];
  extensionId: string;
  extensionVersion: string;
  exportsShape: {
    module: string;
    exportedHooks: string[];
    remark?: string;
  };
  commands: {
    smokeCheckCommandIds: string[];
  };
  contextKeys: string[];
  storagePath: StorageEvidence[];
  workspaceBinding: string;
};

export type ProviderProbeFixture = {
  providerName: string;
  reconBaseline: ReconEvidenceBaseline;
  failurePolicy: ProviderFailurePolicy;
};

export const unverifiedRuntimeProbeFailurePolicy: ProviderFailurePolicy = {
  compatibility: 'unknown',
  degradedFlags: ['runtime_probe_unverified'],
  attachability: 'attachable_with_degraded_capabilities',
};

export const reconBaselineChecklist: readonly ReconBaselineKey[] = [
  'extensionId',
  'extensionVersion',
  'exportsShape',
  'commands',
  'contextKeys',
  'storagePath',
  'workspaceBinding',
] as const;

// Fixture-only helper: keeps probes evidence-driven, rather than guessing private provider entrypoints.
export function readFixtureChecklist(_provider: ProviderKey): readonly ReconBaselineKey[] {
  return reconBaselineChecklist;
}

export const claudeProbeFixtures: ProviderProbeFixture = {
  providerName: 'Claude',
  reconBaseline: {
    verificationState: 'unverified',
    sources: [
      {
        kind: 'plan',
        ref: 'docs/superpowers/plans/2026-03-24-vscode-companion-extension-runtime-implementation.md#task-0-provider-recon-and-stable-fixtures',
        notes: 'Unverified baseline fixture. Replace placeholders with live recon artifacts from the locally installed VS Code extension.',
      },
    ],
    extensionId: 'anthropic.claude-code',
    extensionVersion: 'PENDING_RECON',
    exportsShape: {
      module: 'PENDING_RECON: extension entrypoint/module path (unverified baseline)',
      exportedHooks: ['PENDING_RECON: exported hook names (unverified baseline)'],
      remark: 'Unverified baseline. Do not assume these hook names exist until recon validates the installed extension exports.',
    },
    commands: {
      smokeCheckCommandIds: ['claude-code.open', 'claude-code.acceptDiff', 'claude-code.rejectDiff'],
    },
    contextKeys: ['PENDING_RECON: context keys used for live-session detection (unverified baseline)'],
    storagePath: [
      {
        path: 'PENDING_RECON: storage location(s) used by Claude Code (unverified baseline)',
        format: 'PENDING_RECON: file/directory format',
        workspaceLinked: 'PENDING_RECON: how storage entries link to workspace/session identity',
        notes: 'Replace with observed storage paths and file formats captured during recon.',
      },
    ],
    workspaceBinding:
      'PENDING_RECON: how the Claude Code extension binds runtime sessions to the current VS Code workspace (unverified baseline).',
  },
  failurePolicy: unverifiedRuntimeProbeFailurePolicy,
};
