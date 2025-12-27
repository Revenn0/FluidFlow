/**
 * GitHub Modal
 *
 * Unified modal for GitHub operations:
 * - Import: Clone repositories from GitHub
 * - Push: Push current project to GitHub (new or existing repo)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Github, X, Search, Loader2, Check, AlertTriangle, Lock, Globe,
  Clock, RefreshCw, Download, FolderGit, ExternalLink, ChevronRight,
  Upload, Plus, Link2, AlertCircle
} from 'lucide-react';
import { githubApi } from '@/services/api/github';
import { settingsApi } from '@/services/api/settings';
import type { ProjectMeta } from '@/services/projectApi';

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  cloneUrl: string;
  private: boolean;
  updatedAt: string;
  defaultBranch: string;
  hasFluidFlowBackup: boolean;
}

interface OperationResult {
  success: boolean;
  project?: ProjectMeta;
  restored?: { metadata: boolean; context: boolean };
  repoUrl?: string;
  error?: string;
}

export type GitHubModalMode = 'import' | 'push';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: GitHubModalMode;
  // For import mode
  onImportComplete?: (project: ProjectMeta) => void;
  // For push mode
  projectId?: string;
  projectName?: string;
  hasExistingRemote?: boolean;
  existingRemoteUrl?: string;
  onPushComplete?: (repoUrl: string) => void;
}

type ModalStep = 'token' | 'repos' | 'newRepo' | 'processing' | 'result';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  mode,
  onImportComplete,
  projectId,
  projectName,
  hasExistingRemote = false,
  existingRemoteUrl = '',
  onPushComplete,
}) => {
  const [step, setStep] = useState<ModalStep>('token');
  const [token, setToken] = useState('');
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenVerifying, setTokenVerifying] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [result, setResult] = useState<OperationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBackupOnly, setShowBackupOnly] = useState(false);

  // New repo form state
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  // Push options
  const [forcePush, setForcePush] = useState(false);
  const [pushMode, setPushMode] = useState<'new' | 'existing'>(hasExistingRemote ? 'existing' : 'new');
  const [includeContext, setIncludeContext] = useState(false); // Default false for safety

  // Import options
  const [importMode, setImportMode] = useState<'myRepos' | 'url'>('myRepos');
  const [cloneUrl, setCloneUrl] = useState('');

  // Initialize from saved settings and project name
  useEffect(() => {
    if (mode === 'push') {
      // Load saved push settings from localStorage
      try {
        const savedSettings = localStorage.getItem('fluidflow_github_push_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (typeof settings.includeConversationHistory === 'boolean') {
            setIncludeContext(settings.includeConversationHistory);
          }
          if (typeof settings.defaultPrivate === 'boolean') {
            setIsPrivate(settings.defaultPrivate);
          }
        }
      } catch (err) {
        console.error('Failed to load push settings:', err);
      }

      // Set repo name from project name
      if (projectName) {
        setNewRepoName(projectName.replace(/\s+/g, '-').toLowerCase());
      }
    }
  }, [mode, projectName]);

  const loadRepos = useCallback(async (tokenToUse: string) => {
    setReposLoading(true);
    setError(null);
    try {
      const result = await githubApi.listRepos(tokenToUse);
      setRepos(result.repos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repositories');
    } finally {
      setReposLoading(false);
    }
  }, []);

  const verifyAndProceed = useCallback(async (tokenToVerify: string) => {
    setTokenVerifying(true);
    setError(null);
    try {
      const verifyResult = await githubApi.verifyToken(tokenToVerify);
      if (verifyResult.valid) {
        await loadRepos(tokenToVerify);
        setStep('repos');
      } else {
        setError(verifyResult.error || 'Invalid token');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify token');
    } finally {
      setTokenVerifying(false);
      setTokenLoading(false);
    }
  }, [loadRepos]);

  // Load saved token on mount
  useEffect(() => {
    if (isOpen) {
      const loadSavedToken = async () => {
        setTokenLoading(true);
        try {
          const savedToken = await settingsApi.getBackupToken();
          if (savedToken.token) {
            setToken(savedToken.token);
            verifyAndProceed(savedToken.token);
          } else {
            setTokenLoading(false);
          }
        } catch {
          setTokenLoading(false);
        }
      };
      loadSavedToken();
    }
  }, [isOpen, verifyAndProceed]);

  const handleTokenSubmit = () => {
    if (!token.trim()) return;
    verifyAndProceed(token.trim());
  };

  // Import a repository
  const handleImport = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setStep('processing');
    setError(null);

    try {
      const importResult = await githubApi.importProject({
        url: repo.cloneUrl,
        token: repo.private ? token : undefined,
        branch: repo.hasFluidFlowBackup ? 'backup/auto' : repo.defaultBranch,
        name: repo.name,
      });

      setResult({
        success: true,
        project: importResult.project,
        restored: importResult.restored,
      });
      setStep('result');
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Import failed',
      });
      setStep('result');
    }
  };

  // Clone by URL (public repos or with token for private)
  const handleCloneByUrl = async () => {
    if (!cloneUrl.trim()) return;

    setStep('processing');
    setError(null);

    try {
      // Extract repo name from URL
      const urlParts = cloneUrl.trim().replace(/\.git$/, '').split('/');
      const repoName = urlParts[urlParts.length - 1] || 'imported-project';

      const importResult = await githubApi.importProject({
        url: cloneUrl.trim(),
        token: token || undefined, // Use token if available (for private repos)
        name: repoName,
      });

      setResult({
        success: true,
        project: importResult.project,
        restored: importResult.restored,
      });
      setStep('result');
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Clone failed. Make sure the URL is correct and the repository is accessible.',
      });
      setStep('result');
    }
  };

  // Push to existing repository
  const handlePushToExisting = async (repo: GitHubRepo) => {
    if (!projectId) return;

    setSelectedRepo(repo);
    setStep('processing');
    setError(null);

    try {
      // Set remote first
      await githubApi.setRemote(projectId, repo.cloneUrl, 'origin');

      // Push with token for authentication
      await githubApi.push(projectId, { force: forcePush, token, includeContext });

      setResult({
        success: true,
        repoUrl: repo.url,
      });
      setStep('result');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Push failed';
      // Check if it's a diverged history error
      if (errorMsg.includes('rejected') || errorMsg.includes('diverged') || errorMsg.includes('non-fast-forward')) {
        setResult({
          success: false,
          error: `Push rejected: Remote has changes not in local. Enable "Force Push" to overwrite remote.`,
        });
      } else {
        setResult({
          success: false,
          error: errorMsg,
        });
      }
      setStep('result');
    }
  };

  // Create new repository and push
  const handleCreateAndPush = async () => {
    if (!projectId || !newRepoName.trim()) return;

    setStep('processing');
    setError(null);

    try {
      // Create repo
      const createResult = await githubApi.createRepo(projectId, token, {
        name: newRepoName.trim(),
        description: newRepoDescription.trim() || undefined,
        isPrivate,
      });

      // Push to the new repo with token for authentication
      await githubApi.push(projectId, { force: false, token, includeContext });

      setResult({
        success: true,
        repoUrl: createResult.repository.url,
      });
      setStep('result');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create repository';
      // Check if repo already exists
      if (errorMsg.includes('already exists') || errorMsg.includes('name already')) {
        setResult({
          success: false,
          error: `Repository "${newRepoName}" already exists. Choose a different name or push to existing repo.`,
        });
      } else {
        setResult({
          success: false,
          error: errorMsg,
        });
      }
      setStep('result');
    }
  };

  // Push to current remote
  const handlePushToCurrent = async () => {
    if (!projectId) return;

    setStep('processing');
    setError(null);

    try {
      await githubApi.push(projectId, { force: forcePush, token, includeContext });

      setResult({
        success: true,
        repoUrl: existingRemoteUrl.replace(/\.git$/, ''),
      });
      setStep('result');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Push failed';
      if (errorMsg.includes('rejected') || errorMsg.includes('diverged') || errorMsg.includes('non-fast-forward')) {
        setResult({
          success: false,
          error: `Push rejected: Remote has changes not in local. Enable "Force Push" to overwrite remote.`,
        });
      } else {
        setResult({
          success: false,
          error: errorMsg,
        });
      }
      setStep('result');
    }
  };

  const handleClose = useCallback(() => {
    setStep('token');
    setToken('');
    setRepos([]);
    setSearchQuery('');
    setSelectedRepo(null);
    setResult(null);
    setError(null);
    setShowBackupOnly(false);
    setNewRepoName('');
    setNewRepoDescription('');
    setIsPrivate(true);
    setForcePush(false);
    setPushMode('new');
    setImportMode('myRepos');
    setCloneUrl('');
    onClose();
  }, [onClose]);

  const handleComplete = () => {
    if (result?.success) {
      if (mode === 'import' && result.project && onImportComplete) {
        onImportComplete(result.project);
      } else if (mode === 'push' && result.repoUrl && onPushComplete) {
        onPushComplete(result.repoUrl);
      }
    }
    handleClose();
  };

  // Filter repos
  const filteredRepos = repos.filter(repo => {
    if (mode === 'import' && showBackupOnly && !repo.hasFluidFlowBackup) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.fullName.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query)
    );
  });

  // Sort: FluidFlow backups first (for import), then by update time
  const sortedRepos = [...filteredRepos].sort((a, b) => {
    if (mode === 'import') {
      if (a.hasFluidFlowBackup && !b.hasFluidFlowBackup) return -1;
      if (!a.hasFluidFlowBackup && b.hasFluidFlowBackup) return 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (!isOpen) return null;

  const isImport = mode === 'import';
  const isPush = mode === 'push';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200" style={{ backgroundColor: 'var(--theme-modal-overlay)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col" style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
        {/* Header */}
        <div className="p-5 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-background)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: isImport ? 'var(--theme-glass-200)' : 'var(--theme-accent-subtle)' }}>
              {isImport ? (
                <Download className="w-5 h-5" style={{ color: 'var(--theme-text-primary)' }} />
              ) : (
                <Upload className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
              )}
            </div>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                {isImport ? 'Import from GitHub' : 'Push to GitHub'}
              </h3>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                {step === 'token' && 'Enter your GitHub token to access repositories'}
                {step === 'repos' && (isImport ? 'Select a repository to import' : 'Select destination repository')}
                {step === 'newRepo' && 'Configure new repository'}
                {step === 'processing' && (isImport ? 'Importing project...' : 'Pushing to GitHub...')}
                {step === 'result' && (result?.success ? (isImport ? 'Import complete!' : 'Push complete!') : 'Operation failed')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Token Input Step */}
          {step === 'token' && (
            <div className="p-6 space-y-4">
              {tokenLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-accent)' }} />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold uppercase block mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                      GitHub Personal Access Token
                    </label>
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                      style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-input-border)', color: 'var(--theme-text-primary)' }}
                      onKeyDown={(e) => e.key === 'Enter' && handleTokenSubmit()}
                      autoFocus
                    />
                    <p className="text-xs mt-2" style={{ color: 'var(--theme-text-dim)' }}>
                      Requires 'repo' scope for private repositories.{' '}
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=FluidFlow"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: 'var(--theme-accent)' }}
                      >
                        Create token <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-error-subtle)', border: '1px solid var(--color-error-border)', color: 'var(--color-error)' }}>
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {isImport && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border-light)' }}>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                        <FolderGit className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                        FluidFlow Backup Detection
                      </h4>
                      <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                        Repositories with a <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--theme-glass-300)' }}>backup/auto</code> branch
                        will be highlighted. These contain FluidFlow metadata that will be automatically restored.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Repository List Step */}
          {step === 'repos' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
              {/* Push Mode Selector */}
              {isPush && (
                <div className="px-6 pt-4 pb-2" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
                  <div className="flex p-1 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border-light)' }}>
                    <button
                      onClick={() => setPushMode('new')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all"
                      style={{
                        backgroundColor: pushMode === 'new' ? 'var(--theme-surface)' : 'transparent',
                        color: pushMode === 'new' ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)'
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      New Repository
                    </button>
                    <button
                      onClick={() => setPushMode('existing')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all"
                      style={{
                        backgroundColor: pushMode === 'existing' ? 'var(--theme-surface)' : 'transparent',
                        color: pushMode === 'existing' ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)'
                      }}
                    >
                      <Link2 className="w-4 h-4" />
                      Existing Repository
                    </button>
                  </div>

                  {/* Current Remote Info */}
                  {hasExistingRemote && pushMode === 'existing' && (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-success-subtle)', border: '1px solid var(--color-success-border)' }}>
                      <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--color-success)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>Remote configured</p>
                        <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>{existingRemoteUrl}</p>
                      </div>
                      <button
                        onClick={handlePushToCurrent}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ backgroundColor: 'var(--color-success)', color: 'white' }}
                      >
                        Push Now
                      </button>
                    </div>
                  )}

                  {/* Force Push Option */}
                  {pushMode === 'existing' && (
                    <label className="mt-3 flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--color-warning-subtle)', border: '1px solid var(--color-warning-border)' }}>
                      <input
                        type="checkbox"
                        checked={forcePush}
                        onChange={(e) => setForcePush(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-warning)' }}>Force Push</span>
                        <p className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
                          Overwrite remote history. Use if histories have diverged.
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Include Context Option */}
                  <label className="mt-3 flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border-light)' }}>
                    <input
                      type="checkbox"
                      checked={includeContext}
                      onChange={(e) => setIncludeContext(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Include Conversation History</span>
                      <p className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
                        Include AI chat history in .fluidflow/ folder. Useful for backup/restore.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* New Repo Form (for push mode) */}
              {isPush && pushMode === 'new' && (
                <div className="px-6 py-4 space-y-4" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
                  <div>
                    <label className="text-xs font-semibold uppercase block mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                      Repository Name
                    </label>
                    <input
                      type="text"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, '-'))}
                      placeholder="my-awesome-app"
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                      style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-input-border)', color: 'var(--theme-text-primary)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase block mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={newRepoDescription}
                      onChange={(e) => setNewRepoDescription(e.target.value)}
                      placeholder="A project created with FluidFlow"
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                      style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-input-border)', color: 'var(--theme-text-primary)' }}
                    />
                  </div>

                  {/* Private/Public Toggle */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsPrivate(true)}
                      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-all"
                      style={{
                        backgroundColor: isPrivate ? 'var(--color-warning-subtle)' : 'var(--theme-glass-200)',
                        border: isPrivate ? '1px solid var(--color-warning-border)' : '1px solid var(--theme-border-light)',
                        color: isPrivate ? 'var(--color-warning)' : 'var(--theme-text-muted)'
                      }}
                    >
                      <Lock className="w-4 h-4" />
                      <span className="text-sm font-medium">Private</span>
                    </button>
                    <button
                      onClick={() => setIsPrivate(false)}
                      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-all"
                      style={{
                        backgroundColor: !isPrivate ? 'var(--color-success-subtle)' : 'var(--theme-glass-200)',
                        border: !isPrivate ? '1px solid var(--color-success-border)' : '1px solid var(--theme-border-light)',
                        color: !isPrivate ? 'var(--color-success)' : 'var(--theme-text-muted)'
                      }}
                    >
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-medium">Public</span>
                    </button>
                  </div>

                  {/* Include Context Option */}
                  <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border-light)' }}>
                    <input
                      type="checkbox"
                      checked={includeContext}
                      onChange={(e) => setIncludeContext(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Include Conversation History</span>
                      <p className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
                        Include AI chat history in .fluidflow/ folder. {!isPrivate && <span style={{ color: 'var(--color-warning)' }}>⚠ Public repo!</span>}
                      </p>
                    </div>
                  </label>

                  <button
                    onClick={handleCreateAndPush}
                    disabled={!newRepoName.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-text-on-accent)' }}
                  >
                    <Github className="w-4 h-4" />
                    Create Repository & Push
                  </button>

                  <p className="text-center text-xs" style={{ color: 'var(--theme-text-dim)' }}>
                    Or select an existing repository below
                  </p>
                </div>
              )}

              {/* Import Mode Toggle (My Repos vs Clone URL) */}
              {isImport && (
                <div className="px-6 py-3" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
                  <div className="flex items-center gap-2 p-1 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
                    <button
                      onClick={() => setImportMode('myRepos')}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all"
                      style={{
                        backgroundColor: importMode === 'myRepos' ? 'var(--theme-accent)' : 'transparent',
                        color: importMode === 'myRepos' ? 'var(--theme-text-on-accent)' : 'var(--theme-text-muted)'
                      }}
                    >
                      <FolderGit className="w-4 h-4" />
                      My Repositories
                    </button>
                    <button
                      onClick={() => setImportMode('url')}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all"
                      style={{
                        backgroundColor: importMode === 'url' ? 'var(--theme-accent)' : 'transparent',
                        color: importMode === 'url' ? 'var(--theme-text-on-accent)' : 'var(--theme-text-muted)'
                      }}
                    >
                      <Link2 className="w-4 h-4" />
                      Clone URL
                    </button>
                  </div>
                </div>
              )}

              {/* Clone by URL Section */}
              {isImport && importMode === 'url' && (
                <div className="px-6 py-4 space-y-4" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
                  <div>
                    <label className="text-xs font-semibold uppercase block mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                      GitHub Repository URL
                    </label>
                    <input
                      type="text"
                      value={cloneUrl}
                      onChange={(e) => setCloneUrl(e.target.value)}
                      placeholder="https://github.com/username/repository"
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                      style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-input-border)', color: 'var(--theme-text-primary)' }}
                    />
                    <p className="mt-1.5 text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
                      Paste any public GitHub repository URL. For private repos, enter your token first.
                    </p>
                  </div>

                  <button
                    onClick={handleCloneByUrl}
                    disabled={!cloneUrl.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-text-on-accent)' }}
                  >
                    <Download className="w-4 h-4" />
                    Clone Repository
                  </button>

                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-success-subtle)', border: '1px solid var(--color-success-border)' }}>
                    <FolderGit className="w-5 h-5 shrink-0" style={{ color: 'var(--color-success)' }} />
                    <p className="text-xs" style={{ color: 'var(--color-success)' }}>
                      If the repo contains <code className="px-1 rounded" style={{ backgroundColor: 'var(--theme-glass-300)' }}>.fluidflow/</code> folder, project metadata and conversation history will be restored automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* Search and Filter Bar (only for My Repos mode) */}
              {(!isImport || importMode === 'myRepos') && (
                <>
              <div className="px-6 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--theme-text-dim)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search repositories..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none transition-colors"
                    style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border-light)', color: 'var(--theme-text-primary)' }}
                  />
                </div>

                {isImport && (
                  <button
                    onClick={() => setShowBackupOnly(!showBackupOnly)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      backgroundColor: showBackupOnly ? 'var(--color-success-subtle)' : 'var(--theme-glass-200)',
                      color: showBackupOnly ? 'var(--color-success)' : 'var(--theme-text-muted)',
                      border: showBackupOnly ? '1px solid var(--color-success-border)' : '1px solid var(--theme-border-light)'
                    }}
                  >
                    <FolderGit className="w-4 h-4" />
                    FluidFlow Only
                  </button>
                )}

                <button
                  onClick={() => loadRepos(token)}
                  disabled={reposLoading}
                  className="p-2 rounded-lg transition-colors disabled:opacity-50"
                  style={{ color: 'var(--theme-text-muted)' }}
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${reposLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Repository List */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {reposLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-accent)' }} />
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--theme-text-muted)' }}>
                    <AlertTriangle className="w-12 h-12 mb-3 opacity-50" style={{ color: 'var(--color-error)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
                    <button
                      onClick={() => loadRepos(token)}
                      className="mt-4 px-4 py-2 rounded-lg text-sm transition-colors"
                      style={{ backgroundColor: 'var(--theme-glass-200)' }}
                    >
                      Try Again
                    </button>
                  </div>
                ) : sortedRepos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--theme-text-muted)' }}>
                    <Github className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">
                      {searchQuery ? 'No repositories found' : 'No repositories available'}
                    </p>
                    {showBackupOnly && (
                      <p className="text-xs mt-1" style={{ color: 'var(--theme-text-dim)' }}>
                        Try disabling "FluidFlow Only" filter
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {sortedRepos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => isImport ? handleImport(repo) : handlePushToExisting(repo)}
                        className="w-full group flex items-center gap-4 p-4 rounded-xl transition-all text-left"
                        style={{
                          backgroundColor: repo.hasFluidFlowBackup && isImport ? 'var(--color-success-subtle)' : 'var(--theme-glass-200)',
                          border: repo.hasFluidFlowBackup && isImport ? '1px solid var(--color-success-border)' : '1px solid var(--theme-border-light)'
                        }}
                      >
                        {/* Icon */}
                        <div className="p-2.5 rounded-xl" style={{
                          backgroundColor: repo.hasFluidFlowBackup && isImport ? 'var(--color-success-subtle)' : 'var(--theme-glass-300)'
                        }}>
                          {repo.hasFluidFlowBackup && isImport ? (
                            <FolderGit className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                          ) : (
                            <Github className="w-5 h-5" style={{ color: 'var(--theme-text-muted)' }} />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>
                              {repo.name}
                            </h3>
                            {repo.private ? (
                              <span title="Private"><Lock className="w-3.5 h-3.5" style={{ color: 'var(--color-warning)' }} /></span>
                            ) : (
                              <span title="Public"><Globe className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-dim)' }} /></span>
                            )}
                            {repo.hasFluidFlowBackup && isImport && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded font-medium" style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>
                                FluidFlow
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--theme-text-dim)' }}>
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
                              <Clock className="w-3 h-3" />
                              {formatDate(repo.updatedAt)}
                            </span>
                            <span className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
                              {repo.fullName}
                            </span>
                          </div>
                        </div>

                        {/* Action indicator */}
                        <div className="flex items-center gap-2">
                          {isPush && (
                            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text-dim)' }}>
                              Push here
                            </span>
                          )}
                          <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text-dim)' }} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
                </>
              )}
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--theme-accent-subtle)' }}>
                  {isImport ? (
                    <Download className="w-8 h-8" style={{ color: 'var(--theme-accent)' }} />
                  ) : (
                    <Upload className="w-8 h-8" style={{ color: 'var(--theme-accent)' }} />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--theme-accent)' }} />
                </div>
              </div>
              <h4 className="mt-6 text-lg font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                {isImport ? `Importing ${selectedRepo?.name || cloneUrl.split('/').pop()?.replace('.git', '') || 'project'}` : 'Pushing to GitHub'}
              </h4>
              <p className="mt-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                {isImport
                  ? 'Cloning repository and checking for FluidFlow metadata...'
                  : 'Creating repository and pushing files...'}
              </p>
            </div>
          )}

          {/* Result Step */}
          {step === 'result' && result && (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              {result.success ? (
                <>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-success-subtle)' }}>
                    <Check className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
                  </div>
                  <h4 className="mt-6 text-lg font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                    {isImport ? 'Import Successful!' : 'Push Successful!'}
                  </h4>
                  {isImport ? (
                    <p className="mt-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                      Project "{result.project?.name}" has been imported.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                      Your project has been pushed to GitHub.
                    </p>
                  )}

                  {/* Repo URL */}
                  {result.repoUrl && (
                    <a
                      href={result.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center gap-2 underline underline-offset-4"
                      style={{ color: 'var(--theme-accent)' }}
                    >
                      View on GitHub <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Restoration Status (import mode) */}
                  {isImport && result.restored && (
                    <div className="mt-6 w-full max-w-sm space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-lg" style={{
                        backgroundColor: result.restored.metadata ? 'var(--color-success-subtle)' : 'var(--theme-glass-200)',
                        border: result.restored.metadata ? '1px solid var(--color-success-border)' : '1px solid var(--theme-border-light)'
                      }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                          backgroundColor: result.restored.metadata ? 'var(--color-success-subtle)' : 'var(--theme-glass-300)'
                        }}>
                          {result.restored.metadata ? (
                            <Check className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                          ) : (
                            <X className="w-4 h-4" style={{ color: 'var(--theme-text-dim)' }} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>Project Metadata</p>
                          <p className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
                            {result.restored.metadata ? 'Restored from backup' : 'Not found'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg" style={{
                        backgroundColor: result.restored.context ? 'var(--color-success-subtle)' : 'var(--theme-glass-200)',
                        border: result.restored.context ? '1px solid var(--color-success-border)' : '1px solid var(--theme-border-light)'
                      }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                          backgroundColor: result.restored.context ? 'var(--color-success-subtle)' : 'var(--theme-glass-300)'
                        }}>
                          {result.restored.context ? (
                            <Check className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                          ) : (
                            <X className="w-4 h-4" style={{ color: 'var(--theme-text-dim)' }} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>Conversation Context</p>
                          <p className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
                            {result.restored.context ? 'Restored from backup' : 'Not found'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-error-subtle)' }}>
                    <AlertCircle className="w-8 h-8" style={{ color: 'var(--color-error)' }} />
                  </div>
                  <h4 className="mt-6 text-lg font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                    {isImport ? 'Import Failed' : 'Push Failed'}
                  </h4>
                  <p className="mt-2 text-sm p-3 rounded-lg max-w-md text-center" style={{ backgroundColor: 'var(--color-error-subtle)', border: '1px solid var(--color-error-border)', color: 'var(--color-error)' }}>
                    {result.error}
                  </p>
                  {result.error?.includes('Force Push') && (
                    <button
                      onClick={() => {
                        setForcePush(true);
                        setStep('repos');
                        setResult(null);
                      }}
                      className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: 'var(--color-warning)', color: 'white' }}
                    >
                      Enable Force Push & Retry
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 flex justify-between items-center shrink-0" style={{ backgroundColor: 'var(--theme-glass-100)', borderTop: '1px solid var(--theme-border)' }}>
          {step === 'repos' && (
            <button
              onClick={() => {
                setStep('token');
                setToken('');
              }}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Change Token
            </button>
          )}
          {step !== 'repos' && <div />}

          <div className="flex gap-3">
            {step === 'token' && !tokenLoading && (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTokenSubmit}
                  disabled={!token.trim() || tokenVerifying}
                  className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-text-on-accent)' }}
                >
                  {tokenVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                  Continue
                </button>
              </>
            )}

            {step === 'repos' && (
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                Cancel
              </button>
            )}

            {step === 'result' && (
              <button
                onClick={result?.success ? handleComplete : handleClose}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: result?.success ? 'var(--color-success)' : 'var(--theme-glass-200)',
                  color: result?.success ? 'white' : 'var(--theme-text-primary)'
                }}
              >
                {result?.success ? (isImport ? 'Open Project' : 'Done') : 'Close'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubModal;
