import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import type { BrokerProvider } from 'happy-wire';

import { claudeProbeFixtures } from './probes/claude/claudeProbeFixtures';
import { codexProbeFixtures } from './probes/codex/codexProbeFixtures';
import type {
  ProviderHostResolution,
  ProviderProbeHost,
} from './probes/types';

export type ProviderRegistryExtension = {
  id: string;
  isActive: boolean;
  packageJSON?: {
    version?: string;
    main?: string;
  };
  extensionPath?: string;
  exports?: unknown;
  activate(): Promise<unknown>;
};

type ProviderRegistryCommands = {
  getCommands(filterInternal?: boolean): Promise<string[]>;
};

type ProviderRegistryContextKeys = {
  getKnownKeys(): Promise<string[]> | string[];
};

type ExtensionLookup =
  | Map<string, ProviderRegistryExtension>
  | {
      get(id: string): ProviderRegistryExtension | undefined;
    }
  | ProviderRegistryExtension[];

export type ProviderRegistryVscodeHost = {
  extensions: ExtensionLookup;
  commands?: ProviderRegistryCommands;
  contextKeys?: ProviderRegistryContextKeys;
};

const providerExtensionIds: Record<BrokerProvider, string> = {
  claude: claudeProbeFixtures.reconBaseline.extensionId,
  codex: codexProbeFixtures.reconBaseline.extensionId,
};
const registryRequire = createRequire(
  resolve(process.cwd(), '__happy_vscode_bridge_registry__.cjs'),
);

function normalizeExtensionId(extensionId: string): string {
  return extensionId.trim().toLowerCase();
}

function getExtension(
  extensions: ExtensionLookup,
  extensionId: string,
): ProviderRegistryExtension | undefined {
  if (Array.isArray(extensions)) {
    const expectedId = normalizeExtensionId(extensionId);
    return extensions.find(
      (extension) => normalizeExtensionId(extension.id) === expectedId,
    );
  }

  const direct = extensions.get(extensionId);
  if (direct) {
    return direct;
  }

  if (extensions instanceof Map) {
    const expectedId = normalizeExtensionId(extensionId);
    for (const extension of extensions.values()) {
      if (normalizeExtensionId(extension.id) === expectedId) {
        return extension;
      }
    }
  }

  return undefined;
}

function getVersion(extension: ProviderRegistryExtension | undefined): string {
  return extension?.packageJSON?.version ?? 'unknown';
}

function getExportKeys(exportsValue: unknown): string[] {
  if (!exportsValue || typeof exportsValue !== 'object') {
    return [];
  }

  return Object.keys(exportsValue as Record<string, unknown>).sort();
}

function getModuleExportKeys(extension: ProviderRegistryExtension): string[] {
  const extensionPath = extension.extensionPath;
  const main = extension.packageJSON?.main;
  if (!extensionPath || !main) {
    return [];
  }

  const candidatePath = resolve(extensionPath, main);
  let resolvedPath = candidatePath;
  try {
    resolvedPath = registryRequire.resolve(candidatePath);
  } catch {
    resolvedPath = candidatePath;
  }

  const exportsValue = registryRequire.cache[resolvedPath]?.exports;
  if (
    (!exportsValue || (typeof exportsValue !== 'object' && typeof exportsValue !== 'function'))
  ) {
    return [];
  }

  return Object.getOwnPropertyNames(exportsValue)
    .filter(
      (key) =>
        !['__esModule', 'default', 'length', 'name', 'prototype'].includes(key),
    )
    .sort();
}

async function listCommands(host: ProviderRegistryVscodeHost): Promise<string[]> {
  if (!host.commands) {
    return [];
  }

  try {
    return await host.commands.getCommands(true);
  } catch {
    return [];
  }
}

async function listContextKeys(host: ProviderRegistryVscodeHost): Promise<string[]> {
  if (!host.contextKeys) {
    return [];
  }

  try {
    const keys = await host.contextKeys.getKnownKeys();
    return [...keys];
  } catch {
    return [];
  }
}

class RegistryProbeHost implements ProviderProbeHost {
  readonly provider: BrokerProvider;
  readonly extensionId: string;

  private readonly extension: ProviderRegistryExtension;
  private readonly host: ProviderRegistryVscodeHost;
  private activationPromise: Promise<unknown> | null = null;

  constructor(params: {
    provider: BrokerProvider;
    extensionId: string;
    extension: ProviderRegistryExtension;
    host: ProviderRegistryVscodeHost;
  }) {
    this.provider = params.provider;
    this.extensionId = params.extensionId;
    this.extension = params.extension;
    this.host = params.host;
  }

  async getCommands(): Promise<string[]> {
    return listCommands(this.host);
  }

  async isCommandAvailable(commandId: string): Promise<boolean> {
    const commands = await this.getCommands();
    return commands.includes(commandId);
  }

  async getContextKeys(): Promise<string[]> {
    return listContextKeys(this.host);
  }

  async hasContextKey(key: string): Promise<boolean> {
    const contextKeys = await this.getContextKeys();
    return contextKeys.includes(key);
  }

  async activateExtension<T = unknown>(): Promise<T | undefined> {
    if (this.activationPromise) {
      return this.activationPromise as Promise<T | undefined>;
    }

    this.activationPromise = (async () => {
      if (this.extension.isActive && this.extension.exports !== undefined) {
        return this.extension.exports;
      }

      return this.extension.activate();
    })();

    return this.activationPromise as Promise<T | undefined>;
  }

  async getExports<T = unknown>(): Promise<T | undefined> {
    return this.activateExtension<T>();
  }
}

export class ProviderHostRegistry {
  private readonly host: ProviderRegistryVscodeHost;

  constructor(host: ProviderRegistryVscodeHost) {
    this.host = host;
  }

  async resolve(provider: BrokerProvider): Promise<ProviderHostResolution> {
    const extensionId = providerExtensionIds[provider];
    const extension = getExtension(this.host.extensions, extensionId);

    if (!extension) {
      return {
        provider,
        compatibility: 'incompatible',
        activationState: 'missing',
        providerExtension: {
          id: extensionId,
          version: 'missing',
        },
        commands: [],
        contextKeys: [],
        exportKeys: [],
        moduleExportKeys: [],
        host: null,
      };
    }

    const commands = await listCommands(this.host);
    const contextKeys = await listContextKeys(this.host);
    const probeHost = new RegistryProbeHost({
      provider,
      extensionId,
      extension,
      host: this.host,
    });

    try {
      const exportsValue = await probeHost.getExports();
      return {
        provider,
        compatibility: 'supported',
        activationState: 'active',
        providerExtension: {
          id: extensionId,
          version: getVersion(extension),
        },
        commands,
        contextKeys,
        exportKeys: getExportKeys(exportsValue),
        moduleExportKeys: getModuleExportKeys(extension),
        host: probeHost,
      };
    } catch {
      return {
        provider,
        compatibility: 'unknown',
        activationState: extension.isActive ? 'active' : 'inactive',
        providerExtension: {
          id: extensionId,
          version: getVersion(extension),
        },
        commands,
        contextKeys,
        exportKeys: [],
        moduleExportKeys: getModuleExportKeys(extension),
        host: null,
      };
    }
  }
}
