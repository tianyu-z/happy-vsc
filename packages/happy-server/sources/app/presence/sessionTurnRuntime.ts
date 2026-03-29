export type SessionTurnState = {
    thinking: boolean;
    awaitingTurnStart: boolean;
    awaitingTurnStartAt: number | null;
    dispatching: boolean;
    lastHeartbeatAt: number;
};

/**
 * Per-session runtime state machine:
 * - idle (thinking=false, awaitingTurnStart=false, dispatching=false)
 * - dispatching (beginDispatch -> dispatching=true)
 * - awaitingTurnStart (markDispatched after enqueue/send-now/direct-send)
 * - thinking (markTurnStarted / thinking heartbeat true)
 * - back to idle (thinking heartbeat false and no awaiting/dispatching)
 *
 * Note: this is an in-memory coordination guard for a single server process.
 * Cross-process ordering must be enforced by database-side operations.
 */
const runtimeBySession = new Map<string, SessionTurnState>();
const AWAITING_TURN_START_TIMEOUT_MS = 30_000;
const THINKING_HEARTBEAT_TIMEOUT_MS = 30_000;

function pruneExpiredAwaitingTurnStart(state: SessionTurnState, nowMs: number = Date.now()): void {
    if (!state.awaitingTurnStart || state.awaitingTurnStartAt === null) {
        return;
    }

    if (nowMs - state.awaitingTurnStartAt >= AWAITING_TURN_START_TIMEOUT_MS) {
        state.awaitingTurnStart = false;
        state.awaitingTurnStartAt = null;
    }
}

function pruneExpiredThinking(state: SessionTurnState, nowMs: number = Date.now()): void {
    if (!state.thinking || state.lastHeartbeatAt <= 0) {
        return;
    }

    if (nowMs - state.lastHeartbeatAt >= THINKING_HEARTBEAT_TIMEOUT_MS) {
        state.thinking = false;
    }
}

function ensureSessionState(sessionId: string, nowMs: number = Date.now()): SessionTurnState {
    const existing = runtimeBySession.get(sessionId);
    if (existing) {
        pruneExpiredAwaitingTurnStart(existing, nowMs);
        pruneExpiredThinking(existing, nowMs);
        return existing;
    }

    const created: SessionTurnState = {
        thinking: false,
        awaitingTurnStart: false,
        awaitingTurnStartAt: null,
        dispatching: false,
        lastHeartbeatAt: 0,
    };
    runtimeBySession.set(sessionId, created);
    return created;
}

export function getSessionTurnState(sessionId: string, nowMs: number = Date.now()): SessionTurnState {
    return { ...ensureSessionState(sessionId, nowMs) };
}

export function isSessionThinking(sessionId: string): boolean {
    return ensureSessionState(sessionId).thinking;
}

export function isSessionBusy(sessionId: string): boolean {
    const state = ensureSessionState(sessionId);
    return state.thinking || state.awaitingTurnStart || state.dispatching;
}

export function canDispatch(sessionId: string): boolean {
    const state = ensureSessionState(sessionId);
    return !state.thinking && !state.awaitingTurnStart && !state.dispatching;
}

export function beginDispatch(sessionId: string): boolean {
    const state = ensureSessionState(sessionId);
    if (!canDispatch(sessionId)) {
        return false;
    }

    state.dispatching = true;
    return true;
}

export function finishDispatch(sessionId: string): void {
    const state = ensureSessionState(sessionId);
    state.dispatching = false;
}

export function markDispatched(sessionId: string): void {
    const state = ensureSessionState(sessionId);
    state.awaitingTurnStart = true;
    state.awaitingTurnStartAt = Date.now();
}

export function markTurnStarted(sessionId: string): void {
    const state = ensureSessionState(sessionId);
    state.thinking = true;
    state.awaitingTurnStart = false;
    state.awaitingTurnStartAt = null;
    state.dispatching = false;
}

export function updateThinkingState(sessionId: string, thinking: boolean, timestampMs: number): {
    thinkingChanged: boolean;
    turnStarted: boolean;
    turnEnded: boolean;
    current: SessionTurnState;
} {
    const state = ensureSessionState(sessionId, timestampMs);
    const previousThinking = state.thinking;

    if (thinking) {
        markTurnStarted(sessionId);
    } else {
        state.thinking = false;
    }

    state.lastHeartbeatAt = timestampMs;

    const turnStarted = !previousThinking && thinking;
    const turnEnded = previousThinking && !thinking;

    return {
        thinkingChanged: previousThinking !== thinking,
        turnStarted,
        turnEnded,
        current: { ...state },
    };
}

export function clearSessionTurnState(sessionId: string): void {
    runtimeBySession.delete(sessionId);
}

export function __resetSessionTurnRuntimeForTests(): void {
    runtimeBySession.clear();
}
