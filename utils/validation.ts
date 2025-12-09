/**
 * Input validation and sanitization utilities
 */

import path from 'path';

/**
 * Validates and sanitizes file paths to prevent directory traversal
 */
export function validateFilePath(filePath: string, basePath: string = ''): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path');
  }

  // Check for null bytes (security vulnerability)
  if (filePath.includes('\0')) {
    throw new Error('Path contains null byte');
  }

  // Decode URL-encoded characters before validation
  let decodedPath = filePath;
  try {
    // Attempt to decode URL-encoded characters
    decodedPath = decodeURIComponent(filePath);
  } catch {
    // If decoding fails, use original path
  }

  // Check for traversal patterns BEFORE normalization (catches encoded traversal)
  if (decodedPath.includes('..') || decodedPath.includes('~')) {
    throw new Error('Path traversal detected');
  }

  // Check for absolute paths (Unix and Windows)
  if (path.isAbsolute(filePath) || path.isAbsolute(decodedPath)) {
    throw new Error('Absolute paths not allowed');
  }

  // Also check for Windows absolute path patterns that might slip through
  if (/^[a-zA-Z]:[\\/]/.test(filePath) || /^[a-zA-Z]:[\\/]/.test(decodedPath)) {
    throw new Error('Absolute paths not allowed');
  }

  // Normalize the path
  const normalized = path.normalize(decodedPath);

  // Double-check for traversal after normalization
  if (normalized.includes('..') || normalized.startsWith('..')) {
    throw new Error('Path traversal detected');
  }

  // Resolve relative to base path if provided
  if (basePath) {
    const resolvedBase = path.resolve(basePath);
    const resolved = path.resolve(basePath, normalized);
    if (!resolved.startsWith(resolvedBase)) {
      throw new Error('Path is outside allowed directory');
    }
    // Return with forward slashes for cross-platform consistency
    return path.relative(basePath, resolved).replace(/\\/g, '/');
  }

  // Return with forward slashes for cross-platform consistency
  return normalized.replace(/\\/g, '/');
}

/**
 * Validates project ID format
 */
export function validateProjectId(projectId: string): boolean {
  if (!projectId || typeof projectId !== 'string') {
    return false;
  }

  // Allow only alphanumeric characters, hyphens, and underscores
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(projectId);
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // First, escape & to prevent breaking other entity encoding
  let sanitized = input.replace(/&/g, '&amp;');

  // HTML entity encoding
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove dangerous protocols (case-insensitive)
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');
  sanitized = sanitized.replace(/data\s*:/gi, '');

  // Remove event handlers (case-insensitive)
  sanitized = sanitized.replace(/\bon\w+\s*=/gi, '');

  // Remove CSS expressions
  sanitized = sanitized.replace(/expression\s*\(/gi, '');

  return sanitized;
}

/**
 * Validates file size
 */
export function validateFileSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * Validates MIME type
 */
export function validateMimeType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}