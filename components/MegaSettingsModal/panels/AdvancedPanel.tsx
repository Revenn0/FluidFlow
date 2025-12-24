import React, { useState, useEffect } from 'react';
import { Settings2, Check, Info, Loader2, FlaskConical, Github, CloudUpload, Eye, EyeOff } from 'lucide-react';
import { SettingsSection } from '../shared';
import { SettingsToggle } from '../shared/SettingsToggle';
import { SettingsSelect } from '../shared/SettingsSelect';
import { getFluidFlowConfig, type AIResponseFormat } from '../../../services/fluidflowConfig';
import { webContainerService } from '../../../services/webcontainer';
import { DEFAULT_WEBCONTAINER_SETTINGS, type WebContainerSettings } from '../../../types';
import { settingsApi } from '../../../services/api/settings';
import type { GitHubBackupSettings } from '../../../services/api/types';

export const AdvancedPanel: React.FC = () => {
  const [editingRules, setEditingRules] = useState(false);
  const [rulesInput, setRulesInput] = useState('');
  const [savedRules, setSavedRules] = useState('');

  // WebContainer settings
  const [wcSettings, setWcSettings] = useState<WebContainerSettings>(DEFAULT_WEBCONTAINER_SETTINGS);
  const [wcTesting, setWcTesting] = useState(false);
  const [wcTestResult, setWcTestResult] = useState<'success' | 'error' | null>(null);

  // AI Response Format
  const [responseFormat, setResponseFormat] = useState<AIResponseFormat>('json');

  // GitHub Backup settings
  const [backupSettings, setBackupSettings] = useState<GitHubBackupSettings>({
    enabled: false,
    branchName: 'backup/auto',
  });
  const [backupToken, setBackupToken] = useState('');
  const [showBackupToken, setShowBackupToken] = useState(false);
  const [backupSaving, setBackupSaving] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const config = getFluidFlowConfig();
    const rules = config.getRules();
    setRulesInput(rules);
    setSavedRules(rules);

    // Load WebContainer settings
    const savedWcSettings = webContainerService.getSettings();
    if (savedWcSettings) {
      setWcSettings(savedWcSettings);
    }

    // Load response format
    setResponseFormat(config.getResponseFormat());

    // Load GitHub Backup settings
    settingsApi.getGitHubBackup().then((settings) => {
      setBackupSettings(settings);
      if (settings.token) {
        setBackupToken(settings.token);
      }
    }).catch(console.error);
  }, []);

  const handleResponseFormatChange = (format: string) => {
    const config = getFluidFlowConfig();
    config.setResponseFormat(format as AIResponseFormat);
    setResponseFormat(format as AIResponseFormat);
  };

  const handleWcSettingsChange = async (key: keyof WebContainerSettings, value: string | boolean) => {
    const newSettings = { ...wcSettings, [key]: value };
    setWcSettings(newSettings);
    await webContainerService.saveSettings(newSettings);
    setWcTestResult(null);
  };

  const testWebContainerConnection = async () => {
    setWcTesting(true);
    setWcTestResult(null);

    try {
      // Just try to boot - no auth needed for public packages
      await webContainerService.boot();
      setWcTestResult('success');
    } catch {
      setWcTestResult('error');
    } finally {
      setWcTesting(false);
    }
  };

  const saveRules = () => {
    const config = getFluidFlowConfig();
    config.setRules(rulesInput);
    setSavedRules(rulesInput);
    setEditingRules(false);
  };

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

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Settings2 className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Advanced Settings</h2>
          <p className="text-xs text-slate-400">Configure project rules for AI code generation</p>
        </div>
      </div>

      {/* Project Rules */}
      <SettingsSection
        title="Project Rules"
        description="Custom instructions added to every AI generation request"
      >
        {/* Info Box */}
        <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400">
            These rules are included in every AI generation request. Use them to define
            coding standards, naming conventions, preferred patterns, or any other
            guidelines you want the AI to follow.
          </div>
        </div>

        <div className="space-y-3">
          {editingRules ? (
            <>
              <textarea
                value={rulesInput}
                onChange={(e) => setRulesInput(e.target.value)}
                className="w-full h-80 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white font-mono outline-none focus:border-blue-500/50 resize-none"
                placeholder={`# Project Rules\n\n## Code Style\n- Use TypeScript strict mode\n- Prefer const over let\n- Use descriptive variable names\n\n## Component Guidelines\n- Use functional components\n- Keep components small and focused\n- Extract reusable logic into custom hooks\n\n## Styling\n- Use Tailwind utility classes\n- Follow mobile-first approach\n- Maintain consistent spacing`}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setRulesInput(savedRules);
                    setEditingRules(false);
                  }}
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRules}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Save Rules
                </button>
              </div>
            </>
          ) : (
            <div
              onClick={() => setEditingRules(true)}
              className="p-4 bg-slate-800/50 border border-white/5 rounded-lg cursor-pointer hover:border-white/20 transition-colors group"
            >
              {savedRules ? (
                <pre className="text-xs text-slate-400 whitespace-pre-wrap max-h-48 overflow-hidden">
                  {savedRules}
                </pre>
              ) : (
                <div className="text-sm text-slate-500 italic">
                  No rules defined. Click to add custom AI generation rules.
                </div>
              )}
              <div className="mt-3 text-xs text-blue-400 group-hover:text-blue-300">
                Click to edit rules
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Example Rules */}
      <SettingsSection
        title="Example Rules"
        description="Common rules you might want to add"
      >
        <div className="grid grid-cols-1 gap-2">
          {[
            { title: 'TypeScript Strict', rule: '- Always use TypeScript with strict mode\n- Avoid "any" type, use proper typing' },
            { title: 'Accessibility', rule: '- Include ARIA labels on interactive elements\n- Ensure keyboard navigation works' },
            { title: 'Performance', rule: '- Use React.memo for expensive components\n- Implement proper loading states' },
            { title: 'Error Handling', rule: '- Add try-catch blocks for async operations\n- Show user-friendly error messages' },
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => {
                const newRules = savedRules
                  ? `${savedRules}\n\n## ${example.title}\n${example.rule}`
                  : `# Project Rules\n\n## ${example.title}\n${example.rule}`;
                setRulesInput(newRules);
                setEditingRules(true);
              }}
              className="p-3 bg-slate-800/30 border border-white/5 rounded-lg text-left hover:border-white/20 transition-colors"
            >
              <div className="text-sm text-white">{example.title}</div>
              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{example.rule.split('\n')[0]}</div>
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* WebContainer Settings */}
      <SettingsSection
        title="WebContainer"
        description="In-browser Node.js runtime powered by StackBlitz"
      >
        {/* Info Box */}
        <div className="flex items-start gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-4">
          <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400">
            WebContainer enables running your project with a real Node.js runtime directly in the browser.
            No authentication required for public npm packages. Requires Chrome/Edge browser.
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable Toggle */}
          <SettingsToggle
            label="Enable WebContainer"
            description="Show WebContainer tab in Preview Panel"
            checked={wcSettings.enabled}
            onChange={(checked) => handleWcSettingsChange('enabled', checked)}
          />

          {/* Test Connection */}
          <div className="flex items-center gap-3">
            <button
              onClick={testWebContainerConnection}
              disabled={wcTesting}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              {wcTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Booting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Test WebContainer
                </>
              )}
            </button>
            {wcTestResult === 'success' && (
              <span className="text-sm text-green-400">WebContainer ready!</span>
            )}
            {wcTestResult === 'error' && (
              <span className="text-sm text-red-400">Failed to boot. Use Chrome/Edge browser.</span>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* GitHub Backup Settings */}
      <SettingsSection
        title="GitHub Auto-Backup"
        description="Automatically push commits to a backup branch on GitHub"
      >
        {/* Info Box */}
        <div className="flex items-start gap-3 p-3 bg-slate-500/10 border border-slate-500/20 rounded-lg mb-4">
          <Github className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
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
                className="text-blue-400 hover:underline"
              >
                Create token →
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

      {/* AI Response Format */}
      <SettingsSection
        title="AI Response Format"
        description="Experimental: Choose how AI returns generated code"
      >
        {/* Experimental Badge */}
        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
          <FlaskConical className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400">
            <span className="text-amber-400 font-medium">Experimental Feature:</span> The marker format
            is an alternative to JSON that may improve streaming reliability. Both formats are
            automatically detected and parsed. Use this to A/B test which works better for your use case.
          </div>
        </div>

        <div className="space-y-4">
          <SettingsSelect
            label="Response Format"
            description="How AI should structure code in responses"
            value={responseFormat}
            options={[
              {
                value: 'json',
                label: 'JSON (Default)',
                description: 'Standard JSON format with escaped content. Supports diff mode.'
              },
              {
                value: 'marker',
                label: 'Marker (Experimental)',
                description: 'HTML-style markers, no escaping needed. Diff mode disabled.'
              }
            ]}
            onChange={handleResponseFormatChange}
          />

          {/* Marker format note */}
          {responseFormat === 'marker' && (
            <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-slate-400">
              <Info className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <span className="text-blue-400">Note:</span> Diff mode (search/replace) is JSON-only.
                With marker format, updates use full file content.
              </span>
            </div>
          )}

          {/* Format Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border ${responseFormat === 'json' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-800/30 border-white/5'}`}>
              <div className="text-xs font-medium text-white mb-1">JSON Format</div>
              <pre className="text-[10px] text-slate-500 font-mono overflow-hidden">
{`// PLAN: {"create":[...]}
{"files":{"src/App.tsx":"..."}}`}
              </pre>
            </div>
            <div className={`p-3 rounded-lg border ${responseFormat === 'marker' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-800/30 border-white/5'}`}>
              <div className="text-xs font-medium text-white mb-1">Marker Format</div>
              <pre className="text-[10px] text-slate-500 font-mono overflow-hidden">
{`<!-- PLAN -->
create: src/App.tsx
<!-- FILE:src/App.tsx -->
...code...
<!-- /FILE:src/App.tsx -->`}
              </pre>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export default AdvancedPanel;
