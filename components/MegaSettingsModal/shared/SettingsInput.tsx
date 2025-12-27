import React from 'react';

interface SettingsInputProps {
  label: string;
  description?: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'password';
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  monospace?: boolean;
}

export const SettingsInput: React.FC<SettingsInputProps> = ({
  label,
  description,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  min,
  max,
  step,
  suffix,
  monospace = false
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
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`w-full px-3 py-2 rounded-lg text-sm outline-none disabled:cursor-not-allowed ${
            monospace ? 'font-mono' : ''
          } ${suffix ? 'pr-12' : ''}`}
          style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export default SettingsInput;
