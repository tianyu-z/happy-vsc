export type StorageEvidence = {
  path: string;
  format: string;
  workspaceLinked: string;
  notes?: string;
};

export type ProviderFailurePolicy = {
  compatibility: 'unknown';
  degradedFlags: readonly ['runtime_probe_unverified'];
  attachability: 'attachable_with_degraded_capabilities';
};

export type ProviderKey = 'claude' | 'codex';

export type FullControlEvidenceKey =
  | 'extensionId'
  | 'extensionVersion'
  | 'exportsShape'
  | 'commands'
  | 'contextKeys'
  | 'storagePath'
  | 'workspaceBinding';

export type FullControlEvidence = {
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
  fullControlEvidence: FullControlEvidence;
  failurePolicy: ProviderFailurePolicy;
};

export const unverifiedRuntimeProbeFailurePolicy: ProviderFailurePolicy = {
  compatibility: 'unknown',
  degradedFlags: ['runtime_probe_unverified'],
  attachability: 'attachable_with_degraded_capabilities',
};

export const fullControlEvidenceChecklist: readonly FullControlEvidenceKey[] = [
  'extensionId',
  'extensionVersion',
  'exportsShape',
  'commands',
  'contextKeys',
  'storagePath',
  'workspaceBinding',
] as const;

// Fixture-only helper: keeps probes evidence-driven, rather than guessing private provider entrypoints.
export function readFixtureChecklist(_provider: ProviderKey): readonly FullControlEvidenceKey[] {
  return fullControlEvidenceChecklist;
}

export const claudeProbeFixtures: ProviderProbeFixture = {
  providerName: 'Claude',
  fullControlEvidence: {
    extensionId: 'anthropic.claude-code',
    extensionVersion: '2.0.0',
    exportsShape: {
      module: 'dist/extension.js (the live session webview registrar)',
      exportedHooks: [
        'registerLiveSessionPanel',
        'collectWorkspaceContext',
        'reportSessionState',
      ],
      remark: 'Extension exports an activate() handler that wires commands, context keys, and storage access for the webview panel.',
    },
    commands: {
      smokeCheckCommandIds: ['claude-code.open', 'claude-code.acceptDiff', 'claude-code.rejectDiff'],
    },
    contextKeys: ['claude-code.diffVisible', 'claude-code.sessionActive'],
    storagePath: [
      {
        path: '~/.claude/ide',
        format: 'directory of JSON metadata per live session',
        workspaceLinked: 'each JSON entry embeds the workspace URI and sessionId, anchoring the runtime to a workspace',
        notes: 'Referenced in user-reported errors when the IDE probe scans for live sessions.',
      },
      {
        path: '<vscode globalStorage>/anthropic.claude-code/live-session.json',
        format: 'JSON object',
        workspaceLinked: 'records the active workspaceFolderUri and last sessionId for the workspace before connecting',
      },
    ],
    workspaceBinding:
      'Workspaces get bound through the .claude directory (workspace-session JSON) alongside the globalStorage entry storing the workspace URI, so we only declare full control when both records agree.',
  },
  failurePolicy: unverifiedRuntimeProbeFailurePolicy,
};
