/**
 * Session Metadata Factory
 *
 * Creates session state and metadata objects for all backends (Claude, Codex, Gemini).
 * This follows DRY principles by providing a single implementation for all backends.
 *
 * @module createSessionMetadata
 */

import { readdirSync } from 'node:fs';
import os from 'node:os';
import { resolve, join } from 'node:path';

import { configuration } from '../configuration';
import { projectPath } from '../projectPath';
import type { AgentState, Metadata } from '../api/types';
import { detectGitWorktree } from './gitWorktree';
import packageJson from '../../package.json';

/**
 * Backend flavor identifier for session metadata.
 */
export type BackendFlavor = 'claude' | 'codex' | 'gemini';

/**
 * Options for creating session metadata.
 */
export interface CreateSessionMetadataOptions {
    /** Backend flavor (claude, codex, gemini) */
    flavor: BackendFlavor;
    /** Machine ID for server identification */
    machineId: string;
    /** How the session was started */
    startedBy?: 'daemon' | 'terminal';
    /** Session source marker */
    source?: 'direct' | 'broker_attached';
    /** Broker attachment metadata */
    brokerSessionId?: string;
    brokerCapabilities?: string[];
    brokerDegradedFlags?: string[];
    brokerDesiredMode?: Metadata['brokerDesiredMode'];
    brokerEffectiveMode?: Metadata['brokerEffectiveMode'];
    brokerModeReason?: Metadata['brokerModeReason'];
    brokerCompatibility?: Metadata['brokerCompatibility'];
    brokerProviderExtension?: Metadata['brokerProviderExtension'];
    brokerProbeHealth?: Metadata['brokerProbeHealth'];
    windowInstanceId?: string;
    brokerWindowLabel?: string;
    brokerWorkspaceLabel?: string;
    brokerWorkspacePath?: string;
    brokerWindowOrdinal?: number;
    brokerWindowIsActive?: boolean;
    brokerWindowLastActiveAt?: string;
}

/**
 * Result containing both state and metadata for session creation.
 */
export interface SessionMetadataResult {
    /** Agent state for session */
    state: AgentState;
    /** Session metadata */
    metadata: Metadata;
}

/**
 * Creates session state and metadata for backend agents.
 *
 * This utility consolidates the common session metadata creation logic used by
 * Codex and Gemini backends, ensuring consistency across all backend implementations.
 *
 * @param opts - Options specifying flavor, machineId, and startedBy
 * @returns Object containing state and metadata for session creation
 *
 * @example
 * ```typescript
 * const { state, metadata } = createSessionMetadata({
 *     flavor: 'gemini',
 *     machineId: settings.machineId,
 *     startedBy: opts.startedBy
 * });
 *
 * const response = await api.getOrCreateSession({ tag: sessionTag, metadata, state });
 * ```
 */
/** Scan immediate subdirectories for git worktrees (workspace root detection). */
function detectWorkspaceSubdirectories(cwd: string): Partial<Metadata> {
    try {
        const entries = readdirSync(cwd, { withFileTypes: true });
        const repos: Array<{ path: string; basePath: string; branchName: string; displayName: string }> = [];

        for (const entry of entries) {
            if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
            const subDir = join(cwd, entry.name);
            const info = detectGitWorktree(subDir);
            if (info.isWorktree && info.worktreeBasePath && info.worktreeBranchName) {
                repos.push({
                    path: subDir,
                    basePath: info.worktreeBasePath,
                    branchName: info.worktreeBranchName,
                    displayName: entry.name,
                });
            }
        }

        if (repos.length > 0) {
            return {
                isWorktree: true,
                workspaceRepos: repos,
                workspacePath: cwd,
            };
        }
    } catch {
        // Directory not readable or other error — fall through
    }
    return {};
}

