import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import type { BrokerProvider } from 'happy-wire';

import type { ProviderEvent } from '../providers/types';
import {
  getTrackedCodexViewState,
  type ProviderRuntimeCaptureRegistry,
} from './ProviderRuntimeCapture';
import { ClaudeRuntimeProbe } from './probes/claude/ClaudeRuntimeProbe';
import { ClaudeStorageProbe } from './probes/claude/ClaudeStorageProbe';
import { CodexRuntimeProbe } from './probes/codex/CodexRuntimeProbe';
import { CodexStorageProbe } from './probes/codex/CodexStorageProbe';
import type { ProviderProbeFactory } from './CompanionRuntime';
import type { ProviderHostResolution } from './probes/types';
import type {
  RuntimeSessionBridgeDiagnostic,
  WorkspaceLocator,
} from './types';

type CommandExecutor = <T = unknown>(
  commandId: string,
  ...args: unknown[]
) => Promise<T>;

type UriFactory = (value: string) => unknown;

type BridgeUriLike = {
  scheme?: string;
  authority?: string;
  path?: string;
  fsPath?: string;
};

type BridgeTabLike = {
  label?: string;
  input?: {
    uri?: BridgeUriLike;
  };
};

type DefaultProbeFactoryOptions = {
  extensionLogPath?: string;
  workspace?: WorkspaceLocator;
  commandExecutor?: CommandExecutor;
  createUri?: UriFactory;
  listTabs?: () => BridgeTabLike[] | Promise<BridgeTabLike[]>;
  watchPollMs?: number;
  providerCaptures?: ProviderRuntimeCaptureRegistry;
  now?: () => number;
};

type ParsedSession = {
  providerSessionRef: string;
  title: string;
  latestSeq: number;
  conversationId: string;
  runtimeChannelRef?: string;
  workspace: WorkspaceLocator;
};

type CancellationTokenLike = {
  isCancellationRequested?: boolean;
  onCancellationRequested?: (
    listener: () => void,
  ) => {
    dispose(): unknown;
  };
};

type CodexCapturedChatSessionItem = {
  id?: string;
  label?: string;
  resource?: BridgeUriLike;
};

type CodexCapturedChatSessionProvider = {
  provideChatSessionItems?: (
    token?: CancellationTokenLike,
  ) => Promise<Iterable<unknown> | unknown[] | null | undefined> |
    Iterable<unknown> |
    unknown[] |
    null |
    undefined;
};

type CodexCapturedChatSessionController = {
  refreshHandler?: (
    token?: CancellationTokenLike,
  ) => Promise<unknown> | unknown;
  items?: Iterable<unknown> | unknown;
};

type CodexCapturedViewPanelState = {
  initialRoute?: unknown;
};

type CodexCapturedViewProvider = {
  editorPanels?: Iterable<unknown> | {
    entries?(): Iterable<unknown>;
  };
};

const exthostDirPattern = /^exthost\d+$/;
const claudeLogPattern = /^Claude VSCode(?:\.\d+)?\.log$/;
const codexLogPattern = /^Codex(?:\.\d+)?\.log$/;
const claudeMarker = 'Received message from webview: ';
const codexThreadPattern = /running thread ([0-9a-f-]{16,})/i;
const codexConversationIdPattern = /conversationId[:=]\s*([0-9a-f-]{16,})/i;
const codexResumeSuccessPattern =
  /maybe_resume_success conversationId=([0-9a-f-]{16,}).*?latestTurnStatus=([a-z_]+)/i;
const claudeOpenSessionCommandId = 'claude-vscode.primaryEditor.open';
const codexOpenCommandId = 'vscode.open';
const codexOpenWithCommandId = 'vscode.openWith';
const codexConversationEditorViewType = 'chatgpt.conversationEditor';
const codexTypeCommandId = 'type';
const codexFocusInputCommandId = 'workbench.action.chat.focusInput';
const codexSubmitCommandId = 'workbench.action.chat.submit';
const codexCancelCommandId = 'workbench.action.chat.cancel';
const codexUriScheme = 'openai-codex';
const codexUriAuthority = 'route';
const defaultWatchPollMs = 250;
const codexRecentFallbackWindowMs = 7 * 24 * 60 * 60 * 1000;
const codexRecentFallbackLimit = 5;
const codexRuntimeSendCommandIds = [
  codexTypeCommandId,
  codexFocusInputCommandId,
  codexSubmitCommandId,
] as const;
const emptyCancellationSubscription = {
  dispose() {},
};
const noCancellationToken: CancellationTokenLike = {
  isCancellationRequested: false,
  onCancellationRequested: () => emptyCancellationSubscription,
};

type ClaudeLogRequest = {
  type?: string;
  sessionId?: string;
  title?: string;
  state?: string;
};

type ClaudeLogEnvelope = {
  type?: string;
  channelId?: string;
  resume?: string;
  request?: ClaudeLogRequest;
};

type ClaudeCapturedComm = {
  channels?: {
    has?(ref: string): boolean;
  };
  interruptClaude?: (ref: string) => Promise<void>;
  listSessions?: () => Promise<unknown> | unknown;
};

type ClaudeCapturedProvider = {
  allComms?: Iterable<unknown>;
  sessionStates?: Iterable<unknown> | {
    values?(): Iterable<unknown>;
  };
  activeSessionId?: string;
};

type ClaudeCapturedListSessionsResponse = {
  sessions?: Iterable<unknown> | unknown[] | null | undefined;
};

