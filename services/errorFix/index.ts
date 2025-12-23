/**
 * Error Fix Module
 *
 * Centralized exports for the error fixing system.
 * Import from this module for all error-related functionality.
 *
 * ## Architecture Overview
 *
 * The error fix system has 3 main layers:
 *
 * 1. **Analysis Layer** (errorAnalyzer)
 *    - Parses error messages and stack traces
 *    - Extracts file, line, identifier info
 *    - Returns ParsedError with fix suggestions
 *
 * 2. **Fix Engine Layer** (ErrorFixEngine)
 *    - Multi-strategy fix pipeline
 *    - Tries: local-simple → local-multifile → ai-quick → ai-full
 *    - Used by useAutoFix hook
 *
 * 3. **Agent Layer** (errorFixAgent)
 *    - Stateful orchestration with logging
 *    - Used by ErrorFixPanel UI component
 *    - Provides progress callbacks and state management
 *
 * ## Recommended Usage
 *
 * For hooks/services:
 * ```ts
 * import { ErrorFixEngine, errorAnalyzer, classifyError } from '@/services/errorFix';
 * ```
 *
 * For UI components:
 * ```ts
 * import { errorFixAgent, AgentState, AgentLogEntry } from '@/services/errorFix';
 * ```
 *
 * For local pattern-based fixes:
 * ```ts
 * import { localFixEngine, COMMON_IMPORTS } from '@/services/errorFix';
 * ```
 */

// ============================================================================
// Local Fix Engine (Pattern-based fixes)
// ============================================================================
export { localFixEngine, type LocalFixResult } from './localFixEngine';
export { COMMON_IMPORTS, type ImportInfo } from './commonImports';

// ============================================================================
// Error Analysis (Parsing and classification)
// ============================================================================
export {
  errorAnalyzer,
  type ParsedError,
  type ErrorType,
  type ErrorCategory,
} from '../errorAnalyzer';

// Re-export classification from autoFixService (for backward compatibility)
export {
  classifyError,
  canAutoFix,
  wasRecentlyFixed,
  recordFixAttempt,
  getFixAnalytics,
  type ErrorClassification,
  type AutoFixResult,
  type FixAttempt,
  type FixAnalytics,
} from '../autoFixService';

// ============================================================================
// Fix Engine (Multi-strategy pipeline)
// ============================================================================
export {
  ErrorFixEngine,
  type FixResult,
  type FixStrategy,
  type FixEngineOptions,
} from '../errorFixEngine';

// ============================================================================
// Fix Agent (Stateful orchestration with UI callbacks)
// ============================================================================
export {
  errorFixAgent,
  type AgentState,
  type AgentLogEntry,
  type AgentConfig,
} from '../errorFixAgent';

// ============================================================================
// Fix Verification
// ============================================================================
export {
  verifyFix,
  isCodeValid,
  getCodeIssues,
  doesFixResolveError,
  type VerificationResult,
  type VerificationOptions,
  type VerificationIssue,
} from '../fixVerification';
