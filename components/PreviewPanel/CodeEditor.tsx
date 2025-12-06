import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { FileCode } from 'lucide-react';
import { FileSystem } from '../../types';

// Syntax highlighting function
const highlightCode = (code: string, filename: string): string => {
  const escapeHtml = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const isTS = ['tsx', 'ts', 'jsx', 'js'].includes(ext);
  const isCSS = ext === 'css';
  const isJSON = ext === 'json';
  const isSQL = ext === 'sql';
  const isMD = ext === 'md';

  let result = escapeHtml(code);

  if (isTS) {
    result = result.replace(
      /\b(import|export|from|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|default|try|catch|finally|throw|new|typeof|instanceof|in|of|class|extends|implements|interface|type|enum|namespace|module|declare|abstract|async|await|yield|static|public|private|protected|readonly|as|is|keyof|infer|never|unknown|any|void|null|undefined|true|false|this|super)\b/g,
      '<span style="color:#c678dd">$1</span>'
    );
    result = result.replace(
      /\b(React|useState|useEffect|useRef|useMemo|useCallback|useContext|useReducer|FC|ReactNode|JSX|Promise|Array|Object|String|Number|Boolean|Map|Set|Record|Partial|Required|Pick|Omit)\b/g,
      '<span style="color:#e5c07b">$1</span>'
    );
    result = result.replace(/"([^"\\]|\\.)*"/g, '<span style="color:#98c379">$&</span>');
    result = result.replace(/'([^'\\]|\\.)*'/g, '<span style="color:#98c379">$&</span>');
    result = result.replace(/`([^`\\]|\\.)*`/g, '<span style="color:#98c379">$&</span>');
    result = result.replace(/(\/\/.*$)/gm, '<span style="color:#5c6370;font-style:italic">$1</span>');
    result = result.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#d19a66">$1</span>');
    result = result.replace(/(&lt;\/?)([\w]+)/g, '$1<span style="color:#e06c75">$2</span>');
    result = result.replace(
      /\b([a-zA-Z_$][\w$]*)\s*(?=\()/g,
      '<span style="color:#61afef">$1</span>'
    );
    result = result.replace(/\b(className)\b/g, '<span style="color:#d19a66">$1</span>');
  } else if (isCSS) {
    result = result.replace(/^([.#]?[\w-]+)\s*\{/gm, '<span style="color:#e06c75">$1</span> {');
    result = result.replace(/([\w-]+)\s*:/g, '<span style="color:#d19a66">$1</span>:');
    result = result.replace(/:\s*([^;{}]+)/g, ': <span style="color:#98c379">$1</span>');
    result = result.replace(
      /(\/\*[\s\S]*?\*\/)/g,
      '<span style="color:#5c6370;font-style:italic">$1</span>'
    );
  } else if (isJSON) {
    result = result.replace(/"([^"]+)":/g, '<span style="color:#e06c75">"$1"</span>:');
    result = result.replace(/:\s*"([^"]*)"/g, ': <span style="color:#98c379">"$1"</span>');
    result = result.replace(/:\s*(\d+)/g, ': <span style="color:#d19a66">$1</span>');
    result = result.replace(/:\s*(true|false|null)/g, ': <span style="color:#c678dd">$1</span>');
  } else if (isSQL) {
    result = result.replace(
      /\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|COLUMN|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|UNIQUE|DEFAULT|CHECK|CONSTRAINT|AND|OR|IN|BETWEEN|LIKE|ORDER|BY|ASC|DESC|GROUP|HAVING|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|DISTINCT|LIMIT|OFFSET|UNION|ALL|EXISTS|CASE|WHEN|THEN|ELSE|END|IF|INTEGER|TEXT|REAL|BLOB|VARCHAR|BOOLEAN|TIMESTAMP|SERIAL)\b/gi,
      '<span style="color:#c678dd">$1</span>'
    );
    result = result.replace(/'([^']*)'/g, "<span style=\"color:#98c379\">'$1'</span>");
    result = result.replace(/(--.*$)/gm, '<span style="color:#5c6370;font-style:italic">$1</span>');
  } else if (isMD) {
    result = result.replace(
      /^(#{1,6})\s+(.*)$/gm,
      '<span style="color:#e06c75">$1</span> <span style="color:#61afef;font-weight:bold">$2</span>'
    );
    result = result.replace(
      /\*\*([^*]+)\*\*/g,
      '<span style="color:#e5c07b;font-weight:bold">**$1**</span>'
    );
    result = result.replace(
      /`([^`]+)`/g,
      '<span style="color:#98c379;background:#1e293b;padding:0 4px;border-radius:3px">`$1`</span>'
    );
    result = result.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '[<span style="color:#61afef">$1</span>](<span style="color:#5c6370">$2</span>)'
    );
  }

  return result;
};

interface CodeEditorProps {
  files: FileSystem;
  setFiles: (files: FileSystem) => void;
  activeFile: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ files, setFiles, activeFile }) => {
  const [localContent, setLocalContent] = useState<string>('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local content when active file changes
  useEffect(() => {
    setLocalContent(files[activeFile] || '');
  }, [activeFile, files]);

  // Memoize syntax highlighted code
  const highlightedCode = useMemo(() => {
    if (!localContent) return '';
    return highlightCode(localContent, activeFile);
  }, [localContent, activeFile]);

  const handleChange = useCallback(
    (value: string) => {
      setLocalContent(value);

      // Debounce the actual file update
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setFiles({ ...files, [activeFile]: value });
      }, 300);
    },
    [files, activeFile, setFiles]
  );

  if (!files[activeFile]) {
    return null;
  }

  return (
    <>
      {/* File Tab Bar */}
      <div className="flex-none bg-[#0a0e16] border-b border-white/5 px-2 flex items-center justify-between h-9">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1117] rounded-t border-t border-l border-r border-white/10">
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-medium text-slate-300">{activeFile}</span>
        </div>
        <span className="text-[10px] text-slate-600 font-mono pr-2">
          {localContent.split('\n').length} lines
        </span>
      </div>

      {/* Code Editor with Line Numbers and Syntax Highlighting */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-[#0d1117]">
        {/* Line Numbers */}
        <div className="flex-shrink-0 bg-[#0a0e14] border-r border-white/5 text-right select-none overflow-hidden">
          <div className="py-3 px-2 font-mono text-xs leading-[1.65] text-slate-600">
            {localContent.split('\n').map((_, i) => (
              <div key={`line-${i}`} className="pr-2">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 relative overflow-auto custom-scrollbar">
          {/* Syntax Highlighted Display */}
          <pre
            className="absolute inset-0 py-3 px-4 font-mono text-xs leading-[1.65] pointer-events-none whitespace-pre overflow-visible"
            style={{ tabSize: 2 }}
            aria-hidden="true"
          >
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>

          {/* Editable Textarea */}
          <textarea
            value={localContent}
            onChange={(e) => handleChange(e.target.value)}
            className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-blue-400 py-3 px-4 font-mono text-xs leading-[1.65] focus:outline-none resize-none"
            spellCheck={false}
            style={{
              fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              tabSize: 2,
              caretColor: '#60a5fa'
            }}
            aria-label={`Edit ${activeFile}`}
          />
        </div>
      </div>
    </>
  );
};
