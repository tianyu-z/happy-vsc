import type { Href } from 'expo-router';
import type { Session } from '@/sync/storageTypes';

export interface SessionBackRouter {
    back(): void;
    canGoBack(): boolean;
    replace(href: Href): void;
}

export function createSessionHref(sessionId: string, returnTo?: string | null): Href {
    const sessionPath = `/session/${encodeURIComponent(sessionId)}`;

    if (!returnTo) {
        return sessionPath as Href;
    }

    return `${sessionPath}?returnTo=${encodeURIComponent(returnTo)}` as Href;
}

export function navigateBackFromSession(args: {
    router: SessionBackRouter;
    sessionId: string;
    session: Session | null | undefined;
    returnTo?: string | string[] | null;
}): void {
    const explicitReturnTo = normalizeSessionReturnTo(args.sessionId, args.returnTo);
    if (explicitReturnTo) {
        args.router.replace(explicitReturnTo);
        return;
    }

    if (args.router.canGoBack()) {
        args.router.back();
        return;
    }

    args.router.replace(getSessionFallbackHref(args.session));
}

function getSessionFallbackHref(session: Session | null | undefined): Href {
    const machineId = session?.metadata?.machineId;
    return (machineId ? `/machine/${machineId}` : '/') as Href;
}

function normalizeSessionReturnTo(sessionId: string, returnTo?: string | string[] | null): Href | null {
    const rawValue = Array.isArray(returnTo) ? returnTo[0] : returnTo;
    if (typeof rawValue !== 'string') {
        return null;
    }

    const trimmedValue = rawValue.trim();
    if (!trimmedValue) {
        return null;
    }

    const decodedValue = safelyDecodeURIComponent(trimmedValue);
    if (!decodedValue.startsWith('/')) {
        return null;
    }

    if (isSelfReferentialSessionPath(sessionId, decodedValue)) {
        return null;
    }

    return decodedValue as Href;
}

function safelyDecodeURIComponent(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function isSelfReferentialSessionPath(sessionId: string, href: string): boolean {
    const candidates = [
        `/session/${sessionId}`,
        `/session/${encodeURIComponent(sessionId)}`,
    ];

    return candidates.some((candidate) =>
        href === candidate
        || href.startsWith(`${candidate}/`)
        || href.startsWith(`${candidate}?`),
    );
}
