/**
 * useProjectGit Hook
 *
 * Handles Git operations: init, commit, refresh status.
 * Extracted from useProject for better separation of concerns.
 */

import { useCallback } from 'react';
import { projectApi, gitApi, ProjectMeta, GitStatus } from '@/services/projectApi';
import type { FileSystem } from '@/types';
import { activityLogger } from '@/services/activityLogger';

// ============================================================================
// Types
// ============================================================================

export interface UseProjectGitOptions {
  /** Get current project */
  getCurrentProject: () => ProjectMeta | null;
  /** Get current files */
  getFiles: () => FileSystem;
  /** Get current git status */
  getGitStatus: () => GitStatus | null;
  /** Callback to update state */
  updateState: (updater: (prev: ProjectGitState) => Partial<ProjectGitState>) => void;
}

export interface ProjectGitState {
  gitStatus: GitStatus | null;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  error: string | null;
}

export interface UseProjectGitReturn {
  /** Initialize git repository */
  initGit: (force?: boolean, filesToSync?: FileSystem) => Promise<boolean>;
  /** Create a commit */
  commit: (message: string, filesToCommit?: FileSystem) => Promise<boolean>;
  /** Refresh git status */
  refreshGitStatus: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useProjectGit(options: UseProjectGitOptions): UseProjectGitReturn {
  const { getCurrentProject, getFiles, getGitStatus, updateState } = options;

  /**
   * Initialize git repository
   * force=true will delete and reinitialize corrupted repos
   * filesToSync: current working files to sync before init
   */
  const initGit = useCallback(
    async (force = false, filesToSync?: FileSystem): Promise<boolean> => {
      const currentProject = getCurrentProject();

      if (!currentProject) {
        activityLogger.warn('git', 'Git init failed', 'No current project');
        return false;
      }

      const files = filesToSync || getFiles();
      const fileCount = Object.keys(files).length;

      if (fileCount === 0) {
        activityLogger.warn('git', 'Cannot init git', 'No files');
        updateState(() => ({ error: 'Cannot initialize: no files' }));
        return false;
      }

      const initTimer = activityLogger.startTimed('git', `Initializing git repository`);
      updateState(() => ({ error: null, isSyncing: true }));

      try {
        // Step 1: Sync files to backend first (force=true to bypass confirmation)
        activityLogger.info('git', `Syncing ${fileCount} files...`);
        const syncResponse = await projectApi.update(currentProject.id, { files, force: true });
        if (syncResponse.blocked) {
          activityLogger.error('git', 'Sync blocked before git init', syncResponse.warning);
          updateState(() => ({ isSyncing: false, error: 'Sync blocked: ' + syncResponse.warning }));
          return false;
        }

        // Step 2: Initialize git (force=true for corrupted repos)
        await gitApi.init(currentProject.id, force);

        // Step 3: Refresh status - gitStatus.initialized will now be true
        const gitStatus = await gitApi.status(currentProject.id);

        updateState(() => ({
          gitStatus,
          isSyncing: false,
          lastSyncedAt: Date.now(),
        }));

        initTimer();
        activityLogger.success('git', 'Git repository initialized', currentProject.name);
        return true;
      } catch (_err) {
        const errorMsg = _err instanceof Error ? _err.message : 'Unknown error';
        activityLogger.error('git', 'Git init failed', errorMsg);
        updateState(() => ({ isSyncing: false, error: 'Failed to initialize git' }));
        return false;
      }
    },
    [getCurrentProject, getFiles, updateState]
  );

  /**
   * Create commit - syncs files to backend first, then commits
   * This is the ONLY time files are synced to backend (git-centric approach)
   */
  const commit = useCallback(
    async (message: string, filesToCommit?: FileSystem): Promise<boolean> => {
      const currentProject = getCurrentProject();
      const gitStatus = getGitStatus();

      if (!currentProject || !gitStatus?.initialized) return false;

      const files = filesToCommit || getFiles();
      const fileCount = Object.keys(files).length;

      if (fileCount === 0) {
        activityLogger.warn('git', 'Cannot commit', 'No files');
        updateState(() => ({ error: 'Cannot commit: no files' }));
        return false;
      }

      const commitTimer = activityLogger.startTimed('git', `Committing ${fileCount} files`);
      updateState(() => ({ error: null, isSyncing: true }));

      try {
        // Step 1: Sync files to backend (force=true to bypass confirmation)
        const syncResponse = await projectApi.update(currentProject.id, { files, force: true });
        if (syncResponse.blocked) {
          activityLogger.error('git', 'Sync blocked before commit', syncResponse.warning);
          updateState(() => ({ isSyncing: false, error: 'Sync blocked: ' + syncResponse.warning }));
          return false;
        }

        // Step 2: Git commit
        await gitApi.commit(currentProject.id, message, files);

        // Step 3: Refresh status
        const newGitStatus = await gitApi.status(currentProject.id);
        updateState(() => ({
          gitStatus: newGitStatus,
          isSyncing: false,
          lastSyncedAt: Date.now(),
        }));

        commitTimer();
        activityLogger.success('git', 'Commit created', message.substring(0, 50));
        return true;
      } catch (_err) {
        const errorMsg = _err instanceof Error ? _err.message : 'Unknown error';
        activityLogger.error('git', 'Commit failed', errorMsg);
        updateState(() => ({ isSyncing: false, error: 'Failed to create commit' }));
        return false;
      }
    },
    [getCurrentProject, getFiles, getGitStatus, updateState]
  );

  /**
   * Refresh git status - this is the single source of truth for git state
   */
  const refreshGitStatus = useCallback(async () => {
    const currentProject = getCurrentProject();
    if (!currentProject) return;

    try {
      const gitStatus = await gitApi.status(currentProject.id);
      activityLogger.debug('git', 'Status refreshed', gitStatus.initialized ? 'Initialized' : 'Not initialized');

      updateState(() => ({
        gitStatus,
      }));
    } catch (_err) {
      const errorMsg = _err instanceof Error ? _err.message : 'Unknown error';
      activityLogger.debug('git', 'Status refresh failed', errorMsg);
      // On error, keep current gitStatus - do not reset to null
    }
  }, [getCurrentProject, updateState]);

  return {
    initGit,
    commit,
    refreshGitStatus,
  };
}
