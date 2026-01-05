/**
 * GitHub Issues Service
 *
 * Service for creating and managing GitHub issues.
 * Uses the GitHub REST API v3.
 */

import type {
  GitHubIssue,
  CreatedIssue,
  ExportTask,
  IssuePriority,
} from '@/types/github-issues';
import {
  parseGitHubUrl,
  formatIssueBody,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
} from '@/types/github-issues';

// ===========================================
// Types
// ===========================================

interface GitHubApiError {
  message: string;
  documentation_url?: string;
  errors?: Array<{ resource: string; code: string; message: string }>;
}

interface GitHubLabel {
  name: string;
  color?: string;
}

// ===========================================
// GitHub Issues Service
// ===========================================

export class GitHubIssuesService {
  private baseUrl: string = 'https://api.github.com';
  private owner: string;
  private repo: string;
  private token: string;

  constructor(repoUrl: string, accessToken: string) {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      throw new Error(`Invalid GitHub URL: ${repoUrl}`);
    }

    this.owner = parsed.owner;
    this.repo = parsed.repo;
    this.token = accessToken;
  }

  /**
   * Create authorization headers
   */
  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  /**
   * Make a request to GitHub API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as GitHubApiError;
      const message = error.message || `GitHub API error: ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }

  /**
   * Verify token has required permissions
   */
  async verifyAccess(): Promise<{ hasAccess: boolean; message: string }> {
    try {
      // Try to get repo info
      await this.request(`/repos/${this.owner}/${this.repo}`);
      return { hasAccess: true, message: 'Access verified' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message.includes('Not Found')) {
        return {
          hasAccess: false,
          message: `Repository ${this.owner}/${this.repo} not found or no access`,
        };
      }
      if (message.includes('Bad credentials')) {
        return { hasAccess: false, message: 'Invalid access token' };
      }

      return { hasAccess: false, message };
    }
  }

  /**
   * Ensure a label exists, create if not
   */
  async ensureLabel(
    name: string,
    color: string
  ): Promise<void> {
    try {
      await this.request(`/repos/${this.owner}/${this.repo}/labels/${encodeURIComponent(name)}`);
    } catch {
      // Label doesn't exist, create it
      try {
        await this.request(`/repos/${this.owner}/${this.repo}/labels`, {
          method: 'POST',
          body: JSON.stringify({ name, color }),
        });
      } catch (createError) {
        // Ignore label creation errors (might already exist or no permission)
        console.warn(`Could not create label "${name}":`, createError);
      }
    }
  }

  /**
   * Get labels for a task
   */
  private getLabelsForTask(
    task: ExportTask,
    options: { addPriorityLabels: boolean; addCategoryLabels: boolean }
  ): string[] {
    const labels: string[] = [];

    // Priority label
    if (options.addPriorityLabels && task.priority) {
      const priorityLabel = PRIORITY_LABELS[task.priority as IssuePriority];
      if (priorityLabel) {
        labels.push(priorityLabel.name);
      }
    }

    // Category label
    if (options.addCategoryLabels && task.category) {
      const categoryLabel = CATEGORY_LABELS[task.category.toLowerCase()];
      if (categoryLabel) {
        labels.push(categoryLabel.name);
      }
    }

    return labels;
  }

  /**
   * Ensure all required labels exist
   */
  async ensureLabels(
    tasks: ExportTask[],
    options: { addPriorityLabels: boolean; addCategoryLabels: boolean }
  ): Promise<void> {
    const labelsToCreate = new Set<{ name: string; color: string }>();

    for (const task of tasks) {
      if (options.addPriorityLabels && task.priority) {
        const priorityLabel = PRIORITY_LABELS[task.priority as IssuePriority];
        if (priorityLabel) {
          labelsToCreate.add(priorityLabel);
        }
      }

      if (options.addCategoryLabels && task.category) {
        const categoryLabel = CATEGORY_LABELS[task.category.toLowerCase()];
        if (categoryLabel) {
          labelsToCreate.add(categoryLabel);
        }
      }
    }

    // Create labels in parallel (with concurrency limit)
    const labelsArray = Array.from(labelsToCreate);
    for (const label of labelsArray) {
      await this.ensureLabel(label.name, label.color);
    }
  }

  /**
   * Create a single issue
   */
  async createIssue(issue: GitHubIssue): Promise<CreatedIssue> {
    const response = await this.request<{
      id: number;
      number: number;
      title: string;
      html_url: string;
      state: 'open' | 'closed';
      created_at: string;
    }>(`/repos/${this.owner}/${this.repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title: issue.title,
        body: issue.body,
        labels: issue.labels || [],
        assignees: issue.assignees || [],
      }),
    });

    return {
      id: response.id,
      number: response.number,
      title: response.title,
      html_url: response.html_url,
      state: response.state,
      created_at: response.created_at,
    };
  }

  /**
   * Create issue from task
   */
  async createIssueFromTask(
    task: ExportTask,
    options: {
      addPriorityLabels: boolean;
      addCategoryLabels: boolean;
      titlePrefix?: string;
    }
  ): Promise<CreatedIssue> {
    const title = options.titlePrefix
      ? `${options.titlePrefix} ${task.title}`
      : task.title;

    const body = formatIssueBody(task);
    const labels = this.getLabelsForTask(task, options);

    return this.createIssue({
      title,
      body,
      labels,
    });
  }

  /**
   * Create multiple issues from tasks
   */
  async createIssuesFromTasks(
    tasks: ExportTask[],
    options: {
      addPriorityLabels: boolean;
      addCategoryLabels: boolean;
      titlePrefix?: string;
    }
  ): Promise<{
    created: CreatedIssue[];
    failed: Array<{ task: string; error: string }>;
  }> {
    // First ensure labels exist
    await this.ensureLabels(tasks, options);

    const created: CreatedIssue[] = [];
    const failed: Array<{ task: string; error: string }> = [];

    // Create issues sequentially to avoid rate limiting
    for (const task of tasks) {
      try {
        const issue = await this.createIssueFromTask(task, options);
        created.push(issue);

        // Small delay between requests to be nice to GitHub
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        failed.push({
          task: task.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { created, failed };
  }

  /**
   * Get existing issues for this repo
   */
  async getIssues(
    state: 'open' | 'closed' | 'all' = 'open',
    perPage: number = 30
  ): Promise<CreatedIssue[]> {
    const response = await this.request<Array<{
      id: number;
      number: number;
      title: string;
      html_url: string;
      state: 'open' | 'closed';
      created_at: string;
    }>>(`/repos/${this.owner}/${this.repo}/issues?state=${state}&per_page=${perPage}`);

    return response.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      html_url: issue.html_url,
      state: issue.state,
      created_at: issue.created_at,
    }));
  }

  /**
   * Get labels for this repo
   */
  async getLabels(): Promise<GitHubLabel[]> {
    return this.request<GitHubLabel[]>(`/repos/${this.owner}/${this.repo}/labels`);
  }
}

// ===========================================
// Factory Function
// ===========================================

/**
 * Create a GitHub Issues service instance
 */
export function createGitHubIssuesService(
  repoUrl: string,
  accessToken: string
): GitHubIssuesService {
  return new GitHubIssuesService(repoUrl, accessToken);
}
