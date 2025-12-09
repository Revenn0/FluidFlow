/**
 * Centralized context exports
 *
 * Usage:
 * 1. Wrap App with <AppProvider defaultFiles={defaultFiles}>
 * 2. Use hooks in child components:
 *    - useAppContext() - full context
 *    - useFiles() - just files state
 *    - useProject2() - just project state (named to avoid conflict with useProject hook)
 *    - useGit() - just git state
 *    - useUIState() - just UI state
 *    - useHistory() - just undo/redo
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
