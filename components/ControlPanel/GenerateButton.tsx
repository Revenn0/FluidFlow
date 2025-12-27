import React from 'react';
import { Sparkles, RotateCw, Briefcase } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  isDisabled: boolean;
  isConsultantMode: boolean;
  hasExistingApp: boolean;
  hasFile: boolean;
  hasPrompt: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  isGenerating,
  isDisabled,
  isConsultantMode,
  hasExistingApp,
  hasFile,
  hasPrompt
}) => {
  const canGenerate = !isDisabled && (hasFile || (hasExistingApp && hasPrompt));

  return (
    <>
      <button
        onClick={onClick}
        disabled={isGenerating || isDisabled}
        className={`
          group relative w-full py-3 font-bold rounded-xl flex items-center justify-center gap-3 transition-all overflow-hidden
          ${isGenerating || isDisabled ? 'cursor-not-allowed' : 'active:scale-[0.98]'}
        `}
        style={{
          background: isGenerating || isDisabled
            ? 'var(--theme-glass-200)'
            : isConsultantMode
            ? 'linear-gradient(to right, var(--color-feature), var(--theme-ai-accent), var(--color-feature))'
            : 'linear-gradient(to right, var(--theme-accent), var(--color-info), var(--theme-accent))',
          backgroundSize: isGenerating || isDisabled ? undefined : '200% auto',
          color: isGenerating || isDisabled ? 'var(--theme-text-dim)' : 'var(--theme-text-on-accent)',
          boxShadow: isGenerating || isDisabled ? 'none' : '0 0 20px var(--theme-accent-glow)',
          animation: isGenerating || isDisabled ? undefined : 'gradient 3s ease infinite'
        }}
        aria-busy={isGenerating}
      >
        {/* Shine Effect */}
        {!isGenerating && canGenerate && (
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] z-0 pointer-events-none">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
          </div>
        )}

        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--theme-glass-300)', borderTopColor: 'var(--theme-text-primary)' }} />
            <span className="text-sm tracking-wide">
              {isConsultantMode ? 'Analyzing...' : 'Building...'}
            </span>
          </>
        ) : (
          <>
            {isConsultantMode ? (
              <Briefcase className="w-5 h-5 relative z-10" style={{ color: 'var(--theme-text-primary)', opacity: 0.9 }} />
            ) : hasExistingApp ? (
              <RotateCw className="w-5 h-5 relative z-10" style={{ color: 'var(--theme-text-primary)', opacity: 0.9 }} />
            ) : (
              <Sparkles className="w-5 h-5 relative z-10" style={{ color: 'var(--theme-text-primary)', opacity: 0.9 }} />
            )}
            <span className="relative z-10 text-sm tracking-wide uppercase">
              {isConsultantMode
                ? 'Identify Gaps'
                : hasExistingApp
                ? 'Update App'
                : 'Generate App'}
            </span>
          </>
        )}
      </button>

      {/* CSS Animation for Gradient Button - Using static CSS string (safe, no user input) */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>
    </>
  );
};
