/**
 * Simple Fixes Utility
 * Handles common code errors without AI assistance
 */

interface SimpleFixResult {
  fixed: boolean;
  newCode: string;
  description: string;
  fixType: 'import' | 'typo' | 'syntax' | 'missing-closing' | 'undefined' | 'none';
}

// Common React imports
const REACT_IMPORTS: Record<string, string> = {
  'useState': "import { useState } from 'react';",
  'useEffect': "import { useEffect } from 'react';",
  'useCallback': "import { useCallback } from 'react';",
  'useMemo': "import { useMemo } from 'react';",
  'useRef': "import { useRef } from 'react';",
  'useContext': "import { useContext } from 'react';",
  'useReducer': "import { useReducer } from 'react';",
  'createContext': "import { createContext } from 'react';",
  'Fragment': "import { Fragment } from 'react';",
  'Suspense': "import { Suspense } from 'react';",
  'lazy': "import { lazy } from 'react';",
  'memo': "import { memo } from 'react';",
  'forwardRef': "import { forwardRef } from 'react';",
};

// Common prop typos
const PROP_TYPOS: Record<string, string> = {
  'classname': 'className',
  'classNames': 'className',
  'class': 'className',
  'onclick': 'onClick',
  'onchange': 'onChange',
  'onsubmit': 'onSubmit',
  'oninput': 'onInput',
  'onkeydown': 'onKeyDown',
  'onkeyup': 'onKeyUp',
  'onkeypress': 'onKeyPress',
  'onfocus': 'onFocus',
  'onblur': 'onBlur',
  'onmouseover': 'onMouseOver',
  'onmouseout': 'onMouseOut',
  'onmouseenter': 'onMouseEnter',
  'onmouseleave': 'onMouseLeave',
  'onscroll': 'onScroll',
  'onload': 'onLoad',
  'onerror': 'onError',
  'tabindex': 'tabIndex',
  'readonly': 'readOnly',
  'maxlength': 'maxLength',
  'minlength': 'minLength',
  'autocomplete': 'autoComplete',
  'autofocus': 'autoFocus',
  'htmlfor': 'htmlFor',
  'for': 'htmlFor',
  'srcset': 'srcSet',
  'crossorigin': 'crossOrigin',
  'colspan': 'colSpan',
  'rowspan': 'rowSpan',
  'cellpadding': 'cellPadding',
  'cellspacing': 'cellSpacing',
  'contenteditable': 'contentEditable',
  'spellcheck': 'spellCheck',
  'dangerouslysetinnerhtml': 'dangerouslySetInnerHTML',
};

/**
 * Try to fix common errors without AI
 */
export function trySimpleFix(errorMessage: string, code: string): SimpleFixResult {
  const errorLower = errorMessage.toLowerCase();

  // 1. Try to fix missing React hook imports
  const hookFix = tryFixMissingHookImport(errorMessage, code);
  if (hookFix.fixed) return hookFix;

  // 2. Try to fix prop typos
  const typoFix = tryFixPropTypo(errorMessage, code);
  if (typoFix.fixed) return typoFix;

  // 3. Try to fix "React is not defined"
  if (errorLower.includes('react is not defined') || errorLower.includes("react' is not defined")) {
    const reactFix = tryFixMissingReact(code);
    if (reactFix.fixed) return reactFix;
  }

  // 4. Try to fix missing closing bracket/brace
  const bracketFix = tryFixMissingClosing(errorMessage, code);
  if (bracketFix.fixed) return bracketFix;

  // 5. Try to fix common undefined variable typos
  const undefinedFix = tryFixUndefinedVariable(errorMessage, code);
  if (undefinedFix.fixed) return undefinedFix;

  // 6. Try to fix missing semicolon
  const semicolonFix = tryFixMissingSemicolon(errorMessage, code);
  if (semicolonFix.fixed) return semicolonFix;

  return { fixed: false, newCode: code, description: '', fixType: 'none' };
}

/**
 * Fix missing React hook imports
 */
