import { describe, expect, it } from 'vitest';

import { MetadataSchema } from './storageTypes';

describe('MetadataSchema', () => {
  it('rejects broker-attached metadata when required window fields are missing', () => {
    const result = MetadataSchema.safeParse({
      path: '/workspace',
      host: 'localhost',
      sessionSource: 'broker_attached',
      brokerSessionId: 'broker-sess-1',
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected broker-attached metadata parse to fail');
    }
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining([
        'windowInstanceId',
        'brokerWindowLabel',
        'brokerWorkspaceLabel',
        'brokerWorkspacePath',
        'brokerWindowOrdinal',
      ]),
    );
  });

  it('accepts broker-attached metadata when required window fields are present', () => {
    const result = MetadataSchema.safeParse({
      path: '/workspace',
      host: 'localhost',
      sessionSource: 'broker_attached',
      brokerSessionId: 'broker-sess-1',
      windowInstanceId: 'window-a',
      brokerWindowLabel: 'Window A',
      brokerWorkspaceLabel: 'Workspace A',
      brokerWorkspacePath: '/workspace-a',
      brokerWindowOrdinal: 1,
    });

    expect(result.success).toBe(true);
  });
});
