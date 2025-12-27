/**
 * NetworkTab - Network request display component
 *
 * Displays network requests in a table format.
 */

import React from 'react';
import { Wifi } from 'lucide-react';
import type { NetworkTabProps } from './types';

export const NetworkTab: React.FC<NetworkTabProps> = ({ requests }) => {
  if (requests.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center italic py-10" style={{ color: 'var(--theme-text-dim)' }}>
        <Wifi className="w-5 h-5 mb-2 opacity-50" />
        <span>No network requests recorded</span>
      </div>
    );
  }

  const getStatusStyle = (status: number | string): React.CSSProperties => {
    if (status === 200 || status === 201) {
      return { backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' };
    } else if (status === 'ERR' || (typeof status === 'number' && status >= 400)) {
      return { backgroundColor: 'var(--color-error-subtle)', color: 'var(--color-error)' };
    }
    return { backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)' };
  };

  return (
    <div className="min-w-full inline-block align-middle">
      <table className="min-w-full">
        <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--theme-surface)', color: 'var(--theme-text-muted)' }}>
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium w-20">
              Status
            </th>
            <th scope="col" className="px-3 py-2 text-left font-medium w-20">
              Method
            </th>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Name
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium w-24">
              Time
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium w-24">
              Timestamp
            </th>
          </tr>
        </thead>
        <tbody style={{ borderTop: '1px solid var(--theme-border-light)' }}>
          {requests.map((req) => (
            <tr key={req.id} className="transition-colors" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
              <td className="px-3 py-1.5 whitespace-nowrap">
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={getStatusStyle(req.status)}
                >
                  {req.status}
                </span>
              </td>
              <td className="px-3 py-1.5 whitespace-nowrap font-bold" style={{ color: 'var(--theme-text-secondary)' }}>
                {req.method}
              </td>
              <td className="px-3 py-1.5 truncate max-w-xs" style={{ color: 'var(--theme-text-muted)' }} title={req.url}>
                {req.url}
              </td>
              <td className="px-3 py-1.5 whitespace-nowrap text-right" style={{ color: 'var(--theme-text-dim)' }}>
                {Math.round(req.duration)}ms
              </td>
              <td className="px-3 py-1.5 whitespace-nowrap text-right text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
                {req.timestamp}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
