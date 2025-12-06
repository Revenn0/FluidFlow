import React from 'react';
import { Package, Download, Github, X, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadZip: () => void;
  onPushToGithub: () => void;
  isDownloading: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onDownloadZip,
  onPushToGithub,
  isDownloading
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-white/5 bg-slate-950 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            Export Project
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
            aria-label="Close export modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-400">
            Export your generated project as a complete, ready-to-run application.
          </p>

          {/* Download ZIP Option */}
          <button
            onClick={onDownloadZip}
            disabled={isDownloading}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 transition-all group"
          >
            <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Download className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-white">Download as ZIP</p>
              <p className="text-xs text-slate-500">Complete project with Vite, Tailwind, TypeScript</p>
            </div>
            {isDownloading && <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />}
          </button>

          {/* Push to GitHub Option */}
          <button
            onClick={onPushToGithub}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 transition-all group"
          >
            <div className="p-3 rounded-lg bg-slate-700 text-white group-hover:scale-110 transition-transform">
              <Github className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-white">Push to GitHub</p>
              <p className="text-xs text-slate-500">Create a new repository with your code</p>
            </div>
          </button>
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600">
            Project includes: package.json, vite.config, tsconfig, tailwind.config
          </p>
        </div>
      </div>
    </div>
  );
};
