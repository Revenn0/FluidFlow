/**
 * TitleBar - IDE title bar with traffic lights and breadcrumb navigation
 */
import React, { memo } from 'react';
import { ChevronRight, FolderOpen, Circle } from 'lucide-react';
import { TrafficLights } from './TrafficLights';
import { useAppContext } from '../../contexts/AppContext';

interface TitleBarProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
}

export const TitleBar = memo(function TitleBar({
  showSearch = true,
  onSearchClick,
}: TitleBarProps) {
  const ctx = useAppContext();

  // Get project name and active file for breadcrumb
  const projectName = ctx.currentProject?.name || 'FluidFlow';
  const activeFile = ctx.activeFile || '';
  const hasUncommitted = ctx.hasUncommittedChanges;

  // Split file path into parts for breadcrumb
  const pathParts = activeFile.split('/').filter(Boolean);

  return (
    <header className="h-10 bg-slate-950 border-b border-white/5 flex items-center px-4 justify-between select-none shrink-0">
      {/* Left section: Traffic lights + Breadcrumb */}
      <div className="flex items-center gap-4">
        <TrafficLights />

        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
            {projectName}
          </span>

          {pathParts.map((part, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span
                className={`${
                  index === pathParts.length - 1
                    ? 'text-slate-300'
                    : 'text-slate-500 hover:text-slate-300 cursor-pointer'
                } transition-colors`}
              >
                {part}
              </span>
            </React.Fragment>
          ))}

          {/* Unsaved indicator */}
          {hasUncommitted && (
            <Circle className="w-1.5 h-1.5 ml-1 fill-amber-400 text-amber-400" />
          )}
        </div>
      </div>

      {/* Center: App name */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2">
        <span className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">
          FluidFlow
        </span>
      </div>

      {/* Right section: Search */}
      <div className="flex items-center gap-2">
        {showSearch && (
          <button
            onClick={onSearchClick}
            className="flex items-center gap-2 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 border border-transparent hover:border-white/10 rounded transition-all"
          >
            <span>Search</span>
            <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[9px] text-slate-400">
              Ctrl+P
            </kbd>
          </button>
        )}
      </div>
    </header>
  );
});

export default TitleBar;
