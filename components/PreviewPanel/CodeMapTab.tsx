import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { generateCodeMap, FileInfo, CodeMap } from '../../utils/codemap';
import { FileSystem } from '../../types';

interface CodeMapTabProps {
  files: FileSystem;
}

export const CodeMapTab: React.FC<CodeMapTabProps> = ({ files }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'components' | 'graph'>('tree');
  const [filterType, setFilterType] = useState<'all' | 'component' | 'hook' | 'utility'>('all');

  // Generate codemap from VFS
  const codeMap = useMemo<CodeMap | null>(() => {
    if (Object.keys(files).length === 0) return null;
    try {
      return generateCodeMap(files);
    } catch (err) {
      console.error('Failed to generate code map:', err);
      return null;
    }
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (!codeMap) return [];

    let filtered = codeMap.files;

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(f => f.type === filterType);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.path.toLowerCase().includes(query) ||
        f.exports.some(e => e.toLowerCase().includes(query)) ||
        f.functions.some(fn => fn.toLowerCase().includes(query)) ||
        f.components.some(c => c.name.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [codeMap, filterType, searchQuery]);

  const allComponents = useMemo(() => {
    if (!codeMap) return [];
    return codeMap.files.flatMap(f => f.components);
  }, [codeMap]);

  const getFileIconColor = (type: string) => {
    switch (type) {
      case 'component': return 'var(--color-success)';
      case 'hook': return 'var(--color-feature)';
      case 'style': return 'var(--color-accent)';
      case 'data': return 'var(--color-warning)';
      case 'config': return 'var(--color-warning)';
      default: return 'var(--color-info)';
    }
  };

  const getFileIcon = (file: FileInfo) => {
    const color = getFileIconColor(file.type);
    switch (file.type) {
      case 'component': return <Icons.Package className="w-3.5 h-3.5" style={{ color }} />;
      case 'hook': return <Icons.GitBranch className="w-3.5 h-3.5" style={{ color }} />;
      case 'style': return <Icons.Palette className="w-3.5 h-3.5" style={{ color }} />;
      case 'data': return <Icons.Database className="w-3.5 h-3.5" style={{ color }} />;
      case 'config': return <Icons.Settings className="w-3.5 h-3.5" style={{ color }} />;
      default: return <Icons.FileCode className="w-3.5 h-3.5" style={{ color }} />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'component': return { backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' };
      case 'hook': return { backgroundColor: 'var(--color-feature-subtle)', color: 'var(--color-feature)' };
      case 'style': return { backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' };
      case 'data': return { backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)' };
      case 'config': return { backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)' };
      default: return { backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' };
    }
  };

  const handleFileClick = (file: FileInfo) => {
    setSelectedFile(file);
  };

  if (!codeMap || Object.keys(files).length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--theme-surface)' }}>
        <div className="text-center">
          <Icons.Map className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--theme-text-dim)' }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>No files to analyze</p>
          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-dim)' }}>Generate some code first</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalFiles: codeMap.files.length,
    components: codeMap.files.filter(f => f.type === 'component').length,
    hooks: codeMap.files.filter(f => f.type === 'hook').length,
    utilities: codeMap.files.filter(f => f.type === 'utility').length
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--theme-surface)' }}>
      {/* Stats Bar */}
      <div className="px-3 py-2 flex items-center gap-4 text-xs" style={{ borderBottom: '1px solid var(--theme-border-subtle)', backgroundColor: 'var(--theme-glass-100)' }}>
        <div className="flex items-center gap-1.5">
          <Icons.FileCode className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-dim)' }} />
          <span className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{stats.totalFiles}</span>
          <span style={{ color: 'var(--theme-text-dim)' }}>files</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icons.Package className="w-3.5 h-3.5" style={{ color: 'var(--color-success)', opacity: 0.6 }} />
          <span style={{ color: 'var(--color-success)' }}>{stats.components}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icons.GitBranch className="w-3.5 h-3.5" style={{ color: 'var(--color-feature)', opacity: 0.6 }} />
          <span style={{ color: 'var(--color-feature)' }}>{stats.hooks}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icons.Code className="w-3.5 h-3.5" style={{ color: 'var(--color-info)', opacity: 0.6 }} />
          <span style={{ color: 'var(--color-info)' }}>{stats.utilities}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--theme-border-subtle)' }}>
        {/* View Mode */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
          <button
            onClick={() => setViewMode('tree')}
            className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'tree' ? 'var(--theme-accent)' : 'transparent',
              color: viewMode === 'tree' ? 'var(--theme-text-on-accent)' : 'var(--theme-text-muted)',
            }}
            title="File Tree"
          >
            <Icons.FolderTree className="w-3 h-3" />
          </button>
          <button
            onClick={() => setViewMode('components')}
            className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'components' ? 'var(--theme-accent)' : 'transparent',
              color: viewMode === 'components' ? 'var(--theme-text-on-accent)' : 'var(--theme-text-muted)',
            }}
            title="Components"
          >
            <Icons.Package className="w-3 h-3" />
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'graph' ? 'var(--theme-accent)' : 'transparent',
              color: viewMode === 'graph' ? 'var(--theme-text-on-accent)' : 'var(--theme-text-muted)',
            }}
            title="Dependency Graph"
          >
            <Icons.Network className="w-3 h-3" />
          </button>
        </div>

        {/* Filter */}
        {viewMode === 'tree' && (
          <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
            {(['all', 'component', 'hook', 'utility'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
                style={{
                  backgroundColor: filterType === type ? 'var(--color-feature)' : 'transparent',
                  color: filterType === type ? 'var(--theme-text-on-accent)' : 'var(--theme-text-muted)',
                }}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="flex-1 relative">
          <Icons.Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'var(--theme-text-dim)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-7 pr-2 py-1 rounded text-xs focus:outline-none"
            style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-input-border)', color: 'var(--theme-text-primary)' }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {viewMode === 'tree' && (
          <>
            {/* File List */}
            <div className="w-64 overflow-y-auto" style={{ borderRight: '1px solid var(--theme-border-subtle)' }}>
              <div className="p-2 space-y-0.5">
                {filteredFiles.length === 0 ? (
                  <div className="text-center py-4">
                    <Icons.Search className="w-6 h-6 mx-auto mb-1" style={{ color: 'var(--theme-text-dim)' }} />
                    <p className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>No matching files</p>
                  </div>
                ) : (
                  filteredFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleFileClick(file)}
                      className="w-full text-left p-2 rounded transition-colors"
                      style={{
                        backgroundColor: selectedFile?.path === file.path ? 'var(--color-info-subtle)' : 'transparent',
                        border: selectedFile?.path === file.path ? '1px solid var(--color-info-border)' : '1px solid transparent',
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        {getFileIcon(file)}
                        <span className="flex-1 text-xs truncate" style={{ color: 'var(--theme-text-primary)' }}>
                          {file.path.split('/').pop()}
                        </span>
                        <span className="px-1 py-0.5 rounded text-[8px]" style={getTypeStyle(file.type)}>
                          {file.type.slice(0, 3)}
                        </span>
                      </div>
                      <div className="text-[10px] truncate mt-0.5 pl-5" style={{ color: 'var(--theme-text-dim)' }}>
                        {file.path}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* File Details */}
            <div className="flex-1 overflow-y-auto">
              {selectedFile ? (
                <div className="p-3">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      {getFileIcon(selectedFile)}
                      <h3 className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                        {selectedFile.path.split('/').pop()}
                      </h3>
                    </div>
                    <p className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>{selectedFile.path}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px]" style={getTypeStyle(selectedFile.type)}>
                      {selectedFile.type}
                    </span>
                  </div>

                  {/* Exports */}
                  {selectedFile.exports.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-[10px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
                        Exports ({selectedFile.exports.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedFile.exports.map((exp) => (
                          <span key={exp} className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' }}>
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Components */}
                  {selectedFile.components.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-[10px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
                        Components ({selectedFile.components.length})
                      </h4>
                      <div className="space-y-1.5">
                        {selectedFile.components.map((comp) => (
                          <div key={comp.name} className="p-2 rounded" style={{ backgroundColor: 'var(--theme-glass-100)' }}>
                            <div className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>{comp.name}</div>
                            {comp.props.length > 0 && (
                              <div className="mt-1 text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                                Props: {comp.props.join(', ')}
                              </div>
                            )}
                            {comp.hooks.length > 0 && (
                              <div className="mt-0.5 flex flex-wrap gap-0.5">
                                {comp.hooks.slice(0, 5).map((hook) => (
                                  <span key={hook} className="px-1 py-0.5 rounded text-[8px]" style={{ backgroundColor: 'var(--color-feature-subtle)', color: 'var(--color-feature)' }}>
                                    {hook}
                                  </span>
                                ))}
                                {comp.hooks.length > 5 && (
                                  <span className="text-[8px]" style={{ color: 'var(--theme-text-dim)' }}>+{comp.hooks.length - 5}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Functions */}
                  {selectedFile.functions.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-[10px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
                        Functions ({selectedFile.functions.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedFile.functions.map((fn) => (
                          <span key={fn} className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }}>
                            {fn}()
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Imports */}
                  {selectedFile.imports.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
                        Imports ({selectedFile.imports.length})
                      </h4>
                      <div className="space-y-1">
                        {selectedFile.imports.slice(0, 10).map((imp, idx) => (
                          <div key={idx} className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                            <span style={{ color: 'var(--theme-text-dim)' }}>from</span>
                            <span className="ml-1 font-mono" style={{ color: 'var(--theme-text-secondary)' }}>{imp.from}</span>
                          </div>
                        ))}
                        {selectedFile.imports.length > 10 && (
                          <div className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
                            +{selectedFile.imports.length - 10} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Icons.MousePointer className="w-6 h-6 mx-auto mb-1" style={{ color: 'var(--theme-text-dim)' }} />
                    <p className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>Select a file</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === 'components' && (
          <div className="flex-1 overflow-y-auto p-3">
            {allComponents.length === 0 ? (
              <div className="text-center py-8">
                <Icons.Package className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--theme-text-dim)' }} />
                <p className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>No React components found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {allComponents.map((comp) => (
                  <div key={comp.name} className="p-2 rounded" style={{ backgroundColor: 'var(--theme-glass-100)', border: '1px solid var(--theme-border-subtle)' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icons.Package className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--theme-text-primary)' }}>{comp.name}</span>
                    </div>

                    {comp.props.length > 0 && (
                      <div className="mb-1.5">
                        <div className="text-[8px] mb-0.5" style={{ color: 'var(--theme-text-dim)' }}>Props</div>
                        <div className="flex flex-wrap gap-0.5">
                          {comp.props.slice(0, 4).map((prop) => (
                            <span key={prop} className="px-1 py-0.5 rounded text-[8px]" style={{ backgroundColor: 'var(--theme-glass-300)', color: 'var(--theme-text-secondary)' }}>
                              {prop}
                            </span>
                          ))}
                          {comp.props.length > 4 && (
                            <span className="text-[8px]" style={{ color: 'var(--theme-text-dim)' }}>+{comp.props.length - 4}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {comp.hooks.length > 0 && (
                      <div className="mb-1.5">
                        <div className="text-[8px] mb-0.5" style={{ color: 'var(--theme-text-dim)' }}>Hooks</div>
                        <div className="flex flex-wrap gap-0.5">
                          {comp.hooks.slice(0, 3).map((hook) => (
                            <span key={hook} className="px-1 py-0.5 rounded text-[8px]" style={{ backgroundColor: 'var(--color-feature-subtle)', color: 'var(--color-feature)' }}>
                              {hook}
                            </span>
                          ))}
                          {comp.hooks.length > 3 && (
                            <span className="text-[8px]" style={{ color: 'var(--theme-text-dim)' }}>+{comp.hooks.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {comp.children.length > 0 && (
                      <div>
                        <div className="text-[8px] mb-0.5" style={{ color: 'var(--theme-text-dim)' }}>Uses</div>
                        <div className="flex flex-wrap gap-0.5">
                          {comp.children.slice(0, 3).map((child) => (
                            <span key={child} className="px-1 py-0.5 rounded text-[8px]" style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>
                              {child}
                            </span>
                          ))}
                          {comp.children.length > 3 && (
                            <span className="text-[8px]" style={{ color: 'var(--theme-text-dim)' }}>+{comp.children.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'graph' && (
          <div className="flex-1 overflow-auto p-3">
            <div className="rounded-lg p-4 min-h-[400px]" style={{ backgroundColor: 'var(--theme-glass-100)' }}>
              <h3 className="text-xs font-medium mb-3" style={{ color: 'var(--theme-text-primary)' }}>Component Dependency Graph</h3>

              {/* Simple text-based dependency visualization */}
              <div className="space-y-3">
                {Object.entries(codeMap.componentTree)
                  .filter(([_, children]) => children.length > 0)
                  .map(([parent, children]) => (
                    <div key={parent} className="flex items-start gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>
                        <Icons.Package className="w-3 h-3" />
                        {parent}
                      </div>
                      <Icons.ArrowRight className="w-4 h-4 mt-1" style={{ color: 'var(--theme-text-dim)' }} />
                      <div className="flex flex-wrap gap-1">
                        {children.map(child => (
                          <span key={child} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' }}>
                            {child}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                {Object.entries(codeMap.componentTree).filter(([_, children]) => children.length > 0).length === 0 && (
                  <div className="text-center py-8">
                    <Icons.Network className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--theme-text-dim)' }} />
                    <p className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>No component dependencies found</p>
                  </div>
                )}
              </div>

              {/* File dependencies */}
              <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--theme-border-subtle)' }}>
                <h3 className="text-xs font-medium mb-3" style={{ color: 'var(--theme-text-primary)' }}>File Import Dependencies</h3>
                <div className="space-y-2">
                  {codeMap.files
                    .filter(f => f.imports.filter(i => i.from.startsWith('.')).length > 0)
                    .slice(0, 10)
                    .map(file => {
                      const localImports = file.imports.filter(i => i.from.startsWith('.'));
                      return (
                        <div key={file.path} className="text-[10px]">
                          <span className="font-mono" style={{ color: 'var(--theme-text-secondary)' }}>{file.path.split('/').pop()}</span>
                          <span className="mx-1" style={{ color: 'var(--theme-text-dim)' }}>imports</span>
                          <span style={{ color: 'var(--theme-text-muted)' }}>
                            {localImports.map(i => i.from.split('/').pop()).join(', ')}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeMapTab;
