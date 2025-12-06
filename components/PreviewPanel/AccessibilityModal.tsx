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
    <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80%] animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-100">Accessibility Audit</h3>
              <p className="text-xs text-purple-400">WCAG 2.1 Compliance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
            aria-label="Close accessibility audit"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          {isAuditing ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-sm text-purple-300">Scanning for violations...</p>
            </div>
          ) : report ? (
            <>
              {/* Score Card */}
              <div className="flex items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className={`${
                        report.score > 80
                          ? 'text-green-500'
                          : report.score > 50
                          ? 'text-yellow-500'
                          : 'text-red-500'
                      } transition-all duration-1000 ease-out`}
                      strokeDasharray={`${report.score}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="absolute text-xl font-bold text-white">{report.score}</span>
                </div>
                <div>
                  <h4 className="font-medium text-slate-200">Overall Score</h4>
                  <p className="text-xs text-slate-400 mt-1">
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
                      className="flex gap-3 text-sm text-slate-300 bg-slate-950/30 p-3 rounded-lg border border-white/5"
                    >
                      <AlertTriangle
                        className={`w-5 h-5 flex-none ${
                          issue.type === 'error' ? 'text-red-400' : 'text-yellow-400'
                        }`}
                      />
                      <span className="leading-relaxed">{issue.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="text-center text-slate-500 py-4">Could not load report.</div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/50 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Close
          </button>
          {report && report.issues.length > 0 && (
            <button
              onClick={onFix}
              disabled={isFixing}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 transition-all text-sm font-medium flex items-center justify-center gap-2"
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
