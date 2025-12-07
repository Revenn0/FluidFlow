// Paths that should never be included in virtual file system
const IGNORED_PATHS = ['.git', 'node_modules', '.next', '.nuxt', 'dist', 'build', '.cache', '.DS_Store', 'Thumbs.db'];

/**
 * Checks if a file path should be ignored (e.g., .git, node_modules)
 */
export function isIgnoredFilePath(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return IGNORED_PATHS.some(ignored =>
    normalizedPath === ignored ||
    normalizedPath.startsWith(ignored + '/') ||
    normalizedPath.includes('/' + ignored + '/') ||
    normalizedPath.includes('/' + ignored)
  );
}

/**
 * Cleans AI-generated code by removing markdown artifacts and code block markers
 */
export function cleanGeneratedCode(code: string): string {
  if (!code) return '';

  let cleaned = code;

  // Remove code block markers with various language tags
  const codeBlockPatterns = [
    /^```(?:javascript|typescript|tsx|jsx|ts|js|react|html|css|json|sql|markdown|md|plaintext|text|sh|bash|shell)?\s*\n?/gim,
    /\n?```\s*$/gim,
    /^```\s*\n?/gim,
  ];

  codeBlockPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Remove leading language identifier on first line (e.g., "javascript" or "typescript" alone)
  cleaned = cleaned.replace(/^(javascript|typescript|tsx|jsx|ts|js|react)\s*\n/i, '');

  // Remove any remaining triple backticks
  cleaned = cleaned.replace(/```/g, '');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Attempts to repair truncated JSON from AI responses
 * Returns the repaired JSON string or throws a descriptive error
 */
export function repairTruncatedJson(jsonStr: string): string {
  let json = jsonStr.trim();

  // Count open/close braces and brackets
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
    }
  }

  // If balanced, return as-is
  if (braceCount === 0 && bracketCount === 0 && !inString) {
    return json;
  }

  console.log(`[JSON Repair] Unbalanced: braces=${braceCount}, brackets=${bracketCount}, inString=${inString}`);

  // Try to repair truncated JSON
  let repaired = json;

  // If we're in the middle of a string, try to close it
  if (inString) {
    // Find the last quote and truncate any partial content after it
    // Or close the string if it seems to be the value
    repaired += '"';
    inString = false;
  }

  // Remove trailing partial content (incomplete key or value)
  // Look for the last complete value
  const patterns = [
    // Remove trailing comma and whitespace
    /,\s*$/,
    // Remove incomplete key (": after key name without value)
    /,?\s*"[^"]*"\s*:\s*$/,
    // Remove partial string value
    /,?\s*"[^"]*"\s*:\s*"[^"]*$/,
  ];

  for (const pattern of patterns) {
    if (pattern.test(repaired)) {
      repaired = repaired.replace(pattern, '');
      break;
    }
  }

  // Close remaining brackets and braces
  // Re-count after repairs
  braceCount = 0;
  bracketCount = 0;
  inString = false;
  escapeNext = false;

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (char === '\\' && inString) { escapeNext = true; continue; }
    if (char === '"' && !escapeNext) { inString = !inString; continue; }
    if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
    }
  }

  // Close brackets first, then braces
  repaired += ']'.repeat(Math.max(0, bracketCount));
  repaired += '}'.repeat(Math.max(0, braceCount));

  return repaired;
}

/**
 * Parses AI response that might contain multiple files in JSON format
 * Includes enhanced repair for truncated responses
 */
export function parseMultiFileResponse(response: string): { files: Record<string, string>; explanation?: string; truncated?: boolean } | null {
  try {
    // First, try to extract JSON from markdown code blocks
    const codeBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    let jsonString = codeBlockMatch ? codeBlockMatch[1] : response;

    // Try to find JSON object in the string
    const jsonMatch = jsonString.match(/\{[\s\S]*\}?/);
    if (jsonMatch) {
      let jsonToParse = jsonMatch[0];
      let wasTruncated = false;

      // Try direct parse first
      let parsed;
      try {
        parsed = JSON.parse(jsonToParse);
      } catch (parseError) {
        // Try to repair truncated JSON
        console.log('[parseMultiFileResponse] Direct parse failed, attempting repair...');
        wasTruncated = true;

        try {
          const repaired = repairTruncatedJson(jsonToParse);
          parsed = JSON.parse(repaired);
          console.log('[parseMultiFileResponse] Repair successful');
        } catch (repairError) {
          // Last resort: try to extract just the files object
          const filesMatch = jsonString.match(/"files"\s*:\s*\{([\s\S]*)/);
          if (filesMatch) {
            try {
              const filesJson = '{' + filesMatch[1];
              const repairedFiles = repairTruncatedJson(filesJson);
              const filesObj = JSON.parse(repairedFiles);
              parsed = { files: filesObj, explanation: 'Response was truncated - showing partial results.' };
              console.log('[parseMultiFileResponse] Extracted partial files object');
            } catch {
              throw new Error('Response was truncated and could not be repaired. The model may have hit token limits. Try a shorter prompt or different model.');
            }
          } else {
            throw new Error('Response was truncated and could not be repaired. The model may have hit token limits. Try a shorter prompt or different model.');
          }
        }
      }

      // Validate that parsed is an object
      if (typeof parsed !== 'object' || parsed === null) {
        return null;
      }

      // Extract explanation if present
      const explanation = parsed.explanation || parsed.description;

      // Get the files - could be in "files" key or at root level
      let filesObj = parsed.files || parsed;
      if (filesObj.explanation) delete filesObj.explanation;
      if (filesObj.description) delete filesObj.description;

      // If no file-like keys found, error
      const fileKeys = Object.keys(filesObj).filter(k =>
        k.includes('.') || k.includes('/') // Has extension or path separator
      );

      if (fileKeys.length === 0) {
        throw new Error('Model returned no code files. Try a model better suited for code generation.');
      }

      // Clean each file's content
      const cleaned: Record<string, string> = {};
      for (const [path, content] of Object.entries(filesObj)) {
        // Skip non-file keys
        if (!path.includes('.') && !path.includes('/')) continue;

        // Skip ignored paths like .git, node_modules
        if (isIgnoredFilePath(path)) {
          console.log('[cleanCode] Skipping ignored path:', path);
          continue;
        }

        if (typeof content === 'string') {
          cleaned[path] = cleanGeneratedCode(content);
        }
      }

      // Return null if no valid file entries found
      if (Object.keys(cleaned).length === 0) {
        return null;
      }

      return {
        files: cleaned,
        explanation: typeof explanation === 'string' ? explanation : undefined,
        truncated: wasTruncated
      };
    }

    // No JSON found in response
    throw new Error('No valid JSON found in response. The model may not support structured code generation.');
  } catch (e) {
    // Re-throw with better error message
    if (e instanceof Error) {
      throw e;
    }
    throw new Error('Failed to parse model response. Try a different model.');
  }
}

/**
 * Validates that the cleaned code looks like valid code
 */
export function isValidCode(code: string): boolean {
  if (!code || code.length < 10) return false;

  // Check for common code patterns
  const hasImport = /import\s+/.test(code);
  const hasExport = /export\s+/.test(code);
  const hasFunction = /function\s+|const\s+\w+\s*=|=>\s*{/.test(code);
  const hasJSX = /<\w+/.test(code);
  const hasClass = /class\s+\w+/.test(code);

  return hasImport || hasExport || hasFunction || hasJSX || hasClass;
}
