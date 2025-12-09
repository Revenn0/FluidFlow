import React, { useState, useEffect } from 'react';
import { Settings2, Check, Info } from 'lucide-react';
import { SettingsSection } from '../shared';
import { getFluidFlowConfig } from '../../../services/fluidflowConfig';

export const AdvancedPanel: React.FC = () => {
  const [editingRules, setEditingRules] = useState(false);
  const [rulesInput, setRulesInput] = useState('');
  const [savedRules, setSavedRules] = useState('');

  useEffect(() => {
    const config = getFluidFlowConfig();
    const rules = config.getRules();
    setRulesInput(rules);
    setSavedRules(rules);
  }, []);

  const saveRules = () => {
    const config = getFluidFlowConfig();
    config.setRules(rulesInput);
    setSavedRules(rulesInput);
    setEditingRules(false);
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
    </div>
  );
};

export default AdvancedPanel;
