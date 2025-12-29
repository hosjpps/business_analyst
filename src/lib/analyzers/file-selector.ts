/**
 * Smart File Selector for Large Repositories
 *
 * Prioritizes files by importance and limits total context size.
 * Uses token estimation to fit within LLM context limits.
 */

import type { FileInput } from '@/types';

// Approximate tokens per character (conservative estimate)
const CHARS_PER_TOKEN = 4;

// Default max tokens for file context
// Reduced from 50K to 35K to leave more room for LLM response (~8K tokens)
// and prompt overhead (~5K tokens for instructions)
const DEFAULT_MAX_TOKENS = 35000;

// File priority tiers (lower number = higher priority)
const FILE_PRIORITY: Record<string, number> = {
  // Tier 1: Essential project files
  'README.md': 1,
  'readme.md': 1,
  'package.json': 1,
  'requirements.txt': 1,
  'pyproject.toml': 1,
  'go.mod': 1,
  'Cargo.toml': 1,

  // Tier 2: Documentation
  'PROJECT.md': 2,
  'ARCHITECTURE.md': 2,
  'CONTRIBUTING.md': 2,
  '.env.example': 2,

  // Tier 3: Config files
  'tsconfig.json': 3,
  'next.config.js': 3,
  'next.config.ts': 3,
  'vite.config.ts': 3,
  'tailwind.config.js': 3,
  'tailwind.config.ts': 3,
  '.gitignore': 3,
  'Dockerfile': 3,
  'docker-compose.yml': 3,
  'vercel.json': 3,

  // Tier 4: Entry points
  'src/index.ts': 4,
  'src/index.tsx': 4,
  'src/main.ts': 4,
  'src/main.tsx': 4,
  'src/app.ts': 4,
  'src/app.tsx': 4,
  'src/App.tsx': 4,
  'index.ts': 4,
  'index.tsx': 4,
  'main.ts': 4,
  'main.tsx': 4,
  'main.py': 4,
  'app.py': 4,
};

// Path patterns for priority assignment
const PATH_PATTERNS: Array<{ pattern: RegExp; priority: number }> = [
  // Documentation
  { pattern: /^docs\/.*\.md$/, priority: 3 },
  { pattern: /^documentation\/.*\.md$/, priority: 3 },

  // App Router pages (Next.js)
  { pattern: /^src\/app\/page\.tsx?$/, priority: 4 },
  { pattern: /^src\/app\/layout\.tsx?$/, priority: 4 },
  { pattern: /^app\/page\.tsx?$/, priority: 4 },
  { pattern: /^app\/layout\.tsx?$/, priority: 4 },

  // API routes
  { pattern: /^src\/app\/api\/.*\/route\.ts$/, priority: 5 },
  { pattern: /^app\/api\/.*\/route\.ts$/, priority: 5 },
  { pattern: /^src\/pages\/api\/.*\.ts$/, priority: 5 },
  { pattern: /^pages\/api\/.*\.ts$/, priority: 5 },

  // Components (limited)
  { pattern: /^src\/components\/.*\.(tsx?|jsx?)$/, priority: 6 },
  { pattern: /^components\/.*\.(tsx?|jsx?)$/, priority: 6 },

  // Lib/utils
  { pattern: /^src\/lib\/.*\.(ts|js)$/, priority: 6 },
  { pattern: /^lib\/.*\.(ts|js)$/, priority: 6 },

  // Types
  { pattern: /^src\/types\/.*\.ts$/, priority: 5 },
  { pattern: /types\/.*\.ts$/, priority: 5 },

  // Other source files
  { pattern: /^src\/.*\.(tsx?|jsx?)$/, priority: 7 },
  { pattern: /\.(tsx?|jsx?|py|go|rs)$/, priority: 8 },

  // Markdown files
  { pattern: /\.md$/, priority: 6 },
];

/**
 * Get priority for a file (lower = more important)
 */
function getFilePriority(path: string): number {
  // Check exact match first
  if (FILE_PRIORITY[path] !== undefined) {
    return FILE_PRIORITY[path];
  }

  // Check filename only (for files in subdirectories)
  const fileName = path.split('/').pop() || path;
  if (FILE_PRIORITY[fileName] !== undefined) {
    return FILE_PRIORITY[fileName] + 1; // Slightly lower priority than root
  }

  // Check patterns
  for (const { pattern, priority } of PATH_PATTERNS) {
    if (pattern.test(path)) {
      return priority;
    }
  }

  // Default: low priority
  return 10;
}

