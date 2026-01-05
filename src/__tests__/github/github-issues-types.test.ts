import { describe, it, expect } from 'vitest';
import {
  parseGitHubUrl,
  formatIssueBody,
  ExportIssuesRequestSchema,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
} from '@/types/github-issues';
import type { ExportTask } from '@/types/github-issues';

describe('GitHub Issues Types', () => {
  describe('parseGitHubUrl', () => {
    it('should parse standard GitHub URLs', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse GitHub URLs with .git suffix', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse GitHub URLs with path', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo/tree/main');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse SSH-style URLs', () => {
      const result = parseGitHubUrl('git@github.com:owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should return null for non-GitHub URLs', () => {
      const result = parseGitHubUrl('https://gitlab.com/owner/repo');
      expect(result).toBeNull();
    });

    it('should return null for invalid URLs', () => {
      const result = parseGitHubUrl('not-a-url');
      expect(result).toBeNull();
    });
  });

  describe('formatIssueBody', () => {
    it('should format basic task', () => {
      const task: ExportTask = {
        title: 'Test Task',
        description: 'Test description',
      };

      const body = formatIssueBody(task);

      expect(body).toContain('## Description');
      expect(body).toContain('Test description');
      expect(body).toContain('Created by Business & Code Analyzer');
    });

    it('should include action steps as checklist', () => {
      const task: ExportTask = {
        title: 'Test Task',
        actionSteps: ['Step 1', 'Step 2', 'Step 3'],
      };

      const body = formatIssueBody(task);

      expect(body).toContain('## Action Steps');
      expect(body).toContain('- [ ] Step 1');
      expect(body).toContain('- [ ] Step 2');
      expect(body).toContain('- [ ] Step 3');
    });

    it('should include priority with emoji', () => {
      const task: ExportTask = {
        title: 'Test Task',
        priority: 'critical',
      };

      const body = formatIssueBody(task);

      expect(body).toContain('**Priority:**');
      expect(body).toContain('🔴');
      expect(body).toContain('Critical');
    });

    it('should include category', () => {
      const task: ExportTask = {
        title: 'Test Task',
        category: 'security',
      };

      const body = formatIssueBody(task);

      expect(body).toContain('**Category:**');
      expect(body).toContain('security');
    });

    it('should include effort', () => {
      const task: ExportTask = {
        title: 'Test Task',
        effort: '2-3 hours',
      };

      const body = formatIssueBody(task);

      expect(body).toContain('**Effort:**');
      expect(body).toContain('2-3 hours');
    });

    it('should handle task with all fields', () => {
      const task: ExportTask = {
        title: 'Full Task',
        description: 'Full description',
        priority: 'high',
        category: 'monetization',
        actionSteps: ['Do this', 'Then that'],
        effort: '1 day',
      };

      const body = formatIssueBody(task);

      expect(body).toContain('## Description');
      expect(body).toContain('## Action Steps');
      expect(body).toContain('## Details');
      expect(body).toContain('🟠'); // high priority emoji
    });

    it('should handle task with empty description', () => {
      const task: ExportTask = {
        title: 'Minimal Task',
      };

      const body = formatIssueBody(task);

      expect(body).not.toContain('## Description');
      expect(body).toContain('Created by Business & Code Analyzer');
    });
  });

  describe('ExportIssuesRequestSchema', () => {
    it('should validate valid request', () => {
      const request = {
        repoUrl: 'https://github.com/owner/repo',
        accessToken: 'ghp_test123',
        tasks: [
          { title: 'Task 1' },
          { title: 'Task 2', priority: 'high' },
        ],
      };

      const result = ExportIssuesRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject non-GitHub URLs', () => {
      const request = {
        repoUrl: 'https://gitlab.com/owner/repo',
        accessToken: 'token',
        tasks: [{ title: 'Task' }],
      };

      const result = ExportIssuesRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject empty access token', () => {
      const request = {
        repoUrl: 'https://github.com/owner/repo',
        accessToken: '',
        tasks: [{ title: 'Task' }],
      };

      const result = ExportIssuesRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should require at least one task with title', () => {
      const request = {
        repoUrl: 'https://github.com/owner/repo',
        accessToken: 'token',
        tasks: [{ title: '' }],
      };

      const result = ExportIssuesRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should validate priority enum', () => {
      const request = {
        repoUrl: 'https://github.com/owner/repo',
        accessToken: 'token',
        tasks: [{ title: 'Task', priority: 'invalid' }],
      };

      const result = ExportIssuesRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should accept all valid priorities', () => {
      const priorities = ['critical', 'high', 'medium', 'low'];

      for (const priority of priorities) {
        const request = {
          repoUrl: 'https://github.com/owner/repo',
          accessToken: 'token',
          tasks: [{ title: 'Task', priority }],
        };

        const result = ExportIssuesRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      }
    });

    it('should set default values', () => {
      const request = {
        repoUrl: 'https://github.com/owner/repo',
        accessToken: 'token',
        tasks: [{ title: 'Task' }],
      };

      const result = ExportIssuesRequestSchema.safeParse(request);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.addPriorityLabels).toBe(true);
        expect(result.data.addCategoryLabels).toBe(true);
      }
    });
  });

  describe('PRIORITY_LABELS', () => {
    it('should have all priority levels', () => {
      expect(PRIORITY_LABELS.critical).toBeDefined();
      expect(PRIORITY_LABELS.high).toBeDefined();
      expect(PRIORITY_LABELS.medium).toBeDefined();
      expect(PRIORITY_LABELS.low).toBeDefined();
    });

    it('should have name and color for each', () => {
      for (const key of ['critical', 'high', 'medium', 'low'] as const) {
        expect(PRIORITY_LABELS[key].name).toBeTruthy();
        expect(PRIORITY_LABELS[key].color).toMatch(/^[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('should have common categories', () => {
      expect(CATEGORY_LABELS.monetization).toBeDefined();
      expect(CATEGORY_LABELS.growth).toBeDefined();
      expect(CATEGORY_LABELS.security).toBeDefined();
      expect(CATEGORY_LABELS.ux).toBeDefined();
      expect(CATEGORY_LABELS.infrastructure).toBeDefined();
      expect(CATEGORY_LABELS.marketing).toBeDefined();
    });

    it('should have name and color for each', () => {
      for (const key of Object.keys(CATEGORY_LABELS)) {
        expect(CATEGORY_LABELS[key].name).toBeTruthy();
        expect(CATEGORY_LABELS[key].color).toMatch(/^[0-9A-Fa-f]{6}$/);
      }
    });
  });
});
