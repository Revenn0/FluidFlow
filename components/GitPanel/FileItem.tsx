import React from 'react';
import { Check, FileText, FilePlus, FileX } from 'lucide-react';
import { FileItemProps } from './types';

const statusColors: Record<string, string> = {
  staged: 'var(--color-success)',
  modified: 'var(--color-warning)',
  untracked: 'var(--color-info)',
  deleted: 'var(--color-error)',
};

const StatusIcons = {
  staged: Check,
  modified: FileText,
  untracked: FilePlus,
  deleted: FileX,
};

export const FileItem: React.FC<FileItemProps> = ({ file, status }) => {
  const StatusIcon = StatusIcons[status];

  return (
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 ml-4 text-sm rounded" style={{ color: 'var(--theme-text-muted)' }}>
      <StatusIcon className="w-4 h-4" style={{ color: statusColors[status] }} />
      <span className="truncate">{file}</span>
    </div>
  );
};

export default FileItem;
