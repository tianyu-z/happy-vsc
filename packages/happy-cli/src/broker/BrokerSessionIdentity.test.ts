import { expect, it } from 'vitest';

import { buildBrokerSessionTag } from './BrokerSessionIdentity';

it('builds a stable broker-backed Happy session tag', () => {
  expect(
    buildBrokerSessionTag({
      machineId: 'machine-1',
      canonicalSessionKey: 'machine-1:instance-1:broker-sess-1',
    }),
  ).toBe('vscode-broker:machine-1:machine-1:instance-1:broker-sess-1');
});
