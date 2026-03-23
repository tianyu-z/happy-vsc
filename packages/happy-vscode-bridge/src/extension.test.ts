import { describe, it, expect } from 'vitest';
import { activate, deactivate } from './extension';

describe('bridge extension entrypoint', () => {
  it('exports VS Code lifecycle hooks', () => {
    expect(typeof activate).toBe('function');
    expect(typeof deactivate).toBe('function');
  });
});
