import React from 'react';
import { DiffViewerProps } from './types';

// Line style configurations
const getLineStyles = (line: string): { color: string; bg: string; extra?: string } => {
  if (line.startsWith('+++') || line.startsWith('---')) {
    return { color: 'var(--theme-text-muted)', bg: '', extra: 'font-bold' };
  } else if (line.startsWith('@@')) {
    return { color: 'var(--color-feature)', bg: 'var(--color-feature-subtle)' };
  } else if (line.startsWith('+')) {
    return { color: 'var(--color-success)', bg: 'var(--color-success-subtle)' };
  } else if (line.startsWith('-')) {
    return { color: 'var(--color-error)', bg: 'var(--color-error-subtle)' };
  } else if (line.startsWith('diff --git')) {
    return { color: 'var(--color-info)', bg: 'var(--color-info-subtle)', extra: 'font-bold' };
  } else if (line.startsWith('index ') || line.startsWith('new file') || line.startsWith('deleted file')) {
    return { color: 'var(--theme-text-dim)', bg: '' };
  }
  return { color: 'var(--theme-text-muted)', bg: '' };
};

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff }) => {
  const lines = diff.split('\n');

  return (
    <pre className="text-sm font-mono p-4 overflow-x-auto">
      {lines.map((line, index) => {
        const styles = getLineStyles(line);
        const isDiffHeader = line.startsWith('diff --git');

        return (
          <div
            key={index}
            className={`-mx-4 px-4 ${isDiffHeader ? 'mt-2 pt-2' : ''}`}
            style={{
              backgroundColor: styles.bg || undefined,
              borderTop: isDiffHeader ? '1px solid var(--theme-border-light)' : undefined
            }}
          >
            <span className={styles.extra} style={{ color: styles.color }}>{line || ' '}</span>
          </div>
        );
      })}
    </pre>
  );
};

export default DiffViewer;
