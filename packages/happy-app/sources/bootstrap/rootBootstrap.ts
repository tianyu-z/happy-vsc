import type { AuthCredentials } from '@/auth/tokenStorage';

export type RootBootstrapResult = {
    credentials: AuthCredentials | null;
};

export type RootBootstrapDeps = {
    loadFonts: () => Promise<void>;
    awaitSodiumReady: () => Promise<void>;
    getCredentials: () => Promise<AuthCredentials | null>;
    restoreSync: (credentials: AuthCredentials) => Promise<void>;
    removeCredentials: () => Promise<boolean>;
    logError?: (...args: unknown[]) => void;
    timeoutMs?: number;
};

export async function bootstrapRootApp(
    deps: RootBootstrapDeps,
): Promise<RootBootstrapResult> {
    const timeoutMs = deps.timeoutMs ?? 8000;

    try {
        await withTimeout(deps.loadFonts(), timeoutMs, 'loadFonts');
        await withTimeout(deps.awaitSodiumReady(), timeoutMs, 'awaitSodiumReady');

        const credentials = await withTimeout(deps.getCredentials(), timeoutMs, 'getCredentials');
        if (!credentials) {
            return { credentials: null };
        }

        try {
            await withTimeout(deps.restoreSync(credentials), timeoutMs, 'restoreSync');
            return { credentials };
        } catch (error) {
            deps.logError?.('Error restoring credentials during app bootstrap:', error);
            await deps.removeCredentials();
            return { credentials: null };
        }
    } catch (error) {
        deps.logError?.('Error initializing app bootstrap:', error);
        return { credentials: null };
    }
}

function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    step: string,
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`Bootstrap step timed out: ${step}`));
        }, timeoutMs);

        promise.then(
            (value) => {
                clearTimeout(timeoutId);
                resolve(value);
            },
            (error) => {
                clearTimeout(timeoutId);
                reject(error);
            },
        );
    });
}
