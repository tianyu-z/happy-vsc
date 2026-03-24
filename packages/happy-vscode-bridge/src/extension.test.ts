import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { activate, deactivate } from './extension';

describe('bridge extension entrypoint', () => {
  it('declares a VS Code extension entrypoint', async () => {
    const pkgPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      'package.json',
    );
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as {
      main?: unknown;
      engines?: { vscode?: unknown };
    };
    expect(pkg.engines?.vscode).toBeTruthy();
    expect(typeof pkg.main).toBe('string');
    expect(pkg.main).toContain('dist/');
  });

  it('exports VS Code lifecycle hooks', () => {
    expect(typeof activate).toBe('function');
    expect(typeof deactivate).toBe('function');
  });
});
