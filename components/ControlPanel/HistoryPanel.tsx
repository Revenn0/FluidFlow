import React, { useState } from 'react';
import { History, ChevronUp, ChevronDown, Undo2 } from 'lucide-react';
import { HistoryEntry } from '../../types';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onRestore }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length <= 1) return null;

  return (
    <div className="flex-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-white/5"
        aria-expanded={isOpen}
        aria-controls="history-panel"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <History className="w-4 h-4" />
          <span>History</span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">{history.length}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div
          id="history-panel"
          className="mt-2 p-3 bg-slate-950/50 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2 max-h-48 overflow-y-auto custom-scrollbar"
        >
          <div className="relative pl-4 border-l border-white/10 space-y-3">
            {history.slice(0, 10).map((entry, index) => (
              <div key={entry.id} className="relative group">
                <div
                  className={`absolute -left-[13px] top-1.5 w-2 h-2 rounded-full ${
                    index === 0 ? 'bg-blue-500 ring-2 ring-blue-500/30' : 'bg-slate-600'
                  }`}
                />
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[11px] font-medium truncate ${
                        index === 0 ? 'text-blue-300' : 'text-slate-400'
                      }`}
                    >
                      {entry.label}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {index !== 0 && (
                    <button
                      onClick={() => onRestore(entry)}
                      className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      title="Revert to this version"
                      aria-label={`Revert to ${entry.label}`}
                    >
                      <Undo2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