type ClaudeCapturedHistorySession = {
  id?: string;
  summary?: string;
  lastModified?: number;
};

type ClaudeCapturedSessionState = {
  sessionId?: string;
  title?: string;
};

type ClaudeInterruptBridgeState =
  | 'ready'
  | 'provider_not_captured'
  | 'comm_collection_missing'
  | 'runtime_channel_missing'
  | 'comm_not_found'
  | 'interrupt_method_missing';

type ClaudeInterruptBridgeInspection = {
  state: ClaudeInterruptBridgeState;
  commMatched: boolean;
  comm: ClaudeCapturedComm | null;
};

export function resolveExthostLogDir(
  extensionLogPath: string | undefined,
): string | null {
  if (!extensionLogPath) {
    return null;
  }

  let current = extensionLogPath;
  while (true) {
    if (exthostDirPattern.test(basename(current))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

async function readMatchingLogs(
  directoryPath: string,
  filePattern: RegExp,
): Promise<string[]> {
  const logNames = await listMatchingLogNames(directoryPath, filePattern);
  const contents = await Promise.all(
    logNames.map(async (name) => {
      try {
        return await readFile(join(directoryPath, name), 'utf8');
      } catch {
        return '';
      }
    }),
  );

  return contents.filter((content) => content.length > 0);
}

async function listMatchingLogNames(
  directoryPath: string,
  filePattern: RegExp,
): Promise<string[]> {
  let names: string[];
  try {
    names = await readdir(directoryPath);
  } catch {
    return [];
  }

  return names.filter((name) => filePattern.test(name)).sort();
}

async function listMatchingLogPaths(
  directoryPath: string,
  filePattern: RegExp,
): Promise<string[]> {
  const names = await listMatchingLogNames(directoryPath, filePattern);
  return names.map((name) => join(directoryPath, name));
}

function parseClaudeLogRequest(line: string): ClaudeLogRequest | null {
  const parsed = parseClaudeLogEnvelope(line);
  return parsed?.request ?? null;
}

function parseClaudeLogEnvelope(line: string): ClaudeLogEnvelope | null {
  const markerIndex = line.indexOf(claudeMarker);
  if (markerIndex === -1) {
    return null;
  }

  const payload = line.slice(markerIndex + claudeMarker.length).trim();
  if (!payload.startsWith('{')) {
    return null;
  }

  try {
    return JSON.parse(payload) as ClaudeLogEnvelope;
  } catch {
    return null;
  }
}

function parseClaudeLogs(
  contents: string[],
  workspace: WorkspaceLocator,
): ParsedSession[] {
  const sessions = new Map<
    string,
    {
      title?: string;
      latestSeq: number;
      runtimeChannelRef?: string;
    }
  >();
  let seq = 0;

  for (const content of contents) {
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const message = parseClaudeLogEnvelope(line);
      if (
        message?.type === 'launch_claude' &&
        typeof message.resume === 'string' &&
        message.resume.trim().length > 0 &&
        typeof message.channelId === 'string' &&
        message.channelId.trim().length > 0
      ) {
        const providerSessionRef = message.resume.trim();
        const record = sessions.get(providerSessionRef) ?? {
          latestSeq: 0,
        };
        record.latestSeq = ++seq;
        record.runtimeChannelRef = message.channelId.trim();
        sessions.set(providerSessionRef, record);
      }

      const request = message?.request;
      if (!request?.sessionId) {
        continue;
      }

      const record = sessions.get(request.sessionId) ?? {
        latestSeq: 0,
      };
      const nextSeq = ++seq;
      record.latestSeq = nextSeq;
      if (typeof request.title === 'string' && request.title.trim().length > 0) {
        record.title = request.title.trim();
      }
      sessions.set(request.sessionId, record);
    }
  }

  return Array.from(sessions.entries()).map(([providerSessionRef, record]) => ({
    providerSessionRef,
    title: record.title ?? 'Claude Session',
    latestSeq: record.latestSeq,
    conversationId: providerSessionRef,
    runtimeChannelRef: record.runtimeChannelRef,
    workspace,
  }));
}

function mapClaudeStateToRunStatus(
  state: string | undefined,
): 'idle' | 'running' | null {
  switch (state) {
    case 'idle':
      return 'idle';
    case 'running':
      return 'running';
    default:
      return null;
  }
}

function parseClaudeSessionStateEvent(
  line: string,
  providerSessionRef: string,
): ProviderEvent | null {
  const request = parseClaudeLogRequest(line);
  if (
    !request ||
    request.type !== 'update_session_state' ||
    request.sessionId !== providerSessionRef
  ) {
    return null;
  }

  const status = mapClaudeStateToRunStatus(request.state);
  if (!status) {
    return null;
  }

  return {
    type: 'session.run.status',
    payload: {
      status,
    },
  };
}

function consumeClaudeLogChunk(params: {
  chunk: string;
  providerSessionRef: string;
  remainder: string;
  onEvent: (event: ProviderEvent) => void;
}): string {
  const buffered = params.remainder + params.chunk;
  const lines = buffered.split(/\r?\n/);
  const endsWithNewline = buffered.endsWith('\n') || buffered.endsWith('\r');
  const completeLines = endsWithNewline ? lines : lines.slice(0, -1);

  for (const line of completeLines) {
    const event = parseClaudeSessionStateEvent(line, params.providerSessionRef);
    if (event) {
      params.onEvent(event);
    }
  }

  if (endsWithNewline) {
    return '';
  }

  const trailingLine = lines.at(-1) ?? '';
  const trailingEvent = parseClaudeSessionStateEvent(
    trailingLine,
    params.providerSessionRef,
  );
  if (trailingEvent) {
    params.onEvent(trailingEvent);
    return '';
  }

  return trailingLine;
}

function mapCodexTurnStatusToRunStatus(
  status: string | undefined,
):
  | 'idle'
  | 'running'
  | 'waiting_approval'
  | 'interrupted'
  | 'completed'
  | 'failed'
  | null {
  switch (status?.toLowerCase()) {
    case 'idle':
      return 'idle';
    case 'running':
    case 'streaming':
    case 'in_progress':
    case 'in-progress':
      return 'running';
    case 'waiting_approval':
    case 'awaiting_approval':
    case 'approval_required':
      return 'waiting_approval';
    case 'interrupted':
    case 'cancelled':
    case 'canceled':
      return 'interrupted';
    case 'completed':
    case 'complete':
      return 'completed';
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return null;
  }
}

function parseCodexSessionStateEvent(
  line: string,
  providerSessionRef: string,
): ProviderEvent | null {
  const runningMatch = line.match(codexThreadPattern);
  if (runningMatch?.[1] === providerSessionRef) {
    return {
      type: 'session.run.status',
      payload: {
        status: 'running',
      },
    };
  }

  const resumeMatch = line.match(codexResumeSuccessPattern);
  if (!resumeMatch || resumeMatch[1] !== providerSessionRef) {
    return null;
  }

  const status = mapCodexTurnStatusToRunStatus(resumeMatch[2]);
  if (!status) {
    return null;
  }

  return {
    type: 'session.run.status',
    payload: {
      status,
    },
  };
}

function consumeCodexLogChunk(params: {
  chunk: string;
  providerSessionRef: string;
  remainder: string;
  onEvent: (event: ProviderEvent) => void;
}): string {
  const buffered = params.remainder + params.chunk;
  const lines = buffered.split(/\r?\n/);
  const endsWithNewline = buffered.endsWith('\n') || buffered.endsWith('\r');
  const completeLines = endsWithNewline ? lines : lines.slice(0, -1);

  for (const line of completeLines) {
    const event = parseCodexSessionStateEvent(line, params.providerSessionRef);
    if (event) {
      params.onEvent(event);
    }
  }

  if (endsWithNewline) {
    return '';
  }

  const trailingLine = lines.at(-1) ?? '';
  const trailingEvent = parseCodexSessionStateEvent(
    trailingLine,
    params.providerSessionRef,
  );
  if (trailingEvent) {
    params.onEvent(trailingEvent);
    return '';
  }

  return trailingLine;
}

function findClaudeInterruptComm(
  providerCapture: unknown,
  runtimeChannelRef: string,
): ClaudeCapturedComm | null {
  return inspectClaudeInterruptBridge(providerCapture, runtimeChannelRef).comm;
}

function inspectClaudeInterruptBridge(
  providerCapture: unknown,
  runtimeChannelRef: string | undefined,
): ClaudeInterruptBridgeInspection {
  if (!providerCapture) {
    return {
      state: 'provider_not_captured',
      commMatched: false,
      comm: null,
    };
  }

  if (!runtimeChannelRef) {
    return {
      state: 'runtime_channel_missing',
      commMatched: false,
      comm: null,
    };
  }

  const allComms = (providerCapture as ClaudeCapturedProvider | null | undefined)
    ?.allComms;
  if (!allComms) {
    return {
      state: 'comm_collection_missing',
      commMatched: false,
      comm: null,
    };
  }

  for (const candidate of allComms) {
    const comm = candidate as ClaudeCapturedComm;
    if (
      typeof comm.channels?.has === 'function' &&
      comm.channels.has(runtimeChannelRef)
    ) {
      if (typeof comm.interruptClaude === 'function') {
        return {
          state: 'ready',
          commMatched: true,
          comm,
        };
      }

      return {
        state: 'interrupt_method_missing',
        commMatched: true,
        comm: null,
      };
    }
  }

  return {
    state: 'comm_not_found',
    commMatched: false,
    comm: null,
  };
}

function buildClaudeBridgeDiagnostics(
  providerSessionRef: string,
  runtimeChannelRef: string | undefined,
  providerCapture: unknown,
): RuntimeSessionBridgeDiagnostic {
  const inspection = inspectClaudeInterruptBridge(providerCapture, runtimeChannelRef);

  return {
    runtimeProviderSessionRef: providerSessionRef,
    runtimeChannelRef: runtimeChannelRef ?? null,
    interruptBridgeState: inspection.state,
    interruptCommMatched: inspection.commMatched,
  };
}

function unwrapClaudeCapturedSessionHistory(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  return toArray(
    (response as ClaudeCapturedListSessionsResponse | null | undefined)?.sessions,
  );
}

function unwrapClaudeCapturedSessionStates(value: unknown): unknown[] {
  const values = (value as {
    values?: () => Iterable<unknown>;
  } | null | undefined)?.values;
  if (typeof values === 'function') {
    try {
      return Array.from(values.call(value));
    } catch {
      return [];
    }
  }

  return unwrapCapturedChatSessionItems(
    value as Iterable<unknown> | unknown[] | null | undefined,
  );
}

function parseClaudeCapturedHistorySession(
  item: unknown,
  workspace: WorkspaceLocator,
  fallbackSeq: number,
): ParsedSession | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const capturedSession = item as ClaudeCapturedHistorySession;
  const providerSessionRef =
    typeof capturedSession.id === 'string' &&
    capturedSession.id.trim().length > 0
      ? capturedSession.id.trim()
      : null;
  if (!providerSessionRef) {
    return null;
  }

  const title =
    typeof capturedSession.summary === 'string' &&
    capturedSession.summary.trim().length > 0
      ? capturedSession.summary.trim()
      : 'Claude Session';
  const latestSeq =
    typeof capturedSession.lastModified === 'number' &&
    Number.isFinite(capturedSession.lastModified)
      ? Math.trunc(capturedSession.lastModified)
      : fallbackSeq;

  return {
    providerSessionRef,
    title,
    latestSeq,
    conversationId: providerSessionRef,
    workspace,
  };
}

function parseClaudeCapturedSessionState(
  item: unknown,
  workspace: WorkspaceLocator,
  fallbackSeq: number,
): ParsedSession | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const sessionState = item as ClaudeCapturedSessionState;
  const providerSessionRef =
    typeof sessionState.sessionId === 'string' &&
    sessionState.sessionId.trim().length > 0
      ? sessionState.sessionId.trim()
      : null;
  if (!providerSessionRef) {
    return null;
  }

  const title =
    typeof sessionState.title === 'string' &&
    sessionState.title.trim().length > 0
      ? sessionState.title.trim()
      : 'Claude Session';

  return {
    providerSessionRef,
    title,
    latestSeq: fallbackSeq,
    conversationId: providerSessionRef,
    workspace,
  };
}

