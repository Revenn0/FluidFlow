import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SettingsSelectProps {
  label: string;
  description?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SettingsSelect: React.FC<SettingsSelectProps> = ({
  label,
  description,
  value,
  options,
  onChange,
  disabled = false
}) => {
  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <span className="text-sm block" style={{ color: 'var(--theme-text-primary)' }}>{label}</span>
        {description && (
          <span className="text-xs block mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{description}</span>
        )}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none cursor-pointer disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--theme-text-muted)' }} />
      </div>
    </div>
  );
};

export default SettingsSelect;
