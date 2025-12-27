/**
 * Environment Variables Script
 *
 * Provides mock environment variables for sandbox applications.
 * Supports both process.env and import.meta.env patterns.
 */

/**
 * Default environment variables for the sandbox
 */
export const DEFAULT_ENV_VARS: Record<string, string> = {
  NODE_ENV: 'development',
  MODE: 'development',
  DEV: 'true',
  PROD: 'false',
  SSR: 'false',
  BASE_URL: '/',
  PUBLIC_URL: '',
  // Common API placeholders
  VITE_API_URL: '/api',
  REACT_APP_API_URL: '/api',
  NEXT_PUBLIC_API_URL: '/api',
  // App info
  VITE_APP_NAME: 'Sandbox App',
  REACT_APP_NAME: 'Sandbox App',
  VITE_APP_VERSION: '1.0.0',
  REACT_APP_VERSION: '1.0.0',
};

/**
 * Generate the environment variables script for the sandbox
 */
export function getEnvVariablesScript(
  customEnv: Record<string, string> = {}
): string {
  const mergedEnv = { ...DEFAULT_ENV_VARS, ...customEnv };
  const envJson = JSON.stringify(mergedEnv);

  return `
    // ═══════════════════════════════════════════════════════════
    // ENVIRONMENT VARIABLES SUPPORT
    // Provides process.env and import.meta.env for sandbox apps
    // ═══════════════════════════════════════════════════════════

    (function() {
      const envVars = ${envJson};

      // Create process.env polyfill
      if (typeof window.process === 'undefined') {
        window.process = {};
      }

      // Proxy for process.env that returns empty string for undefined vars
      window.process.env = new Proxy(envVars, {
        get: function(target, prop) {
          if (typeof prop === 'string') {
            // Return the value or empty string (matches Node.js behavior)
            return target[prop] !== undefined ? target[prop] : '';
          }
          return undefined;
        },
        has: function(target, prop) {
          return true; // Always return true to prevent "X is not defined" errors
        }
      });

      // Create import.meta.env polyfill
      // This is handled specially because import.meta is read-only
      // We'll create a global that can be used as fallback
      window.__VITE_ENV__ = new Proxy(envVars, {
        get: function(target, prop) {
          if (typeof prop === 'string') {
            // Vite-style: VITE_ prefix or standard vars
            if (prop === 'MODE') return target.MODE || 'development';
            if (prop === 'DEV') return target.DEV === 'true';
            if (prop === 'PROD') return target.PROD === 'true';
            if (prop === 'SSR') return target.SSR === 'true';
            if (prop === 'BASE_URL') return target.BASE_URL || '/';
            return target[prop] !== undefined ? target[prop] : undefined;
          }
          return undefined;
        }
      });

      // Store for later access
      window.__SANDBOX_ENV__ = envVars;

      console.log('[Sandbox] Environment variables initialized:', Object.keys(envVars).length, 'vars');
    })();
  `;
}

/**
 * Transform code to replace import.meta.env references
 * Since import.meta.env can't be polyfilled directly, we transform the code
 */
export function transformEnvReferences(code: string): string {
  // Replace import.meta.env.X with window.__VITE_ENV__.X
  // But be careful not to break other import.meta uses
  let transformed = code;

  // Pattern 1: import.meta.env.VARIABLE_NAME
  transformed = transformed.replace(
    /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g,
    'window.__VITE_ENV__.$1'
  );

  // Pattern 2: import.meta.env (the whole object)
  transformed = transformed.replace(
    /import\.meta\.env(?![.\w])/g,
    'window.__VITE_ENV__'
  );

  return transformed;
}

/**
 * Parse .env file content into key-value pairs
 */
export function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Parse KEY=VALUE
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.substring(0, eqIndex).trim();
    let value = trimmed.substring(eqIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}
