import { describe, expect, it } from 'vitest';

import { EditorContextBridge } from './EditorContextBridge';

describe('EditorContextBridge', () => {
  it('projects the active editor into a provider-agnostic context snapshot', () => {
    const bridge = new EditorContextBridge();

    const ctx = bridge.project({
      fileName: '/repo/src/app.ts',
      selectionText: 'const a = 1;',
      selectionRanges: [
        {
          startLine: 0,
          startCharacter: 0,
          endLine: 0,
          endCharacter: 12,
        },
      ],
      visibleFiles: ['/repo/src/app.ts'],
      openTabs: ['/repo/src/app.ts'],
      workspaceRoots: ['/repo'],
      gitBranch: 'next',
      diagnosticsSummary: {
        errors: 1,
        warnings: 0,
        infos: 0,
        hints: 0,
      },
    });

    expect(ctx.activeFilePath).toBe('/repo/src/app.ts');
    expect(ctx.selectedText).toBe('const a = 1;');
    expect(ctx.selectionRanges).toHaveLength(1);
    expect(ctx.openTabs).toEqual(['/repo/src/app.ts']);
    expect(ctx.workspaceRoots).toEqual(['/repo']);
    expect(ctx.gitBranch).toBe('next');
  });

  it('normalizes missing editor fields into stable defaults', () => {
    const bridge = new EditorContextBridge();

    const ctx = bridge.project({});

    expect(ctx.activeFilePath).toBeNull();
    expect(ctx.selectedText).toBeNull();
    expect(ctx.selectionRanges).toEqual([]);
    expect(ctx.visibleFilePaths).toEqual([]);
    expect(ctx.openTabs).toEqual([]);
    expect(ctx.workspaceRoots).toEqual([]);
    expect(ctx.gitBranch).toBeNull();
    expect(ctx.diagnosticsSummary).toEqual({
      errors: 0,
      warnings: 0,
      infos: 0,
      hints: 0,
    });
  });
});
