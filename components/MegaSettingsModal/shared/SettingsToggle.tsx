import React from 'react';

interface SettingsToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false
}) => {
  return (
    <label className={`flex items-center justify-between py-2 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0 pr-4">
        <span className="text-sm block" style={{ color: 'var(--theme-text-primary)' }}>{label}</span>
        {description && (
          <span className="text-xs block mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ backgroundColor: checked ? 'var(--theme-accent)' : 'var(--theme-glass-300)' }}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
};

export default SettingsToggle;
