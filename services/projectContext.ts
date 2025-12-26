/**
 * Project Context Service
 *
 * Generates and stores project context summaries for consistent AI responses.
 * Instead of sending all files to AI (which doesn't persist), we generate
 * condensed summaries that are included in every prompt's system instruction.
 *
 * Two types of summaries:
 * 1. Style Guide - Design patterns, colors, typography, conventions
 * 2. Project Summary - What the project does, architecture, key files
 */

import { getProviderManager } from './ai';
import { FileSystem } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface StyleGuide {
  colors: Record<string, string>;
  typography: string;
  patterns: string[];
  conventions: string[];
  components: string[];
  summary: string;
}

export interface ProjectSummary {
  name: string;
  purpose: string;
  architecture: string;
  keyFiles: Record<string, string>; // path -> description
  features: string[];
  techStack: string[];
  summary: string;
}

export interface ProjectContext {
  projectId: string;
  generatedAt: number;
  styleGuide: StyleGuide;
  projectSummary: ProjectSummary;
  // Combined summary for system instruction (~1000 tokens)
  combinedPrompt: string;
}

// ============================================================================
// Storage
// ============================================================================

const STORAGE_KEY = 'fluidflow_project_contexts';

export function getProjectContexts(): Record<string, ProjectContext> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getProjectContext(projectId: string): ProjectContext | null {
  const contexts = getProjectContexts();
  return contexts[projectId] || null;
}

export function saveProjectContext(context: ProjectContext): void {
  const contexts = getProjectContexts();
  contexts[context.projectId] = context;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contexts));
  console.log(`[ProjectContext] Saved context for project: ${context.projectId}`);
}

export function deleteProjectContext(projectId: string): void {
  const contexts = getProjectContexts();
  delete contexts[projectId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contexts));
}

// ============================================================================
// System Instructions for Generation
// ============================================================================

const STYLE_GUIDE_SYSTEM = `You are analyzing a React/TypeScript codebase to extract design patterns.

Respond with ONLY a valid JSON object:
{
  "colors": {
    "primary": "#hex or tailwind class",
    "secondary": "#hex or tailwind class",
    "background": "#hex or tailwind class",
    "text": "#hex or tailwind class"
  },
  "typography": "Font family and text sizing approach",
  "patterns": ["3-5 key visual patterns, e.g., 'Glass morphism', 'Rounded corners'"],
  "conventions": ["3-5 code patterns, e.g., 'React.FC with interfaces'"],
  "components": ["List of reusable components found"],
  "summary": "2-3 sentence design summary"
}

RULES:
- Extract ACTUAL values from code, don't invent
- Focus on Tailwind classes and hex colors actually used
- Keep arrays to 3-5 items max
- JSON only, no markdown`;

const PROJECT_SUMMARY_SYSTEM = `You are analyzing a React/TypeScript codebase to understand its purpose and architecture.

Respond with ONLY a valid JSON object:
{
  "name": "Project name (infer from package.json or main component)",
  "purpose": "1-2 sentences: What does this app do? Who is it for?",
  "architecture": "1-2 sentences: How is it structured? (e.g., 'SPA with context-based state')",
  "keyFiles": {
    "src/App.tsx": "Brief role description",
    "src/components/Main.tsx": "Brief role description"
  },
  "features": ["List of 3-5 main features"],
  "techStack": ["React", "TypeScript", "Tailwind", etc.],
  "summary": "2-3 sentence overall project summary"
}

RULES:
- Infer from actual code, don't guess
- keyFiles: only include 3-5 most important files
- Keep arrays to 3-5 items max
- JSON only, no markdown`;

// ============================================================================
// Code Sampling
// ============================================================================

function buildCodeSample(files: FileSystem, maxTokens: number = 25000): string {
  const relevantExtensions = ['.tsx', '.jsx', '.css', '.scss', '.ts', '.js', '.json'];

  // Categorize and prioritize files
  const prioritized: string[] = [];
  const regular: string[] = [];

  for (const path of Object.keys(files)) {
    const ext = '.' + path.split('.').pop()?.toLowerCase();
    if (!relevantExtensions.includes(ext)) continue;

    // Priority files
    const isPriority =
      path.includes('App.') ||
      path.includes('index.') ||
      path.includes('style') ||
      path.includes('theme') ||
      path.includes('context') ||
      path.includes('hook') ||
      path === 'package.json' ||
      path.endsWith('.css');

    if (isPriority) {
      prioritized.push(path);
    } else {
      regular.push(path);
    }
  }

  // Build sample
  let sample = '';
  let tokenCount = 0;
  const allFiles = [...prioritized, ...regular];

  for (const path of allFiles) {
    const content = files[path];
    if (!content) continue;

    const fileTokens = Math.ceil(content.length / 4);

    if (tokenCount + fileTokens > maxTokens) {
      // Add truncated version if there's room
      const remaining = maxTokens - tokenCount;
      if (remaining > 500) {
        const chars = remaining * 4;
        sample += `\n### ${path} (truncated)\n\`\`\`\n${content.substring(0, chars)}\n...\n\`\`\`\n`;
      }
      break;
    }

    sample += `\n### ${path}\n\`\`\`\n${content}\n\`\`\`\n`;
    tokenCount += fileTokens;
  }

  return sample;
}

