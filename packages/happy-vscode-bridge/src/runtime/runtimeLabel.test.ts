import { describe, expect, it } from 'vitest';

import { deriveRuntimeInfo } from './runtimeLabel';

describe('deriveRuntimeInfo', () => {
  it('maps ssh remotes into a readable runtime label', () => {
    expect(
      deriveRuntimeInfo({
        remoteName: 'ssh-remote',
        remoteAuthority: 'ssh-remote+gpu-1',
      }),
    ).toEqual({
      runtimeKind: 'ssh',
      runtimeLabel: 'ssh:gpu-1',
    });
  });

  it('falls back to local when no remote host is active', () => {
    expect(
      deriveRuntimeInfo({
        remoteName: undefined,
        remoteAuthority: undefined,
      }),
    ).toEqual({
      runtimeKind: 'local',
      runtimeLabel: 'local',
    });
  });
});
