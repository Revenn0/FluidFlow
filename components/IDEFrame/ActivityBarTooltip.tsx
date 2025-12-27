/**
 * ActivityBarTooltip - Animated tooltip for ActivityBar icons
 * Shows label and description on hover
 */
import React, { useState, useRef, useEffect } from 'react';

interface ActivityBarTooltipProps {
  children: React.ReactNode;
  label: string;
  description?: string;
  side?: 'right' | 'left';
  delay?: number;
}

export const ActivityBarTooltip: React.FC<ActivityBarTooltipProps> = ({
  children,
  label,
  description,
  side = 'right',
  delay = 400,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top + rect.height / 2,
        });
      }
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      className="relative"
    >
      {children}

      {/* Tooltip */}
      {isVisible && (
        <div
          className={`fixed z-[9999] pointer-events-none ${
            side === 'right' ? 'left-14' : 'right-14'
          }`}
          style={{
            top: position.top,
            transform: 'translateY(-50%)',
          }}
        >
          {/* Arrow - using inline styles for theme colors */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              [side === 'right' ? 'left' : 'right']: '-6px',
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              [side === 'right' ? 'borderRight' : 'borderLeft']: '6px solid var(--theme-surface)',
            }}
          />

          {/* Content */}
          <div
            className="rounded-lg px-3 py-2 shadow-xl animate-in fade-in slide-in-from-left-2 duration-150"
            style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
          >
            <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--theme-text-primary)' }}>
              {label}
            </span>
            {description && (
              <p className="text-xs mt-0.5 max-w-[200px]" style={{ color: 'var(--theme-text-muted)' }}>
                {description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityBarTooltip;