// ============================================================================
// Generation Functions
// ============================================================================

export async function generateStyleGuide(
  files: FileSystem,
  onProgress?: (status: string) => void
): Promise<StyleGuide> {
  const manager = getProviderManager();
  onProgress?.('Analyzing design patterns...');

  const sample = buildCodeSample(files, 25000);
  const prompt = `Analyze this codebase and extract the style guide:\n${sample}`;

  const response = await manager.generate({
    prompt,
    systemInstruction: STYLE_GUIDE_SYSTEM,
    responseFormat: 'text'
  });

  // Parse JSON
  const jsonMatch = response.text?.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in style guide response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  onProgress?.('Style guide complete!');

  return {
    colors: parsed.colors || {},
    typography: parsed.typography || '',
    patterns: parsed.patterns || [],
    conventions: parsed.conventions || [],
    components: parsed.components || [],
    summary: parsed.summary || ''
  };
}

export async function generateProjectSummary(
  files: FileSystem,
  onProgress?: (status: string) => void
): Promise<ProjectSummary> {
  const manager = getProviderManager();
  onProgress?.('Analyzing project structure...');

  const sample = buildCodeSample(files, 25000);
  const prompt = `Analyze this codebase and summarize the project:\n${sample}`;

  const response = await manager.generate({
    prompt,
    systemInstruction: PROJECT_SUMMARY_SYSTEM,
    responseFormat: 'text'
  });

  // Parse JSON
  const jsonMatch = response.text?.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in project summary response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  onProgress?.('Project summary complete!');

  return {
    name: parsed.name || 'Unknown Project',
    purpose: parsed.purpose || '',
    architecture: parsed.architecture || '',
    keyFiles: parsed.keyFiles || {},
    features: parsed.features || [],
    techStack: parsed.techStack || [],
    summary: parsed.summary || ''
  };
}

/**
 * Generate complete project context (both summaries)
 */
export async function generateProjectContext(
  projectId: string,
  files: FileSystem,
  onProgress?: (status: string) => void
): Promise<ProjectContext> {
  onProgress?.('Step 1/2: Analyzing design...');

  // Generate both in parallel? No, sequential is safer for rate limits
  const styleGuide = await generateStyleGuide(files, onProgress);

  onProgress?.('Step 2/2: Analyzing project...');
  const projectSummary = await generateProjectSummary(files, onProgress);

  // Build combined prompt for system instruction
  const combinedPrompt = formatContextForPrompt(styleGuide, projectSummary);

  const context: ProjectContext = {
    projectId,
    generatedAt: Date.now(),
    styleGuide,
    projectSummary,
    combinedPrompt
  };

  // Save to storage
  saveProjectContext(context);
  onProgress?.('Context generation complete!');

  return context;
}

// ============================================================================
// Formatting for System Instruction
// ============================================================================

function formatContextForPrompt(style: StyleGuide, project: ProjectSummary): string {
  const colorsList = Object.entries(style.colors)
    .filter(([_, v]) => v)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');

  const keyFilesList = Object.entries(project.keyFiles)
    .map(([path, desc]) => `  ${path}: ${desc}`)
    .join('\n');

  return `
## PROJECT CONTEXT

### About This Project
${project.summary}

**Purpose:** ${project.purpose}
**Architecture:** ${project.architecture}
**Tech Stack:** ${project.techStack.join(', ')}

### Key Files
${keyFilesList}

### Design System
${style.summary}

**Colors:**
${colorsList}

**Visual Patterns:**
${style.patterns.map(p => `- ${p}`).join('\n')}

**Code Conventions:**
${style.conventions.map(c => `- ${c}`).join('\n')}

**Key Components:** ${style.components.join(', ')}

---
**IMPORTANT:** Follow this project's existing patterns, colors, and conventions exactly. Maintain visual and code consistency.
`.trim();
}

/**
 * Get formatted context for system instruction
 */
export function getContextForPrompt(projectId: string): string | null {
  const context = getProjectContext(projectId);
  if (!context) return null;
  return context.combinedPrompt;
}

// ============================================================================
// Legacy compatibility - re-export for existing code
// ============================================================================

export function getStyleGuide(projectId: string): StyleGuide | null {
  const context = getProjectContext(projectId);
  return context?.styleGuide || null;
}

export function formatStyleGuideForPrompt(style: StyleGuide): string {
  // Minimal format for backward compatibility
  return `
## STYLE GUIDE
${style.summary}

Colors: ${Object.entries(style.colors).map(([k, v]) => `${k}=${v}`).join(', ')}
Patterns: ${style.patterns.join(', ')}
Conventions: ${style.conventions.join(', ')}
Components: ${style.components.join(', ')}
`.trim();
}
