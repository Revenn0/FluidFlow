import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, CheckCircle, AlertCircle, GraduationCap, Bug, Settings2, ChevronRight, History, X, Map, Package, Zap, SlidersHorizontal, GitBranch } from 'lucide-react';
import { useDebugStore } from '../../hooks/useDebugStore';
import { getProviderManager } from '../../services/ai';

interface SettingsPanelProps {
  isEducationMode: boolean;
  onEducationModeChange: (value: boolean) => void;
  hasApiKey: boolean;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onProviderChange?: (providerId: string, modelId: string) => void;
  onOpenAISettings?: () => void;
  onOpenMegaSettings?: () => void;
  aiHistoryCount?: number;
  onOpenAIHistory?: () => void;
  onOpenCodeMap?: () => void;
  onOpenTechStack?: () => void;
  autoAcceptChanges?: boolean;
  onAutoAcceptChangesChange?: (value: boolean) => void;
  // Diff Mode (Beta)
  diffModeEnabled?: boolean;
  onDiffModeChange?: (value: boolean) => void;
  // Props for modal exclusivity
  shouldClose?: boolean;
  onClosed?: () => void;
  onOpened?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isEducationMode,
  onEducationModeChange,
  hasApiKey: _hasApiKey,
  onOpenAISettings,
  onOpenMegaSettings,
  aiHistoryCount = 0,
  onOpenAIHistory,
  onOpenCodeMap,
  onOpenTechStack,
  autoAcceptChanges = false,
  onAutoAcceptChangesChange,
  diffModeEnabled = false,
  onDiffModeChange,
  shouldClose,
  onClosed,
  onOpened
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { enabled: debugEnabled, setEnabled: setDebugEnabled, logs } = useDebugStore();

  const manager = getProviderManager();
  const activeProvider = manager.getActiveConfig();

  // Handle modal exclusivity - close when shouldClose is true
  useEffect(() => {
    if (shouldClose && isOpen) {
      setIsOpen(false);
      onClosed?.();
    }
  }, [shouldClose, isOpen, onClosed]);

  return (
    <div className="pt-2 flex-none" style={{ borderTop: '1px solid var(--theme-border-light)' }}>
      <button
        onClick={() => {
          const newOpenState = !isOpen;
          setIsOpen(newOpenState);
          if (newOpenState) {
            onOpened?.();
          }
        }}
        className="flex items-center justify-between w-full p-2 transition-colors rounded-lg"
        style={{ color: 'var(--theme-text-muted)' }}
        aria-expanded={isOpen}
        aria-controls="settings-panel"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Quick Settings</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200" style={{ backgroundColor: 'var(--theme-modal-overlay)' }}>
          <div
            id="settings-panel"
            className="w-full max-w-sm backdrop-blur-xl rounded-2xl animate-in zoom-in-95 duration-200 shadow-2xl overflow-hidden mx-4"
            style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>Quick Settings</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                title="Close settings"
              >
                <X className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
              </button>
            </div>

            <div className="p-3 space-y-1">
              {/* AI Provider Settings - Quick Link */}
              {/* All Settings - Mega Settings Modal */}
              {onOpenMegaSettings && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenMegaSettings();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg transition-colors" style={{ background: 'linear-gradient(to bottom right, var(--color-info-subtle), var(--color-feature-subtle))' }}>
                      <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium block" style={{ color: 'var(--theme-text-secondary)' }}>All Settings</span>
                      <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>AI, Editor, Appearance & more</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                </button>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAISettings?.();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg transition-colors" style={{ backgroundColor: 'var(--color-info-subtle)' }}>
                    <Settings2 className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium block" style={{ color: 'var(--theme-text-secondary)' }}>AI Provider Settings</span>
                    <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>API keys, models, endpoints</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeProvider?.apiKey || activeProvider?.isLocal ? (
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-warning)' }} />
                  )}
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                </div>
              </button>

              {/* Divider */}
              <div className="my-2" style={{ borderTop: '1px solid var(--theme-border-light)' }} />

