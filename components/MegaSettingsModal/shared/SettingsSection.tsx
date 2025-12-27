import React from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="pb-2" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <h3 className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>{title}</h3>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{description}</p>
        )}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

export default SettingsSection;
