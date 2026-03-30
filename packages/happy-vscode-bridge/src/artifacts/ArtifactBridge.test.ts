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

  it('does not leak mutable references from stage/get/snapshot', () => {
    const bridge = new ArtifactBridge();

    const staged = bridge.stage({
      kind: 'file',
      displayName: 'safe.txt',
      filePath: '/tmp/safe.txt',
      mimeType: 'text/plain',
    });
    if (staged.kind !== 'file') {
      throw new Error('Expected file artifact');
    }
    staged.filePath = '/tmp/mutated.txt';

    const read1 = bridge.get(staged.id)!;
    if (read1.kind !== 'file') {
      throw new Error('Expected file artifact');
    }
    expect(read1.filePath).toBe('/tmp/safe.txt');

    read1.displayName = 'mutated';
    const read2 = bridge.get(staged.id)!;
    expect(read2.displayName).toBe('safe.txt');

    const snap1 = bridge.snapshot();
    snap1.artifacts[0].displayName = 'snapshot-mutated';
    const snap2 = bridge.snapshot();
    expect(snap2.artifacts[0].displayName).toBe('safe.txt');
  });
});
