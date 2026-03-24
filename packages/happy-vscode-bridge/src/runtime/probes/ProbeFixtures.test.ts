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

const requiredReconBaselineKeys = [
  'extensionId',
  'extensionVersion',
  'exportsShape',
  'commands',
  'contextKeys',
  'storagePath',
  'workspaceBinding',
] as const;

describe('Provider Probe Fixtures', () => {
  test('document the provider evidence required for full-control (as an unverified recon baseline)', () => {
    const providers = [
      { providerKey: 'claude', name: 'Claude', fixture: claudeProbeFixtures },
      { providerKey: 'codex', name: 'Codex', fixture: codexProbeFixtures },
    ] as const;

    providers.forEach(({ providerKey, name, fixture }) => {
      expect(fixture.providerName).toBe(name);

      // This is intentionally a helper to prevent probe authors from "guessing" evidence keys.
      expect(readFixtureChecklist(providerKey)).toEqual([...requiredReconBaselineKeys]);

      requiredReconBaselineKeys.forEach((field) => {
        expect(fixture.reconBaseline).toHaveProperty(field);
      });

      // Prevent fixtures from degrading into empty placeholders while still satisfying shape checks.
      expect(fixture.reconBaseline.verificationState).toBe('unverified');
      expect(Array.isArray(fixture.reconBaseline.sources)).toBe(true);
      expect(fixture.reconBaseline.sources.length).toBeGreaterThan(0);
      fixture.reconBaseline.sources.forEach((source) => {
        expectNonEmptyString(source.kind);
        expectNonEmptyString(source.ref);
      });

      expectNonEmptyString(fixture.reconBaseline.extensionId);
      expectNonEmptyString(fixture.reconBaseline.extensionVersion);
      expect(fixture.reconBaseline.extensionVersion).toBe('PENDING_RECON');

      expect(fixture.reconBaseline.exportsShape).toBeDefined();
      expectNonEmptyString(fixture.reconBaseline.exportsShape.module);
      expectNonEmptyStringArray(fixture.reconBaseline.exportsShape.exportedHooks);

      expect(fixture.reconBaseline.commands).toBeDefined();
      expectNonEmptyStringArray(fixture.reconBaseline.commands.smokeCheckCommandIds);

      expectNonEmptyStringArray(fixture.reconBaseline.contextKeys);

      expect(Array.isArray(fixture.reconBaseline.storagePath)).toBe(true);
      expect(fixture.reconBaseline.storagePath.length).toBeGreaterThan(0);
      fixture.reconBaseline.storagePath.forEach((entry) => {
        expectNonEmptyString(entry.path);
        expectNonEmptyString(entry.format);
        expectNonEmptyString(entry.workspaceLinked);
      });

      expectNonEmptyString(fixture.reconBaseline.workspaceBinding);
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

    const actual = [...codexProbeFixtures.reconBaseline.commands.smokeCheckCommandIds].sort();
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
