import React from 'react';
import { ArrowLeft, Eye, Copy, CheckCheck, RotateCcw, Loader2 } from 'lucide-react';
import { CommitDetailsViewProps } from './types';
import { CommitFileIcon } from './CommitFileIcon';

export const CommitDetailsView: React.FC<CommitDetailsViewProps> = ({
  commit,
  isLoading,
  onBack,
  onViewDiff,
  onViewFullDiff,
  onCopyHash,
  copiedHash,
  onRevert,
  isFirstCommit = false
}) => {
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="w-5 h-5 mx-auto animate-spin" style={{ color: 'var(--theme-accent)' }} />
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Header with back button */}
      <div className="flex items-center gap-2.5 mb-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded transition-colors"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>{commit.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onCopyHash}
              className="flex items-center gap-1.5 text-xs font-mono transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {copiedHash === commit.hash ? (
                <CheckCheck className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {commit.hashShort}
            </button>
            <span className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{commit.author}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          {commit.stats.filesChanged} file{commit.stats.filesChanged !== 1 ? 's' : ''}
        </span>
        {commit.stats.insertions > 0 && (
          <span className="text-xs" style={{ color: 'var(--color-success)' }}>+{commit.stats.insertions}</span>
        )}
        {commit.stats.deletions > 0 && (
          <span className="text-xs" style={{ color: 'var(--color-error)' }}>-{commit.stats.deletions}</span>
        )}
        <button
          onClick={onViewFullDiff}
          className="ml-auto text-xs flex items-center gap-1"
          style={{ color: 'var(--theme-accent)' }}
        >
          <Eye className="w-3.5 h-3.5" />
          All
        </button>
      </div>

      {/* Changed Files */}
      <div className="space-y-1">
        {commit.files.map((file) => (
          <button
            key={file.path}
            onClick={() => onViewDiff(file.path)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-sm rounded group transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <CommitFileIcon status={file.status} />
            <span className="truncate flex-1 text-left transition-colors">
              {file.newPath ? `${file.path} → ${file.newPath}` : file.path}
            </span>
            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        ))}
      </div>

      {/* Revert Button */}
      {onRevert && !isFirstCommit && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--theme-border-light)' }}>
          <button
            onClick={() => onRevert(commit)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)', border: '1px solid var(--color-warning-border)' }}
          >
            <RotateCcw className="w-4 h-4" />
            Restore to this commit
          </button>
        </div>
      )}
    </div>
  );
};

export default CommitDetailsView;
