import React from 'react';
import { AlertTriangle, X, RotateCcw, MessageSquare, FileCode, History, Server, FolderOpen, Database } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentProjectName?: string;
  hasUncommittedChanges?: boolean;
  onOpenGitTab?: () => void;
  hasRunningServer?: boolean;
}

export function ResetConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  currentProjectName,
  hasUncommittedChanges,
  onOpenGitTab,
  hasRunningServer
}: ResetConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200" style={{ backgroundColor: 'var(--theme-modal-overlay)' }}>
      <div className="w-full max-w-md backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden mx-4 animate-in zoom-in-95 duration-200" style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 p-5" style={{ borderBottom: '1px solid var(--theme-border)', backgroundColor: 'var(--color-error-subtle)' }}>
          <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--color-error-subtle)' }}>
            <AlertTriangle className="w-6 h-6" style={{ color: 'var(--color-error)' }} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Start Fresh?</h3>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>This action cannot be undone</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            Starting fresh will clear the following:
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-100)', border: '1px solid var(--theme-border-light)' }}>
              <MessageSquare className="w-5 h-5 shrink-0" style={{ color: 'var(--theme-accent)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>Chat History</p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>All messages and conversation context</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-100)', border: '1px solid var(--theme-border-light)' }}>
              <FileCode className="w-5 h-5 shrink-0" style={{ color: 'var(--theme-ai-accent)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>Generated Code</p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>All files and the preview will be cleared</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-100)', border: '1px solid var(--theme-border-light)' }}>
              <History className="w-5 h-5 shrink-0" style={{ color: 'var(--color-success)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>Version History</p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>All undo/redo states will be lost</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-100)', border: '1px solid var(--theme-border-light)' }}>
              <Database className="w-5 h-5 shrink-0" style={{ color: 'var(--color-warning)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>AI Contexts</p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>All conversation contexts (main, prompt improver, git, etc.)</p>
              </div>
            </div>

            {/* Running Server */}
            {hasRunningServer && (
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-warning-subtle)', border: '1px solid var(--color-warning-border)' }}>
                <Server className="w-5 h-5 shrink-0" style={{ color: 'var(--color-warning)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-warning)' }}>Running Server</p>
                  <p className="text-xs" style={{ color: 'var(--color-warning)', opacity: 0.7 }}>Development server will be stopped</p>
                </div>
              </div>
            )}

            {/* Current Project */}
            {currentProjectName && (
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-info-subtle)', border: '1px solid var(--color-info-border)' }}>
                <FolderOpen className="w-5 h-5 shrink-0" style={{ color: 'var(--color-info)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-info)' }}>Project: {currentProjectName}</p>
                  <p className="text-xs" style={{ color: 'var(--color-info)', opacity: 0.7 }}>Project will be closed (saved changes preserved)</p>
                </div>
              </div>
            )}
          </div>

          {/* Uncommitted Changes Warning */}
          {currentProjectName && hasUncommittedChanges && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-warning-subtle)', border: '1px solid var(--color-warning-border)' }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-warning)' }}>Uncommitted Changes</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-warning)', opacity: 0.8 }}>
                    You have unsaved changes in project "{currentProjectName}".
                    These changes will be lost if you reset.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenGitTab?.();
                    }}
                    className="text-xs underline mt-2"
                    style={{ color: 'var(--color-warning)' }}
                  >
                    Review changes in Git tab
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5" style={{ borderTop: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-glass-100)' }}>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
            style={{ color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--color-error)', color: 'white' }}
          >
            <RotateCcw className="w-4 h-4" />
            Yes, Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}
