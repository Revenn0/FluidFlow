/**
 * TitleBar - IDE title bar with traffic lights and breadcrumb navigation
 */
import React, { memo } from 'react';
import { ChevronRight, FolderOpen, Circle, Info } from 'lucide-react';
import { TrafficLights } from './TrafficLights';
import { useAppContext } from '../../contexts/AppContext';
import { useUI } from '../../contexts/UIContext';

interface TitleBarProps {
  onInfoClick?: () => void;
}

export const TitleBar = memo(function TitleBar({
  onInfoClick,
}: TitleBarProps) {
  const ctx = useAppContext();
  const ui = useUI();

  // Get project name and active file for breadcrumb
  const projectName = ctx.currentProject?.name || 'FluidFlow';
  const activeFile = ctx.activeFile || '';
  const hasUncommitted = ctx.hasUncommittedChanges;

  // Split file path into parts for breadcrumb
  const pathParts = activeFile.split('/').filter(Boolean);

  // Click on file path opens Code tab
  const handleFileClick = () => {
    if (activeFile) {
      ui.setActiveTab('code');
    }
  };

  return (
    <header
      className="h-10 flex items-center px-4 justify-between select-none shrink-0 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--theme-background)',
        borderBottom: '1px solid var(--theme-border)'
      }}
    >
      {/* Left section: Traffic lights + Breadcrumb */}
      <div className="flex items-center gap-4">
        <TrafficLights />

        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <FolderOpen className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
          <span
            className="cursor-pointer transition-colors hover:opacity-80"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {projectName}
          </span>

          {pathParts.map((part, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-3 h-3" style={{ color: 'var(--theme-text-muted)' }} />
              <button
                onClick={handleFileClick}
                className="transition-colors cursor-pointer hover:opacity-80"
                style={{
                  color: index === pathParts.length - 1
                    ? 'var(--theme-text-primary)'
                    : 'var(--theme-text-muted)'
                }}
                title="Open in Code Editor"
              >
                {part}
              </button>
            </React.Fragment>
          ))}

          {/* Unsaved indicator */}
          {hasUncommitted && (
            <Circle className="w-1.5 h-1.5 ml-1" style={{ fill: 'var(--color-warning)', color: 'var(--color-warning)' }} />
          )}
        </div>
      </div>

      {/* Center: App name - clickable for info */}
      <button
        onClick={onInfoClick}
        className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity"
        title="About FluidFlow"
      >
        <span
          className="text-[10px] uppercase tracking-widest font-medium"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          FluidFlow
        </span>
      </button>

      {/* Right section: Info */}
      <div className="flex items-center gap-2">
        <button
          onClick={onInfoClick}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] rounded transition-all group"
          style={{
            color: 'var(--theme-text-muted)',
            border: '1px solid transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--theme-accent-subtle)';
            e.currentTarget.style.backgroundColor = 'var(--theme-accent-subtle)';
            e.currentTarget.style.color = 'var(--theme-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--theme-text-muted)';
          }}
          title="About FluidFlow"
        >
          <Info className="w-3 h-3" />
          <span>About</span>
        </button>
      </div>
    </header>
  );
});

export default TitleBar;
