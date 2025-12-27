import React from 'react';
import { FileText, FilePlus, FileX, GitMerge, Copy, LucideIcon } from 'lucide-react';
import { CommitFileChange } from '@/services/projectApi';
import { CommitFileIconProps } from './types';

const iconConfigs: Record<CommitFileChange['status'], { Icon: LucideIcon; color: string }> = {
  added: { Icon: FilePlus, color: 'var(--color-success)' },
  modified: { Icon: FileText, color: 'var(--color-warning)' },
  deleted: { Icon: FileX, color: 'var(--color-error)' },
  renamed: { Icon: GitMerge, color: 'var(--color-feature)' },
  copied: { Icon: Copy, color: 'var(--color-info)' },
  unknown: { Icon: FileText, color: 'var(--theme-text-muted)' },
};

export const CommitFileIcon: React.FC<CommitFileIconProps> = ({ status }) => {
  const { Icon, color } = iconConfigs[status] || iconConfigs.unknown;
  return <Icon className="w-4 h-4 shrink-0" style={{ color }} />;
};

export default CommitFileIcon;
