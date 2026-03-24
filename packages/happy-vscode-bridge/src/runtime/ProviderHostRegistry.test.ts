import { describe, expect, it, vi } from 'vitest';

import {
  ProviderHostRegistry,
  type ProviderRegistryExtension,
  type ProviderRegistryVscodeHost,
} from './ProviderHostRegistry';

function makeExtension(
  overrides: Partial<ProviderRegistryExtension> = {},
): ProviderRegistryExtension {
  const activate = vi.fn(async () => overrides.exports ?? {});

  return {
    id: 'anthropic.claude-code',
    isActive: false,
    packageJSON: {
      version: '1.2.3',
    },
    exports: undefined,
    activate,
    ...overrides,
  };
}

function makeVscodeHost(options: {
  extensions?: ProviderRegistryExtension[];
  commands?: string[];
  contextKeys?: string[];
} = {}): ProviderRegistryVscodeHost {
  const extensions = new Map(
    (options.extensions ?? []).map((extension) => [extension.id, extension]),
  );

  return {
    extensions,
    commands: {
      getCommands: async () => [...(options.commands ?? [])],
    },
    contextKeys: {
      getKnownKeys: async () => [...(options.contextKeys ?? [])],
    },
  };
}

describe('ProviderHostRegistry', () => {
  it('reports missing provider extensions as incompatible', async () => {
    const registry = new ProviderHostRegistry(makeVscodeHost({ extensions: [] }));

    await expect(registry.resolve('claude')).resolves.toMatchObject({
      provider: 'claude',
      compatibility: 'incompatible',
      activationState: 'missing',
      providerExtension: {
        id: 'anthropic.claude-code',
      },
      host: null,
    });
  });

  it('activates the target extension on demand and exposes observed host data', async () => {
    const activate = vi.fn(async () => ({
      runtimeBridge: {
        watchSession: vi.fn(),
      },
    }));
    const extension = makeExtension({
      exports: {
        staleValue: true,
      },
      activate,
    });
    const registry = new ProviderHostRegistry(
      makeVscodeHost({
        extensions: [extension],
        commands: ['claude.resume', 'claude.sendMessage'],
        contextKeys: ['claude.sessionActive'],
      }),
    );

    const resolved = await registry.resolve('claude');

    expect(activate).toHaveBeenCalledTimes(1);
    expect(resolved).toMatchObject({
      provider: 'claude',
      compatibility: 'supported',
      activationState: 'active',
      providerExtension: {
        id: 'anthropic.claude-code',
        version: '1.2.3',
      },
      commands: ['claude.resume', 'claude.sendMessage'],
      contextKeys: ['claude.sessionActive'],
      exportKeys: ['runtimeBridge'],
    });
    expect(await resolved.host?.isCommandAvailable('claude.resume')).toBe(true);
    expect(await resolved.host?.hasContextKey('claude.sessionActive')).toBe(true);
    await expect(resolved.host?.activateExtension()).resolves.toMatchObject({
      runtimeBridge: expect.any(Object),
    });
  });

  it('returns unknown compatibility when activation fails', async () => {
    const extension = makeExtension({
      id: 'openai.chatgpt',
      packageJSON: {
        version: '0.9.0',
      },
      activate: vi.fn(async () => {
        throw new Error('activation failed');
      }),
    });
    const registry = new ProviderHostRegistry(
      makeVscodeHost({
        extensions: [extension],
        commands: ['chatgpt.newCodexPanel'],
      }),
    );

    await expect(registry.resolve('codex')).resolves.toMatchObject({
      provider: 'codex',
      compatibility: 'unknown',
      activationState: 'inactive',
      providerExtension: {
        id: 'openai.chatgpt',
        version: '0.9.0',
      },
      commands: ['chatgpt.newCodexPanel'],
      exportKeys: [],
      host: null,
    });
  });
});
