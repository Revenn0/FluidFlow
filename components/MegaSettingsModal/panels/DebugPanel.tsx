import React, { useState, useEffect, useMemo } from 'react';
import { Bug, Trash2, AlertTriangle, Info, Eye, Sparkles, RefreshCw } from 'lucide-react';
import { ConfirmModal } from '../../ContextIndicator/ConfirmModal';
import { SettingsSection, SettingsToggle, SettingsSelect, SettingsSlider } from '../shared';
import { DebugSettings, DEFAULT_DEBUG_SETTINGS, STORAGE_KEYS } from '../types';
import { useDebugStore } from '../../../hooks/useDebugStore';
import { usePromptConfirmation } from '../../../contexts/PromptConfirmationContext';
import { useAppContext } from '../../../contexts/AppContext';
import {
  getFileContextTracker,
  clearFileTracker,
  getTokenSavings,
  CONTEXT_IDS,
} from '../../../services/context';
import { STORAGE_KEYS as GLOBAL_STORAGE_KEYS } from '../../../constants';

export const DebugPanel: React.FC = () => {
  const [settings, setSettings] = useState<DebugSettings>(DEFAULT_DEBUG_SETTINGS);
  const debugState = useDebugStore();
  const promptConfirmation = usePromptConfirmation();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showClearFileContextConfirm, setShowClearFileContextConfirm] = useState(false);
  const { files } = useAppContext();

  // File context delta mode state
  const [fileContextEnabled, setFileContextEnabled] = useState(() => {
    return localStorage.getItem(GLOBAL_STORAGE_KEYS.FILE_CONTEXT_ENABLED) !== 'false';
  });

  // File context stats
  const fileContextStats = useMemo(() => {
    if (!files || Object.keys(files).length === 0) {
      return { trackedFiles: 0, tokensSaved: 0, currentTurn: 0 };
    }
    const tracker = getFileContextTracker(CONTEXT_IDS.MAIN_CHAT);
    return {
      trackedFiles: tracker.getTrackedPaths().length,
      tokensSaved: getTokenSavings(files, CONTEXT_IDS.MAIN_CHAT),
      currentTurn: tracker.getCurrentTurn(),
    };
  }, [files]);

  const updateFileContextEnabled = (enabled: boolean) => {
    setFileContextEnabled(enabled);
    if (enabled) {
      localStorage.removeItem(GLOBAL_STORAGE_KEYS.FILE_CONTEXT_ENABLED);
    } else {
      localStorage.setItem(GLOBAL_STORAGE_KEYS.FILE_CONTEXT_ENABLED, 'false');
    }
  };

  const clearFileContext = () => {
    clearFileTracker(CONTEXT_IDS.MAIN_CHAT);
    setShowClearFileContextConfirm(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEBUG_SETTINGS);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_DEBUG_SETTINGS, ...JSON.parse(saved) });
      } catch {
        setSettings(DEFAULT_DEBUG_SETTINGS);
      }
    }
    // Sync with debug store
    setSettings(prev => ({ ...prev, enabled: debugState.enabled }));
  }, [debugState.enabled]);

  const updateSettings = (updates: Partial<DebugSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEYS.DEBUG_SETTINGS, JSON.stringify(updated));

    // Sync enabled state with debug store
    if ('enabled' in updates) {
      if (updates.enabled) {
        localStorage.setItem('fluidflow_debug_enabled', 'true');
      } else {
        localStorage.removeItem('fluidflow_debug_enabled');
      }
      window.location.reload(); // Refresh to apply debug mode change
    }
  };

  const clearLogs = () => {
    setShowClearConfirm(true);
  };

  const performClearLogs = () => {
    debugState.clearLogs();
    setShowClearConfirm(false);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-info-subtle)' }}>
          <Bug className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Debug & Monitoring</h2>
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Configure debugging and logging options</p>
        </div>
      </div>

      {/* Warning */}
      {settings.enabled && (
        <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-warning-subtle)', border: '1px solid var(--color-warning-border)' }}>
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
          <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            <p className="font-medium mb-1" style={{ color: 'var(--color-warning)' }}>Debug Mode Active</p>
            <p style={{ color: 'var(--theme-text-muted)' }}>
              Debug mode logs all API requests and responses. This may impact performance
              and will consume additional memory. Disable when not needed.
            </p>
          </div>
        </div>
      )}

      {/* Main Toggle */}
      <SettingsSection
        title="Debug Mode"
        description="Enable or disable debug logging"
      >
        <SettingsToggle
          label="Enable Debug Mode"
          description="Log all AI API calls, responses, and errors (requires refresh)"
          checked={settings.enabled}
          onChange={(checked) => updateSettings({ enabled: checked })}
        />
      </SettingsSection>

      {/* Prompt Confirmation */}
      <SettingsSection
        title="Prompt Confirmation"
        description="Review prompts before sending to AI"
      >
        <SettingsToggle
          label="Confirm Before Sending"
          description="Show a modal with prompt details before every AI request"
          checked={promptConfirmation.isEnabled}
          onChange={(checked) => promptConfirmation.setEnabled(checked)}
        />
        <div className="flex items-start gap-3 p-3 rounded-lg mt-3" style={{ backgroundColor: 'var(--color-info-subtle)', border: '1px solid var(--color-info-border)' }}>
          <Eye className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-info)' }} />
          <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            When enabled, you'll see the exact prompt, system instruction, model, and token
            estimate before any request is sent to the AI provider. Useful for debugging
            and understanding what data is being shared.
          </div>
        </div>
      </SettingsSection>

      {/* Smart File Context */}
      <SettingsSection
        title="Smart File Context"
        description="Optimize token usage by tracking file changes"
      >
        <SettingsToggle
          label="Delta Mode"
          description="Only send changed files in subsequent prompts (saves tokens)"
          checked={fileContextEnabled}
          onChange={updateFileContextEnabled}
        />

        {/* Stats */}
        <div className="flex items-center justify-between p-3 rounded-lg mt-3" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--color-feature)' }} />
            <div>
              <div className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                {fileContextStats.trackedFiles} files tracked
              </div>
              <div className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>
                Turn {fileContextStats.currentTurn} • {fileContextStats.tokensSaved.toLocaleString()} tokens saved
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowClearFileContextConfirm(true)}
            disabled={fileContextStats.trackedFiles === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50"
            style={{ color: 'var(--color-warning)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg mt-3" style={{ backgroundColor: 'var(--color-feature-subtle)', border: '1px solid var(--color-feature)' }}>
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-feature)' }} />
          <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            When delta mode is enabled, the first prompt sends file summaries, and subsequent
            prompts only include files that have changed. This significantly reduces token
            usage for iterative conversations.
          </div>
        </div>
      </SettingsSection>

      {/* Log Settings */}
      <SettingsSection
        title="Logging"
        description="Configure what gets logged"
      >
        <SettingsSelect
          label="Log Level"
          description="Minimum severity level to log"
          value={settings.logLevel}
          options={[
            { value: 'error', label: 'Error only' },
            { value: 'warn', label: 'Warnings and errors' },
            { value: 'info', label: 'Info, warnings, and errors' },
            { value: 'debug', label: 'Everything (verbose)' }
          ]}
          onChange={(value) => updateSettings({ logLevel: value as 'error' | 'warn' | 'info' | 'debug' })}
          disabled={!settings.enabled}
        />

        <SettingsSlider
          label="Max Log Entries"
          description="Maximum number of log entries to keep in memory"
          value={settings.maxLogs}
          onChange={(value) => updateSettings({ maxLogs: value })}
          min={100}
          max={2000}
          step={100}
          disabled={!settings.enabled}
        />

        <SettingsToggle
          label="Persist Logs"
          description="Keep logs after page refresh (stored in localStorage)"
          checked={settings.persistLogs}
          onChange={(checked) => updateSettings({ persistLogs: checked })}
          disabled={!settings.enabled}
        />
      </SettingsSection>

      {/* Display Settings */}
      <SettingsSection
        title="Display"
        description="What to show in the UI"
      >
        <SettingsToggle
          label="Show Token Usage"
          description="Display token counts for AI requests"
          checked={settings.showTokenUsage}
          onChange={(checked) => updateSettings({ showTokenUsage: checked })}
        />

        <SettingsToggle
          label="Show Generation Time"
          description="Display how long AI generation takes"
          checked={settings.showGenerationTime}
          onChange={(checked) => updateSettings({ showGenerationTime: checked })}
        />

        <SettingsToggle
          label="Show Network Requests"
          description="Log network requests in console panel"
          checked={settings.showNetworkRequests}
          onChange={(checked) => updateSettings({ showNetworkRequests: checked })}
        />
      </SettingsSection>

      {/* Log Management */}
      <SettingsSection
        title="Log Management"
        description={`Currently storing ${debugState.logs.length} log entries`}
      >
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
          <div>
            <div className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>{debugState.logs.length} entries</div>
            <div className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>
              {debugState.logs.filter(l => l.type === 'error').length} errors,{' '}
              {debugState.logs.filter(l => l.type === 'request').length} requests
            </div>
          </div>
          <button
            onClick={clearLogs}
            disabled={debugState.logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50"
            style={{ color: 'var(--color-error)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Logs
          </button>
        </div>
      </SettingsSection>

      {/* Info */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--theme-text-muted)' }} />
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Debug Panel Access</div>
            <div className="text-xs mt-1" style={{ color: 'var(--theme-text-dim)' }}>
              When debug mode is enabled, you can view detailed logs in the Debug tab
              of the preview panel. Use this to inspect AI requests, responses, and
              troubleshoot issues.
            </div>
          </div>
        </div>
      </div>

      {/* Clear Debug Logs Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={performClearLogs}
        title="Clear Debug Logs"
        message="This will permanently delete all debug logs. This action cannot be undone."
        confirmText="Clear Logs"
        confirmVariant="danger"
      />

      {/* Clear File Context Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearFileContextConfirm}
        onClose={() => setShowClearFileContextConfirm(false)}
        onConfirm={clearFileContext}
        title="Reset File Context"
        message="This will clear file tracking data. The next prompt will send all file summaries again as if starting fresh."
        confirmText="Reset"
        confirmVariant="warning"
      />
    </div>
  );
};

export default DebugPanel;
