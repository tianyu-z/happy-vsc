import { describe, test, expect } from 'vitest';

import { claudeProbeFixtures, readFixtureChecklist } from './claude/claudeProbeFixtures';
import { codexProbeFixtures } from './codex/codexProbeFixtures';

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
      // RED expectation: this helper does not exist yet.
      expect(readFixtureChecklist(providerKey)).toEqual(
        expect.arrayContaining([...requiredFullControlEvidenceKeys]),
      );

      requiredFullControlEvidenceKeys.forEach((field) => {
        expect(fixture.fullControlEvidence).toHaveProperty(field);
      });
    });
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
