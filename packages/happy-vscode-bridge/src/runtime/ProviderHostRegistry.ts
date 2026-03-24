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
  };
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

function getExtension(
  extensions: ExtensionLookup,
  extensionId: string,
): ProviderRegistryExtension | undefined {
  if (Array.isArray(extensions)) {
    return extensions.find((extension) => extension.id === extensionId);
  }

  return extensions.get(extensionId);
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
        host: null,
      };
    }
  }
}
