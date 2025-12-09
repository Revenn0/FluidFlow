import React from 'react';
import { Palette, Info } from 'lucide-react';
import { SettingsSection } from '../shared';

export const AppearancePanel: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Palette className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Appearance</h2>
          <p className="text-xs text-slate-400">Visual appearance of FluidFlow</p>
        </div>
      </div>

      {/* Theme Info */}
      <SettingsSection
        title="Theme"
        description="Current visual theme"
      >
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10" />
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10" />
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30" />
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur border border-white/20" />
          </div>
          <div className="text-sm text-white mb-1">Glassmorphism Dark</div>
          <div className="text-xs text-slate-500">
            FluidFlow uses a custom glassmorphism dark theme optimized for long coding sessions.
            Additional themes may be added in future updates.
          </div>
        </div>
      </SettingsSection>

      {/* Preview Device Info */}
      <SettingsSection
        title="Preview"
        description="Preview panel device options"
      >
        <div className="flex items-start gap-3 p-4 bg-slate-800/50 border border-white/5 rounded-lg">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-400">
            Use the device buttons in the Preview panel toolbar to switch between desktop,
            tablet, and mobile views. The preview will remember your last selection during
            the session.
          </div>
        </div>
      </SettingsSection>

      {/* Color Reference */}
      <SettingsSection
        title="Color Palette"
        description="Colors used throughout the interface"
      >
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: 'Primary', color: '#3b82f6', textColor: 'white' },
            { name: 'Success', color: '#22c55e', textColor: 'white' },
            { name: 'Warning', color: '#f59e0b', textColor: 'black' },
            { name: 'Error', color: '#ef4444', textColor: 'white' },
            { name: 'Background', color: '#0a0e16', textColor: 'white' },
            { name: 'Surface', color: '#0d1117', textColor: 'white' },
            { name: 'Border', color: 'rgba(255,255,255,0.1)', textColor: 'white' },
            { name: 'Text', color: '#e2e8f0', textColor: 'black' },
          ].map(item => (
            <div key={item.name} className="text-center">
              <div
                className="w-full h-10 rounded-lg border border-white/10 mb-1"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-[10px] text-slate-500">{item.name}</div>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
};

export default AppearancePanel;
