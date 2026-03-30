export type BrokerStripMode = 'expanded' | 'collapsed' | 'hidden';

export type BrokerStripStateListener = (mode: BrokerStripMode) => void;

export interface BrokerStripStateController {
    readonly mode: BrokerStripMode;
    subscribe: (listener: BrokerStripStateListener) => () => void;
    onEnter: () => void;
    onScroll: (offsetY: number) => void;
    onUserMessageSent: () => void;
    onAssistantDelta: () => void;
    hide: () => void;
    dispose: () => void;
}

const AUTO_COLLAPSE_MS = 3_000;
const SCROLL_COLLAPSE_THRESHOLD_PX = 24;

export function createBrokerStripStateController(): BrokerStripStateController {
    let mode: BrokerStripMode = 'expanded';
    let collapseTimer: ReturnType<typeof setTimeout> | null = null;

    const listeners = new Set<BrokerStripStateListener>();

    const clearCollapseTimer = () => {
        if (collapseTimer) {
            clearTimeout(collapseTimer);
            collapseTimer = null;
        }
    };

    const emit = () => {
        for (const listener of listeners) {
            listener(mode);
        }
    };

    const collapse = () => {
        if (mode !== 'expanded') {
            return;
        }

        clearCollapseTimer();
        mode = 'collapsed';
        emit();
    };

    const scheduleAutoCollapse = () => {
        if (mode !== 'expanded' || collapseTimer) {
            return;
        }

        collapseTimer = setTimeout(() => {
            collapseTimer = null;
            collapse();
        }, AUTO_COLLAPSE_MS);
    };

    scheduleAutoCollapse();

    return {
        get mode() {
            return mode;
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        onEnter() {
            scheduleAutoCollapse();
        },
        onScroll(offsetY) {
            if (offsetY > SCROLL_COLLAPSE_THRESHOLD_PX) {
                collapse();
            }
        },
        onUserMessageSent() {
            collapse();
        },
        onAssistantDelta() {
            collapse();
        },
        hide() {
            if (mode === 'hidden') {
                return;
            }

            clearCollapseTimer();
            mode = 'hidden';
            emit();
        },
        dispose() {
            clearCollapseTimer();
            listeners.clear();
        },
    };
}
