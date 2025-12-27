import React, { useState } from 'react';
import {
  History, X, ChevronRight, Clock, Pin, FileCode, RotateCcw,
  Save, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import { HistoryEntry } from '../hooks/useVersionHistory';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  currentIndex: number;
  onGoToIndex: (index: number) => void;
  onSaveSnapshot: (name: string) => void;
  onPreview?: (index: number) => void;
}

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Get icon for entry type
function getEntryIcon(entry: HistoryEntry) {
  if (entry.type === 'snapshot') return <Pin className="w-3.5 h-3.5" style={{ color: 'var(--color-warning)' }} />;
  if (entry.label.includes('Initial')) return <FileCode className="w-3.5 h-3.5" style={{ color: 'var(--color-info)' }} />;
  return <Clock className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-dim)' }} />;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  currentIndex,
  onGoToIndex,
  onSaveSnapshot,
  onPreview
}) => {
  const [snapshotName, setSnapshotName] = useState('');
  const [isSnapshotInputOpen, setIsSnapshotInputOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleSaveSnapshot = () => {
    if (snapshotName.trim()) {
      onSaveSnapshot(snapshotName.trim());
      setSnapshotName('');
      setIsSnapshotInputOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 z-50 flex flex-col backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-5 duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderLeft: '1px solid var(--theme-border-light)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
        <div className="flex items-center gap-2">
          <History className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
          <h2 className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>History Timeline</h2>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--theme-glass-200)', color: 'var(--theme-text-muted)' }}>
            {history.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Save Snapshot */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--theme-border-subtle)' }}>
        {isSnapshotInputOpen ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveSnapshot()}
              placeholder="Snapshot name..."
              className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-input-border)', color: 'var(--theme-text-primary)' }}
              autoFocus
            />
            <button
              onClick={handleSaveSnapshot}
              disabled={!snapshotName.trim()}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-warning)', color: 'var(--theme-text-on-accent)' }}
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setIsSnapshotInputOpen(false); setSnapshotName(''); }}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsSnapshotInputOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)', border: '1px solid var(--color-warning-border)' }}
          >
            <Pin className="w-4 h-4" />
            Save Checkpoint
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2">
          {[...history].reverse().map((entry, reversedIdx) => {
            const idx = history.length - 1 - reversedIdx;
            const isCurrent = idx === currentIndex;
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={`${entry.timestamp}-${idx}`}
                className={`relative mb-1 ${reversedIdx < history.length - 1 ? 'pb-1' : ''}`}
              >
                {/* Timeline connector line */}
                {reversedIdx < history.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px" style={{ backgroundColor: 'var(--theme-border-light)' }} />
                )}

                <div
                  className="relative flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all"
                  style={{
                    backgroundColor: isCurrent ? 'var(--color-info-subtle)' : 'transparent',
                    border: isCurrent ? '1px solid var(--color-info-border)' : '1px solid transparent',
                  }}
                  onClick={() => !isCurrent && onGoToIndex(idx)}
                >
                  {/* Timeline dot */}
                  <div
                    className="flex-none w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: isCurrent ? 'var(--color-info)' : entry.type === 'snapshot' ? 'var(--color-warning-subtle)' : 'var(--theme-glass-200)',
                      border: isCurrent ? 'none' : entry.type === 'snapshot' ? '1px solid var(--color-warning-border)' : '1px solid var(--theme-border-light)',
                      boxShadow: isCurrent ? '0 0 0 4px var(--color-info-subtle)' : 'none',
                    }}
                  >
                    {isCurrent ? (
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--theme-text-on-accent)' }} />
                    ) : (
                      getEntryIcon(entry)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: isCurrent ? 'var(--color-info)' : 'var(--theme-text-secondary)' }}>
                        {entry.label}
                      </span>
                      <span className="text-[10px] flex-none" style={{ color: 'var(--theme-text-dim)' }}>
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>

                    {/* Changed files summary */}
                    {entry.changedFiles && entry.changedFiles.length > 0 && (
                      <div className="mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedIndex(isExpanded ? null : idx);
                          }}
                          className="flex items-center gap-1 text-[10px]"
                          style={{ color: 'var(--theme-text-dim)' }}
                        >
                          <FileCode className="w-3 h-3" />
                          <span>{entry.changedFiles.length} file{entry.changedFiles.length > 1 ? 's' : ''}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-1.5 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                            {entry.changedFiles.map((file) => (
                              <div
                                key={file}
                                className="text-[10px] font-mono pl-4 truncate"
                                style={{ color: 'var(--theme-text-dim)' }}
                              >
                                {file}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons for non-current entries */}
                    {!isCurrent && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onGoToIndex(idx);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded transition-colors"
                          style={{ backgroundColor: 'var(--theme-glass-200)', color: 'var(--theme-text-muted)' }}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                        {onPreview && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreview(idx);
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded transition-colors"
                            style={{ backgroundColor: 'var(--theme-glass-200)', color: 'var(--theme-text-muted)' }}
                          >
                            <Eye className="w-3 h-3" />
                            Preview
                          </button>
                        )}
                      </div>
                    )}

                    {isCurrent && (
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' }}>
                        Current
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--theme-border-subtle)', backgroundColor: 'var(--theme-surface-dark)' }}>
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--theme-text-dim)' }}>
          <span>Position: {currentIndex + 1} / {history.length}</span>
          <span>Max: 50 entries</span>
        </div>
      </div>
    </div>
  );
};
