import React from 'react';
import { ChevronDown, Folder, FileCode, FileJson, FileText, Database, FlaskConical, File as FileIcon } from 'lucide-react';
import { FileSystem } from '../../types';

interface FileExplorerProps {
  files: FileSystem;
  activeFile: string;
  onFileSelect: (file: string) => void;
}

const getFileIcon = (fileName: string) => {
  if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) {
    return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
  }
  if (fileName.endsWith('.json')) {
    return <FileJson className="w-3.5 h-3.5 text-yellow-400" />;
  }
  if (fileName.endsWith('.css')) {
    return <FileIcon className="w-3.5 h-3.5 text-pink-400" />;
  }
  if (fileName.endsWith('.sql')) {
    return <Database className="w-3.5 h-3.5 text-emerald-400" />;
  }
  if (fileName.endsWith('.md')) {
    return <FileText className="w-3.5 h-3.5 text-orange-400" />;
  }
  return <FileIcon className="w-3.5 h-3.5 text-slate-400" />;
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFile, onFileSelect }) => {
  const srcFiles = Object.keys(files).filter((f) => f.startsWith('src/') && !f.includes('.test.'));
  const testFiles = Object.keys(files).filter((f) => f.includes('.test.'));
  const dbFiles = Object.keys(files).filter((f) => f.startsWith('db/'));
  const rootFiles = Object.keys(files).filter((f) => !f.includes('/'));

  return (
    <div className="w-56 bg-[#0a0e16] border-r border-white/5 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-white/5">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Explorer
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {/* src folder */}
        {srcFiles.length > 0 && (
          <div className="mb-1">
            <div className="flex items-center gap-1.5 px-2 py-1 text-slate-400">
              <ChevronDown className="w-3 h-3" />
              <Folder className="w-3.5 h-3.5 text-blue-400/70" />
              <span className="text-[11px] font-medium">src</span>
            </div>
            <div className="ml-3 border-l border-white/5 pl-2">
              {srcFiles.map((file) => (
                <button
                  key={file}
                  onClick={() => onFileSelect(file)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${
                    activeFile === file
                      ? 'bg-blue-600/20 text-blue-200'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {getFileIcon(file)}
                  <span className="text-[11px] truncate">{file.replace('src/', '')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* tests */}
        {testFiles.length > 0 && (
          <div className="mb-1">
            <div className="flex items-center gap-1.5 px-2 py-1 text-slate-400">
              <ChevronDown className="w-3 h-3" />
              <FlaskConical className="w-3.5 h-3.5 text-pink-400/70" />
              <span className="text-[11px] font-medium">tests</span>
            </div>
            <div className="ml-3 border-l border-white/5 pl-2">
              {testFiles.map((file) => (
                <button
                  key={file}
                  onClick={() => onFileSelect(file)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${
                    activeFile === file
                      ? 'bg-pink-600/20 text-pink-200'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-[11px] truncate">{file.replace('src/', '')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* db folder */}
        {dbFiles.length > 0 && (
          <div className="mb-1">
            <div className="flex items-center gap-1.5 px-2 py-1 text-slate-400">
              <ChevronDown className="w-3 h-3" />
              <Database className="w-3.5 h-3.5 text-emerald-400/70" />
              <span className="text-[11px] font-medium">db</span>
            </div>
            <div className="ml-3 border-l border-white/5 pl-2">
              {dbFiles.map((file) => (
                <button
                  key={file}
                  onClick={() => onFileSelect(file)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${
                    activeFile === file
                      ? 'bg-emerald-600/20 text-emerald-200'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {getFileIcon(file)}
                  <span className="text-[11px] truncate">{file.replace('db/', '')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Root files */}
        {rootFiles.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/5">
            {rootFiles.map((file) => (
              <button
                key={file}
                onClick={() => onFileSelect(file)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${
                  activeFile === file
                    ? 'bg-slate-700/50 text-slate-200'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {getFileIcon(file)}
                <span className="text-[11px] truncate">{file}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