              {/* Toggle Options */}
              <div className="space-y-1">
                {/* Auto-Accept Changes */}
                {onAutoAcceptChangesChange && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-success-subtle)' }}>
                        <Zap className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                      </div>
                      <div>
                        <span className="text-sm font-medium block" style={{ color: 'var(--theme-text-secondary)' }}>Auto-Accept Changes</span>
                        <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Skip diff review</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onAutoAcceptChangesChange(!autoAcceptChanges)}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                      style={{ backgroundColor: autoAcceptChanges ? 'var(--color-success)' : 'var(--theme-glass-300)' }}
                      role="switch"
                      aria-checked={autoAcceptChanges}
                    >
                      <span className={`${autoAcceptChanges ? 'translate-x-4' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                    </button>
                  </div>
                )}

                {/* Search/Replace Mode (Beta) - Token-efficient updates */}
                {onDiffModeChange && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-warning-subtle)' }}>
                        <GitBranch className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                      </div>
                      <div>
                        <span className="text-sm font-medium block" style={{ color: 'var(--theme-text-secondary)' }}>
                          Search/Replace
                          <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }}>BETA</span>
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Token-efficient updates</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDiffModeChange(!diffModeEnabled)}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                      style={{ backgroundColor: diffModeEnabled ? 'var(--color-warning)' : 'var(--theme-glass-300)' }}
                      role="switch"
                      aria-checked={diffModeEnabled}
                    >
                      <span className={`${diffModeEnabled ? 'translate-x-4' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                    </button>
                  </div>
                )}

                {/* Education Mode */}
                <div className="flex items-center justify-between p-2.5 rounded-lg transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-warning-subtle)' }}>
                      <GraduationCap className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                    </div>
                    <div>
                      <span className="text-sm font-medium block" style={{ color: 'var(--theme-text-secondary)' }}>Education Mode</span>
                      <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Learn as you build</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onEducationModeChange(!isEducationMode)}
                    className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                    style={{ backgroundColor: isEducationMode ? 'var(--color-warning)' : 'var(--theme-glass-300)' }}
                    role="switch"
                    aria-checked={isEducationMode}
                  >
                    <span className={`${isEducationMode ? 'translate-x-4' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                  </button>
                </div>

                {/* Debug Mode */}
                <div className="flex items-center justify-between p-2.5 rounded-lg transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-feature-subtle)' }}>
                      <Bug className="w-4 h-4" style={{ color: 'var(--color-feature)' }} />
                    </div>
                    <div>
                      <span className="text-sm font-medium block" style={{ color: 'var(--theme-text-secondary)' }}>Debug Mode</span>
                      <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Log API calls</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {debugEnabled && logs.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-feature-subtle)', color: 'var(--color-feature)' }}>
                        {logs.length}
                      </span>
                    )}
                    <button
                      onClick={() => setDebugEnabled(!debugEnabled)}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                      style={{ backgroundColor: debugEnabled ? 'var(--color-feature)' : 'var(--theme-glass-300)' }}
                      role="switch"
                      aria-checked={debugEnabled}
                    >
                      <span className={`${debugEnabled ? 'translate-x-4' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-2" style={{ borderTop: '1px solid var(--theme-border-light)' }} />

              {/* Quick Links */}
              <div className="space-y-1">
                {/* Technology Stack */}
                {onOpenTechStack && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenTechStack();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg transition-colors" style={{ backgroundColor: 'var(--color-info-subtle)' }}>
                        <Package className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
                      </div>
                      <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>Technology Stack</span>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                  </button>
                )}

                {/* AI History */}
                {onOpenAIHistory && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenAIHistory();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg transition-colors" style={{ backgroundColor: 'var(--color-info-subtle)' }}>
                        <History className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
                      </div>
                      <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>AI History</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {aiHistoryCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' }}>
                          {aiHistoryCount}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                    </div>
                  </button>
                )}

                {/* CodeMap */}
                {onOpenCodeMap && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenCodeMap();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg transition-colors" style={{ backgroundColor: 'var(--color-success-subtle)' }}>
                        <Map className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                      </div>
                      <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>CodeMap</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>
                        AST
                      </span>
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Click outside to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};
