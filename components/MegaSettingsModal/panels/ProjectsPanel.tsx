import React from 'react';
import { FolderOpen, GitBranch, Save, Database, Info, HardDrive } from 'lucide-react';
import { SettingsSection } from '../shared';

export const ProjectsPanel: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <FolderOpen className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Projects</h2>
          <p className="text-xs text-slate-400">How FluidFlow manages your projects</p>
        </div>
      </div>

      {/* Storage Info */}
      <SettingsSection
        title="Project Storage"
        description="Where your projects are saved"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 border border-white/5 rounded-lg">
            <HardDrive className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm text-white">Local File System</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Projects are stored in <code className="px-1 py-0.5 bg-slate-700 rounded text-blue-300">projects/[project-id]/</code> directory
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/50 border border-white/5 rounded-lg">
            <Database className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm text-white">IndexedDB (WIP)</div>
              <div className="text-xs text-slate-500 mt-0.5">
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
          <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
            <Save className="w-4 h-4 text-green-400" />
            <div className="flex-1">
              <div className="text-sm text-white">WIP Auto-Save</div>
              <div className="text-xs text-slate-500">Every 1 second to IndexedDB</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Active</span>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
            <GitBranch className="w-4 h-4 text-orange-400" />
            <div className="flex-1">
              <div className="text-sm text-white">Git Commits</div>
              <div className="text-xs text-slate-500">Manual via Git panel</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-400 rounded">Manual</span>
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
            <div key={i} className="p-3 bg-slate-800/30 rounded-lg">
              <div className="text-sm text-white">{item.label}</div>
              <div className="text-xs text-slate-500">{item.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 mt-3 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Access Git features from the Git tab in the Preview panel</span>
        </div>
      </SettingsSection>

      {/* Project Structure */}
      <SettingsSection
        title="Project Structure"
        description="Generated project file layout"
      >
        <div className="font-mono text-xs text-slate-400 bg-slate-800/50 p-4 rounded-lg">
          <div className="text-slate-500">project-name/</div>
          <div className="pl-4">
            <div className="text-blue-400">├── src/</div>
            <div className="pl-4">
              <div>├── App.tsx</div>
              <div>├── main.tsx</div>
              <div className="text-blue-400">├── components/</div>
              <div className="text-blue-400">└── styles/</div>
            </div>
            <div>├── index.html</div>
            <div>├── package.json</div>
            <div>├── tailwind.config.js</div>
            <div className="text-slate-600">└── .fluidflow/</div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export default ProjectsPanel;
