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
      <label className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--theme-text-secondary)' }}>
        <Sparkles className="w-4 h-4" style={{ color: 'var(--theme-text-dim)' }} />
        {hasExistingApp && !isConsultantMode ? 'Refine & Update' : 'Prompt & Context'}
      </label>
      <div className="relative group h-24">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          maxLength={maxLength}
          className="w-full h-full rounded-xl p-3 pr-10 text-xs focus:outline-none resize-none transition-all font-mono leading-relaxed"
          style={{ backgroundColor: 'var(--theme-glass-100)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}
          placeholder={isConsultantMode ? 'Questions for consultant...' : 'Describe app flow, colors...'}
          aria-label={isConsultantMode ? 'Consultant prompt' : 'App description prompt'}
        />
        {value.length > maxLength * 0.8 && (
          <span className="absolute bottom-2 left-3 text-[10px]" style={{ color: 'var(--color-warning)' }}>
            {value.length}/{maxLength}
          </span>
        )}

        {/* Microphone Button */}
        <button
          onClick={onToggleListening}
          className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-300 ${isListening ? 'animate-pulse' : ''}`}
          style={{
            backgroundColor: isListening ? 'var(--color-error-subtle)' : 'var(--theme-glass-200)',
            color: isListening ? 'var(--color-error)' : 'var(--theme-text-muted)',
            border: isListening ? '1px solid var(--color-error-border)' : '1px solid transparent'
          }}
          title="Voice Input"
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
