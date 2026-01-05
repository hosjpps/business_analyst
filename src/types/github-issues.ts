/**
 * GitHub Issues Export Types
 *
 * Types for exporting tasks to GitHub Issues.
 */

import { z } from 'zod';

// ===========================================
// GitHub Issue Types
// ===========================================

/**
 * Issue priority labels
 */
export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Issue category labels
 */
export type IssueCategory =
  | 'monetization'
  | 'growth'
  | 'security'
  | 'ux'
  | 'infrastructure'
  | 'marketing'
  | 'technical'
  | 'business';

/**
 * Single issue to create
 */
export interface GitHubIssue {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
}

/**
 * Created issue response from GitHub
 */
export interface CreatedIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  created_at: string;
}

// ===========================================
// Export Request/Response
// ===========================================

/**
 * Request to export issues
 */
export const ExportIssuesRequestSchema = z.object({
  /** GitHub repository URL */
  repoUrl: z.string().url().refine(
    (url) => url.includes('github.com'),
    { message: 'Must be a GitHub repository URL' }
  ),
  /** Personal access token with repo scope */
  accessToken: z.string().min(1, 'Access token is required'),
  /** Tasks to export as issues */
  tasks: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    category: z.string().optional(),
    actionSteps: z.array(z.string()).optional(),
    effort: z.string().optional(),
  })),
  /** Optional: add priority labels */
  addPriorityLabels: z.boolean().default(true),
  /** Optional: add category labels */
  addCategoryLabels: z.boolean().default(true),
  /** Optional: prefix for issue titles */
  titlePrefix: z.string().optional(),
});

export type ExportIssuesRequest = z.infer<typeof ExportIssuesRequestSchema>;

/**
 * Single task for export
 */
export interface ExportTask {
  title: string;
  description?: string;
  priority?: IssuePriority;
  category?: string;
  actionSteps?: string[];
  effort?: string;
}

/**
 * Response from export API
 */
export interface ExportIssuesResponse {
  success: boolean;
  created: CreatedIssue[];
  failed: Array<{
    task: string;
    error: string;
  }>;
  summary: {
    total: number;
    created: number;
    failed: number;
  };
}

// ===========================================
// Label Mapping
// ===========================================

/**
 * Priority to label color mapping
 */
export const PRIORITY_LABELS: Record<IssuePriority, { name: string; color: string }> = {
  critical: { name: 'priority: critical', color: 'B60205' }, // red
  high: { name: 'priority: high', color: 'D93F0B' }, // orange
  medium: { name: 'priority: medium', color: 'FBCA04' }, // yellow
  low: { name: 'priority: low', color: '0E8A16' }, // green
};

/**
 * Category to label color mapping
 */
export const CATEGORY_LABELS: Record<string, { name: string; color: string }> = {
  monetization: { name: 'area: monetization', color: '5319E7' }, // purple
  growth: { name: 'area: growth', color: '1D76DB' }, // blue
  security: { name: 'area: security', color: 'B60205' }, // red
  ux: { name: 'area: ux', color: 'C2E0C6' }, // light green
  infrastructure: { name: 'area: infrastructure', color: 'BFD4F2' }, // light blue
  marketing: { name: 'area: marketing', color: 'D4C5F9' }, // light purple
  technical: { name: 'area: technical', color: 'E4E669' }, // yellow
  business: { name: 'area: business', color: 'F9D0C4' }, // pink
};

// ===========================================
// Helpers
// ===========================================

/**
 * Parse owner and repo from GitHub URL
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * Format task as GitHub issue body (Markdown)
 */
export function formatIssueBody(task: ExportTask): string {
  const sections: string[] = [];

  // Description
  if (task.description) {
    sections.push(`## Description\n\n${task.description}`);
  }

  // Action steps as checklist
  if (task.actionSteps && task.actionSteps.length > 0) {
    const checklist = task.actionSteps
      .map((step) => `- [ ] ${step}`)
      .join('\n');
    sections.push(`## Action Steps\n\n${checklist}`);
  }

  // Metadata
  const metadata: string[] = [];
  if (task.priority) {
    const emoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    }[task.priority];
    metadata.push(`**Priority:** ${emoji} ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`);
  }
  if (task.category) {
    metadata.push(`**Category:** ${task.category}`);
  }
  if (task.effort) {
    metadata.push(`**Effort:** ${task.effort}`);
  }

  if (metadata.length > 0) {
    sections.push(`## Details\n\n${metadata.join('\n')}`);
  }

  // Footer
  sections.push('---\n*Created by Business & Code Analyzer*');

  return sections.join('\n\n');
}
