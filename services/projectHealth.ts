/**
 * Project Health Service
 *
 * Detects missing or corrupted critical project files and provides
 * auto-fix capabilities to restore them from templates.
 */

import type { FileSystem } from '../types';

// ============================================================================
// Types
// ============================================================================

export type HealthStatus = 'healthy' | 'warning' | 'critical';
export type IssueType = 'missing' | 'invalid' | 'corrupted';
export type IssueSeverity = 'error' | 'warning' | 'info';

export interface HealthIssue {
  id: string;
  file: string;
  type: IssueType;
  severity: IssueSeverity;
  message: string;
  fixable: boolean;
  fix?: () => Record<string, string>; // Returns files to add/update
}

export interface HealthCheckResult {
  status: HealthStatus;
  issues: HealthIssue[];
  checkedAt: number;
  fixableCount: number;
}

export interface CriticalFile {
  path: string;
  required: boolean;
  validator?: (content: string) => { valid: boolean; error?: string };
  template: string | ((projectName?: string) => string);
  description: string;
}

// ============================================================================
// Critical File Templates
// ============================================================================

const getPackageJsonTemplate = (projectName = 'my-app') => `{
  "name": "${projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "typescript": "^5.6.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}`;

const VITE_CONFIG_TEMPLATE = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
});
`;

const TSCONFIG_TEMPLATE = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`;

const TSCONFIG_NODE_TEMPLATE = `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}`;

const INDEX_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const MAIN_TSX_TEMPLATE = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

const APP_TSX_TEMPLATE = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Your App
        </h1>
        <p className="text-gray-600">
          Start editing <code className="bg-gray-200 px-2 py-1 rounded">src/App.tsx</code>
        </p>
      </div>
    </div>
  );
}

export default App;
`;

const INDEX_CSS_TEMPLATE = `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
`;

const TAILWIND_CONFIG_TEMPLATE = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;

const POSTCSS_CONFIG_TEMPLATE = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

const GITIGNORE_TEMPLATE = `# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;

// ============================================================================
// Validators
// ============================================================================

function validateJson(content: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(content);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}

