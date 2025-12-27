import React from 'react';
import { ShieldCheck, X, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { AccessibilityReport } from '../../types';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AccessibilityReport | null;
  isAuditing: boolean;
  isFixing: boolean;
  onFix: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  report,
  isAuditing,
  isFixing,
  onFix
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-8 backdrop-blur-sm animate-in fade-in duration-200" style={{ backgroundColor: 'var(--theme-modal-overlay)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80%] animate-in slide-in-from-bottom-4 duration-300" style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--color-feature-border)' }}>
        {/* Header */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(to right, var(--color-feature-subtle), transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-feature-subtle)', color: 'var(--color-feature)' }}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Accessibility Audit</h3>
              <p className="text-xs" style={{ color: 'var(--color-feature)' }}>WCAG 2.1 Compliance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            aria-label="Close accessibility audit"
          >
            <X className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          {isAuditing ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-feature)' }} />
              <p className="text-sm" style={{ color: 'var(--color-feature)' }}>Scanning for violations...</p>
            </div>
          ) : report ? (
            <>
              {/* Score Card */}
              <div className="flex items-center gap-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--theme-glass-100)', border: '1px solid var(--theme-border-light)' }}>
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--theme-glass-300)"
                      strokeWidth="3"
                    />
                    <path
                      className="transition-all duration-1000 ease-out"
                      style={{
                        stroke: report.score > 80
                          ? 'var(--color-success)'
                          : report.score > 50
                          ? 'var(--color-warning)'
                          : 'var(--color-error)'
                      }}
                      strokeDasharray={`${report.score}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="absolute text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>{report.score}</span>
                </div>
                <div>
                  <h4 className="font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Overall Score</h4>
                  <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                    {report.score === 100
                      ? 'Great job! No obvious accessibility issues found.'
                      : `Found ${report.issues.length} issues that need attention.`}
                  </p>
                </div>
              </div>

              {/* Issues List */}
              {report.issues.length > 0 && (
                <ul className="space-y-3">
                  {report.issues.map((issue, idx) => (
                    <li
                      key={idx}
                      className="flex gap-3 text-sm p-3 rounded-lg"
                      style={{ color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-glass-100)', border: '1px solid var(--theme-border-light)' }}
                    >
                      <AlertTriangle
                        className="w-5 h-5 flex-none"
                        style={{ color: issue.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)' }}
                      />
                      <span className="leading-relaxed">{issue.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="text-center py-4" style={{ color: 'var(--theme-text-dim)' }}>Could not load report.</div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 flex gap-3" style={{ backgroundColor: 'var(--theme-glass-100)', borderTop: '1px solid var(--theme-border-light)' }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl transition-colors text-sm font-medium"
            style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
          >
            Close
          </button>
          {report && report.issues.length > 0 && (
            <button
              onClick={onFix}
              disabled={isFixing}
              className="flex-1 py-2.5 rounded-xl shadow-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-feature)', color: 'white' }}
            >
              {isFixing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isFixing ? 'Applying Fixes...' : 'Fix Automatically'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