function tryFixMissingHookImport(errorMessage: string, code: string): SimpleFixResult {
  // Pattern: "X is not defined" where X is a React hook
  const notDefinedMatch = errorMessage.match(/['"]?(\w+)['"]?\s+is not defined/i);
  if (!notDefinedMatch) {
    return { fixed: false, newCode: code, description: '', fixType: 'none' };
  }

  const identifier = notDefinedMatch[1];

  // Check if it's a known React import
  if (REACT_IMPORTS[identifier]) {
    // Check if already imported
    const importRegex = new RegExp(`import\\s*{[^}]*\\b${identifier}\\b[^}]*}\\s*from\\s*['"]react['"]`, 'i');
    if (importRegex.test(code)) {
      return { fixed: false, newCode: code, description: '', fixType: 'none' };
    }

    // Check if there's an existing react import to extend
    const existingImport = code.match(/import\s*{([^}]*)}\s*from\s*['"]react['"]/);
    let newCode: string;

    if (existingImport) {
      // Add to existing import
      const currentImports = existingImport[1].trim();
      const newImports = currentImports ? `${currentImports}, ${identifier}` : identifier;
      newCode = code.replace(
        /import\s*{[^}]*}\s*from\s*['"]react['"]/,
        `import { ${newImports} } from 'react'`
      );
    } else {
      // Check if there's a default React import
      const defaultReactImport = code.match(/import\s+React\s+from\s*['"]react['"]/);
      if (defaultReactImport) {
        // Add named import alongside default
        newCode = code.replace(
          /import\s+React\s+from\s*['"]react['"]/,
          `import React, { ${identifier} } from 'react'`
        );
      } else {
        // Add new import at the top
        newCode = `import { ${identifier} } from 'react';\n${code}`;
      }
    }

    return {
      fixed: true,
      newCode,
      description: `Added missing import: ${identifier}`,
      fixType: 'import'
    };
  }

  return { fixed: false, newCode: code, description: '', fixType: 'none' };
}

/**
 * Fix common prop typos
 */
function tryFixPropTypo(errorMessage: string, code: string): SimpleFixResult {
  // Check if error mentions invalid prop name
  const invalidPropMatch = errorMessage.match(/invalid dom property ['"`](\w+)['"`]/i) ||
                          errorMessage.match(/unknown prop ['"`](\w+)['"`]/i) ||
                          errorMessage.match(/warning:.*['"`](\w+)['"`].*is not a valid/i);

  if (invalidPropMatch) {
    const wrongProp = invalidPropMatch[1].toLowerCase();
    const correctProp = PROP_TYPOS[wrongProp];

    if (correctProp) {
      // Replace the typo (case-insensitive)
      const regex = new RegExp(`\\b${invalidPropMatch[1]}\\s*=`, 'g');
      const newCode = code.replace(regex, `${correctProp}=`);

      if (newCode !== code) {
        return {
          fixed: true,
          newCode,
          description: `Fixed prop typo: ${invalidPropMatch[1]} → ${correctProp}`,
          fixType: 'typo'
        };
      }
    }
  }

  // Also check for direct prop typo patterns in error
  for (const [typo, correct] of Object.entries(PROP_TYPOS)) {
    if (errorMessage.toLowerCase().includes(typo)) {
      const regex = new RegExp(`\\b${typo}\\s*=`, 'gi');
      if (regex.test(code)) {
        const newCode = code.replace(regex, `${correct}=`);
        if (newCode !== code) {
          return {
            fixed: true,
            newCode,
            description: `Fixed prop typo: ${typo} → ${correct}`,
            fixType: 'typo'
          };
        }
      }
    }
  }

  return { fixed: false, newCode: code, description: '', fixType: 'none' };
}

/**
 * Fix missing React import for JSX
 */
function tryFixMissingReact(code: string): SimpleFixResult {
  // Check if React is already imported
  if (/import\s+React/i.test(code) || /import\s*{[^}]*}\s*from\s*['"]react['"]/.test(code)) {
    return { fixed: false, newCode: code, description: '', fixType: 'none' };
  }

  const newCode = `import React from 'react';\n${code}`;
  return {
    fixed: true,
    newCode,
    description: 'Added missing React import',
    fixType: 'import'
  };
}

/**
 * Fix missing closing brackets/braces
 */
function tryFixMissingClosing(errorMessage: string, code: string): SimpleFixResult {
  const errorLower = errorMessage.toLowerCase();

  // Count brackets
  const counts = {
    '(': 0, ')': 0,
    '{': 0, '}': 0,
    '[': 0, ']': 0,
  };

  // Simple bracket counting (not perfect but catches obvious cases)
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prevChar = i > 0 ? code[i - 1] : '';

    // Track string state
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    // Count brackets outside strings
    if (!inString && counts.hasOwnProperty(char)) {
      counts[char as keyof typeof counts]++;
    }
  }

  let newCode = code;
  let fixes: string[] = [];

  // Check for missing closing brackets
  if (counts['('] > counts[')']) {
    const missing = counts['('] - counts[')'];
    newCode = newCode.trimEnd() + ')'.repeat(missing);
    fixes.push(`${missing} closing parenthesis`);
  }

  if (counts['{'] > counts['}']) {
    const missing = counts['{'] - counts['}'];
    newCode = newCode.trimEnd() + '}'.repeat(missing);
    fixes.push(`${missing} closing brace`);
  }

  if (counts['['] > counts[']']) {
    const missing = counts['['] - counts[']'];
    newCode = newCode.trimEnd() + ']'.repeat(missing);
    fixes.push(`${missing} closing bracket`);
  }

  if (fixes.length > 0 && newCode !== code) {
    return {
      fixed: true,
      newCode,
      description: `Added missing: ${fixes.join(', ')}`,
      fixType: 'missing-closing'
    };
  }

  // Check error message for specific missing bracket hints
  if (errorLower.includes("expected '}'") || errorLower.includes("missing }")) {
    newCode = code.trimEnd() + '\n}';
    return {
      fixed: true,
      newCode,
      description: 'Added missing closing brace',
      fixType: 'missing-closing'
    };
  }

  if (errorLower.includes("expected ')'") || errorLower.includes("missing )")) {
    newCode = code.trimEnd() + ')';
    return {
      fixed: true,
      newCode,
      description: 'Added missing closing parenthesis',
      fixType: 'missing-closing'
    };
  }

  return { fixed: false, newCode: code, description: '', fixType: 'none' };
}

/**
 * Try to fix undefined variable (common typos)
 */
function tryFixUndefinedVariable(errorMessage: string, code: string): SimpleFixResult {
  const match = errorMessage.match(/['"]?(\w+)['"]?\s+is not defined/i);
  if (!match) return { fixed: false, newCode: code, description: '', fixType: 'none' };

  const undefinedVar = match[1];

  // Common variable typos
  const commonTypos: Record<string, string[]> = {
    'setstate': ['setState', 'setStage'],
    'usestate': ['useState'],
    'useeffect': ['useEffect'],
    'usecallback': ['useCallback'],
    'usememo': ['useMemo'],
    'useref': ['useRef'],
    'props': ['props'],
    'childrens': ['children'],
    'classname': ['className'],
  };

  const lowerVar = undefinedVar.toLowerCase();

  // Check if it's a known typo
  for (const [typo, corrections] of Object.entries(commonTypos)) {
    if (lowerVar === typo || lowerVar.includes(typo)) {
      for (const correction of corrections) {
        // Check if correction exists in code (as definition)
        const defRegex = new RegExp(`(const|let|var|function)\\s+${correction}\\b`, 'i');
        if (defRegex.test(code) || REACT_IMPORTS[correction]) {
          const replaceRegex = new RegExp(`\\b${undefinedVar}\\b`, 'g');
          const newCode = code.replace(replaceRegex, correction);
          if (newCode !== code) {
            return {
              fixed: true,
              newCode,
              description: `Fixed typo: ${undefinedVar} → ${correction}`,
              fixType: 'undefined'
            };
          }
        }
      }
    }
  }

  // Try to find similar variable in code (Levenshtein-like matching)
  const definedVars = extractDefinedVariables(code);
  for (const definedVar of definedVars) {
    if (isSimilar(undefinedVar, definedVar) && undefinedVar !== definedVar) {
      const replaceRegex = new RegExp(`\\b${undefinedVar}\\b`, 'g');
      const newCode = code.replace(replaceRegex, definedVar);
      if (newCode !== code) {
        return {
          fixed: true,
          newCode,
          description: `Fixed typo: ${undefinedVar} → ${definedVar}`,
          fixType: 'undefined'
        };
      }
    }
  }

  return { fixed: false, newCode: code, description: '', fixType: 'none' };
}

/**
 * Extract defined variables from code
 */
function extractDefinedVariables(code: string): string[] {
  const vars: string[] = [];

  // Match const/let/var declarations
  const declMatches = code.matchAll(/(const|let|var)\s+(\w+)/g);
  for (const match of declMatches) {
    vars.push(match[2]);
  }

  // Match function declarations
  const funcMatches = code.matchAll(/function\s+(\w+)/g);
  for (const match of funcMatches) {
    vars.push(match[1]);
  }

  // Match destructured state from useState
  const stateMatches = code.matchAll(/const\s+\[(\w+),\s*(\w+)\]/g);
  for (const match of stateMatches) {
    vars.push(match[1], match[2]);
  }

  return [...new Set(vars)];
}

/**
 * Check if two strings are similar (simple check)
 */
function isSimilar(a: string, b: string): boolean {
  if (a.length < 3 || b.length < 3) return false;

  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  // Same except case
  if (aLower === bLower) return true;

  // One character difference
  if (Math.abs(a.length - b.length) <= 1) {
    let differences = 0;
    const shorter = a.length <= b.length ? aLower : bLower;
    const longer = a.length <= b.length ? bLower : aLower;

    let j = 0;
    for (let i = 0; i < shorter.length && differences <= 1; i++) {
      if (shorter[i] !== longer[j]) {
        differences++;
        if (shorter.length < longer.length) j++;
      }
      j++;
    }

    return differences <= 1;
  }

  return false;
}

/**
 * Try to fix missing semicolon
 */
function tryFixMissingSemicolon(errorMessage: string, code: string): SimpleFixResult {
  const errorLower = errorMessage.toLowerCase();

  if (errorLower.includes('missing semicolon') || errorLower.includes("expected ';'")) {
    // Try to find the line number from error
    const lineMatch = errorMessage.match(/line\s+(\d+)/i);
    if (lineMatch) {
      const lineNum = parseInt(lineMatch[1], 10);
      const lines = code.split('\n');

      if (lineNum > 0 && lineNum <= lines.length) {
        const targetLine = lines[lineNum - 1];
        // Add semicolon if line doesn't end with one
        if (!targetLine.trimEnd().endsWith(';') &&
            !targetLine.trimEnd().endsWith('{') &&
            !targetLine.trimEnd().endsWith('}') &&
            !targetLine.trimEnd().endsWith(',')) {
          lines[lineNum - 1] = targetLine.trimEnd() + ';';
          return {
            fixed: true,
            newCode: lines.join('\n'),
            description: `Added semicolon at line ${lineNum}`,
            fixType: 'syntax'
          };
        }
      }
    }
  }

  return { fixed: false, newCode: code, description: '', fixType: 'none' };
}

/**
 * Check if an error can potentially be fixed without AI
 */
export function canTrySimpleFix(errorMessage: string): boolean {
  const errorLower = errorMessage.toLowerCase();

  const simpleFixPatterns = [
    /is not defined/i,
    /invalid.*prop/i,
    /unknown prop/i,
    /expected ['"`][});\]]['"`]/i,
    /missing.*[});\]]/i,
    /missing semicolon/i,
    /react is not defined/i,
    /unexpected token/i,
  ];

  return simpleFixPatterns.some(pattern => pattern.test(errorMessage));
}