function validatePackageJson(content: string): { valid: boolean; error?: string } {
  const jsonResult = validateJson(content);
  if (!jsonResult.valid) return jsonResult;

  try {
    const pkg = JSON.parse(content);
    if (!pkg.name) return { valid: false, error: 'Missing "name" field' };
    if (!pkg.dependencies && !pkg.devDependencies) {
      return { valid: false, error: 'Missing dependencies' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid package.json structure' };
  }
}

function validateViteConfig(content: string): { valid: boolean; error?: string } {
  if (!content.includes('defineConfig')) {
    return { valid: false, error: 'Missing defineConfig import' };
  }
  if (!content.includes('export default')) {
    return { valid: false, error: 'Missing default export' };
  }
  return { valid: true };
}

function validateHtml(content: string): { valid: boolean; error?: string } {
  if (!content.includes('<!DOCTYPE html>') && !content.includes('<!doctype html>')) {
    return { valid: false, error: 'Missing DOCTYPE declaration' };
  }
  if (!content.includes('<div id="root">') && !content.includes("id='root'")) {
    return { valid: false, error: 'Missing root element' };
  }
  return { valid: true };
}

// ============================================================================
// Critical Files Definition
// ============================================================================

export const CRITICAL_FILES: CriticalFile[] = [
  {
    path: 'package.json',
    required: true,
    validator: validatePackageJson,
    template: getPackageJsonTemplate,
    description: 'Project configuration and dependencies',
  },
  {
    path: 'vite.config.ts',
    required: true,
    validator: validateViteConfig,
    template: VITE_CONFIG_TEMPLATE,
    description: 'Vite build configuration',
  },
  {
    path: 'tsconfig.json',
    required: true,
    validator: validateJson,
    template: TSCONFIG_TEMPLATE,
    description: 'TypeScript configuration',
  },
  {
    path: 'tsconfig.node.json',
    required: false,
    validator: validateJson,
    template: TSCONFIG_NODE_TEMPLATE,
    description: 'TypeScript config for Node.js files',
  },
  {
    path: 'index.html',
    required: true,
    validator: validateHtml,
    template: INDEX_HTML_TEMPLATE,
    description: 'HTML entry point',
  },
  {
    path: 'src/main.tsx',
    required: true,
    template: MAIN_TSX_TEMPLATE,
    description: 'React application entry point',
  },
  {
    path: 'src/App.tsx',
    required: true,
    template: APP_TSX_TEMPLATE,
    description: 'Main App component',
  },
  {
    path: 'src/index.css',
    required: false,
    template: INDEX_CSS_TEMPLATE,
    description: 'Global styles with Tailwind',
  },
  {
    path: 'tailwind.config.js',
    required: false,
    template: TAILWIND_CONFIG_TEMPLATE,
    description: 'Tailwind CSS configuration',
  },
  {
    path: 'postcss.config.js',
    required: false,
    template: POSTCSS_CONFIG_TEMPLATE,
    description: 'PostCSS configuration',
  },
  {
    path: '.gitignore',
    required: false,
    template: GITIGNORE_TEMPLATE,
    description: 'Git ignore rules',
  },
];

// ============================================================================
// Health Check Logic
// ============================================================================

/**
 * Check project health and return issues
 */
export function checkProjectHealth(
  files: FileSystem,
  projectName?: string
): HealthCheckResult {
  const issues: HealthIssue[] = [];
  let issueId = 0;

  for (const criticalFile of CRITICAL_FILES) {
    const content = files[criticalFile.path];

    // Check if file exists
    if (!content) {
      if (criticalFile.required) {
        issues.push({
          id: `issue-${++issueId}`,
          file: criticalFile.path,
          type: 'missing',
          severity: 'error',
          message: `Missing required file: ${criticalFile.description}`,
          fixable: true,
          fix: () => ({
            [criticalFile.path]:
              typeof criticalFile.template === 'function'
                ? criticalFile.template(projectName)
                : criticalFile.template,
          }),
        });
      }
      continue;
    }

    // Validate content if validator exists
    if (criticalFile.validator) {
      const result = criticalFile.validator(content);
      if (!result.valid) {
        issues.push({
          id: `issue-${++issueId}`,
          file: criticalFile.path,
          type: 'invalid',
          severity: criticalFile.required ? 'error' : 'warning',
          message: `Invalid ${criticalFile.path}: ${result.error}`,
          fixable: true,
          fix: () => ({
            [criticalFile.path]:
              typeof criticalFile.template === 'function'
                ? criticalFile.template(projectName)
                : criticalFile.template,
          }),
        });
      }
    }
  }

  // Determine overall status
  let status: HealthStatus = 'healthy';
  if (issues.some((i) => i.severity === 'error')) {
    status = 'critical';
  } else if (issues.some((i) => i.severity === 'warning')) {
    status = 'warning';
  }

  return {
    status,
    issues,
    checkedAt: Date.now(),
    fixableCount: issues.filter((i) => i.fixable).length,
  };
}

/**
 * Apply fixes for given issues
 * Returns the files to add/update
 */
export function applyFixes(issues: HealthIssue[]): Record<string, string> {
  const fixes: Record<string, string> = {};

  for (const issue of issues) {
    if (issue.fixable && issue.fix) {
      const fixedFiles = issue.fix();
      Object.assign(fixes, fixedFiles);
    }
  }

  return fixes;
}

/**
 * Get a single file template
 */
export function getFileTemplate(
  path: string,
  projectName?: string
): string | null {
  const criticalFile = CRITICAL_FILES.find((f) => f.path === path);
  if (!criticalFile) return null;

  return typeof criticalFile.template === 'function'
    ? criticalFile.template(projectName)
    : criticalFile.template;
}

/**
 * Get all required files as templates (for new project scaffolding)
 */
export function getProjectScaffold(projectName = 'my-app'): Record<string, string> {
  const files: Record<string, string> = {};

  for (const criticalFile of CRITICAL_FILES) {
    files[criticalFile.path] =
      typeof criticalFile.template === 'function'
        ? criticalFile.template(projectName)
        : criticalFile.template;
  }

  return files;
}

/**
 * Quick health check - just returns status without details
 */
export function getQuickHealthStatus(files: FileSystem): HealthStatus {
  const requiredFiles = CRITICAL_FILES.filter((f) => f.required);

  for (const file of requiredFiles) {
    const content = files[file.path];
    if (!content) return 'critical';

    if (file.validator) {
      const result = file.validator(content);
      if (!result.valid) return 'critical';
    }
  }

  return 'healthy';
}
