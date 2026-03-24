import { describe, test, expect } from 'vitest';

import { claudeProbeFixtures, readFixtureChecklist } from './claude/claudeProbeFixtures';
import { codexProbeFixtures } from './codex/codexProbeFixtures';

function expectNonEmptyString(value: unknown) {
  expect(typeof value).toBe('string');
  expect((value as string).trim().length).toBeGreaterThan(0);
}

function expectNonEmptyStringArray(value: unknown) {
  expect(Array.isArray(value)).toBe(true);
  expect((value as unknown[]).length).toBeGreaterThan(0);
  (value as unknown[]).forEach((entry) => expectNonEmptyString(entry));
}

const requiredFullControlEvidenceKeys = [
  'extensionId',
  'extensionVersion',
  'exportsShape',
  'commands',
  'contextKeys',
  'storagePath',
  'workspaceBinding',
] as const;

describe('Provider Probe Fixtures', () => {
  test('document the provider evidence required for full-control', () => {
    const providers = [
      { providerKey: 'claude', name: 'Claude', fixture: claudeProbeFixtures },
      { providerKey: 'codex', name: 'Codex', fixture: codexProbeFixtures },
    ] as const;

    providers.forEach(({ providerKey, name, fixture }) => {
      expect(fixture.providerName).toBe(name);

      // This is intentionally a helper to prevent probe authors from "guessing" evidence keys.
      expect(readFixtureChecklist(providerKey)).toEqual(
        expect.arrayContaining([...requiredFullControlEvidenceKeys]),
      );

      requiredFullControlEvidenceKeys.forEach((field) => {
        expect(fixture.fullControlEvidence).toHaveProperty(field);
      });

      // Prevent fixtures from degrading into empty placeholders while still satisfying shape checks.
      expectNonEmptyString(fixture.fullControlEvidence.extensionId);
      expectNonEmptyString(fixture.fullControlEvidence.extensionVersion);

      expect(fixture.fullControlEvidence.commands).toBeDefined();
      expectNonEmptyStringArray(fixture.fullControlEvidence.commands.smokeCheckCommandIds);

      expectNonEmptyStringArray(fixture.fullControlEvidence.contextKeys);

      expect(Array.isArray(fixture.fullControlEvidence.storagePath)).toBe(true);
      expect(fixture.fullControlEvidence.storagePath.length).toBeGreaterThan(0);
      fixture.fullControlEvidence.storagePath.forEach((entry) => {
        expectNonEmptyString(entry.path);
        expectNonEmptyString(entry.format);
        expectNonEmptyString(entry.workspaceLinked);
      });

      expectNonEmptyString(fixture.fullControlEvidence.workspaceBinding);
    });
  });

  test('Codex smoke-check commands must match the current official IDE command list (no unverified ids)', () => {
    const expected = [
      'chatgpt.addToThread',
      'chatgpt.addFileToThread',
      'chatgpt.newChat',
      'chatgpt.implementTodo',
      'chatgpt.newCodexPanel',
      'chatgpt.openSidebar',
    ] as const;

    const actual = [...codexProbeFixtures.fullControlEvidence.commands.smokeCheckCommandIds].sort();
    const expectedSorted = [...expected].sort();

    expect(actual).toEqual(expectedSorted);
  });

  test('codifies the stop condition for unverified probes (do not guess provider internals)', () => {
    const providers = [claudeProbeFixtures, codexProbeFixtures];

    providers.forEach((fixture) => {
      expect(fixture.failurePolicy).toMatchObject({
        compatibility: 'unknown',
        degradedFlags: ['runtime_probe_unverified'],
        attachability: 'attachable_with_degraded_capabilities',
      });
    });
  });
});
