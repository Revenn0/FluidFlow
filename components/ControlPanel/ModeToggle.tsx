import React from 'react';
import { Briefcase, Code2, Check, Info } from 'lucide-react';

interface ModeToggleProps {
  isConsultantMode: boolean;
  onToggle: () => void;
  autoAcceptChanges?: boolean;
  onAutoAcceptChange?: (value: boolean) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  isConsultantMode,
  onToggle,
  autoAcceptChanges = false,
  onAutoAcceptChange
}) => {
  return (
    <div className="flex items-center justify-between gap-3 p-2 rounded-xl" style={{ backgroundColor: 'var(--theme-glass-100)', border: '1px solid var(--theme-border-light)' }}>
      {/* Mode Toggle - Left side */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all"
          style={{
            backgroundColor: isConsultantMode ? 'var(--color-feature-subtle)' : 'var(--color-info-subtle)',
            color: isConsultantMode ? 'var(--color-feature)' : 'var(--color-info)'
          }}
          title={`Switch to ${isConsultantMode ? 'Engineer' : 'Consultant'} mode`}
        >
          {isConsultantMode ? (
            <>
              <Briefcase className="w-3 h-3" />
              <span>Consultant</span>
            </>
          ) : (
            <>
              <Code2 className="w-3 h-3" />
              <span>Engineer</span>
            </>
          )}
        </button>
      </div>

      {/* Auto-Accept Toggle - Right side (only in Engineer mode) */}
      {!isConsultantMode && onAutoAcceptChange && (
        <div className="flex items-center gap-1.5 group relative">
          <button
            onClick={() => onAutoAcceptChange(!autoAcceptChanges)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
            style={{
              backgroundColor: autoAcceptChanges ? 'var(--color-success-subtle)' : 'var(--theme-glass-200)',
              color: autoAcceptChanges ? 'var(--color-success)' : 'var(--theme-text-muted)'
            }}
            title={autoAcceptChanges ? 'Auto-accept is ON - changes apply immediately' : 'Auto-accept is OFF - review changes before applying'}
          >
            <Check className="w-3 h-3" style={{ opacity: autoAcceptChanges ? 1 : 0.5 }} />
            <span>Auto</span>
          </button>

          {/* Tooltip on hover */}
          <div className="absolute bottom-full right-0 mb-1 px-2 py-1 rounded-lg text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg" style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" style={{ color: 'var(--color-info)' }} />
              {autoAcceptChanges ? 'Changes apply immediately' : 'Review changes before applying'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
