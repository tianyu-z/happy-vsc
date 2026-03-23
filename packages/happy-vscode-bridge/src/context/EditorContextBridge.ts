import type {
  BrokerDiagnosticsSummary,
  BrokerEditorContext,
  BrokerSelectionRange,
} from '../providers/types';

export type EditorContextProjectionInput = {
  fileName?: string;
  selectionText?: string;
  selectionRanges?: BrokerSelectionRange[];
  visibleFiles?: string[];
  openTabs?: string[];
  workspaceRoots?: string[];
  gitBranch?: string;
  diagnosticsSummary?: Partial<BrokerDiagnosticsSummary>;
};

const emptyDiagnostics: BrokerDiagnosticsSummary = {
  errors: 0,
  warnings: 0,
  infos: 0,
  hints: 0,
};

function cloneSelectionRanges(ranges: BrokerSelectionRange[] | undefined): BrokerSelectionRange[] {
  return (ranges ?? []).map((range) => ({ ...range }));
}

export class EditorContextBridge {
  snapshot(input: EditorContextProjectionInput = {}): BrokerEditorContext {
    return this.project(input);
  }

  project(input: EditorContextProjectionInput = {}): BrokerEditorContext {
    return {
      activeFilePath: input.fileName ?? null,
      selectedText: input.selectionText ?? null,
      selectionRanges: cloneSelectionRanges(input.selectionRanges),
      visibleFilePaths: [...(input.visibleFiles ?? [])],
      openTabs: [...(input.openTabs ?? [])],
      workspaceRoots: [...(input.workspaceRoots ?? [])],
      gitBranch: input.gitBranch ?? null,
      diagnosticsSummary: {
        ...emptyDiagnostics,
        ...(input.diagnosticsSummary ?? {}),
      },
    };
  }
}
