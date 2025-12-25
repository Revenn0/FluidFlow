import React, { useState, useEffect, useMemo } from 'react';
import {
  Info,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowUpCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Wrench,
  Bug,
  Trash2,
  Shield,
  AlertTriangle,
  Github,
  Heart,
  Zap,
} from 'lucide-react';
import { SettingsSection } from '../shared';
import {
  APP_VERSION,
  APP_NAME,
  getVersionInfo,
  checkForUpdatesWithCache,
  clearUpdateCache,
  parseChangelog,
  getSectionStyle,
  type UpdateCheckResult,
  type ChangelogEntry,
} from '../../../services/version';

// Import changelog content
import changelogContent from '../../../CHANGELOG.md?raw';

export const AboutPanel: React.FC = () => {
  const [updateCheck, setUpdateCheck] = useState<UpdateCheckResult | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set([APP_VERSION]));

  const versionInfo = getVersionInfo();

  // Parse changelog
  const changelog = useMemo(() => parseChangelog(changelogContent), []);

  // Check for updates on mount
  useEffect(() => {
    checkForUpdatesWithCache().then(setUpdateCheck);
  }, []);

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    clearUpdateCache();
    try {
      const result = await checkForUpdatesWithCache();
      setUpdateCheck(result);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  const getSectionIcon = (type: ChangelogEntry['sections'][0]['type']) => {
    switch (type) {
      case 'added':
        return Sparkles;
      case 'changed':
        return Wrench;
      case 'fixed':
        return Bug;
      case 'removed':
        return Trash2;
      case 'security':
        return Shield;
      case 'deprecated':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
          <Zap className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">About {APP_NAME}</h2>
          <p className="text-xs text-slate-400">Version info, updates, and changelog</p>
        </div>
      </div>

      {/* App Info Card */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{APP_NAME}</h3>
                <p className="text-sm text-slate-400">Sketch-to-App Prototyping Tool</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                    v{versionInfo.version}
                  </span>
                  <span className="text-xs text-slate-500">
                    Build: {versionInfo.buildDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5">
            <a
              href="https://github.com/ersinkoc/FluidFlow"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/ersinkoc/FluidFlow/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <Bug className="w-4 h-4" />
              Report Issue
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/sponsors/ersinkoc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-pink-400 transition-colors"
            >
              <Heart className="w-4 h-4" />
              Sponsor
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Update Check */}
      <SettingsSection title="Updates" description="Check for new versions">
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            {updateCheck?.hasUpdate ? (
              <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
            ) : updateCheck?.error ? (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-slate-400" />
            )}
            <div>
              {updateCheck?.hasUpdate ? (
                <>
                  <div className="text-sm text-emerald-400 font-medium">
                    Update available: v{updateCheck.latestVersion}
                  </div>
                  <div className="text-xs text-slate-500">
                    Current: v{updateCheck.currentVersion}
                  </div>
                </>
              ) : updateCheck?.error ? (
                <>
                  <div className="text-sm text-amber-400">Unable to check for updates</div>
                  <div className="text-xs text-slate-500">{updateCheck.error}</div>
                </>
              ) : updateCheck ? (
                <>
                  <div className="text-sm text-white">You're up to date</div>
                  <div className="text-xs text-slate-500">v{updateCheck.currentVersion}</div>
                </>
              ) : (
                <>
                  <div className="text-sm text-slate-400">Checking for updates...</div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {updateCheck?.hasUpdate && updateCheck.latestRelease && (
              <a
                href={updateCheck.latestRelease.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                View Release
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              {isCheckingUpdate ? 'Checking...' : 'Check Now'}
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Changelog */}
      <SettingsSection
        title="Changelog"
        description={`${changelog.length} releases`}
      >
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {changelog.map((entry) => {
            const isExpanded = expandedVersions.has(entry.version);
            const isCurrent = entry.version === APP_VERSION;

            return (
              <div
                key={entry.version}
                className={`border rounded-lg overflow-hidden transition-colors ${
                  isCurrent
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-white/5 bg-slate-800/30'
                }`}
              >
                <button
                  onClick={() => toggleVersion(entry.version)}
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                  <span className="text-sm font-medium text-white">v{entry.version}</span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">
                      Current
                    </span>
                  )}
                  {entry.date && (
                    <span className="text-xs text-slate-500 ml-auto">{entry.date}</span>
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {entry.sections.map((section, sIdx) => {
                      const style = getSectionStyle(section.type);
                      const Icon = getSectionIcon(section.type);

                      return (
                        <div key={sIdx}>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded ${style.bgColor} ${style.color}`}
                            >
                              <Icon className="w-3 h-3" />
                              {style.label}
                            </span>
                          </div>
                          <ul className="space-y-1 ml-4">
                            {section.items.map((item, iIdx) => (
                              <li
                                key={iIdx}
                                className="text-xs text-slate-400 flex items-start gap-2"
                              >
                                <span className="text-slate-600 mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Credits */}
      <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
        <div className="flex items-center gap-3">
          <Heart className="w-4 h-4 text-pink-400" />
          <div className="text-xs text-slate-400">
            Made with <span className="text-pink-400">love</span> by{' '}
            <a
              href="https://github.com/ersinkoc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Ersin Koc
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPanel;
