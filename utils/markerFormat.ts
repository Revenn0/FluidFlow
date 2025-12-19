/**
 * Marker Format Parser
 *
 * Alternative response format using HTML-style markers instead of JSON.
 * Benefits:
 * - No JSON escaping needed (newlines, quotes work naturally)
 * - Easy file boundary detection for streaming
 * - Partial responses still parseable
 * - Less prone to AI formatting errors
 *
 * Format:
 * <!-- PLAN -->
 * create: src/App.tsx, src/components/Header.tsx
 * update: src/pages/Home.tsx
 * delete: src/old/Legacy.tsx
 * sizes: src/App.tsx:25, src/components/Header.tsx:40
 * <!-- /PLAN -->
 *
 * <!-- EXPLANATION -->
 * Created responsive layout components...
 * <!-- /EXPLANATION -->
 *
 * <!-- FILE:src/App.tsx -->
 * import { Header } from './components/Header';
 * function App() { ... }
 * <!-- /FILE:src/App.tsx -->
 */

import { cleanGeneratedCode } from './cleanCode';
import type { GenerationMeta } from './cleanCode';

// File plan structure from marker format
export interface MarkerFilePlan {
  create: string[];
  update: string[];
  delete: string[];
  total: number;
  sizes?: Record<string, number>;
}

// Parsed marker format response
export interface MarkerFormatResponse {
  files: Record<string, string>;
  explanation?: string;
  plan?: MarkerFilePlan;
  generationMeta?: GenerationMeta;
  truncated?: boolean;
  /** Files that were started but not completed (missing closing marker) */
  incompleteFiles?: string[];
}

/**
 * Detects if response uses marker format (vs JSON format)
 */
export function isMarkerFormat(response: string): boolean {
  // Check for marker format indicators
  const hasFileMarker = /<!--\s*FILE:/.test(response);
  const hasPlanMarker = /<!--\s*PLAN\s*-->/.test(response);
  const hasExplanationMarker = /<!--\s*EXPLANATION\s*-->/.test(response);

  // Marker format should have FILE markers
  return hasFileMarker || (hasPlanMarker && hasExplanationMarker);
}

/**
 * Parse PLAN block from marker format
 *
 * <!-- PLAN -->
 * create: src/App.tsx, src/components/Header.tsx
 * update: src/pages/Home.tsx
 * delete: src/old/Legacy.tsx
 * sizes: src/App.tsx:25, src/components/Header.tsx:40
 * batch: 1/2
 * <!-- /PLAN -->
 */
export function parseMarkerPlan(response: string): MarkerFilePlan | null {
  const planMatch = response.match(/<!--\s*PLAN\s*-->([\s\S]*?)<!--\s*\/PLAN\s*-->/);
  if (!planMatch) return null;

  const planContent = planMatch[1].trim();
  const lines = planContent.split('\n').map((l) => l.trim()).filter(Boolean);

  const plan: MarkerFilePlan = {
    create: [],
    update: [],
    delete: [],
    total: 0,
    sizes: {},
  };

  for (const line of lines) {
    // Parse "create: file1, file2, file3"
    if (line.startsWith('create:')) {
      const files = line.slice(7).split(',').map((f) => f.trim()).filter(Boolean);
      plan.create = files;
    }
    // Parse "update: file1, file2"
    else if (line.startsWith('update:')) {
      const files = line.slice(7).split(',').map((f) => f.trim()).filter(Boolean);
      plan.update = files;
    }
    // Parse "delete: file1, file2"
    else if (line.startsWith('delete:')) {
      const files = line.slice(7).split(',').map((f) => f.trim()).filter(Boolean);
      plan.delete = files;
    }
    // Parse "sizes: src/App.tsx:25, src/components/Header.tsx:40"
    else if (line.startsWith('sizes:')) {
      const sizePairs = line.slice(6).split(',').map((s) => s.trim()).filter(Boolean);
      for (const pair of sizePairs) {
        const lastColon = pair.lastIndexOf(':');
        if (lastColon > 0) {
          const path = pair.slice(0, lastColon).trim();
          const size = parseInt(pair.slice(lastColon + 1).trim(), 10);
          if (path && !isNaN(size) && plan.sizes) {
            plan.sizes[path] = size;
          }
        }
      }
    }
  }

  plan.total = plan.create.length + plan.update.length;
  return plan;
}

