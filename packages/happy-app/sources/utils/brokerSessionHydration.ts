export const BROKER_SESSION_HYDRATION_WINDOW_MS = 15_000;

export function shouldShowBrokerHydrationPlaceholder(args: {
    sessionSource?: string | null;
    createdAt: number;
    now?: number;
    isLoaded: boolean;
    messageCount: number;
    silentRefreshPhase: 'idle' | 'refreshing' | 'failed';
}): boolean {
    if (args.sessionSource !== 'broker_attached') {
        return false;
    }

    if (!args.isLoaded || args.messageCount > 0 || args.silentRefreshPhase === 'failed') {
        return false;
    }

    const now = args.now ?? Date.now();
    return now - args.createdAt <= BROKER_SESSION_HYDRATION_WINDOW_MS;
}
