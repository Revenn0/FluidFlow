import React, { useState } from 'react';
import { Github, X, Check, AlertTriangle, ExternalLink, Loader2, Plus, Link2 } from 'lucide-react';
import { PushResult } from '../../types';

type PushMode = 'create' | 'existing';

interface GithubModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubToken: string;
  onTokenChange: (token: string) => void;
  repoName: string;
  onRepoNameChange: (name: string) => void;
  onPush: () => void;
  isPushing: boolean;
  pushResult: PushResult | null;
  // New props for existing repo
  repoUrl?: string;
  onRepoUrlChange?: (url: string) => void;
  onPushToExisting?: (force?: boolean) => void;
  hasRemote?: boolean;
  currentRemoteUrl?: string;
}

export const GithubModal: React.FC<GithubModalProps> = ({
  isOpen,
  onClose,
  githubToken,
  onTokenChange,
  repoName,
  onRepoNameChange,
  onPush,
  isPushing,
  pushResult,
  repoUrl = '',
  onRepoUrlChange,
  onPushToExisting,
  hasRemote = false,
  currentRemoteUrl = '',
}) => {
  const [mode, setMode] = useState<PushMode>(hasRemote ? 'existing' : 'create');
  const [forcePush, setForcePush] = useState(false);

  if (!isOpen) return null;

  const canPushCreate = githubToken && repoName;
  const canPushExisting = githubToken && (repoUrl || currentRemoteUrl);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-white/5 bg-slate-950 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Github className="w-5 h-5" />
            Push to GitHub
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
            aria-label="Close GitHub modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        {!pushResult && (
          <div className="px-6 pt-4">
            <div className="flex p-1 bg-slate-950/50 rounded-lg border border-white/5">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'create'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-4 h-4" />
                New Repo
              </button>
              <button
                onClick={() => setMode('existing')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'existing'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Link2 className="w-4 h-4" />
                Existing Repo
              </button>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          {!pushResult ? (
            <>
              {/* GitHub Token - shared between modes */}
              <div>
                <label
                  htmlFor="github-token"
                  className="text-xs font-semibold text-slate-400 uppercase block mb-1.5"
                >
                  GitHub Token (PAT)
                </label>
                <input
                  id="github-token"
                  type="password"
                  value={githubToken}
                  onChange={(e) => onTokenChange(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Requires 'repo' scope.{' '}
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=FluidFlow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Create token
                  </a>
                </p>
              </div>

              {mode === 'create' ? (
                /* Create New Repo Mode */
                <div>
                  <label
                    htmlFor="repo-name"
                    className="text-xs font-semibold text-slate-400 uppercase block mb-1.5"
                  >
                    Repository Name
                  </label>
                  <input
                    id="repo-name"
                    type="text"
                    value={repoName}
                    onChange={(e) => onRepoNameChange(e.target.value.replace(/[^a-zA-Z0-9-_]/g, '-'))}
                    placeholder="my-awesome-app"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    A new private repository will be created on your GitHub account.
                  </p>
                </div>
              ) : (
                /* Push to Existing Repo Mode */
                <>
                  <div>
                    <label
                      htmlFor="repo-url"
                      className="text-xs font-semibold text-slate-400 uppercase block mb-1.5"
                    >
                      Repository URL
                    </label>
                    {currentRemoteUrl ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-emerald-300 truncate flex-1">{currentRemoteUrl}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Remote already configured. Click "Push" to sync.
                        </p>
                      </div>
                    ) : (
                      <>
                        <input
                          id="repo-url"
                          type="text"
                          value={repoUrl}
                          onChange={(e) => onRepoUrlChange?.(e.target.value)}
                          placeholder="https://github.com/username/repo.git"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-600"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Enter the URL of an existing GitHub repository.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Force Push Option */}
                  <label className="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg cursor-pointer hover:bg-amber-500/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={forcePush}
                      onChange={(e) => setForcePush(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500/50"
                    />
                    <div>
                      <span className="text-sm text-amber-300 font-medium">Force Push</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Overwrite remote history. Use if histories have diverged.
                      </p>
                    </div>
                  </label>
                </>
              )}
            </>
          ) : pushResult.success ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-2">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">
                {mode === 'create' ? 'Repository Created!' : 'Push Successful!'}
              </h4>
              {pushResult.url && (
                <a
                  href={pushResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 underline underline-offset-4"
                >
                  View on GitHub <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Push Failed</h4>
              <p className="text-sm text-red-300 bg-red-950/50 p-3 rounded border border-red-500/20 font-mono">
                {pushResult.error}
              </p>
              {pushResult.error?.includes('diverged') || pushResult.error?.includes('rejected') ? (
                <p className="text-xs text-slate-400">
                  Try enabling "Force Push" to overwrite remote history.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-white/5 flex justify-end gap-3">
          {!pushResult ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              {mode === 'create' ? (
                <button
                  onClick={onPush}
                  disabled={isPushing || !canPushCreate}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {isPushing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isPushing ? 'Creating...' : 'Create & Push'}
                </button>
              ) : (
                <button
                  onClick={() => onPushToExisting?.(forcePush)}
                  disabled={isPushing || !canPushExisting}
                  className={`px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors ${
                    forcePush
                      ? 'bg-amber-500 text-black hover:bg-amber-400'
                      : 'bg-slate-100 text-slate-900 hover:bg-white'
                  }`}
                >
                  {isPushing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isPushing ? 'Pushing...' : forcePush ? 'Force Push' : 'Push'}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors text-sm font-medium"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
