import { expect, it } from 'vitest';

import { buildBrokerSessionTag } from './BrokerSessionIdentity';

it('builds a stable broker-backed Happy session tag', () => {
  expect(
    buildBrokerSessionTag({
      machineId: 'machine-1',
      brokerSessionId: 'broker-sess-1',
    }),
  ).toBe('broker:machine-1:broker-sess-1');
});
