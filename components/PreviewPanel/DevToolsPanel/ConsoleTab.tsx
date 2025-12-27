/**
 * ConsoleTab - Console log display component
 *
 * Displays console logs with timestamps and error fixing capabilities.
 */

import React, { useRef, useEffect } from 'react';
import { Terminal, Sparkles, Loader2, Check } from 'lucide-react';
import type { ConsoleTabProps } from './types';

export const ConsoleTab: React.FC<ConsoleTabProps> = ({ logs, onFixError }) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    const container = consoleEndRef.current?.parentElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center italic py-10" style={{ color: 'var(--theme-text-dim)' }}>
        <Terminal className="w-5 h-5 mb-2 opacity-50" />
        <span>Console is clear</span>
      </div>
    );
  }

  const getLogColor = (type: string): string => {
    switch (type) {
      case 'error': return 'var(--color-error)';
      case 'warn': return 'var(--color-warning)';
      default: return 'var(--theme-text-secondary)';
    }
  };

  return (
    <div className="p-3 space-y-1.5">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex gap-3 pb-2 last:border-0 items-start group"
          style={{
            borderBottom: '1px solid var(--theme-border-light)',
            backgroundColor: log.type === 'error' ? 'var(--color-error-subtle)' : 'transparent',
            margin: log.type === 'error' ? '0 -12px' : undefined,
            padding: log.type === 'error' ? '4px 12px' : undefined,
          }}
        >
          <span
            className="flex-none opacity-40 select-none min-w-[50px] pt-0.5"
            style={{ color: log.type === 'error' ? 'var(--color-error)' : 'var(--theme-text-dim)' }}
          >
            {log.timestamp}
          </span>
          <div className="flex-1 min-w-0">
            <span
              className={`break-all whitespace-pre-wrap ${log.type === 'error' ? 'font-semibold' : ''}`}
              style={{ color: getLogColor(log.type) }}
            >
              {log.message}
            </span>

            {log.type === 'error' && (
              <div className="mt-2 flex items-center gap-2">
                {log.isFixed ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                    style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)' }}
                  >
                    <Check className="w-3 h-3" />
                    Fixed
                  </span>
                ) : (
                  <button
                    onClick={() => onFixError(log.id, log.message)}
                    disabled={log.isFixing}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded transition-all text-[10px] font-medium"
                    style={{ backgroundColor: 'var(--color-error-subtle)', color: 'var(--color-error)', border: '1px solid var(--color-error-border)' }}
                  >
                    {log.isFixing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {log.isFixing ? 'Fixing with AI...' : 'Fix with AI'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={consoleEndRef} />
    </div>
  );
};
