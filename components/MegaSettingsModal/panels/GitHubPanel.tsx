import React, { useState, useEffect } from 'react';
import { Github, Check, Info, Loader2, CloudUpload, Eye, EyeOff, FileJson, MessageSquare, Shield, ExternalLink } from 'lucide-react';
import { SettingsSection } from '../shared';
import { SettingsToggle } from '../shared/SettingsToggle';
import { settingsApi } from '../../../services/api/settings';
import type { GitHubBackupSettings, GitHubPushSettings } from '../../../services/api/types';

const GITHUB_PUSH_SETTINGS_KEY = 'fluidflow_github_push_settings';

const DEFAULT_PUSH_SETTINGS: GitHubPushSettings = {
  includeProjectMetadata: true,
  includeConversationHistory: false,
  defaultPrivate: true,
};

export const GitHubPanel: React.FC = () => {
  // GitHub Backup settings
  const [backupSettings, setBackupSettings] = useState<GitHubBackupSettings>({
    enabled: false,
    branchName: 'backup/auto',
  });
  const [backupToken, setBackupToken] = useState('');
  const [showBackupToken, setShowBackupToken] = useState(false);
  const [backupSaving, setBackupSaving] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Push settings (stored in localStorage)
  const [pushSettings, setPushSettings] = useState<GitHubPushSettings>(DEFAULT_PUSH_SETTINGS);

  useEffect(() => {
    // Load GitHub Backup settings from server
    settingsApi.getGitHubBackup().then((settings) => {
      setBackupSettings(settings);
      if (settings.token) {
        setBackupToken(settings.token);
      }
    }).catch(console.error);

    // Load push settings from localStorage
    try {
      const saved = localStorage.getItem(GITHUB_PUSH_SETTINGS_KEY);
      if (saved) {
        setPushSettings({ ...DEFAULT_PUSH_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (err) {
      console.error('Failed to load push settings:', err);
    }
  }, []);

  // GitHub Backup handlers
  const handleBackupSettingChange = async (key: keyof GitHubBackupSettings, value: boolean | string) => {
    setBackupSaving(true);
    setBackupMessage(null);

    try {
      const updates: Partial<GitHubBackupSettings> = { [key]: value };
      await settingsApi.saveGitHubBackup(updates);
      setBackupSettings(prev => ({ ...prev, [key]: value }));
      setBackupMessage({ type: 'success', text: 'Saved!' });
      setTimeout(() => setBackupMessage(null), 2000);
    } catch (err) {
      console.error('Failed to save backup settings:', err);
      setBackupMessage({ type: 'error', text: 'Failed to save' });
      setTimeout(() => setBackupMessage(null), 3000);
    } finally {
      setBackupSaving(false);
    }
  };

  const handleSaveBackupToken = async () => {
    if (!backupToken || backupToken.includes('****')) {
      return; // Don't save masked tokens
    }

    setBackupSaving(true);
    setBackupMessage(null);

    try {
      await settingsApi.saveGitHubBackup({ token: backupToken });
      setBackupMessage({ type: 'success', text: 'Token saved!' });
      setTimeout(() => setBackupMessage(null), 2000);
    } catch (err) {
      console.error('Failed to save token:', err);
      setBackupMessage({ type: 'error', text: 'Failed to save token' });
      setTimeout(() => setBackupMessage(null), 3000);
    } finally {
      setBackupSaving(false);
    }
  };

  // Push settings handlers
  const handlePushSettingChange = (key: keyof GitHubPushSettings, value: boolean) => {
    const newSettings = { ...pushSettings, [key]: value };
    setPushSettings(newSettings);
    localStorage.setItem(GITHUB_PUSH_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-500/20 rounded-lg">
          <Github className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">GitHub Integration</h2>
          <p className="text-xs text-slate-400">Configure GitHub sync, backup, and push settings</p>
        </div>
      </div>

      {/* Push Defaults */}
      <SettingsSection
        title="Push Defaults"
        description="Default settings when pushing projects to GitHub"
      >
        {/* Info Box */}
        <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400">
            These settings control what metadata is included when pushing to GitHub.
            The <code className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">.fluidflow/</code> folder
            in your repo stores project metadata for portability between devices.
          </div>
        </div>

        <div className="space-y-4">
          {/* Include Project Metadata */}
          <div className="flex items-start gap-3 p-4 bg-slate-800/30 border border-white/5 rounded-lg">
            <div className="p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
              <FileJson className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <SettingsToggle
                label="Include Project Metadata"
                description="Always include project.json with name, description, and settings"
                checked={pushSettings.includeProjectMetadata}
                onChange={(checked) => handlePushSettingChange('includeProjectMetadata', checked)}
              />
              <p className="text-[10px] text-slate-500 mt-2">
                Recommended: Enables project restoration when importing from GitHub
              </p>
            </div>
          </div>

          {/* Include Conversation History */}
          <div className="flex items-start gap-3 p-4 bg-slate-800/30 border border-white/5 rounded-lg">
            <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <SettingsToggle
                label="Include Conversation History"
                description="Include AI chat history (context.json) when pushing"
                checked={pushSettings.includeConversationHistory}
                onChange={(checked) => handlePushSettingChange('includeConversationHistory', checked)}
              />
              <div className="flex items-center gap-2 mt-2 text-[10px] text-amber-400">
                <Shield className="w-3 h-3" />
                <span>Privacy note: Only enable for private repos or if you're okay sharing chat history</span>
              </div>
            </div>
          </div>

          {/* Default Visibility */}
          <div className="flex items-start gap-3 p-4 bg-slate-800/30 border border-white/5 rounded-lg">
            <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <SettingsToggle
                label="Default to Private Repos"
                description="Create new repositories as private by default"
                checked={pushSettings.defaultPrivate}
                onChange={(checked) => handlePushSettingChange('defaultPrivate', checked)}
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* GitHub Auto-Backup Settings */}
      <SettingsSection
        title="Auto-Backup"
        description="Automatically push commits to a backup branch on GitHub"
      >
        {/* Info Box */}
        <div className="flex items-start gap-3 p-3 bg-slate-500/10 border border-slate-500/20 rounded-lg mb-4">
          <CloudUpload className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400">
            When enabled, every auto-commit will also be pushed to a backup branch on GitHub.
            This provides an automatic off-site backup of your work. Requires a GitHub token with
            <code className="px-1 py-0.5 bg-slate-800 rounded text-slate-300 mx-1">repo</code>
            scope and a remote origin configured.
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable Toggle */}
          <SettingsToggle
            label="Enable Auto-Backup"
            description="Push to backup branch after each auto-commit"
            checked={backupSettings.enabled}
            onChange={(checked) => handleBackupSettingChange('enabled', checked)}
          />

          {/* Branch Name */}
          <div className="space-y-1.5">
            <label className="text-sm text-white">Backup Branch Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={backupSettings.branchName}
                onChange={(e) => setBackupSettings(prev => ({ ...prev, branchName: e.target.value }))}
                onBlur={(e) => {
                  if (e.target.value && e.target.value !== backupSettings.branchName) {
                    handleBackupSettingChange('branchName', e.target.value);
                  }
                }}
                placeholder="backup/auto"
                className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-blue-500/50"
              />
            </div>
            <p className="text-xs text-slate-500">Branch where backups will be pushed (e.g., backup/auto)</p>
          </div>

          {/* Token */}
          <div className="space-y-1.5">
            <label className="text-sm text-white">GitHub Token (PAT)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showBackupToken ? 'text' : 'password'}
                  value={backupToken}
                  onChange={(e) => setBackupToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full px-3 py-2 pr-10 bg-slate-800 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-blue-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowBackupToken(!showBackupToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
                >
                  {showBackupToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleSaveBackupToken}
                disabled={backupSaving || !backupToken || backupToken.includes('****')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                {backupSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                Save
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Personal Access Token with <code className="px-1 py-0.5 bg-slate-800 rounded">repo</code> scope.{' '}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=FluidFlow%20Auto-Backup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Create token <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {/* Status Message */}
          {backupMessage && (
            <div className={`text-sm px-3 py-2 rounded-lg ${
              backupMessage.type === 'success'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {backupMessage.text}
            </div>
          )}

          {/* Last Backup Info */}
          {backupSettings.lastBackupAt && (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Check className="w-3 h-3 text-green-400" />
              Last backup: {new Date(backupSettings.lastBackupAt).toLocaleString()}
              {backupSettings.lastBackupCommit && (
                <code className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">
                  {backupSettings.lastBackupCommit}
                </code>
              )}
            </div>
          )}
        </div>
      </SettingsSection>
    </div>
  );
};

export default GitHubPanel;