/**
 * Parse EXPLANATION block from marker format
 */
export function parseMarkerExplanation(response: string): string | undefined {
  const match = response.match(/<!--\s*EXPLANATION\s*-->([\s\S]*?)<!--\s*\/EXPLANATION\s*-->/);
  return match ? match[1].trim() : undefined;
}

/**
 * Parse GENERATION_META block from marker format (for multi-batch)
 *
 * <!-- GENERATION_META -->
 * totalFilesPlanned: 10
 * filesInThisBatch: src/App.tsx, src/components/Header.tsx
 * completedFiles: src/App.tsx, src/components/Header.tsx
 * remainingFiles: src/components/Footer.tsx, src/components/Sidebar.tsx
 * currentBatch: 1
 * totalBatches: 2
 * isComplete: false
 * <!-- /GENERATION_META -->
 */
export function parseMarkerGenerationMeta(response: string): GenerationMeta | undefined {
  const match = response.match(
    /<!--\s*GENERATION_META\s*-->([\s\S]*?)<!--\s*\/GENERATION_META\s*-->/
  );
  if (!match) return undefined;

  const content = match[1].trim();
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

  const meta: GenerationMeta = {
    totalFilesPlanned: 0,
    filesInThisBatch: [],
    completedFiles: [],
    remainingFiles: [],
    currentBatch: 1,
    totalBatches: 1,
    isComplete: true,
  };

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();

    switch (key) {
      case 'totalFilesPlanned':
        meta.totalFilesPlanned = parseInt(value, 10) || 0;
        break;
      case 'filesInThisBatch':
        meta.filesInThisBatch = value.split(',').map((f) => f.trim()).filter(Boolean);
        break;
      case 'completedFiles':
        meta.completedFiles = value.split(',').map((f) => f.trim()).filter(Boolean);
        break;
      case 'remainingFiles':
        meta.remainingFiles = value.split(',').map((f) => f.trim()).filter(Boolean);
        break;
      case 'currentBatch':
        meta.currentBatch = parseInt(value, 10) || 1;
        break;
      case 'totalBatches':
        meta.totalBatches = parseInt(value, 10) || 1;
        break;
      case 'isComplete':
        meta.isComplete = value.toLowerCase() === 'true';
        break;
    }
  }

  return meta;
}

/**
 * File path pattern for marker format
 * Matches paths like: src/App.tsx, components/Header.tsx, utils/helpers.ts
 */
const FILE_PATH_PATTERN = /[\w./-]+\.[a-zA-Z]+/;

/**
 * Build regex for FILE markers dynamically
 */
function buildFilePattern(): RegExp {
  // Match: <!-- FILE:path --> content <!-- /FILE:path -->
  return new RegExp(
    '<!--\\s*FILE:(' + FILE_PATH_PATTERN.source + ')\\s*-->([\\s\\S]*?)<!--\\s*\\/FILE:\\1\\s*-->',
    'g'
  );
}

/**
 * Extract all FILE blocks from marker format
 *
 * <!-- FILE:src/App.tsx -->
 * content here
 * <!-- /FILE:src/App.tsx -->
 *
 * Also handles missing closing tags when AI opens a new file without closing the previous one:
 * <!-- FILE:src/App.tsx -->
 * content...
 * <!-- FILE:src/Other.tsx -->  <- Missing <!-- /FILE:src/App.tsx --> here
 * content...
 * <!-- /FILE:src/Other.tsx -->
 */
