/**
 * Activity Log Panel
 *
 * Displays FluidFlow internal logs in real-time.
 * Shows AI operations, git commits, backup status, and system events.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  Trash2,
  Filter,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
  Clock,
} from 'lucide-react';
import {
  activityLogger,
  ActivityLogEntry,
  LogCategory,
  formatLogTime,
  getCategoryColor,
  getLevelStyle,
} from '../../services/activityLogger';

const CATEGORY_LABELS: Record<LogCategory, string> = {
  system: 'System',
  ai: 'AI',
  git: 'Git',
  backup: 'Backup',
  autocommit: 'Auto-Commit',
  preview: 'Preview',
  api: 'API',
  file: 'File',
  generation: 'Generation',
};

const LEVEL_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  debug: Bug,
};

export const ActivityLogPanel: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [filter, setFilter] = useState<LogCategory | 'all'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Load initial logs and subscribe to new ones
  useEffect(() => {
    setLogs(activityLogger.getLogs());

    const unsubscribe = activityLogger.subscribe((entry) => {
      if (entry.id === 'clear') {
        setLogs([]);
      } else {
        setLogs(prev => {
          // Update existing entry or add new one
          const existingIdx = prev.findIndex(l => l.id === entry.id);
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = entry;
            return updated;
          }
          return [...prev, entry];
        });
      }
    });

    return unsubscribe;
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      // Use scrollTop instead of scrollIntoView to prevent page scrolling
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  }, []);

  // Close filter menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    activityLogger.clear();
  };

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(l => l.category === filter);

  const categories = Object.keys(CATEGORY_LABELS) as LogCategory[];

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-medium text-white">Activity Log</h3>
          <span className="text-xs text-slate-500">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              {filter === 'all' ? 'All' : CATEGORY_LABELS[filter]}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 py-1">
                <button
                  onClick={() => { setFilter('all'); setShowFilterMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 ${
                    filter === 'all' ? 'text-blue-400' : 'text-slate-300'
                  }`}
                >
                  All Categories
                </button>
                <div className="border-t border-white/5 my-1" />
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setFilter(cat); setShowFilterMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 flex items-center gap-2 ${
                      filter === cat ? 'text-blue-400' : 'text-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${getCategoryColor(cat).replace('text-', 'bg-')}`} />
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Button */}
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-xs"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <Activity className="w-8 h-8 opacity-50" />
            <span>No activity logs yet</span>
            <span className="text-[10px]">Logs will appear as FluidFlow operates</span>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredLogs.map(log => {
              const LevelIcon = LEVEL_ICONS[log.level];
              const levelStyle = getLevelStyle(log.level);

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 px-4 py-2 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Time */}
                  <span className="text-slate-600 whitespace-nowrap shrink-0">
                    {formatLogTime(log.timestamp)}
                  </span>

                  {/* Level Icon */}
                  <div className={`shrink-0 p-0.5 rounded ${levelStyle.bgColor}`}>
                    <LevelIcon className={`w-3 h-3 ${levelStyle.color}`} />
                  </div>

                  {/* Category Badge */}
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${getCategoryColor(log.category)} bg-white/5`}>
                    {log.category}
                  </span>

                  {/* Message */}
                  <span className="text-slate-300 flex-1 break-words">
                    {log.message}
                    {log.details && (
                      <span className="text-slate-500 ml-2">{log.details}</span>
                    )}
                  </span>

                  {/* Duration */}
                  {log.duration !== undefined && (
                    <span className="shrink-0 flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      {log.duration}ms
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && filteredLogs.length > 10 && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }}
          className="absolute bottom-4 right-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg shadow-lg flex items-center gap-1.5 transition-colors"
        >
          <ChevronDown className="w-3 h-3" />
          Jump to latest
        </button>
      )}
    </div>
  );
};

export default ActivityLogPanel;
