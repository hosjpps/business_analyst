import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GitHubIssuesService,
  createGitHubIssuesService,
} from '@/lib/github/issues-service';
import type { ExportTask } from '@/types/github-issues';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GitHubIssuesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should parse GitHub URL correctly', () => {
      const service = new GitHubIssuesService(
        'https://github.com/owner/repo',
        'token123'
      );
      expect(service).toBeDefined();
    });

    it('should throw on invalid URL', () => {
      expect(() => {
        new GitHubIssuesService('https://gitlab.com/owner/repo', 'token');
      }).toThrow('Invalid GitHub URL');
    });
  });

  describe('verifyAccess', () => {
    it('should return true for valid access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, full_name: 'owner/repo' }),
      });

      const service = createGitHubIssuesService(
        'https://github.com/owner/repo',
        'valid-token'
      );

      const result = await service.verifyAccess();

      expect(result.hasAccess).toBe(true);
      expect(result.message).toBe('Access verified');
    });

    it('should return false for 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Not Found' }),
      });

      const service = createGitHubIssuesService(
        'https://github.com/owner/repo',
        'token'
      );

      const result = await service.verifyAccess();

      expect(result.hasAccess).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should return false for bad credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Bad credentials' }),
      });

      const service = createGitHubIssuesService(
        'https://github.com/owner/repo',
        'invalid-token'
      );

      const result = await service.verifyAccess();

      expect(result.hasAccess).toBe(false);
      expect(result.message).toContain('Invalid access token');
    });
  });

  describe('createIssue', () => {
    it('should create issue successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 123,
            number: 1,
            title: 'Test Issue',
            html_url: 'https://github.com/owner/repo/issues/1',
            state: 'open',
            created_at: '2024-01-01T00:00:00Z',
          }),
      });

      const service = createGitHubIssuesService(
        'https://github.com/owner/repo',
        'token'
      );

      const result = await service.createIssue({
        title: 'Test Issue',
        body: 'Test body',
        labels: ['bug'],
      });

      expect(result.number).toBe(1);
      expect(result.title).toBe('Test Issue');
      expect(result.html_url).toContain('/issues/1');
    });

    it('should include correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 1,
            number: 1,
            title: 'Test',
            html_url: 'url',
            state: 'open',
            created_at: 'date',
          }),
      });

      const service = createGitHubIssuesService(
        'https://github.com/owner/repo',
        'my-token'
      );

      await service.createIssue({ title: 'Test', body: 'Body' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
            Accept: 'application/vnd.github.v3+json',
          }),
        })
      );
    });
  });

  describe('createIssueFromTask', () => {
    it('should format task as issue', async () => {
      // Mock issue creation only (createIssueFromTask calls createIssue directly)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 1,
            number: 1,
            title: 'Test Task',
            html_url: 'https://github.com/owner/repo/issues/1',
            state: 'open',
            created_at: 'date',
          }),
      });

      const service = createGitHubIssuesService(
        'https://github.com/owner/repo',
        'token'
      );

      const task: ExportTask = {
        title: 'Test Task',
        description: 'Test description',
        priority: 'high',
      };

      const result = await service.createIssueFromTask(task, {
        addPriorityLabels: true,
        addCategoryLabels: false,
      });

      expect(result.title).toBe('Test Task');
    });

    it('should add title prefix when specified', async () => {
      // Reset mocks for this test
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 1,
            number: 1,
            title: '[Task] My Task',
            html_url: 'url',
            state: 'open',
            created_at: 'date',
          }),
      });

      const service = createGitHubIssuesService(
        'https://github.com/owner/repo',
        'token'
      );

      await service.createIssueFromTask(
        { title: 'My Task' },
        {
          addPriorityLabels: false,
          addCategoryLabels: false,
          titlePrefix: '[Task]',
        }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('[Task] My Task'),
        })
      );
    });
  });

  describe('createIssuesFromTasks', () => {
    it('should create multiple issues', async () => {
      // Mock successful issue creations
      for (let i = 0; i < 2; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: i + 1,
              number: i + 1,
              title: `Task ${i + 1}`,
              html_url: `https://github.com/owner/repo/issues/${i + 1}`,
              state: 'open',
              created_at: 'date',
            }),
        });
      }

      const service = createGitHubIssuesService(
        'https://github.com/owner/repo',
        'token'
      );

      const tasks: ExportTask[] = [
        { title: 'Task 1' },
        { title: 'Task 2' },
      ];

      const result = await service.createIssuesFromTasks(tasks, {
        addPriorityLabels: false,
        addCategoryLabels: false,
      });

      expect(result.created.length).toBe(2);
      expect(result.failed.length).toBe(0);
    });

    it('should handle partial failures', async () => {
      // First succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 1,
            number: 1,
            title: 'Task 1',
            html_url: 'url1',
            state: 'open',
            created_at: 'date',
          }),
      });
      // Second fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Validation Failed' }),
      });
      // Third succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 3,
            number: 3,
            title: 'Task 3',
            html_url: 'url3',
            state: 'open',
            created_at: 'date',
          }),
      });

      const service = createGitHubIssuesService(
        'https://github.com/owner/repo',
        'token'
      );

      const result = await service.createIssuesFromTasks(
        [{ title: 'Task 1' }, { title: 'Task 2' }, { title: 'Task 3' }],
        { addPriorityLabels: false, addCategoryLabels: false }
      );

      expect(result.created.length).toBe(2);
      expect(result.failed.length).toBe(1);
      expect(result.failed[0].task).toBe('Task 2');
    });
  });

  describe('getIssues', () => {
    it('should fetch open issues', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 1, number: 1, title: 'Issue 1', html_url: 'url1', state: 'open', created_at: 'date' },
            { id: 2, number: 2, title: 'Issue 2', html_url: 'url2', state: 'open', created_at: 'date' },
          ]),
      });

      const service = createGitHubIssuesService(
        'https://github.com/owner/repo',
        'token'
      );

      const issues = await service.getIssues('open');

      expect(issues.length).toBe(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('state=open'),
        expect.any(Object)
      );
    });
  });

  describe('getLabels', () => {
    it('should fetch repository labels', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { name: 'bug', color: 'd73a4a' },
            { name: 'enhancement', color: 'a2eeef' },
          ]),
      });

      const service = createGitHubIssuesService(
        'https://github.com/owner/repo',
        'token'
      );

      const labels = await service.getLabels();

      expect(labels.length).toBe(2);
      expect(labels[0].name).toBe('bug');
    });
  });

  describe('createGitHubIssuesService', () => {
    it('should create service instance', () => {
      const service = createGitHubIssuesService(
        'https://github.com/owner/repo',
        'token'
      );

      expect(service).toBeInstanceOf(GitHubIssuesService);
    });
  });
});