async function discoverCapturedClaudeSessions(
  providerCapture: unknown,
  workspace: WorkspaceLocator,
): Promise<ParsedSession[]> {
  const capturedProvider =
    providerCapture as ClaudeCapturedProvider | null | undefined;
  if (!capturedProvider) {
    return [];
  }

  const sessions = new Map<string, ParsedSession>();
  let seq = 0;

  const addSession = (session: ParsedSession | null) => {
    if (!session || sessions.has(session.providerSessionRef)) {
      return;
    }

    sessions.set(session.providerSessionRef, session);
  };

  for (const candidate of toArray(capturedProvider.allComms)) {
    const comm = candidate as ClaudeCapturedComm;
    if (typeof comm.listSessions !== 'function') {
      continue;
    }

    let response: unknown;
    try {
      response = await comm.listSessions.call(candidate);
    } catch {
      continue;
    }

    for (const item of unwrapClaudeCapturedSessionHistory(response)) {
      addSession(
        parseClaudeCapturedHistorySession(
          item,
          workspace,
          ++seq,
        ),
      );
    }
  }

  for (const item of unwrapClaudeCapturedSessionStates(
    capturedProvider.sessionStates,
  )) {
    addSession(
      parseClaudeCapturedSessionState(
        item,
        workspace,
        ++seq,
      ),
    );
  }

  return Array.from(sessions.values());
}

