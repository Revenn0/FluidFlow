import React, { useMemo, useState } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
  SandpackConsole,
  SandpackFileExplorer,
  useSandpack
} from '@codesandbox/sandpack-react';
import { dracula } from '@codesandbox/sandpack-themes';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Code2,
  Eye,
  Terminal,
  FolderTree,
  Layout,
  LayoutPanelLeft
} from 'lucide-react';
import type { FileSystem } from '@/types';

interface SandpackPanelProps {
  files: FileSystem;
  onFilesChange?: (files: FileSystem) => void;
}

// Convert FluidFlow files to Sandpack format
function convertToSandpackFiles(files: FileSystem): Record<string, string> {
  const sandpackFiles: Record<string, string> = {};

  for (const [path, content] of Object.entries(files)) {
    // Sandpack expects paths starting with /
    const sandpackPath = path.startsWith('/') ? path : `/${path}`;
    sandpackFiles[sandpackPath] = content;
  }

  // Ensure we have an entry point
  if (!sandpackFiles['/src/index.tsx'] && !sandpackFiles['/src/index.js']) {
    // Create a default entry point that imports App
    sandpackFiles['/src/index.tsx'] = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
`;
  }

  // Ensure we have index.html
  if (!sandpackFiles['/index.html'] && !sandpackFiles['/public/index.html']) {
    sandpackFiles['/index.html'] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FluidFlow App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
  }

  return sandpackFiles;
}

// Refresh button component that uses sandpack context
const RefreshButton: React.FC = () => {
  const { sandpack } = useSandpack();

  return (
    <button
      onClick={() => sandpack.runSandpack()}
      className="p-1.5 rounded hover:bg-white/10 transition-colors"
      title="Refresh Preview"
    >
      <RefreshCw className="w-4 h-4" />
    </button>
  );
};

type ViewMode = 'split' | 'preview' | 'editor';

export const SandpackPanel: React.FC<SandpackPanelProps> = ({
  files,
  onFilesChange
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showConsole, setShowConsole] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);

  // Convert files to Sandpack format
  const sandpackFiles = useMemo(() => convertToSandpackFiles(files), [files]);

  // Determine entry file
  const entryFile = useMemo(() => {
    if (sandpackFiles['/src/App.tsx']) return '/src/App.tsx';
    if (sandpackFiles['/src/App.jsx']) return '/src/App.jsx';
    if (sandpackFiles['/src/index.tsx']) return '/src/index.tsx';
    if (sandpackFiles['/src/index.jsx']) return '/src/index.jsx';
    return Object.keys(sandpackFiles)[0] || '/src/App.tsx';
  }, [sandpackFiles]);

  // Custom dependencies based on what's imported in the code
  const customDependencies = useMemo(() => {
    const deps: Record<string, string> = {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
    };

    // Check for common imports
    const allCode = Object.values(files).join('\n');

    if (allCode.includes('motion/react') || allCode.includes('framer-motion')) {
      deps['motion'] = 'latest';
    }
    if (allCode.includes('lucide-react')) {
      deps['lucide-react'] = 'latest';
    }
    if (allCode.includes('react-router')) {
      deps['react-router'] = 'latest';
    }
    if (allCode.includes('@tanstack/react-query')) {
      deps['@tanstack/react-query'] = 'latest';
    }
    if (allCode.includes('zustand')) {
      deps['zustand'] = 'latest';
    }
    if (allCode.includes('axios')) {
      deps['axios'] = 'latest';
    }
    if (allCode.includes('date-fns')) {
      deps['date-fns'] = 'latest';
    }
    if (allCode.includes('clsx') || allCode.includes('classnames')) {
      deps['clsx'] = 'latest';
    }
    if (allCode.includes('tailwind-merge')) {
      deps['tailwind-merge'] = 'latest';
    }

    return deps;
  }, [files]);

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-[#1a1a2e]'
    : 'h-full';

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-1">
          {/* View mode toggles */}
          <button
            onClick={() => setViewMode('split')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'split' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/60'
            }`}
            title="Split View"
          >
            <Layout className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('editor')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'editor' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/60'
            }`}
            title="Editor Only"
          >
            <Code2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'preview' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/60'
            }`}
            title="Preview Only"
          >
            <Eye className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/20 mx-2" />

          {/* File explorer toggle */}
          <button
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className={`p-1.5 rounded transition-colors ${
              showFileExplorer ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/60'
            }`}
            title="Toggle File Explorer"
          >
            <FolderTree className="w-4 h-4" />
          </button>

          {/* Console toggle */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`p-1.5 rounded transition-colors ${
              showConsole ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/60'
            }`}
            title="Toggle Console"
          >
            <Terminal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-white/80">
          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Sandpack */}
      <div className={`${isFullscreen ? 'h-[calc(100%-44px)]' : 'h-[calc(100%-44px)]'}`}>
        <SandpackProvider
          template="react-ts"
          theme={dracula}
          files={sandpackFiles}
          customSetup={{
            dependencies: customDependencies,
            entry: entryFile
          }}
          options={{
            recompileMode: 'delayed',
            recompileDelay: 500,
            autoReload: true,
            autorun: true,
            externalResources: [
              'https://cdn.tailwindcss.com'
            ]
          }}
        >
          <SandpackLayout
            style={{
              height: '100%',
              border: 'none',
              borderRadius: 0
            }}
          >
            {/* File Explorer */}
            {showFileExplorer && viewMode !== 'preview' && (
              <SandpackFileExplorer
                style={{
                  height: '100%',
                  minWidth: '160px',
                  maxWidth: '200px'
                }}
              />
            )}

            {/* Code Editor */}
            {viewMode !== 'preview' && (
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                showInlineErrors
                wrapContent
                closableTabs
                style={{
                  height: showConsole ? '70%' : '100%',
                  flex: viewMode === 'editor' ? 1 : 0.5
                }}
              />
            )}

            {/* Preview */}
            {viewMode !== 'editor' && (
              <div style={{ flex: viewMode === 'preview' ? 1 : 0.5, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <SandpackPreview
                    showOpenInCodeSandbox={false}
                    showRefreshButton={true}
                    style={{
                      height: '100%'
                    }}
                  />
                </div>
              </div>
            )}
          </SandpackLayout>

          {/* Console (outside layout for full width) */}
          {showConsole && (
            <div className="border-t border-white/10" style={{ height: '200px' }}>
              <SandpackConsole
                style={{ height: '100%' }}
                showHeader
                showResetConsoleButton
              />
            </div>
          )}
        </SandpackProvider>
      </div>
    </div>
  );
};

export default SandpackPanel;
