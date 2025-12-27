import React from 'react';
import { FolderOpen, GitBranch, Save, Database, Info, HardDrive } from 'lucide-react';
import { SettingsSection } from '../shared';

export const ProjectsPanel: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-info-subtle)' }}>
          <FolderOpen className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Projects</h2>
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>How FluidFlow manages your projects</p>
        </div>
      </div>

      {/* Storage Info */}
      <SettingsSection
        title="Project Storage"
        description="Where your projects are saved"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border-light)' }}>
            <HardDrive className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-info)' }} />
            <div>
              <div className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>Local File System</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                Projects are stored in <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--theme-surface-dark)', color: 'var(--color-info)' }}>projects/[project-id]/</code> directory
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border-light)' }}>
            <Database className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-feature)' }} />
            <div>
              <div className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>IndexedDB (WIP)</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                Work-in-progress changes are cached in browser storage for page refresh resilience
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Auto-Save Info */}
      <SettingsSection
        title="Auto-Save"
        description="How changes are saved"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-100)' }}>
            <Save className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
            <div className="flex-1">
              <div className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>WIP Auto-Save</div>
              <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Every 1 second to IndexedDB</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>Active</span>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-100)' }}>
            <GitBranch className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
            <div className="flex-1">
              <div className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>Git Commits</div>
              <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Manual via Git panel</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--theme-glass-300)', color: 'var(--theme-text-muted)' }}>Manual</span>
          </div>
        </div>
      </SettingsSection>

      {/* Git Integration */}
      <SettingsSection
        title="Git Integration"
        description="Version control features"
      >
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Initialize Repo', desc: 'Create new git repository' },
            { label: 'Commit Changes', desc: 'Save changes to git history' },
            { label: 'View Status', desc: 'See modified files' },
            { label: 'Push to GitHub', desc: 'Sync with remote repository' },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-100)' }}>
              <div className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>{item.label}</div>
              <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 mt-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Access Git features from the Git tab in the Preview panel</span>
        </div>
      </SettingsSection>

      {/* Project Structure */}
      <SettingsSection
        title="Project Structure"
        description="Generated project file layout"
      >
        <div className="font-mono text-xs p-4 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-200)', color: 'var(--theme-text-muted)' }}>
          <div style={{ color: 'var(--theme-text-dim)' }}>project-name/</div>
          <div className="pl-4">
            <div style={{ color: 'var(--color-info)' }}>├── src/</div>
            <div className="pl-4">
              <div>├── App.tsx</div>
              <div>├── main.tsx</div>
              <div style={{ color: 'var(--color-info)' }}>├── components/</div>
              <div style={{ color: 'var(--color-info)' }}>└── styles/</div>
            </div>
            <div>├── index.html</div>
            <div>├── package.json</div>
            <div>├── tailwind.config.js</div>
            <div style={{ color: 'var(--theme-text-dim)' }}>└── .fluidflow/</div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export default ProjectsPanel;
