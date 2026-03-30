/**
 * Daemon-specific types (not related to API/server communication)
 */

import { Metadata } from '@/api/types';
import { ChildProcess } from 'child_process';

/**
 * Session tracking for daemon
 */
export interface TrackedSession {
  startedBy: 'daemon' | string;
  source?: 'direct' | 'broker_attached';
  brokerSessionId?: string;
  brokerUrl?: string;
  brokerWindowInstanceId?: string;
  happySessionId?: string;
  happySessionMetadataFromLocalWebhook?: Metadata;
  pid: number;
  childProcess?: ChildProcess;
  error?: string;
  directoryCreated?: boolean;
  message?: string;
  /** tmux session identifier (format: session:window) */
  tmuxSessionId?: string;
  /** Per-repo lifecycle scripts for multi-repo workspaces */
  repoScripts?: Array<{
    repoDisplayName: string;
    worktreePath: string;
    setupScript?: string;
    parallelSetup?: boolean;
    cleanupScript?: string;
    archiveScript?: string;
    devServerScript?: string;
  }>;
}
