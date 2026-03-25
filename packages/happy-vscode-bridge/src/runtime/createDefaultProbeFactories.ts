import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import type { BrokerProvider } from 'happy-wire';

import type { ProviderEvent } from '../providers/types';
import type { ProviderRuntimeCaptureRegistry } from './ProviderRuntimeCapture';
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
};

type ParsedSession = {
  providerSessionRef: string;
  title: string;
  latestSeq: number;
  conversationId: string;
  runtimeChannelRef?: string;
  workspace: WorkspaceLocator;
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
const codexRuntimeSendCommandIds = [
  codexTypeCommandId,
  codexFocusInputCommandId,
  codexSubmitCommandId,
] as const;

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
};

type ClaudeCapturedProvider = {
  allComms?: Iterable<unknown>;
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

  const segments = (uri.path?.startsWith('/') ? uri.path.slice(1) : uri.path ?? '')
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
    const listStorageSessions = async () =>
      discoverStorageSessions('claude', params.exthostLogDir, params.workspace);
    const listSessions = async () => {
      const sessions = await listStorageSessions();
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
    const capturedClaudeProvider =
      params.providerCaptures?.getCapturedProvider('claude') ?? null;
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
            supportsApprovals: true,
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
}): ProviderProbeFactory {
  return async (resolution: ProviderHostResolution) => {
    const listStorageSessions = async () =>
      discoverStorageSessions('codex', params.exthostLogDir, params.workspace);
    const listTabSessions = async () =>
      discoverCodexTabs(params.listTabs, params.workspace);
    const listSessions = async () =>
      mergeSessions(await listTabSessions(), await listStorageSessions());

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
          supportsApprovals: true,
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