function parseCodexLogs(
  contents: string[],
  workspace: WorkspaceLocator,
): ParsedSession[] {
  const sessions = new Map<string, number>();
  let seq = 0;

  for (const content of contents) {
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const match =
        line.match(codexThreadPattern) ?? line.match(codexConversationIdPattern);
      if (!match?.[1]) {
        continue;
      }

      sessions.set(match[1], ++seq);
    }
  }

  return Array.from(sessions.entries()).map(([providerSessionRef, latestSeq]) => ({
    providerSessionRef,
    title: `Codex Thread ${providerSessionRef.slice(0, 8)}`,
    latestSeq,
    conversationId: providerSessionRef,
    workspace,
  }));
}

function parseCodexConversationUri(
  uri: BridgeUriLike | undefined,
): string | null {
  if (!uri) {
    return null;
  }

  if (uri.scheme !== codexUriScheme || uri.authority !== codexUriAuthority) {
    return null;
  }

  return parseCodexRouteSessionRef(uri.path);
}

function parseCodexRouteSessionRef(
  path: string | null | undefined,
): string | null {
  const segments = (path?.startsWith('/') ? path.slice(1) : path ?? '')
    .split('/')
    .filter((segment: string) => segment.length > 0);
  if (segments.length < 2) {
    return null;
  }

  if (segments[0] !== 'local' && segments[0] !== 'remote') {
    return null;
  }

  return segments[1] ?? null;
}

function toArray(value: Iterable<unknown> | unknown[] | null | undefined): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value &&
    typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] ===
      'function'
  ) {
    return Array.from(value as Iterable<unknown>);
  }

  return [];
}

function toEntryArray(value: unknown): [unknown, unknown][] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        Array.isArray(entry) && entry.length >= 2
          ? ([entry[0], entry[1]] as [unknown, unknown])
          : null,
      )
      .filter((entry): entry is [unknown, unknown] => entry !== null);
  }

  if (
    typeof (value as { entries?: unknown }).entries === 'function'
  ) {
    try {
      return toArray(
        (
          value as {
            entries(): Iterable<unknown> | unknown[];
          }
        ).entries(),
      )
        .map((entry) =>
          Array.isArray(entry) && entry.length >= 2
            ? ([entry[0], entry[1]] as [unknown, unknown])
            : null,
        )
        .filter((entry): entry is [unknown, unknown] => entry !== null);
    } catch {
      return [];
    }
  }

  if (
    typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] !==
      'function'
  ) {
    return [];
  }

  return toArray(value as Iterable<unknown>)
    .map((entry) =>
      Array.isArray(entry) && entry.length >= 2
        ? ([entry[0], entry[1]] as [unknown, unknown])
        : null,
    )
    .filter((entry): entry is [unknown, unknown] => entry !== null);
}

