import { describe, expect, it } from 'vitest';

import { mergeSessionActivity } from './sessionActivityMerge';

describe('mergeSessionActivity', () => {
  it('preserves a newer local activeAt when an older server snapshot arrives later', () => {
    expect(
      mergeSessionActivity(
        { active: false, activeAt: 2_000 },
        { active: false, activeAt: 1_000 },
      ),
    ).toEqual({
      active: false,
      activeAt: 2_000,
    });
  });

  it('uses a newer incoming activeAt when the server snapshot is fresher', () => {
    expect(
      mergeSessionActivity(
        { active: false, activeAt: 1_000 },
        { active: false, activeAt: 2_000 },
      ),
    ).toEqual({
      active: false,
      activeAt: 2_000,
    });
  });

  it('preserves an optimistic local archive even if an older active snapshot arrives', () => {
    expect(
      mergeSessionActivity(
        { active: false, activeAt: 3_000 },
        { active: true, activeAt: 4_000 },
        { preserveLocalInactive: true },
      ),
    ).toEqual({
      active: false,
      activeAt: 3_000,
    });
  });
});
