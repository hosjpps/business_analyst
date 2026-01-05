'use client';

/**
 * GitHub Export Button
 *
 * Button to export tasks to GitHub Issues.
 */

import { useState } from 'react';
import type { ExportTask, CreatedIssue, ExportIssuesResponse } from '@/types/github-issues';

// ===========================================
// Types
// ===========================================

interface GitHubExportButtonProps {
  /** Tasks to export */
  tasks: ExportTask[];
  /** Default repo URL (optional, can be overridden in modal) */
  defaultRepoUrl?: string;
  /** Callback when export completes */
  onExportComplete?: (result: ExportIssuesResponse) => void;
  /** Custom class name */
  className?: string;
}

// ===========================================
// Component
// ===========================================

export function GitHubExportButton({
  tasks,
  defaultRepoUrl = '',
  onExportComplete,
  className = '',
}: GitHubExportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState(defaultRepoUrl);
  const [accessToken, setAccessToken] = useState('');
  const [addPriorityLabels, setAddPriorityLabels] = useState(true);
  const [addCategoryLabels, setAddCategoryLabels] = useState(true);
  const [titlePrefix, setTitlePrefix] = useState('[Task]');
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(
    new Set(tasks.map((_, i) => i))
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExportIssuesResponse | null>(null);

  // Open modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setError(null);
    setResult(null);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  // Toggle task selection
  const toggleTask = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  // Select/deselect all
  const toggleAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((_, i) => i)));
    }
  };

  // Export to GitHub
  const handleExport = async () => {
    if (!repoUrl || !accessToken) {
      setError('Repository URL and access token are required');
      return;
    }

    if (selectedTasks.size === 0) {
      setError('Please select at least one task');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const selectedTasksList = tasks.filter((_, i) => selectedTasks.has(i));

      const response = await fetch('/api/export/github-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          accessToken,
          tasks: selectedTasksList,
          addPriorityLabels,
          addCategoryLabels,
          titlePrefix: titlePrefix || undefined,
        }),
      });

      const data: ExportIssuesResponse | { success: false; error: string } =
        await response.json();

      if (!data.success && 'error' in data) {
        setError(data.error);
        return;
      }

      setResult(data as ExportIssuesResponse);
      onExportComplete?.(data as ExportIssuesResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if no tasks
  if (tasks.length === 0) {
    return null;
  }

  return (
    <>
      {/* Export Button */}
      <button
        onClick={handleOpenModal}
        className={`github-export-btn ${className}`}
        title="Export tasks to GitHub Issues"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          style={{ marginRight: 6 }}
        >
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        Export to GitHub Issues
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="export-modal-overlay" onClick={handleCloseModal}>
          <div
            className="export-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="export-modal-header">
              <h2>Export to GitHub Issues</h2>
              <button
                className="export-modal-close"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="export-modal-content">
              {/* Result view */}
              {result ? (
                <div className="export-result">
                  <div className="export-result-summary">
                    <span className="success-icon">✓</span>
                    <p>
                      Created <strong>{result.summary.created}</strong> of{' '}
                      <strong>{result.summary.total}</strong> issues
                    </p>
                  </div>

                  {result.created.length > 0 && (
                    <div className="export-result-list">
                      <h4>Created Issues:</h4>
                      <ul>
                        {result.created.map((issue) => (
                          <li key={issue.number}>
                            <a
                              href={issue.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              #{issue.number}: {issue.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.failed.length > 0 && (
                    <div className="export-result-errors">
                      <h4>Failed ({result.failed.length}):</h4>
                      <ul>
                        {result.failed.map((f, i) => (
                          <li key={i}>
                            <strong>{f.task}</strong>: {f.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    className="export-btn-primary"
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Configuration form */}
                  <div className="export-form">
                    {/* Repository URL */}
                    <div className="export-form-field">
                      <label htmlFor="repoUrl">Repository URL *</label>
                      <input
                        id="repoUrl"
                        type="text"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/owner/repo"
                      />
                    </div>

                    {/* Access Token */}
                    <div className="export-form-field">
                      <label htmlFor="accessToken">
                        Personal Access Token *
                        <a
                          href="https://github.com/settings/tokens/new?scopes=repo"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="help-link"
                        >
                          (Create token)
                        </a>
                      </label>
                      <input
                        id="accessToken"
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="ghp_..."
                      />
                      <small>Requires `repo` scope for private repos</small>
                    </div>

                    {/* Title prefix */}
                    <div className="export-form-field">
                      <label htmlFor="titlePrefix">Title Prefix (optional)</label>
                      <input
                        id="titlePrefix"
                        type="text"
                        value={titlePrefix}
                        onChange={(e) => setTitlePrefix(e.target.value)}
                        placeholder="[Task]"
                      />
                    </div>

                    {/* Options */}
                    <div className="export-form-options">
                      <label className="export-checkbox">
                        <input
                          type="checkbox"
                          checked={addPriorityLabels}
                          onChange={(e) => setAddPriorityLabels(e.target.checked)}
                        />
                        Add priority labels
                      </label>
                      <label className="export-checkbox">
                        <input
                          type="checkbox"
                          checked={addCategoryLabels}
                          onChange={(e) => setAddCategoryLabels(e.target.checked)}
                        />
                        Add category labels
                      </label>
                    </div>

                    {/* Task selection */}
                    <div className="export-task-selection">
                      <div className="export-task-header">
                        <span>Select tasks to export ({selectedTasks.size}/{tasks.length})</span>
                        <button
                          type="button"
                          onClick={toggleAll}
                          className="export-toggle-all"
                        >
                          {selectedTasks.size === tasks.length ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="export-task-list">
                        {tasks.map((task, index) => (
                          <label key={index} className="export-task-item">
                            <input
                              type="checkbox"
                              checked={selectedTasks.has(index)}
                              onChange={() => toggleTask(index)}
                            />
                            <span className="export-task-title">{task.title}</span>
                            {task.priority && (
                              <span className={`export-task-priority priority-${task.priority}`}>
                                {task.priority}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Error message */}
                    {error && <div className="export-error">{error}</div>}
                  </div>

                  {/* Actions */}
                  <div className="export-modal-actions">
                    <button
                      className="export-btn-secondary"
                      onClick={handleCloseModal}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      className="export-btn-primary"
                      onClick={handleExport}
                      disabled={isLoading || selectedTasks.size === 0}
                    >
                      {isLoading ? 'Creating Issues...' : `Export ${selectedTasks.size} Tasks`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .github-export-btn {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          background: #238636;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .github-export-btn:hover {
          background: #2ea043;
        }

        .export-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .export-modal {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
          width: 90%;
          max-width: 520px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
        }

        .export-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #30363d;
        }

        .export-modal-header h2 {
          margin: 0;
          font-size: 18px;
          color: #f0f6fc;
        }

        .export-modal-close {
          background: none;
          border: none;
          color: #8b949e;
          font-size: 24px;
          cursor: pointer;
          padding: 4px 8px;
        }

        .export-modal-close:hover {
          color: #f0f6fc;
        }

        .export-modal-content {
          padding: 20px;
          overflow-y: auto;
        }

        .export-form-field {
          margin-bottom: 16px;
        }

        .export-form-field label {
          display: block;
          margin-bottom: 6px;
          color: #c9d1d9;
          font-size: 14px;
        }

        .export-form-field input {
          width: 100%;
          padding: 10px 12px;
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 6px;
          color: #c9d1d9;
          font-size: 14px;
        }

        .export-form-field input:focus {
          border-color: #58a6ff;
          outline: none;
        }

        .export-form-field small {
          display: block;
          margin-top: 4px;
          color: #8b949e;
          font-size: 12px;
        }

        .help-link {
          margin-left: 8px;
          color: #58a6ff;
          font-size: 12px;
        }

        .export-form-options {
          display: flex;
          gap: 20px;
          margin-bottom: 16px;
        }

        .export-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #c9d1d9;
          font-size: 14px;
          cursor: pointer;
        }

        .export-task-selection {
          margin-bottom: 16px;
        }

        .export-task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          color: #c9d1d9;
          font-size: 14px;
        }

        .export-toggle-all {
          background: none;
          border: none;
          color: #58a6ff;
          cursor: pointer;
          font-size: 12px;
        }

        .export-task-list {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #30363d;
          border-radius: 6px;
        }

        .export-task-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-bottom: 1px solid #21262d;
          cursor: pointer;
        }

        .export-task-item:last-child {
          border-bottom: none;
        }

        .export-task-item:hover {
          background: #21262d;
        }

        .export-task-title {
          flex: 1;
          color: #c9d1d9;
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .export-task-priority {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          text-transform: uppercase;
        }

        .priority-critical {
          background: #b60205;
          color: white;
        }

        .priority-high {
          background: #d93f0b;
          color: white;
        }

        .priority-medium {
          background: #fbca04;
          color: #24292e;
        }

        .priority-low {
          background: #0e8a16;
          color: white;
        }

        .export-error {
          padding: 12px;
          background: rgba(248, 81, 73, 0.1);
          border: 1px solid #f85149;
          border-radius: 6px;
          color: #f85149;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .export-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #30363d;
          margin-top: 16px;
        }

        .export-btn-primary,
        .export-btn-secondary {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .export-btn-primary {
          background: #238636;
          color: white;
          border: none;
        }

        .export-btn-primary:hover:not(:disabled) {
          background: #2ea043;
        }

        .export-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .export-btn-secondary {
          background: transparent;
          color: #c9d1d9;
          border: 1px solid #30363d;
        }

        .export-btn-secondary:hover {
          border-color: #8b949e;
        }

        /* Result styles */
        .export-result {
          text-align: center;
        }

        .export-result-summary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .success-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: #238636;
          border-radius: 50%;
          font-size: 20px;
        }

        .export-result-summary p {
          color: #c9d1d9;
          font-size: 16px;
          margin: 0;
        }

        .export-result-list,
        .export-result-errors {
          text-align: left;
          margin-bottom: 20px;
        }

        .export-result-list h4,
        .export-result-errors h4 {
          color: #c9d1d9;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .export-result-list ul,
        .export-result-errors ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .export-result-list li,
        .export-result-errors li {
          padding: 8px 0;
          border-bottom: 1px solid #21262d;
          font-size: 13px;
        }

        .export-result-list a {
          color: #58a6ff;
          text-decoration: none;
        }

        .export-result-list a:hover {
          text-decoration: underline;
        }

        .export-result-errors li {
          color: #f85149;
        }
      `}</style>
    </>
  );
}

export default GitHubExportButton;
