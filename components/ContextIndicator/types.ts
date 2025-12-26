/**
 * Shared types for ContextIndicator components
 */

export interface ContextIndicatorProps {
  contextId: string;
  projectId?: string;
  showLabel?: boolean;
  onCompact?: () => Promise<void>;
  className?: string;
}

export interface ProjectContextInfo {
  exists: boolean;
  generatedAt?: number;
  tokens?: number;
}

export interface ContextManagerModalProps {
  contextId: string;
  projectId?: string;
  onClose: () => void;
  onCompact?: () => Promise<void>;
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'warning' | 'default';
}