function unwrapCapturedChatSessionItems(
  value: Iterable<unknown> | unknown[] | null | undefined,
): unknown[] {
  return toArray(value).map((entry) => {
    if (Array.isArray(entry) && entry.length >= 2) {
      return entry[1];
    }

    return entry;
  });
}

function parseCodexCapturedChatSessionItem(
  item: unknown,
  workspace: WorkspaceLocator,
  latestSeq: number,
): ParsedSession | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const chatSessionItem = item as CodexCapturedChatSessionItem;
  const providerSessionRef =
    parseCodexConversationUri(chatSessionItem.resource) ??
    (typeof chatSessionItem.id === 'string' && chatSessionItem.id.trim().length > 0
      ? chatSessionItem.id.trim()
      : null);
  if (!providerSessionRef) {
    return null;
  }

  const title =
    typeof chatSessionItem.label === 'string' &&
    chatSessionItem.label.trim().length > 0
      ? chatSessionItem.label.trim()
      : `Codex Thread ${providerSessionRef.slice(0, 8)}`;

  return {
    providerSessionRef,
    title,
    latestSeq,
    conversationId: providerSessionRef,
    workspace,
  };
}

function parseCodexCapturedViewPanelSession(
  panelState: unknown,
  workspace: WorkspaceLocator,
  latestSeq: number,
): ParsedSession | null {
  if (!panelState || typeof panelState !== 'object') {
    return null;
  }

  const providerSessionRef = parseCodexRouteSessionRef(
    (panelState as CodexCapturedViewPanelState).initialRoute as string | null | undefined,
  );
  if (!providerSessionRef) {
    return null;
  }

  return {
    providerSessionRef,
    title: `Codex Thread ${providerSessionRef.slice(0, 8)}`,
    latestSeq,
    conversationId: providerSessionRef,
    workspace,
  };
}

async function discoverCapturedCodexSessions(
  providerCapture: unknown,
  workspace: WorkspaceLocator,
): Promise<ParsedSession[]> {
  const provideChatSessionItems = (
    providerCapture as CodexCapturedChatSessionProvider | null | undefined
  )?.provideChatSessionItems;

  let items: Iterable<unknown> | unknown[] | null | undefined;
  if (typeof provideChatSessionItems === 'function') {
    try {
      items = await provideChatSessionItems.call(
        providerCapture,
        noCancellationToken,
      );
    } catch {
      return [];
    }
  } else {
    const controller =
      providerCapture as CodexCapturedChatSessionController | null | undefined;
    if (typeof controller?.refreshHandler !== 'function') {
      return [];
    }

    try {
      await controller.refreshHandler.call(
        providerCapture,
        noCancellationToken,
      );
    } catch {
      return [];
    }

    items = controller.items as Iterable<unknown> | unknown[] | null | undefined;
  }

  const sessions = new Map<string, ParsedSession>();
  let seq = 0;
  for (const item of unwrapCapturedChatSessionItems(items)) {
    const session = parseCodexCapturedChatSessionItem(
      item,
      workspace,
      ++seq,
    );
    if (!session) {
      continue;
    }

    sessions.set(session.providerSessionRef, session);
  }

  return Array.from(sessions.values());
}

function discoverCapturedCodexViewSessions(
  providerCapture: unknown,
  workspace: WorkspaceLocator,
): ParsedSession[] {
  const editorPanels = (
    providerCapture as CodexCapturedViewProvider | null | undefined
  )?.editorPanels;
  const sessions = new Map<string, ParsedSession>();
  let seq = 0;

  for (const [, panelState] of toEntryArray(editorPanels)) {
    const session = parseCodexCapturedViewPanelSession(
      panelState,
      workspace,
      ++seq,
    );
    if (!session) {
      continue;
    }

    sessions.set(session.providerSessionRef, session);
  }

  const trackedViewState = getTrackedCodexViewState(providerCapture);
  const trackedRefs = [
    ...(trackedViewState?.sidebarSessionRef
      ? [trackedViewState.sidebarSessionRef]
      : []),
    ...(trackedViewState?.panelSessionRefs ?? []),
  ];
  for (const providerSessionRef of trackedRefs) {
    if (sessions.has(providerSessionRef)) {
      continue;
    }

    sessions.set(providerSessionRef, {
      providerSessionRef,
      title: `Codex Thread ${providerSessionRef.slice(0, 8)}`,
      latestSeq: ++seq,
      conversationId: providerSessionRef,
      workspace,
    });
  }

  return Array.from(sessions.values());
}

async function discoverCodexTabs(
  listTabs: DefaultProbeFactoryOptions['listTabs'],
  workspace: WorkspaceLocator,
): Promise<ParsedSession[]> {
  if (!listTabs) {
    return [];
  }

  const tabs = await listTabs();
  const sessions = new Map<string, ParsedSession>();
  let seq = 0;

  for (const tab of tabs) {
    const providerSessionRef = parseCodexConversationUri(tab.input?.uri);
    if (!providerSessionRef) {
      continue;
    }

    const title = typeof tab.label === 'string' ? tab.label.trim() : '';
    sessions.set(providerSessionRef, {
      providerSessionRef,
      title: title.length > 0 ? title : `Codex Thread ${providerSessionRef.slice(0, 8)}`,
      latestSeq: ++seq,
      conversationId: providerSessionRef,
      workspace,
    });
  }

  return Array.from(sessions.values());
}

