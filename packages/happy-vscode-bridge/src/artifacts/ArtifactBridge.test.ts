import { describe, expect, it } from 'vitest';

import { ArtifactBridge } from './ArtifactBridge';

describe('ArtifactBridge', () => {
  it('stages image/file/temp/diff artifacts and exposes them in snapshot order', () => {
    const bridge = new ArtifactBridge();

    const file = bridge.stage({
      kind: 'file',
      displayName: 'notes.txt',
      filePath: '/tmp/notes.txt',
      mimeType: 'text/plain',
    });
    const image = bridge.stage({
      kind: 'image',
      displayName: 'diagram.png',
      filePath: '/tmp/diagram.png',
      mimeType: 'image/png',
    });
    const tempFile = bridge.stage({
      kind: 'temp_file',
      displayName: 'preview.json',
      filePath: '/tmp/preview.json',
    });
    const diff = bridge.stage({
      kind: 'diff',
      displayName: 'app.patch',
      text: 'diff --git a/app.ts b/app.ts',
    });

    const snapshot = bridge.snapshot();

    expect(snapshot.artifacts.map((artifact) => artifact.id)).toEqual([
      file.id,
      image.id,
      tempFile.id,
      diff.id,
    ]);
    expect(bridge.get(file.id)).toMatchObject({
      kind: 'file',
      filePath: '/tmp/notes.txt',
    });
    expect(bridge.get(image.id)?.mimeType).toBe('image/png');
    expect(bridge.get(diff.id)?.text).toContain('diff --git');
  });
});
