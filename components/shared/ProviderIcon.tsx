import React from 'react';
import { Sparkles, Server, Monitor, Cloud, Cpu } from 'lucide-react';
import { ProviderType } from '@/services/ai/types';

interface ProviderIconProps {
  type: ProviderType;
  className?: string;
}

/**
 * Shared component for displaying AI provider icons
 * Used across AISettingsModal, AIProviderSettings, and AIProvidersPanel
 */
export const ProviderIcon: React.FC<ProviderIconProps> = ({ type, className = "w-5 h-5" }) => {
  switch (type) {
    case 'gemini':
      return <Sparkles className={className} style={{ color: 'var(--color-info)' }} />;
    case 'openai':
      return <div className={`${className} rounded-sm flex items-center justify-center text-[10px] font-bold`} style={{ backgroundColor: 'var(--color-success)', color: 'var(--theme-text-on-accent)' }}>AI</div>;
    case 'anthropic':
      return <div className={`${className} rounded-sm flex items-center justify-center text-[10px] font-bold`} style={{ backgroundColor: 'var(--color-warning)', color: 'var(--theme-text-on-accent)' }}>A</div>;
    case 'zai':
      return <div className={`${className} rounded-sm flex items-center justify-center text-[10px] font-bold`} style={{ backgroundColor: 'var(--color-feature)', color: 'var(--theme-text-on-accent)' }}>Z</div>;
    case 'ollama':
      return <Server className={className} style={{ color: 'var(--color-feature)' }} />;
    case 'lmstudio':
      return <Monitor className={className} style={{ color: 'var(--color-error)' }} />;
    case 'openrouter':
      return <Cloud className={className} style={{ color: 'var(--color-info)' }} />;
    case 'custom':
      return <Cpu className={className} style={{ color: 'var(--color-warning)' }} />;
    default:
      return <Cpu className={className} style={{ color: 'var(--theme-text-muted)' }} />;
  }
};

export default ProviderIcon;