/**
 * Estimate tokens in a string
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Truncate file content to fit within token limit
 */
function truncateContent(content: string, maxTokens: number): string {
  const currentTokens = estimateTokens(content);

  if (currentTokens <= maxTokens) {
    return content;
  }

  const lines = content.split('\n');
  let result = '';
  let tokens = 0;
  const targetChars = maxTokens * CHARS_PER_TOKEN;

  for (const line of lines) {
    const lineChars = line.length + 1; // +1 for newline
    if (result.length + lineChars > targetChars) {
      break;
    }
    result += line + '\n';
    tokens = estimateTokens(result);
  }

  if (result.length < content.length) {
    result += '\n// ... (file truncated for context limit)\n';
  }

  return result;
}

export interface FileSelectionResult {
  files: FileInput[];
  totalTokens: number;
  truncatedFiles: string[];
  excludedFiles: string[];
  stats: {
    inputFiles: number;
    outputFiles: number;
    avgPriority: number;
  };
}

/**
 * Select and prioritize files for analysis within token limit
 */
export function selectFilesForAnalysis(
  files: FileInput[],
  maxTokens: number = DEFAULT_MAX_TOKENS
): FileSelectionResult {
  // Sort files by priority
  const sortedFiles = [...files].sort((a, b) => {
    const priorityA = getFilePriority(a.path);
    const priorityB = getFilePriority(b.path);
    return priorityA - priorityB;
  });

  const selectedFiles: FileInput[] = [];
  const truncatedFiles: string[] = [];
  const excludedFiles: string[] = [];
  let totalTokens = 0;

  // Reserve some tokens for file path overhead (~10 tokens per file)
  const tokenOverheadPerFile = 10;

  for (const file of sortedFiles) {
    const fileTokens = estimateTokens(file.content);
    const overhead = tokenOverheadPerFile;

    // Check if we can fit the whole file
    if (totalTokens + fileTokens + overhead <= maxTokens) {
      selectedFiles.push(file);
      totalTokens += fileTokens + overhead;
    }
    // Try to fit a truncated version for important files
    else if (getFilePriority(file.path) <= 5) {
      const remainingTokens = maxTokens - totalTokens - overhead;

      if (remainingTokens > 500) {
        // At least 500 tokens to be useful
        const truncatedContent = truncateContent(file.content, remainingTokens);
        selectedFiles.push({
          path: file.path,
          content: truncatedContent
        });
        truncatedFiles.push(file.path);
        totalTokens += estimateTokens(truncatedContent) + overhead;
      } else {
        excludedFiles.push(file.path);
      }
    } else {
      excludedFiles.push(file.path);
    }

    // Stop if we're close to the limit
    if (totalTokens >= maxTokens * 0.95) {
      break;
    }
  }

  // Calculate average priority of selected files
  const avgPriority = selectedFiles.length > 0
    ? selectedFiles.reduce((sum, f) => sum + getFilePriority(f.path), 0) / selectedFiles.length
    : 0;

  return {
    files: selectedFiles,
    totalTokens,
    truncatedFiles,
    excludedFiles,
    stats: {
      inputFiles: files.length,
      outputFiles: selectedFiles.length,
      avgPriority: Math.round(avgPriority * 10) / 10
    }
  };
}

/**
 * Get a summary of excluded files for context
 */
export function getExcludedFilesSummary(excludedFiles: string[]): string {
  if (excludedFiles.length === 0) return '';

  const byFolder: Record<string, number> = {};

  for (const file of excludedFiles) {
    const folder = file.includes('/') ? file.split('/')[0] : '(root)';
    byFolder[folder] = (byFolder[folder] || 0) + 1;
  }

  const summary = Object.entries(byFolder)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([folder, count]) => `${folder}/ (${count} files)`)
    .join(', ');

  return `Excluded ${excludedFiles.length} files: ${summary}`;
}

export { estimateTokens, getFilePriority };
