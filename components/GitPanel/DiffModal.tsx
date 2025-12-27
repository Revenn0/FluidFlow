import React from 'react';
import { FileText, X, Loader2 } from 'lucide-react';
import { DiffModalProps } from './types';
import { DiffViewer } from './DiffViewer';

export const DiffModal: React.FC<DiffModalProps> = ({ diff, isLoading, fileName, commitHash, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'var(--theme-modal-overlay)' }}>
      <div className="w-full max-w-4xl max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--theme-modal-bg)', border: '1px solid var(--theme-modal-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>
              {fileName ? fileName : 'All Changes'}
            </span>
            {commitHash && (
              <span className="text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>@ {commitHash}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 mx-auto animate-spin" style={{ color: 'var(--theme-accent)' }} />
              <p className="text-sm mt-2" style={{ color: 'var(--theme-text-muted)' }}>Loading diff...</p>
            </div>
          ) : diff ? (
            <DiffViewer diff={diff} />
          ) : (
            <div className="p-8 text-center" style={{ color: 'var(--theme-text-muted)' }}>
              <p>No changes to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiffModal;
