import React from 'react';
import { Briefcase, X } from 'lucide-react';

interface ConsultantReportProps {
  suggestions: string[] | null;
  onClose: () => void;
}

export const ConsultantReport: React.FC<ConsultantReportProps> = ({ suggestions, onClose }) => {
  if (!suggestions) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80%] animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-indigo-100">Consultant Report</h3>
              <p className="text-xs text-indigo-400">UX & Logic Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
            aria-label="Close consultant report"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <ul className="space-y-3">
            {suggestions.map((suggestion, idx) => (
              <li
                key={idx}
                className="flex gap-3 text-sm text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="flex-none w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold border border-indigo-500/30">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 bg-slate-950/50 border-t border-white/5 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-indigo-300 transition-colors"
          >
            Dismiss Report
          </button>
        </div>
      </div>
    </div>
  );
};
