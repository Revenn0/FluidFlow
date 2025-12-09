import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Palette, Database, Globe, Check, RotateCcw, Sparkles, Zap, FileText } from 'lucide-react';
import { useTechStack } from '../../hooks/useTechStack';
import { TechStackConfig, TECH_STACK_OPTIONS, TechStackOption } from '../../types';

// Category metadata with icons and colors (uses shared TECH_STACK_OPTIONS for data)
interface CategoryMeta {
  key: keyof TechStackConfig;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface TechStackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Category display metadata - actual options come from TECH_STACK_OPTIONS
const categoryMeta: CategoryMeta[] = [
  { key: 'styling', label: 'Styling', icon: Palette, color: 'text-blue-400' },
  { key: 'icons', label: 'Icons', icon: Package, color: 'text-green-400' },
  { key: 'stateManagement', label: 'State Management', icon: Database, color: 'text-purple-400' },
  { key: 'routing', label: 'Routing', icon: Globe, color: 'text-orange-400' },
  { key: 'dataFetching', label: 'Data Fetching', icon: Zap, color: 'text-cyan-400' },
  { key: 'forms', label: 'Forms', icon: FileText, color: 'text-pink-400' },
  { key: 'animations', label: 'Animations', icon: Sparkles, color: 'text-yellow-400' },
  { key: 'testing', label: 'Testing', icon: Check, color: 'text-red-400' }
];

// Helper to get options for a category from shared TECH_STACK_OPTIONS
const getOptionsForCategory = (key: keyof TechStackConfig): TechStackOption[] => {
  return TECH_STACK_OPTIONS[key] || [];
};

export const TechStackModal: React.FC<TechStackModalProps> = ({ isOpen, onClose }) => {
  const { techStack, updateTechStack, resetTechStack } = useTechStack();
  const [selectedCategory, setSelectedCategory] = useState<keyof TechStackConfig>('styling');

  if (!isOpen) return null;

  const currentMeta = categoryMeta.find(cat => cat.key === selectedCategory);
  const currentOptions = getOptionsForCategory(selectedCategory);
  const currentSelection = techStack[selectedCategory];

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="w-full max-w-5xl bg-slate-950/98 backdrop-blur-xl rounded-2xl border border-white/10 animate-in zoom-in-95 duration-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Technology Stack</h2>
              <p className="text-xs text-slate-400">Choose your preferred libraries and frameworks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetTechStack}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
              title="Reset to default stack"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Category Selection */}
          <div className="w-64 bg-slate-900/50 border-r border-white/5 p-4">
            <div className="space-y-1">
              {categoryMeta.map((meta) => {
                const Icon = meta.icon;
                const isSelected = selectedCategory === meta.key;

                return (
                  <button
                    key={meta.key}
                    onClick={() => setSelectedCategory(meta.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? meta.color : ''}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{meta.label}</div>
                      <div className="text-xs opacity-70 capitalize">
                        {techStack[meta.key]?.library}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-green-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content - Options */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              {/* Category Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  {currentMeta && <currentMeta.icon className={`w-6 h-6 ${currentMeta.color}`} />}
                  <h3 className="text-xl font-semibold text-white">
                    {currentMeta?.label}
                  </h3>
                </div>
                <p className="text-sm text-slate-400">
                  Select your preferred {currentMeta?.label.toLowerCase()} library for the generated code
                </p>
              </div>

              {/* Options Grid */}
              <div className="grid gap-3">
                {currentOptions.map((option) => {
                  const isSelected = currentSelection?.library === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => updateTechStack(selectedCategory, option.value, option.version)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 text-white'
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{option.label}</h4>
                            {isSelected && <Check className="w-4 h-4 text-green-400" />}
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{option.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-slate-900/50 rounded-md text-slate-400">
                              {option.version}
                            </span>
                            {isSelected && (
                              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-md font-medium">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Current Stack Summary */}
              <div className="mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                <h4 className="text-sm font-semibold text-white mb-3">Current Stack</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {categoryMeta.map((meta) => {
                    const selection = techStack[meta.key];
                    return (
                      <div key={meta.key} className="flex items-center gap-2">
                        <meta.icon className={`w-3 h-3 ${meta.color}`} />
                        <span className="text-slate-300">{selection?.library || 'none'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};