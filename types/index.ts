// Shared types for FluidFlow application

export type FileSystem = Record<string, string>;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  label: string;
  files: FileSystem;
}

export interface AccessibilityIssue {
  type: 'error' | 'warning';
  message: string;
}

export interface AccessibilityReport {
  score: number;
  issues: AccessibilityIssue[];
}

export interface LogEntry {
  id: string;
  type: 'log' | 'warn' | 'error';
  message: string;
  timestamp: string;
  isFixing?: boolean;
  isFixed?: boolean;
}

export interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  status: number | string;
  duration: number;
  timestamp: string;
}

export interface PushResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Device types for preview
export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
export type TabType = 'preview' | 'code' | 'database' | 'tests' | 'docs';
export type TerminalTab = 'console' | 'network';
