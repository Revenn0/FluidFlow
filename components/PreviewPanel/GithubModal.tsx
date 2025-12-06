import React from 'react';
import { Github, X, Check, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { PushResult } from '../../types';

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
  pushResult
}) => {
  if (!isOpen) return null;

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

        <div className="p-6 space-y-4">
          {!pushResult ? (
            <>
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
                    href="https://github.com/settings/tokens/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Create token
                  </a>
                </p>
              </div>
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
              </div>
            </>
          ) : pushResult.success ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-2">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Repository Created!</h4>
              <a
                href={pushResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 underline underline-offset-4"
              >
                View on GitHub <ExternalLink className="w-3.5 h-3.5" />
              </a>
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
              <button
                onClick={onPush}
                disabled={isPushing || !githubToken || !repoName}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isPushing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isPushing ? 'Pushing...' : 'Create & Push'}
              </button>
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