/** Env vars from daemon take priority; otherwise detect via git */
function detectWorktreeMetadata(): Partial<Metadata> {
    // New: multi-repo workspace
    if (process.env.HAPPY_WORKSPACE_REPOS) {
        try {
            const repos = JSON.parse(process.env.HAPPY_WORKSPACE_REPOS);
            return {
                isWorktree: true,
                workspaceRepos: repos,
                workspacePath: process.env.HAPPY_WORKSPACE_PATH,
            };
        } catch {
            // Fall through to legacy detection
        }
    }
    // Legacy: single-repo worktree (env vars from daemon)
    if (process.env.HAPPY_WORKTREE_BASE_PATH) {
        return {
            isWorktree: true,
            worktreeBasePath: process.env.HAPPY_WORKTREE_BASE_PATH,
            worktreeBranchName: process.env.HAPPY_WORKTREE_BRANCH_NAME,
        };
    }
    // Terminal: git auto-detection
    const info = detectGitWorktree(process.cwd());
    if (info.isWorktree) {
        return {
            isWorktree: true,
            worktreeBasePath: info.worktreeBasePath,
            worktreeBranchName: info.worktreeBranchName,
        };
    }
    // Workspace root: scan subdirectories for worktrees
    const workspaceResult = detectWorkspaceSubdirectories(process.cwd());
    if (workspaceResult.isWorktree) {
        return workspaceResult;
    }
    return {};
}

function getMissingBrokerAttachedWindowFields(
    opts: CreateSessionMetadataOptions,
): string[] {
    const missing: string[] = [];

    if (!opts.windowInstanceId) missing.push('windowInstanceId');
    if (!opts.brokerWindowLabel) missing.push('brokerWindowLabel');
    if (!opts.brokerWorkspaceLabel) missing.push('brokerWorkspaceLabel');
    if (!opts.brokerWorkspacePath) missing.push('brokerWorkspacePath');
    if (typeof opts.brokerWindowOrdinal !== 'number') {
        missing.push('brokerWindowOrdinal');
    }

    return missing;
}

export function createSessionMetadata(opts: CreateSessionMetadataOptions): SessionMetadataResult {
    if (opts.source === 'broker_attached') {
        const missingFields = getMissingBrokerAttachedWindowFields(opts);
        if (missingFields.length > 0) {
            throw new Error(
                `Missing broker-attached metadata fields: ${missingFields.join(', ')}`,
            );
        }
    }

    const state: AgentState = {
        controlledByUser: false,
    };

    const sessionPath =
        opts.source === 'broker_attached' && opts.brokerWorkspacePath
            ? opts.brokerWorkspacePath
            : process.cwd();

    const metadata: Metadata = {
        path: sessionPath,
        host: os.hostname(),
        version: packageJson.version,
        os: os.platform(),
        machineId: opts.machineId,
        homeDir: os.homedir(),
        happyHomeDir: configuration.happyHomeDir,
        happyLibDir: projectPath(),
        happyToolsDir: resolve(projectPath(), 'tools', 'unpacked'),
        startedFromDaemon: opts.startedBy === 'daemon',
        hostPid: process.pid,
        startedBy: opts.startedBy || 'terminal',
        lifecycleState: 'running',
        lifecycleStateSince: Date.now(),
        flavor: opts.flavor,
        ...(opts.source ? {
            sessionSource: opts.source,
            brokerSessionId: opts.brokerSessionId,
            brokerCapabilities: opts.brokerCapabilities,
            brokerDegradedFlags: opts.brokerDegradedFlags,
            brokerDesiredMode: opts.brokerDesiredMode,
            brokerEffectiveMode: opts.brokerEffectiveMode,
            brokerModeReason: opts.brokerModeReason,
            brokerCompatibility: opts.brokerCompatibility,
            brokerProviderExtension: opts.brokerProviderExtension,
            brokerProbeHealth: opts.brokerProbeHealth,
            windowInstanceId: opts.windowInstanceId,
            brokerWindowLabel: opts.brokerWindowLabel,
            brokerWorkspaceLabel: opts.brokerWorkspaceLabel,
            brokerWorkspacePath: opts.brokerWorkspacePath,
            brokerWindowOrdinal: opts.brokerWindowOrdinal,
            brokerWindowIsActive: opts.brokerWindowIsActive,
            brokerWindowLastActiveAt: opts.brokerWindowLastActiveAt,
        } : {}),
        // Worktree metadata: env vars from daemon take priority, otherwise detect via git
        ...detectWorktreeMetadata(),
    };

    return { state, metadata };
}
