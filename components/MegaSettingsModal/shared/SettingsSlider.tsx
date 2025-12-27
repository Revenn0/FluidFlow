import React from 'react';

interface SettingsSliderProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  suffix?: string;
  showValue?: boolean;
}

export const SettingsSlider: React.FC<SettingsSliderProps> = ({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  suffix = '',
  showValue = true
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm block" style={{ color: 'var(--theme-text-primary)' }}>{label}</span>
          {description && (
            <span className="text-xs block mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{description}</span>
          )}
        </div>
        {showValue && (
          <span className="text-sm tabular-nums" style={{ color: 'var(--theme-text-secondary)' }}>
            {value}{suffix}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, var(--theme-accent) 0%, var(--theme-accent) ${percentage}%, var(--theme-glass-300) ${percentage}%, var(--theme-glass-300) 100%)`
          }}
        />
      </div>
      <div className="flex justify-between text-xs" style={{ color: 'var(--theme-text-muted)' }}>
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
};

export default SettingsSlider;
