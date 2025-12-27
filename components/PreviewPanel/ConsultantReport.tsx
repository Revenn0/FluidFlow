import React from 'react';
import { Briefcase, X } from 'lucide-react';

interface ConsultantReportProps {
  suggestions: string[] | null;
  onClose: () => void;
}

export const ConsultantReport: React.FC<ConsultantReportProps> = ({ suggestions, onClose }) => {
  if (!suggestions) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-8 backdrop-blur-sm animate-in fade-in duration-200" style={{ backgroundColor: 'var(--theme-overlay)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80%] animate-in slide-in-from-bottom-4 duration-300" style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--color-feature-border)' }}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--theme-border-subtle)', background: 'linear-gradient(to right, var(--color-feature-subtle), transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-feature-subtle)', color: 'var(--color-feature)' }}>
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Consultant Report</h3>
              <p className="text-xs" style={{ color: 'var(--color-feature)' }}>UX & Logic Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            aria-label="Close consultant report"
          >
            <X className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <ul className="space-y-3">
            {suggestions.map((suggestion, idx) => (
              <li
                key={idx}
                className="flex gap-3 text-sm p-3 rounded-xl transition-colors"
                style={{ color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-glass-100)', border: '1px solid var(--theme-border-subtle)' }}
              >
                <span className="flex-none w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--color-feature-subtle)', color: 'var(--color-feature)', border: '1px solid var(--color-feature-border)' }}>
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 text-center" style={{ backgroundColor: 'var(--theme-surface-dark)', borderTop: '1px solid var(--theme-border-subtle)' }}>
          <button
            onClick={onClose}
            className="text-xs transition-colors"
            style={{ color: 'var(--theme-text-dim)' }}
          >
            Dismiss Report
          </button>
        </div>
      </div>
    </div>
  );
};
