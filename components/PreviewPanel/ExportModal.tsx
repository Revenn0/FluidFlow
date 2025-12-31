import React from 'react';
import { Package, Download, X, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadZip: () => void;
  isDownloading: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onDownloadZip,
  isDownloading
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200" style={{ backgroundColor: 'var(--theme-modal-overlay)' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-background)' }}>
          <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
            <Package className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
            Export Project
          </h3>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
            aria-label="Close export modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Download ZIP Option */}
          <button
            onClick={onDownloadZip}
            disabled={isDownloading}
            className="w-full flex items-center gap-4 p-4 rounded-xl transition-all group"
            style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border-light)' }}
          >
            <div className="p-3 rounded-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>
              <Download className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Download as ZIP</p>
              <p className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>Complete project with Vite, Tailwind, TypeScript</p>
            </div>
            {isDownloading && <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-success)' }} />}
          </button>

          <p className="mt-4 text-[10px] text-center" style={{ color: 'var(--theme-text-dim)' }}>
            Includes: package.json, vite.config, tsconfig, tailwind.config
          </p>
          <p className="mt-2 text-[10px] text-center" style={{ color: 'var(--theme-text-dim)' }}>
            To push to GitHub, use the Git panel
          </p>
        </div>
      </div>
    </div>
  );
};