function parseUuidV7TimestampMs(value: string): number | null {
  const normalized = value.replace(/-/g, '');
  if (normalized.length < 13 || normalized[12] !== '7') {
    return null;
  }

  const timestampHex = normalized.slice(0, 12);
  if (!/^[0-9a-f]{12}$/i.test(timestampHex)) {
    return null;
  }

  const timestampMs = Number.parseInt(timestampHex, 16);
  return Number.isFinite(timestampMs) ? timestampMs : null;
}

function selectPreferredCodexSessions(params: {
  capturedSessions: ParsedSession[];
  viewSessions: ParsedSession[];
  tabSessions: ParsedSession[];
  storageSessions: ParsedSession[];
  nowMs: number;
}): ParsedSession[] {
  const scopedRefs = new Set(
    [...params.tabSessions, ...params.storageSessions, ...params.viewSessions].map(
      (session) => session.providerSessionRef,
    ),
  );

  if (scopedRefs.size > 0) {
    const overlappingCapturedSessions = params.capturedSessions.filter((session) =>
      scopedRefs.has(session.providerSessionRef),
    );

    return mergeSessions(
      params.tabSessions,
      overlappingCapturedSessions,
      params.storageSessions,
      params.viewSessions,
    );
  }

  const recentCapturedSessions = params.capturedSessions
    .map((session) => ({
      session,
      timestampMs: parseUuidV7TimestampMs(session.providerSessionRef),
    }))
    .filter(
      (entry) =>
        entry.timestampMs !== null &&
        params.nowMs >= entry.timestampMs &&
        params.nowMs - entry.timestampMs <= codexRecentFallbackWindowMs,
    )
    .sort((left, right) => (right.timestampMs ?? 0) - (left.timestampMs ?? 0))
    .slice(0, codexRecentFallbackLimit)
    .map((entry) => entry.session);

  if (recentCapturedSessions.length > 0) {
    return recentCapturedSessions;
  }

  return params.capturedSessions.slice(0, codexRecentFallbackLimit);
}

function mergeSessions(...lists: ParsedSession[][]): ParsedSession[] {
  const merged = new Map<string, ParsedSession>();

  for (const list of lists) {
    for (const session of list) {
      if (!merged.has(session.providerSessionRef)) {
        merged.set(session.providerSessionRef, session);
      }
    }
  }

  return Array.from(merged.values());
}

async function discoverStorageSessions(
  provider: BrokerProvider,
  exthostLogDir: string | null,
  workspace: WorkspaceLocator,
): Promise<ParsedSession[]> {
  if (!exthostLogDir) {
    return [];
  }

  if (provider === 'claude') {
    const contents = await readMatchingLogs(
      join(exthostLogDir, 'Anthropic.claude-code'),
      claudeLogPattern,
    );
    return parseClaudeLogs(contents, workspace);
  }

  const contents = await readMatchingLogs(
    join(exthostLogDir, 'openai.chatgpt'),
    codexLogPattern,
  );
  return parseCodexLogs(contents, workspace);
}

function createStorageFactory(
  provider: BrokerProvider,
  params: {
    exthostLogDir: string | null;
    workspace: WorkspaceLocator;
  },
): ProviderProbeFactory {
  return async (resolution: ProviderHostResolution) => {
    if (provider === 'claude') {
      return {
        storageProbe: new ClaudeStorageProbe(resolution, {
          listSessions: async () =>
            discoverStorageSessions(provider, params.exthostLogDir, params.workspace),
        }),
      };
    }

    return {
      storageProbe: new CodexStorageProbe(resolution, {
        listSessions: async () =>
          discoverStorageSessions(provider, params.exthostLogDir, params.workspace),
      }),
    };
  };
}

