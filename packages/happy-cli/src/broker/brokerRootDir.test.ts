import { describe, expect, it } from 'vitest';

import { resolveBrokerRootDir } from './brokerRootDir';

describe('resolveBrokerRootDir', () => {
  it('prefers explicit HAPPY_VSCODE_BRIDGE_ROOT override', () => {
    expect(
      resolveBrokerRootDir({
        env: {
          HAPPY_VSCODE_BRIDGE_ROOT: '/custom/broker-root',
        },
        homeDir: '/home/test',
        exists: () => false,
      }),
    ).toBe('/custom/broker-root');
  });

  it('discovers VS Code Server global storage root before legacy ~/.happy-vsc', () => {
    expect(
      resolveBrokerRootDir({
        env: {},
        homeDir: '/home/test',
        exists: (path: string) =>
          path ===
          '/home/test/.vscode-server/data/User/globalStorage/happy.happy-vscode-bridge/broker/instance.json',
      }),
    ).toBe(
      '/home/test/.vscode-server/data/User/globalStorage/happy.happy-vscode-bridge',
    );
  });

  it('falls back to legacy ~/.happy-vsc when no VS Code manifest is present', () => {
    expect(
      resolveBrokerRootDir({
        env: {},
        homeDir: '/home/test',
        exists: () => false,
      }),
    ).toBe('/home/test/.happy-vsc');
  });
});
