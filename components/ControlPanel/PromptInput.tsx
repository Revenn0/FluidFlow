import React from 'react';
import { Sparkles, Mic, MicOff } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  isConsultantMode: boolean;
  hasExistingApp: boolean;
  maxLength: number;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  isListening,
  onToggleListening,
  isConsultantMode,
  hasExistingApp,
  maxLength
}) => {
  return (
    <div className="flex-none flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-slate-500" />
        {hasExistingApp && !isConsultantMode ? 'Refine & Update' : 'Prompt & Context'}
      </label>
      <div className="relative group h-24">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          maxLength={maxLength}
          className="w-full h-full bg-slate-950/20 border border-slate-700/50 rounded-xl p-3 pr-10 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none placeholder-slate-600 transition-all font-mono leading-relaxed"
          placeholder={isConsultantMode ? 'Questions for consultant...' : 'Describe app flow, colors...'}
          aria-label={isConsultantMode ? 'Consultant prompt' : 'App description prompt'}
        />
        {value.length > maxLength * 0.8 && (
          <span className="absolute bottom-2 left-3 text-[10px] text-amber-400">
            {value.length}/{maxLength}
          </span>
        )}

        {/* Microphone Button */}
        <button
          onClick={onToggleListening}
          className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-300 ${
            isListening
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
              : 'bg-slate-800/50 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50'
          }`}
          title="Voice Input"
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