export function parseMarkerFiles(response: string): Record<string, string> {
  const files: Record<string, string> = {};

  // First, try to match properly closed FILE blocks
  const filePattern = buildFilePattern();

  let match;
  const processedPaths = new Set<string>();

  while ((match = filePattern.exec(response)) !== null) {
    const filePath = match[1].trim();
    let content = match[2];

    // Remove leading/trailing blank lines but preserve internal formatting
    content = content.replace(/^\n+/, '').replace(/\n+$/, '');

    // Clean generated code (fix imports, JSX issues, etc.)
    const cleaned = cleanGeneratedCode(content, filePath);

    if (cleaned && cleaned.length > 0) {
      files[filePath] = cleaned;
      processedPaths.add(filePath);
    }
  }

  // Now handle files that were opened but not properly closed
  // Find all FILE opening markers
  const openPattern = /<!--\s*FILE:([\w./-]+\.[a-zA-Z]+)\s*-->/g;
  const openings: { path: string; index: number; endIndex: number }[] = [];

  while ((match = openPattern.exec(response)) !== null) {
    const path = match[1].trim();
    // Skip if already processed with proper closing tag
    if (!processedPaths.has(path)) {
      openings.push({
        path,
        index: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }

  // For each unclosed file, extract content until the next FILE marker or end
  for (let i = 0; i < openings.length; i++) {
    const current = openings[i];
    const contentStart = current.endIndex;

    // Find the end: either the next FILE opening marker, or a matching close tag, or end of string
    let contentEnd = response.length;

    // Check for next FILE opening marker
    const nextOpening = openings[i + 1];
    if (nextOpening) {
      contentEnd = nextOpening.index;
    }

    // Also check if there's any <!-- FILE: or <!-- /FILE: marker before the next opening
    const remainingText = response.slice(contentStart, contentEnd);
    const nextMarkerMatch = remainingText.match(/<!--\s*(?:\/)?FILE:/);
    if (nextMarkerMatch && nextMarkerMatch.index !== undefined) {
      contentEnd = contentStart + nextMarkerMatch.index;
    }

    // Extract and clean content
    let content = response.slice(contentStart, contentEnd);
    content = content.replace(/^\n+/, '').replace(/\n+$/, '');

    // Clean generated code
    const cleaned = cleanGeneratedCode(content, current.path);

    if (cleaned && cleaned.length > 0) {
      files[current.path] = cleaned;
      console.warn(`[parseMarkerFiles] File "${current.path}" had missing closing tag - recovered content`);
    }
  }

  return files;
}

/**
 * Parse incomplete/streaming FILE blocks
 * Returns partial files that are still being streamed
 *
 * Also handles cases where AI opens a new file without closing the previous one:
 * - The "implicitly closed" file (content up to next FILE marker) goes to complete
 * - Only the truly incomplete last file goes to streaming
 */
export function parseStreamingMarkerFiles(response: string): {
  complete: Record<string, string>;
  streaming: Record<string, string>;
  currentFile: string | null;
} {
  const complete: Record<string, string> = {};
  const streaming: Record<string, string> = {};
  let currentFile: string | null = null;

  // First, extract all properly closed files
  const completePattern = buildFilePattern();
  const completedPaths = new Set<string>();

  let match;
  while ((match = completePattern.exec(response)) !== null) {
    const filePath = match[1].trim();
    let content = match[2];
    content = content.replace(/^\n+/, '').replace(/\n+$/, '');
    complete[filePath] = cleanGeneratedCode(content, filePath);
    completedPaths.add(filePath);
  }

  // Find all FILE opening markers
  const openPattern = /<!--\s*FILE:([\w./-]+\.[a-zA-Z]+)\s*-->/g;
  const openings: { path: string; index: number; endIndex: number }[] = [];

  while ((match = openPattern.exec(response)) !== null) {
    const path = match[1].trim();
    // Skip if already processed with proper closing tag
    if (!completedPaths.has(path)) {
      openings.push({
        path,
        index: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }

  // Process unclosed files
  for (let i = 0; i < openings.length; i++) {
    const current = openings[i];
    const contentStart = current.endIndex;
    const isLast = i === openings.length - 1;

    if (isLast) {
      // Last unclosed file - this is truly streaming/incomplete
      let content = response.slice(contentStart);
      content = content.replace(/^\n+/, '');

      // Check if there's any marker after this (like GENERATION_META)
      const nextMarkerMatch = content.match(/<!--\s*(?:\/FILE:|GENERATION_META|PLAN|EXPLANATION)/);
      if (nextMarkerMatch && nextMarkerMatch.index !== undefined) {
        content = content.slice(0, nextMarkerMatch.index).replace(/\n+$/, '');
      }

      streaming[current.path] = content;
      currentFile = current.path;
    } else {
      // Not the last file - it was implicitly closed when next file started
      // Treat this as complete (recovered from missing closing tag)
      const nextOpening = openings[i + 1];
      let content = response.slice(contentStart, nextOpening.index);
      content = content.replace(/^\n+/, '').replace(/\n+$/, '');

      const cleaned = cleanGeneratedCode(content, current.path);
      if (cleaned && cleaned.length > 0) {
        complete[current.path] = cleaned;
      }
    }
  }

  return { complete, streaming, currentFile };
}

/**
 * Main parser for marker format responses
 */
export function parseMarkerFormatResponse(response: string): MarkerFormatResponse | null {
  if (!response || !isMarkerFormat(response)) {
    return null;
  }

  try {
    // Parse all components
    const plan = parseMarkerPlan(response);
    const explanation = parseMarkerExplanation(response);
    const generationMeta = parseMarkerGenerationMeta(response);
    const files = parseMarkerFiles(response);

    // Check if we have any files
    if (Object.keys(files).length === 0) {
      // Check for streaming/incomplete files
      const { complete, streaming } = parseStreamingMarkerFiles(response);

      // Log incomplete files as warnings
      if (Object.keys(streaming).length > 0) {
        console.warn('[parseMarkerFormatResponse] INCOMPLETE FILES DETECTED (will be excluded):', Object.keys(streaming));
      }

      if (Object.keys(complete).length === 0) {
        console.warn('[parseMarkerFormatResponse] No complete files found in marker format response');
        // Only return null if no complete files AND no streaming files
        if (Object.keys(streaming).length === 0) {
          return null;
        }
        // If we have streaming files but no complete ones, return truncated result with ONLY complete files
        return {
          files: complete,
          explanation,
          plan: plan || undefined,
          generationMeta,
          truncated: true,
          incompleteFiles: Object.keys(streaming), // Track which files are incomplete
        };
      }

      // Return ONLY complete files - do NOT include streaming/incomplete files
      return {
        files: complete,
        explanation,
        plan: plan || undefined,
        generationMeta,
        truncated: Object.keys(streaming).length > 0,
        incompleteFiles: Object.keys(streaming).length > 0 ? Object.keys(streaming) : undefined,
      };
    }

    // Check for any incomplete files even when we have complete ones
    const { streaming } = parseStreamingMarkerFiles(response);
    const incompleteFiles = Object.keys(streaming).filter(f => !files[f]);

    if (incompleteFiles.length > 0) {
      console.warn('[parseMarkerFormatResponse] Some files are incomplete:', incompleteFiles);
    }

    return {
      files,
      explanation,
      plan: plan || undefined,
      generationMeta,
      truncated: incompleteFiles.length > 0,
      incompleteFiles: incompleteFiles.length > 0 ? incompleteFiles : undefined,
    };
  } catch (error) {
    console.error('[parseMarkerFormatResponse] Parse error:', error);
    return null;
  }
}

/**
 * Extract file list from marker format for streaming progress
 */
export function extractMarkerFileList(response: string): string[] {
  const files = new Set<string>();

  // From PLAN block
  const plan = parseMarkerPlan(response);
  if (plan) {
    plan.create.forEach((f) => files.add(f));
    plan.update.forEach((f) => files.add(f));
  }

  // From FILE blocks (both complete and streaming)
  const filePattern = /<!--\s*FILE:([\w./-]+\.[a-zA-Z]+)\s*-->/g;
  let match;
  while ((match = filePattern.exec(response)) !== null) {
    files.add(match[1].trim());
  }

  return Array.from(files).sort();
}

/**
 * Detect which files are currently being streamed vs complete
 */
export function getMarkerStreamingStatus(response: string): {
  pending: string[];
  streaming: string[];
  complete: string[];
} {
  const plan = parseMarkerPlan(response);
  const { complete, currentFile } = parseStreamingMarkerFiles(response);

  const allPlanned = plan ? [...plan.create, ...plan.update] : [];
  const completeSet = new Set(Object.keys(complete));

  // Pending = planned but not started
  const pending = allPlanned.filter((f) => !completeSet.has(f) && f !== currentFile);

  return {
    pending,
    streaming: currentFile ? [currentFile] : [],
    complete: Object.keys(complete),
  };
}

/**
 * Strip PLAN and EXPLANATION markers for display
 */
export function stripMarkerMetadata(response: string): string {
  return response
    .replace(/<!--\s*PLAN\s*-->[\s\S]*?<!--\s*\/PLAN\s*-->/g, '')
    .replace(/<!--\s*EXPLANATION\s*-->[\s\S]*?<!--\s*\/EXPLANATION\s*-->/g, '')
    .replace(/<!--\s*GENERATION_META\s*-->[\s\S]*?<!--\s*\/GENERATION_META\s*-->/g, '')
    .trim();
}