function createClaudeFactory(params: {
  exthostLogDir: string | null;
  workspace: WorkspaceLocator;
  commandExecutor?: CommandExecutor;
  watchPollMs?: number;
  providerCaptures?: ProviderRuntimeCaptureRegistry;
}): ProviderProbeFactory {
  return async (resolution: ProviderHostResolution) => {
    const runtimeChannelRefs = new Map<string, string>();
    const capturedClaudeProvider =
      params.providerCaptures?.getCapturedProvider('claude') ?? null;
    const listStorageSessions = async () =>
      discoverStorageSessions('claude', params.exthostLogDir, params.workspace);
    const listCapturedSessions = async () =>
      discoverCapturedClaudeSessions(
        capturedClaudeProvider,
        params.workspace,
      );
    const listSessions = async () => {
      const sessions = mergeSessions(
        await listStorageSessions(),
        await listCapturedSessions(),
      );
      runtimeChannelRefs.clear();
      for (const session of sessions) {
        if (session.runtimeChannelRef) {
          runtimeChannelRefs.set(
            session.providerSessionRef,
            session.runtimeChannelRef,
          );
        }
      }
      return sessions;
    };
    const runtimeCapture =
      params.providerCaptures?.getCaptureDiagnostic?.('claude') ?? null;

    const storageProbe = new ClaudeStorageProbe(resolution, {
      listSessions: listStorageSessions,
    });

    if (
      resolution.compatibility !== 'supported' ||
      !params.commandExecutor ||
      !resolution.commands.includes(claudeOpenSessionCommandId)
    ) {
      return {
        storageProbe,
      };
    }

    const interrupt = capturedClaudeProvider
      ? async (providerSessionRef: string) => {
          let runtimeChannelRef = runtimeChannelRefs.get(providerSessionRef);
          if (!runtimeChannelRef) {
            await listSessions();
            runtimeChannelRef = runtimeChannelRefs.get(providerSessionRef);
          }

          if (!runtimeChannelRef) {
            throw new Error('Claude interrupt bridge unavailable');
          }

          const comm = findClaudeInterruptComm(
            capturedClaudeProvider,
            runtimeChannelRef,
          );
          if (!comm?.interruptClaude) {
            throw new Error('Claude interrupt bridge unavailable');
          }

          await comm.interruptClaude(runtimeChannelRef);
        }
      : undefined;

    const watchSession = params.exthostLogDir
      ? async (providerSessionRef: string, onEvent: (event: ProviderEvent) => void) => {
          const claudeLogDir = join(params.exthostLogDir!, 'Anthropic.claude-code');
          const offsets = new Map<string, number>();
          const remainders = new Map<string, string>();

          for (const path of await listMatchingLogPaths(claudeLogDir, claudeLogPattern)) {
            try {
              offsets.set(path, (await readFile(path, 'utf8')).length);
            } catch {
              // Ignore transient log file reads; the next poll will retry.
            }
          }

          let disposed = false;
          let polling = false;
          const poll = async () => {
            if (disposed || polling) {
              return;
            }

            polling = true;
            try {
              const paths = await listMatchingLogPaths(claudeLogDir, claudeLogPattern);
              for (const path of paths) {
                let content: string;
                try {
                  content = await readFile(path, 'utf8');
                } catch {
                  continue;
                }

                const previousOffset = offsets.get(path);
                const startOffset =
                  previousOffset === undefined
                    ? 0
                    : content.length < previousOffset
                      ? 0
                      : previousOffset;
                offsets.set(path, content.length);

                const chunk = content.slice(startOffset);
                if (chunk.length === 0) {
                  continue;
                }

                const remainder = consumeClaudeLogChunk({
                  chunk,
                  providerSessionRef,
                  remainder: remainders.get(path) ?? '',
                  onEvent,
                });

                if (remainder.length > 0) {
                  remainders.set(path, remainder);
                } else {
                  remainders.delete(path);
                }
              }
            } finally {
              polling = false;
            }
          };

          const timer = setInterval(
            () => void poll(),
            params.watchPollMs ?? defaultWatchPollMs,
          );
          if (typeof timer.unref === 'function') {
            timer.unref();
          }

          return () => {
            disposed = true;
            clearInterval(timer);
          };
        }
      : undefined;

    const runtimeProbe = new ClaudeRuntimeProbe(resolution, {
      listSessions: async () => {
        const sessions = await listSessions();
        return sessions.map((session) => {
          const bridgeDiagnostics = buildClaudeBridgeDiagnostics(
            session.providerSessionRef,
            session.runtimeChannelRef,
            capturedClaudeProvider,
          );

          return {
            providerSessionRef: session.providerSessionRef,
            title: session.title,
            latestSeq: session.latestSeq,
            conversationId: session.conversationId,
            sessionId: session.providerSessionRef,
            supportsInterrupt: Boolean(session.runtimeChannelRef),
            interruptBridgeAvailable:
              bridgeDiagnostics.interruptBridgeState === 'ready',
            supportsApprovals: false,
            eventStreamAvailable: Boolean(watchSession),
            bridgeDiagnostics,
            workspace: session.workspace,
          };
        });
      },
      watchSession,
      sendMessage: async (providerSessionRef, text) => {
        await params.commandExecutor!(
          claudeOpenSessionCommandId,
          providerSessionRef,
          text,
        );
      },
      interrupt,
    });

    return {
      probeDiagnostics: {
        runtimeCapture,
      },
      runtimeProbe,
      storageProbe,
    };
  };
}

function hasCommands(
  availableCommands: string[],
  requiredCommands: readonly string[],
): boolean {
  const commandSet = new Set(availableCommands);
  return requiredCommands.every((commandId) => commandSet.has(commandId));
}

function codexThreadUri(providerSessionRef: string): string {
  return `openai-codex://route/local/${providerSessionRef}`;
}

