import { describe, it, expect } from 'vitest';
import { activate, deactivate } from './extension';

describe('bridge extension entrypoint', () => {
  it('declares a VS Code extension entrypoint', async () => {
    const pkg = await import('../package.json');
    expect(pkg.engines.vscode).toBeTruthy();
    expect(pkg.main).toContain('dist/');
  });

  it('exports VS Code lifecycle hooks', () => {
    expect(typeof activate).toBe('function');
    expect(typeof deactivate).toBe('function');
  });
});
