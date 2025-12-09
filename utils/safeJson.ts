/**
 * Safe JSON parsing utilities with error handling
 */

export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) {
    return fallback;
  }

  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('JSON parsing failed:', error);
    return fallback;
  }
}

export function safeJsonStringify(obj: unknown, fallback: string = '{}'): string {
  // Handle undefined and functions explicitly - JSON.stringify returns undefined for these
  if (obj === undefined || typeof obj === 'function') {
    return fallback;
  }

  try {
    const result = JSON.stringify(obj);
    // JSON.stringify can return undefined for some edge cases
    if (result === undefined) {
      return fallback;
    }
    return result;
  } catch (error) {
    console.error('JSON stringification failed:', error);
    return fallback;
  }
}

export function safeJsonParseWithDefault<T>(json: string | null | undefined): T | null {
  return safeJsonParse(json, null);
}