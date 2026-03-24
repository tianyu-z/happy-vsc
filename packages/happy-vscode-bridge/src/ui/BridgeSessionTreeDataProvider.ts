import type { BridgeBrokerDiscoveredSession } from '../runtime/types';
import type { CompanionRuntimeLike } from '../runtime/CompanionRuntime';

type TreeListener<T> = (value: T | undefined) => unknown;

type Disposable = {
  dispose(): unknown;
};

class SimpleEventEmitter<T> {
  private readonly listeners = new Set<TreeListener<T>>();

  readonly event = (listener: TreeListener<T>): Disposable => {
    this.listeners.add(listener);
    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  };

  fire(value: T | undefined): void {
    for (const listener of this.listeners) {
      listener(value);
    }
  }

  dispose(): void {
    this.listeners.clear();
  }
}

export type BridgeSessionTreeItem = {
  brokerSessionId: string;
  label: string;
  description: string;
  tooltip: string;
  contextValue: string;
};

function formatProvider(provider: BridgeBrokerDiscoveredSession['provider']): string {
  return provider === 'claude' ? 'Claude' : 'Codex';
}

function formatProbeLabel(session: BridgeBrokerDiscoveredSession): string {
  return session.effectiveMode === 'runtime'
    ? 'RuntimeProbe (Recommended)'
    : 'StorageProbe';
}

function formatStateLabel(session: BridgeBrokerDiscoveredSession): string | null {
  if (session.attachability === 'attachable_with_degraded_capabilities') {
    return 'degraded';
  }

  if (session.attachability === 'not_attachable') {
    return 'not attachable';
  }

  return null;
}

export class BridgeSessionTreeDataProvider {
  private readonly emitter = new SimpleEventEmitter<BridgeSessionTreeItem>();
  private readonly unsubscribe: () => void;

  readonly onDidChangeTreeData = this.emitter.event;

  constructor(private readonly runtime: CompanionRuntimeLike) {
    this.unsubscribe = this.runtime.subscribe(() => {
      this.refresh();
    });
  }

  async getChildren(): Promise<BridgeSessionTreeItem[]> {
    return this.runtime.listDiscoveredSessions().map((session) => {
      const parts = [formatProvider(session.provider), formatProbeLabel(session)];
      const stateLabel = formatStateLabel(session);
      if (stateLabel) {
        parts.push(stateLabel);
      }

      return {
        brokerSessionId: session.brokerSessionId,
        label: session.title,
        description: parts.join(' • '),
        tooltip: [
          `desired: ${session.desiredMode}`,
          `effective: ${session.effectiveMode}`,
          `mode reason: ${session.modeReason}`,
        ].join('\n'),
        contextValue: 'brokerSession',
      };
    });
  }

  getTreeItem(item: BridgeSessionTreeItem): BridgeSessionTreeItem {
    return item;
  }

  refresh(): void {
    this.emitter.fire(undefined);
  }

  dispose(): void {
    this.unsubscribe();
    this.emitter.dispose();
  }
}
