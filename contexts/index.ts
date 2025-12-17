/**
 * Centralized context exports
 *
 * Usage:
 * 1. Wrap App with <UIProvider><AppProvider defaultFiles={defaultFiles}>
 * 2. Use hooks in child components:
 *    - useAppContext() - full context (backwards compatible)
 *    - useFiles() - just files state
 *    - useProject2() - just project state (named to avoid conflict with useProject hook)
 *    - useGit() - just git state
 *    - useUIState() - just UI state (legacy, prefer useUI)
 *    - useHistory() - just undo/redo
 *
 * NEW (optimized):
 *    - useUI() - UI state from UIContext (isolated, doesn't cause file re-renders)
 *    - useGenerationState() - just isGenerating
 *    - useTabState() - just activeTab
 *    - useModelState() - just selectedModel
 *    - usePreferences() - just preferences
 */
export {
  AppProvider,
  useAppContext,
  useFiles,
  useProject2,
  useGit,
  useUIState,
  useHistory,
  type AppContextValue,
  type AppUIContext,
} from './AppContext';

// New UIContext exports (for optimized re-renders)
export {
  UIProvider,
  useUI,
  useGenerationState,
  useTabState,
  useModelState,
  usePreferences,
  type UIContextValue,
} from './UIContext';
