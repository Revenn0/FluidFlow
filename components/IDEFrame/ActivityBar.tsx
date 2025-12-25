/**
 * ActivityBar - VS Code style vertical icon sidebar
 * Contains all navigation tabs matching PreviewPanel tabs
 */
import React, { memo } from 'react';
import {
  MessageSquare,
  Eye,
  Code2,
  GitBranch,
  Settings,
  FolderOpen,
  Bot,
  Activity,
  Map,
  Play,
  ShieldCheck,
  Database,
  FileText,
  Bug,
  Wrench,
  Lock
} from 'lucide-react';
import { useUI } from '../../contexts/UIContext';
import { useStatusBar } from '../../contexts/StatusBarContext';
import type { TabType } from '../../types';

interface ActivityBarItem {
  id: string;
  icon: React.ElementType;
  label: string;
  tab?: TabType;
  action?: 'chat' | 'settings';
  badge?: number;
  hasIndicator?: boolean;
}

interface ActivityBarProps {
  onChatClick?: () => void;
  onSettingsClick?: () => void;
  chatUnread?: number;
}

// Main navigation items - matches PreviewPanel tabs
const MAIN_ITEMS: ActivityBarItem[] = [
  { id: 'run', icon: Play, label: 'Run Dev Server', tab: 'run', hasIndicator: true },
  { id: 'preview', icon: Eye, label: 'Preview', tab: 'preview' },
  { id: 'code', icon: Code2, label: 'Code Editor', tab: 'code' },
];

// Project & Files
const PROJECT_ITEMS: ActivityBarItem[] = [
  { id: 'projects', icon: FolderOpen, label: 'Projects', tab: 'projects' },
  { id: 'codemap', icon: Map, label: 'CodeMap', tab: 'codemap' },
  { id: 'git', icon: GitBranch, label: 'Git', tab: 'git' },
];

// Tools & Analysis
const TOOLS_ITEMS: ActivityBarItem[] = [
  { id: 'quality', icon: ShieldCheck, label: 'Code Quality', tab: 'quality' },
  { id: 'activity', icon: Activity, label: 'Activity Log', tab: 'activity' },
  { id: 'database', icon: Database, label: 'DB Studio', tab: 'database' },
  { id: 'docs', icon: FileText, label: 'Documentation', tab: 'docs' },
];

// Advanced & Debug
const ADVANCED_ITEMS: ActivityBarItem[] = [
  { id: 'env', icon: Lock, label: 'Environment', tab: 'env' },
  { id: 'debug', icon: Bug, label: 'Debug', tab: 'debug' },
  { id: 'errorfix', icon: Wrench, label: 'Error Fix', tab: 'errorfix' },
];

// Bottom settings
const BOTTOM_ITEMS: ActivityBarItem[] = [
  { id: 'ai', icon: Bot, label: 'AI Settings', action: 'settings' },
  { id: 'settings', icon: Settings, label: 'Settings', action: 'settings' },
];

export const ActivityBar = memo(function ActivityBar({
  onChatClick,
  onSettingsClick,
  chatUnread = 0,
}: ActivityBarProps) {
  const ui = useUI();
  const { isRunnerActive } = useStatusBar();
  const activeTab = ui.activeTab;

  const handleClick = (item: ActivityBarItem) => {
    if (item.action === 'chat') {
      onChatClick?.();
    } else if (item.action === 'settings') {
      onSettingsClick?.();
    } else if (item.tab) {
      ui.setActiveTab(item.tab);
    }
  };

  const isActive = (item: ActivityBarItem) => {
    if (item.tab) {
      return activeTab === item.tab;
    }
    return false;
  };

  const renderItem = (item: ActivityBarItem) => (
    <button
      key={item.id}
      onClick={() => handleClick(item)}
      className={`relative p-2 rounded-md transition-all ${
        isActive(item)
          ? 'text-white bg-white/10'
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
      } ${item.hasIndicator && isRunnerActive ? 'text-emerald-400' : ''}`}
      title={item.label}
    >
      <item.icon className="w-[18px] h-[18px]" />

      {/* Active indicator */}
      {isActive(item) && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-500 rounded-r" />
      )}

      {/* Runner indicator */}
      {item.hasIndicator && isRunnerActive && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      )}

      {/* Badge for unread messages */}
      {item.id === 'chat' && chatUnread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {chatUnread > 9 ? '9+' : chatUnread}
        </span>
      )}
    </button>
  );

  const renderDivider = () => (
    <div className="w-6 h-px bg-white/10 my-1" />
  );

  return (
    <aside className="w-11 bg-slate-950 border-r border-white/10 flex flex-col items-center py-2 shrink-0">
      {/* Chat - Special top item */}
      <button
        onClick={onChatClick}
        className={`relative p-2 rounded-md transition-all text-slate-500 hover:text-slate-300 hover:bg-white/5 mb-1`}
        title="Chat"
      >
        <MessageSquare className="w-[18px] h-[18px]" />
        {chatUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {chatUnread > 9 ? '9+' : chatUnread}
          </span>
        )}
      </button>

      {renderDivider()}

      {/* Main items */}
      <div className="flex flex-col items-center gap-0.5">
        {MAIN_ITEMS.map(renderItem)}
      </div>

      {renderDivider()}

      {/* Project items */}
      <div className="flex flex-col items-center gap-0.5">
        {PROJECT_ITEMS.map(renderItem)}
      </div>

      {renderDivider()}

      {/* Tools items */}
      <div className="flex flex-col items-center gap-0.5">
        {TOOLS_ITEMS.map(renderItem)}
      </div>

      {renderDivider()}

      {/* Advanced items */}
      <div className="flex flex-col items-center gap-0.5">
        {ADVANCED_ITEMS.map(renderItem)}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom items */}
      <div className="flex flex-col items-center gap-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className="p-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            title={item.label}
          >
            <item.icon className="w-[18px] h-[18px]" />
          </button>
        ))}
      </div>
    </aside>
  );
});

export default ActivityBar;
