import type { CompanionRuntimeLike } from '../runtime/CompanionRuntime';

type Disposable = {
  dispose(): unknown;
};

type StatusBarItem = Disposable & {
  text: string;
  tooltip?: string;
  command?: string;
  show(): unknown;
};

type StatusBarHost = {
  window: {
    createStatusBarItem(): StatusBarItem;
  };
};

type CreateBridgeStatusBarOptions = {
  runtime: CompanionRuntimeLike;
  vscode: StatusBarHost;
};

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function createBridgeStatusBar(options: CreateBridgeStatusBarOptions): Disposable {
  const item = options.vscode.window.createStatusBarItem();

  const update = () => {
    const sessions = options.runtime.listDiscoveredSessions();
    const degradedCount = sessions.filter(
      (session) => session.attachability === 'attachable_with_degraded_capabilities',
    ).length;

    item.text = `Happy Companion: ${pluralize(sessions.length, 'session')} • ${pluralize(
      degradedCount,
      'degraded',
    )}`;
    item.tooltip = 'Happy Companion broker runtime';
    item.command = 'happyVscodeBridge.refreshSessions';
  };

  const unsubscribe = options.runtime.subscribe(update);
  update();
  item.show();

  return {
    dispose() {
      unsubscribe();
      item.dispose();
    },
  };
}
