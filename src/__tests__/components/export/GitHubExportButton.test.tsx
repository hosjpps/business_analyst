import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GitHubExportButton } from '@/components/export/GitHubExportButton';
import type { ExportTask } from '@/types/github-issues';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GitHubExportButton', () => {
  const mockTasks: ExportTask[] = [
    { title: 'Task 1', priority: 'high', category: 'security' },
    { title: 'Task 2', priority: 'medium', category: 'ux' },
    { title: 'Task 3', priority: 'low' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render export button', () => {
      render(<GitHubExportButton tasks={mockTasks} />);

      expect(screen.getByText('Export to GitHub Issues')).toBeInTheDocument();
    });

    it('should not render when no tasks', () => {
      const { container } = render(<GitHubExportButton tasks={[]} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should apply custom className', () => {
      render(<GitHubExportButton tasks={mockTasks} className="custom-class" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('modal', () => {
    it('should open modal on button click', () => {
      render(<GitHubExportButton tasks={mockTasks} />);

      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      expect(screen.getByText('Repository URL *')).toBeInTheDocument();
      expect(screen.getByText('Personal Access Token *')).toBeInTheDocument();
    });

    it('should close modal on close button click', () => {
      render(<GitHubExportButton tasks={mockTasks} />);

      fireEvent.click(screen.getByText('Export to GitHub Issues'));
      expect(screen.getByText('Repository URL *')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Close'));
      expect(screen.queryByText('Repository URL *')).not.toBeInTheDocument();
    });

    it('should close modal on Cancel click', () => {
      render(<GitHubExportButton tasks={mockTasks} />);

      fireEvent.click(screen.getByText('Export to GitHub Issues'));
      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Repository URL *')).not.toBeInTheDocument();
    });

    it('should show default repo URL if provided', () => {
      render(
        <GitHubExportButton
          tasks={mockTasks}
          defaultRepoUrl="https://github.com/test/repo"
        />
      );

      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      const input = screen.getByLabelText('Repository URL *');
      expect(input).toHaveValue('https://github.com/test/repo');
    });
  });

  describe('task selection', () => {
    it('should show all tasks selected by default', () => {
      render(<GitHubExportButton tasks={mockTasks} />);
      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      expect(screen.getByText('Select tasks to export (3/3)')).toBeInTheDocument();
    });

    it('should toggle task selection', () => {
      render(<GitHubExportButton tasks={mockTasks} />);
      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      // Find and click first task checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      const taskCheckbox = checkboxes.find((cb) =>
        cb.closest('label')?.textContent?.includes('Task 1')
      );

      if (taskCheckbox) {
        fireEvent.click(taskCheckbox);
        expect(screen.getByText('Select tasks to export (2/3)')).toBeInTheDocument();
      }
    });

    it('should toggle all tasks', () => {
      render(<GitHubExportButton tasks={mockTasks} />);
      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      // Deselect all
      fireEvent.click(screen.getByText('Deselect all'));
      expect(screen.getByText('Select tasks to export (0/3)')).toBeInTheDocument();

      // Select all
      fireEvent.click(screen.getByText('Select all'));
      expect(screen.getByText('Select tasks to export (3/3)')).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should show error when repo URL is empty', () => {
      render(<GitHubExportButton tasks={mockTasks} />);
      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      // Fill token but leave URL empty
      const tokenInput = screen.getByLabelText(/Personal Access Token/);
      fireEvent.change(tokenInput, { target: { value: 'ghp_test' } });

      fireEvent.click(screen.getByText(/Export 3 Tasks/));

      expect(
        screen.getByText('Repository URL and access token are required')
      ).toBeInTheDocument();
    });

    it('should disable export button when no tasks selected', () => {
      render(<GitHubExportButton tasks={mockTasks} />);
      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      // Deselect all tasks
      fireEvent.click(screen.getByText('Deselect all'));

      // Fill form
      const urlInput = screen.getByLabelText('Repository URL *');
      const tokenInput = screen.getByLabelText(/Personal Access Token/);
      fireEvent.change(urlInput, { target: { value: 'https://github.com/test/repo' } });
      fireEvent.change(tokenInput, { target: { value: 'ghp_test' } });

      // Export button should be disabled when 0 tasks selected
      const exportButton = screen.getByText(/Export 0 Tasks/);
      expect(exportButton).toBeDisabled();
    });
  });

  describe('export functionality', () => {
    it('should call API and show results on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            created: [
              { number: 1, title: 'Task 1', html_url: 'https://github.com/test/repo/issues/1' },
            ],
            failed: [],
            summary: { total: 1, created: 1, failed: 0 },
          }),
      });

      render(<GitHubExportButton tasks={[{ title: 'Task 1' }]} />);
      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      // Fill form
      fireEvent.change(screen.getByLabelText('Repository URL *'), {
        target: { value: 'https://github.com/test/repo' },
      });
      fireEvent.change(screen.getByLabelText(/Personal Access Token/), {
        target: { value: 'ghp_test' },
      });

      fireEvent.click(screen.getByText(/Export 1 Task/));

      await waitFor(() => {
        // Check for success icon (unique to result view)
        expect(screen.getByText('✓')).toBeInTheDocument();
      });

      expect(screen.getByText(/#1: Task 1/)).toBeInTheDocument();
    });

    it('should show error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Access denied' }),
      });

      render(<GitHubExportButton tasks={mockTasks} />);
      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      fireEvent.change(screen.getByLabelText('Repository URL *'), {
        target: { value: 'https://github.com/test/repo' },
      });
      fireEvent.change(screen.getByLabelText(/Personal Access Token/), {
        target: { value: 'ghp_test' },
      });

      fireEvent.click(screen.getByText(/Export 3 Tasks/));

      await waitFor(() => {
        expect(screen.getByText('Access denied')).toBeInTheDocument();
      });
    });

    it('should call onExportComplete callback', async () => {
      const onComplete = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            created: [{ number: 1, title: 'Task', html_url: 'url' }],
            failed: [],
            summary: { total: 1, created: 1, failed: 0 },
          }),
      });

      render(
        <GitHubExportButton
          tasks={[{ title: 'Task' }]}
          onExportComplete={onComplete}
        />
      );
      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      fireEvent.change(screen.getByLabelText('Repository URL *'), {
        target: { value: 'https://github.com/test/repo' },
      });
      fireEvent.change(screen.getByLabelText(/Personal Access Token/), {
        target: { value: 'ghp_test' },
      });

      fireEvent.click(screen.getByText(/Export 1 Task/));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            summary: expect.objectContaining({ created: 1 }),
          })
        );
      });
    });
  });

  describe('options', () => {
    it('should include title prefix in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            created: [],
            failed: [],
            summary: { total: 0, created: 0, failed: 0 },
          }),
      });

      render(<GitHubExportButton tasks={mockTasks} />);
      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      fireEvent.change(screen.getByLabelText('Repository URL *'), {
        target: { value: 'https://github.com/test/repo' },
      });
      fireEvent.change(screen.getByLabelText(/Personal Access Token/), {
        target: { value: 'ghp_test' },
      });
      fireEvent.change(screen.getByLabelText(/Title Prefix/), {
        target: { value: '[Bug]' },
      });

      // Use specific button selector
      const exportBtn = screen.getByRole('button', { name: /Export 3 Tasks/ });
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/export/github-issues',
          expect.objectContaining({
            body: expect.stringContaining('[Bug]'),
          })
        );
      }, { timeout: 5000 });
    });

    it('should toggle label options', () => {
      render(<GitHubExportButton tasks={mockTasks} />);
      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      const priorityCheckbox = screen.getByLabelText('Add priority labels');
      const categoryCheckbox = screen.getByLabelText('Add category labels');

      expect(priorityCheckbox).toBeChecked();
      expect(categoryCheckbox).toBeChecked();

      fireEvent.click(priorityCheckbox);
      expect(priorityCheckbox).not.toBeChecked();

      fireEvent.click(categoryCheckbox);
      expect(categoryCheckbox).not.toBeChecked();
    });
  });

  describe('priority badges', () => {
    it('should show priority badges for tasks', () => {
      render(<GitHubExportButton tasks={mockTasks} />);
      fireEvent.click(screen.getByText('Export to GitHub Issues'));

      // Check that priority badges are visible
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });
  });
});
