/**
 * ErrorFixPanel - UI for monitoring the agentic error fixing process
 *
 * Displays:
 * - Agent state (idle, analyzing, fixing, etc.)
 * - Log entries (prompts sent, responses received, fixes applied)
 * - Controls (start, stop)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Play,
  Square,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Send,
  MessageSquare,
  Wrench,
  Info,
  AlertCircle,
  Clock,
  FileCode,
  Undo2,
  Trash2
} from 'lucide-react';
import { AgentState, AgentLogEntry, fixAgent, AgentConfig } from '../../services/errorFix';
import { FileSystem } from '../../types';

interface ErrorFixPanelProps {
  files: FileSystem;
  currentError: string | null;
  currentErrorStack?: string;
  targetFile: string;
  onFileUpdate: (path: string, content: string) => void;
  onFixComplete?: (success: boolean) => void;
  // Revert to last working state (undo)
  onUndo?: () => void;
  canUndo?: boolean;
}

// State colors and icons - using CSS variables
const stateConfig: Record<AgentState, { colorVar: string; icon: React.ReactNode; label: string }> = {
  idle: { colorVar: 'var(--theme-text-muted)', icon: <Bot className="w-4 h-4" />, label: 'Idle' },
  analyzing: { colorVar: 'var(--theme-accent)', icon: <Loader2 className="w-4 h-4 animate-spin" />, label: 'Analyzing' },
  'local-fix': { colorVar: 'var(--color-info)', icon: <Wrench className="w-4 h-4 animate-pulse" />, label: 'Local Fix' },
  'ai-fix': { colorVar: 'var(--theme-ai-accent)', icon: <Bot className="w-4 h-4 animate-pulse" />, label: 'AI Fix' },
  fixing: { colorVar: 'var(--color-warning)', icon: <Loader2 className="w-4 h-4 animate-spin" />, label: 'Fixing' },
  applying: { colorVar: 'var(--color-warning)', icon: <Wrench className="w-4 h-4" />, label: 'Applying' },
  verifying: { colorVar: 'var(--theme-ai-accent)', icon: <Loader2 className="w-4 h-4 animate-spin" />, label: 'Verifying' },
  success: { colorVar: 'var(--color-success)', icon: <CheckCircle className="w-4 h-4" />, label: 'Success' },
  failed: { colorVar: 'var(--color-error)', icon: <XCircle className="w-4 h-4" />, label: 'Failed' },
  max_attempts_reached: { colorVar: 'var(--color-warning)', icon: <AlertTriangle className="w-4 h-4" />, label: 'Max Attempts' }
};

// Log entry type icons - colors applied via style
const getLogTypeIcon = (type: AgentLogEntry['type']) => {
  const iconMap: Record<AgentLogEntry['type'], { icon: React.ReactNode; colorVar: string }> = {
    info: { icon: <Info className="w-3.5 h-3.5" />, colorVar: 'var(--theme-accent)' },
    prompt: { icon: <Send className="w-3.5 h-3.5" />, colorVar: 'var(--color-info)' },
    response: { icon: <MessageSquare className="w-3.5 h-3.5" />, colorVar: 'var(--color-success)' },
    fix: { icon: <Wrench className="w-3.5 h-3.5" />, colorVar: 'var(--color-warning)' },
    error: { icon: <AlertCircle className="w-3.5 h-3.5" />, colorVar: 'var(--color-error)' },
    success: { icon: <CheckCircle className="w-3.5 h-3.5" />, colorVar: 'var(--color-success)' },
    warning: { icon: <AlertTriangle className="w-3.5 h-3.5" />, colorVar: 'var(--color-warning)' }
  };
  return iconMap[type];
};

export const ErrorFixPanel: React.FC<ErrorFixPanelProps> = ({
  files,
  currentError,
  currentErrorStack,
  targetFile,
  onFileUpdate,
  onFixComplete,
  onUndo,
  canUndo
}) => {
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Restore state from agent on mount (handles tab switching)
  // We intentionally only run on mount to restore state, callbacks are passed by ref
  useEffect(() => {
    // Check if agent has stored state to restore
    const agentIsRunning = fixAgent.getIsRunning();
    const storedLogs = fixAgent.getLogs();
    const storedState = fixAgent.getState();
    const storedCompletionMessage = fixAgent.getCompletionMessage();
    const storedMaxAttempts = fixAgent.getMaxAttempts();

    // Restore state if there's something to restore
    if (storedLogs.length > 0 || storedState !== 'idle') {
      setLogs(storedLogs);
      setAgentState(storedState);
      setIsRunning(agentIsRunning);
      setCompletionMessage(storedCompletionMessage);
      setMaxAttempts(storedMaxAttempts);

      // Reconnect callbacks if agent is still running
      if (agentIsRunning) {
        fixAgent.reconnect({
          onStateChange: setAgentState,
          onLog: (entry) => setLogs(prev => [...prev, entry]),
          onFileUpdate,
          onComplete: (success, message) => {
            setIsRunning(false);
            setCompletionMessage(message);
            onFixComplete?.(success);
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount to restore state

  // Auto-scroll to latest log (only when logs exist, and use block: 'nearest' to prevent parent scroll)
  useEffect(() => {
    if (logs.length > 0) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [logs]);

  const handleStart = () => {
    if (!currentError) return;

    setLogs([]);
    setCompletionMessage(null);
    setIsRunning(true);

    const config: AgentConfig = {
      maxAttempts,
      timeoutMs: 60000,
      onStateChange: (state) => setAgentState(state),
      onLog: (entry) => setLogs(prev => [...prev, entry]),
      onFileUpdate: (path, content) => {
        onFileUpdate(path, content);
      },
      onComplete: (success, message) => {
        setIsRunning(false);
        setCompletionMessage(message);
        onFixComplete?.(success);
      }
    };

    fixAgent.start(
      currentError,
      currentErrorStack,
      targetFile,
      files,
      config
    );
  };

  const handleStop = () => {
    fixAgent.stop();
    setIsRunning(false);
  };

  const handleClear = () => {
    fixAgent.clear();
    setLogs([]);
    setAgentState('idle');
    setCompletionMessage(null);
    setExpandedLogs(new Set());
  };

  const toggleLogExpand = (id: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const stateInfo = stateConfig[agentState];

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--theme-code-bg)', color: 'var(--theme-text-secondary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-surface-elevated)' }}>
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
          <span className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>Error Fix Agent</span>
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs"
            style={{ color: stateInfo.colorVar, backgroundColor: 'var(--theme-surface)' }}
          >
            {stateInfo.icon}
            <span>{stateInfo.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear logs button */}
          {logs.length > 0 && !isRunning && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-sm transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Max attempts selector */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            <span>Max attempts:</span>
            <select
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              disabled={isRunning}
              className="rounded px-2 py-1 text-xs"
              style={{
                backgroundColor: 'var(--theme-input-bg)',
                border: '1px solid var(--theme-input-border)',
                color: 'var(--theme-text-primary)'
              }}
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>

          {/* Revert button - undo last change */}
          {onUndo && canUndo && currentError && !isRunning && (
            <button
              onClick={onUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--color-warning)', color: 'var(--theme-text-inverse)' }}
              title="Revert to last working code"
            >
              <Undo2 className="w-4 h-4" />
              Revert
            </button>
          )}

          {/* Start/Stop button */}
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={!currentError}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-success)', color: 'var(--theme-text-inverse)' }}
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--color-error)', color: 'var(--theme-text-inverse)' }}
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Current error display */}
      {currentError && (
        <div className="px-4 py-2" style={{ backgroundColor: 'var(--color-error-subtle)', borderBottom: '1px solid var(--color-error-border)' }}>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--color-error)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium" style={{ color: 'var(--color-error)' }}>Current Error</div>
              <div className="text-sm font-mono break-words" style={{ color: 'var(--color-error-text)' }}>{currentError}</div>
              {targetFile && (
                <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  <FileCode className="w-3 h-3" />
                  <span>{targetFile}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logs area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--theme-text-muted)' }}>
            <Bot className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No logs yet</p>
            <p className="text-xs mt-1">Click "Start" to begin fixing the error</p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogs.has(log.id);
            const isLongContent = log.content.length > 200;

            return (
              <div
                key={log.id}
                className="rounded"
                style={{
                  border: `1px solid ${
                    log.type === 'error' ? 'var(--color-error-border)' :
                    log.type === 'success' ? 'var(--color-success-border)' :
                    log.type === 'warning' ? 'var(--color-warning-border)' :
                    'var(--theme-border)'
                  }`,
                  backgroundColor: log.type === 'error' ? 'var(--color-error-subtle)' :
                    log.type === 'success' ? 'var(--color-success-subtle)' :
                    log.type === 'warning' ? 'var(--color-warning-subtle)' :
                    'var(--theme-glass-100)'
                }}
              >
                {/* Log header */}
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                  onClick={() => isLongContent && toggleLogExpand(log.id)}
                >
                  {isLongContent && (
                    isExpanded ?
                      <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} /> :
                      <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
                  )}
                  <span style={{ color: getLogTypeIcon(log.type).colorVar }}>{getLogTypeIcon(log.type).icon}</span>
                  <span className="text-sm font-medium flex-1" style={{ color: 'var(--theme-text-primary)' }}>{log.title}</span>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    {log.metadata?.attempt && (
                      <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
                        #{log.metadata.attempt}
                      </span>
                    )}
                    {log.metadata?.model && (
                      <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--theme-accent-subtle)', color: 'var(--theme-accent)' }}>
                        {log.metadata.model}
                      </span>
                    )}
                    {log.metadata?.duration && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {(log.metadata.duration / 1000).toFixed(1)}s
                      </span>
                    )}
                    <span>{formatTime(log.timestamp)}</span>
                  </div>
                </div>

                {/* Log content */}
                <div className={`px-3 pb-2 ${isLongContent && !isExpanded ? 'max-h-24 overflow-hidden' : ''}`}>
                  <pre
                    className="text-xs font-mono whitespace-pre-wrap break-words p-2 rounded"
                    style={{ color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-glass-100)' }}
                  >
                    {isLongContent && !isExpanded
                      ? log.content.slice(0, 200) + '...'
                      : log.content
                    }
                  </pre>
                  {log.metadata?.file && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      <FileCode className="w-3 h-3" />
                      <span>{log.metadata.file}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Completion message */}
      {completionMessage && (
        <div
          className="px-4 py-3"
          style={{
            borderTop: `1px solid ${agentState === 'success' ? 'var(--color-success-border)' : 'var(--color-error-border)'}`,
            backgroundColor: agentState === 'success' ? 'var(--color-success-subtle)' : 'var(--color-error-subtle)'
          }}
        >
          <div className="flex items-center gap-2">
            {agentState === 'success' ? (
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
            ) : (
              <XCircle className="w-5 h-5" style={{ color: 'var(--color-error)' }} />
            )}
            <span
              className="text-sm font-medium"
              style={{ color: agentState === 'success' ? 'var(--color-success)' : 'var(--color-error)' }}
            >
              {completionMessage}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorFixPanel;
