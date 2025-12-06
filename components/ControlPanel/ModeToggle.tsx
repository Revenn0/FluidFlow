import React from 'react';
import { Briefcase, UserCheck } from 'lucide-react';

interface ModeToggleProps {
  isConsultantMode: boolean;
  onToggle: () => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ isConsultantMode, onToggle }) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
      <div className="flex items-center gap-2">
        <div
          className={`p-1.5 rounded-lg transition-colors ${
            isConsultantMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-blue-500/20 text-blue-300'
          }`}
        >
          {isConsultantMode ? (
            <Briefcase className="w-3.5 h-3.5" />
          ) : (
            <UserCheck className="w-3.5 h-3.5" />
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-200">
            {isConsultantMode ? 'Consultant Mode' : 'Engineer Mode'}
          </p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900 ${
          isConsultantMode ? 'bg-indigo-600' : 'bg-slate-600'
        }`}
        role="switch"
        aria-checked={isConsultantMode}
        aria-label={`Switch to ${isConsultantMode ? 'Engineer' : 'Consultant'} mode`}
      >
        <span
          className={`${
            isConsultantMode ? 'translate-x-4' : 'translate-x-1'
          } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
        />
      </button>
    </div>
  );
};