function createCodexFactory(params: {
  exthostLogDir: string | null;
  workspace: WorkspaceLocator;
  commandExecutor?: CommandExecutor;
  createUri?: UriFactory;
  listTabs?: DefaultProbeFactoryOptions['listTabs'];
  watchPollMs?: number;
  providerCaptures?: ProviderRuntimeCaptureRegistry;
  now?: DefaultProbeFactoryOptions['now'];
}): ProviderProbeFactory {
  return async (resolution: ProviderHostResolution) => {
    const listStorageSessions = async () =>
      discoverStorageSessions('codex', params.exthostLogDir, params.workspace);
    const listCapturedSessions = async () =>
      discoverCapturedCodexSessions(
        params.providerCaptures?.getCapturedChatSessionProvider?.('codex') ??
          params.providerCaptures?.getCapturedProvider('codex') ??
          null,
        params.workspace,
      );
    const listViewSessions = async () =>
      discoverCapturedCodexViewSessions(
        params.providerCaptures?.getCapturedViewProvider?.('codex') ?? null,
        params.workspace,
      );
    const listTabSessions = async () =>
      discoverCodexTabs(params.listTabs, params.workspace);
    const listSessions = async () =>
      selectPreferredCodexSessions({
        capturedSessions: await listCapturedSessions(),
        viewSessions: await listViewSessions(),
        tabSessions: await listTabSessions(),
        storageSessions: await listStorageSessions(),
        nowMs: params.now?.() ?? Date.now(),
      });

    const storageProbe = new CodexStorageProbe(resolution, {
      listSessions: listStorageSessions,
    });

    const useOpenWith = resolution.commands.includes(codexOpenWithCommandId);
    const canOpenSession =
      useOpenWith || resolution.commands.includes(codexOpenCommandId);
    if (
      resolution.compatibility !== 'supported' ||
      !params.commandExecutor ||
      !params.createUri ||
      !canOpenSession ||
      !hasCommands(resolution.commands, codexRuntimeSendCommandIds)
    ) {
      return {
        storageProbe,
      };
    }

    const openSession = async (providerSessionRef: string) => {
      const uri = params.createUri!(codexThreadUri(providerSessionRef));
      if (useOpenWith) {
        await params.commandExecutor!(
          codexOpenWithCommandId,
          uri,
          codexConversationEditorViewType,
          {
            preview: false,
          },
        );
      } else {
        await params.commandExecutor!(codexOpenCommandId, uri);
      }
      await params.commandExecutor!(codexFocusInputCommandId);
    };

    const watchSession = params.exthostLogDir
      ? async (providerSessionRef: string, onEvent: (event: ProviderEvent) => void) => {
          const codexLogDir = join(params.exthostLogDir!, 'openai.chatgpt');
          const offsets = new Map<string, number>();
          const remainders = new Map<string, string>();

          for (const path of await listMatchingLogPaths(codexLogDir, codexLogPattern)) {
            try {
              offsets.set(path, (await readFile(path, 'utf8')).length);
            } catch {
              // Ignore transient log file reads; the next poll will retry.
            }
          }

          let disposed = false;
          let polling = false;
          const poll = async () => {
            if (disposed || polling) {
              return;
            }

            polling = true;
            try {
              const paths = await listMatchingLogPaths(codexLogDir, codexLogPattern);
              for (const path of paths) {
                let content: string;
                try {
                  content = await readFile(path, 'utf8');
                } catch {
                  continue;
                }

                const previousOffset = offsets.get(path);
                const startOffset =
                  previousOffset === undefined
                    ? 0
                    : content.length < previousOffset
                      ? 0
                      : previousOffset;
                offsets.set(path, content.length);

                const chunk = content.slice(startOffset);
                if (chunk.length === 0) {
                  continue;
                }

                const remainder = consumeCodexLogChunk({
                  chunk,
                  providerSessionRef,
                  remainder: remainders.get(path) ?? '',
                  onEvent,
                });

                if (remainder.length > 0) {
                  remainders.set(path, remainder);
                } else {
                  remainders.delete(path);
                }
              }
            } finally {
              polling = false;
            }
          };

          const timer = setInterval(
            () => void poll(),
            params.watchPollMs ?? defaultWatchPollMs,
          );
          if (typeof timer.unref === 'function') {
            timer.unref();
          }

          return () => {
            disposed = true;
            clearInterval(timer);
          };
        }
      : undefined;

    const runtimeProbe = new CodexRuntimeProbe(resolution, {
      listSessions: async () => {
        const sessions = await listSessions();
        return sessions.map((session) => ({
          providerSessionRef: session.providerSessionRef,
          title: session.title,
          latestSeq: session.latestSeq,
          conversationId: session.conversationId,
          threadId: session.providerSessionRef,
          supportsInterrupt: true,
          supportsApprovals: false,
          eventStreamAvailable: Boolean(watchSession),
          workspace: session.workspace,
        }));
      },
      watchSession,
      sendMessage: async (providerSessionRef, text) => {
        await openSession(providerSessionRef);
        await params.commandExecutor!(codexTypeCommandId, { text });
        await params.commandExecutor!(codexSubmitCommandId);
      },
      interrupt: resolution.commands.includes(codexCancelCommandId)
        ? async (providerSessionRef) => {
            await openSession(providerSessionRef);
            await params.commandExecutor!(codexCancelCommandId);
          }
        : undefined,
      attachmentBridgeAvailable: true,
    });

    return {
      probeDiagnostics: {
        runtimeCapture:
          params.providerCaptures?.getCaptureDiagnostic?.('codex') ?? null,
      },
      runtimeProbe,
      storageProbe,
    };
  };
}

export function createDefaultProbeFactories(
  options: DefaultProbeFactoryOptions = {},
): Partial<Record<BrokerProvider, ProviderProbeFactory>> {
  const exthostLogDir = resolveExthostLogDir(options.extensionLogPath);
  const workspace = options.workspace ?? {};

  return {
    claude: createClaudeFactory({
      exthostLogDir,
      workspace,
      commandExecutor: options.commandExecutor,
      watchPollMs: options.watchPollMs,
      providerCaptures: options.providerCaptures,
    }),
    codex: createCodexFactory({
      exthostLogDir,
      workspace,
      commandExecutor: options.commandExecutor,
      createUri: options.createUri,
      listTabs: options.listTabs,
      watchPollMs: options.watchPollMs,
      providerCaptures: options.providerCaptures,
    }),
  };
}
