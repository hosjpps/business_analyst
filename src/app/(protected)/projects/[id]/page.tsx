'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/types/database';

type Analysis = Tables<'analyses'>;
type BusinessCanvas = Tables<'business_canvases'>;
type Task = Tables<'tasks'>;

type ProjectWithRelations = Tables<'projects'> & {
  analyses: Analysis[];
  business_canvases: BusinessCanvas[];
  tasks: Task[];
};

export default function ProjectPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const supabase = createClient();

  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) {
      // Supabase not configured, redirect to home
      router.push('/');
      return;
    }

    const checkAuth = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }
        loadProject();
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      }
    };

    checkAuth();
  }, [id, router, supabase]);

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load project');
      }

      setProject(data.project);
      setEditName(data.project.name);
      setEditDescription(data.project.description || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleSave = async () => {
    if (!editName.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project');
      }

      setProject(prev => prev ? { ...prev, ...data.project } : null);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete project');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAnalysisTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string; icon: string }> = {
      code: { label: 'Анализ кода', color: '#58a6ff', icon: '💻' },
      business: { label: 'Бизнес-анализ', color: '#a371f7', icon: '📊' },
      full: { label: 'Полный анализ', color: '#3fb950', icon: '🔬' },
      competitor: { label: 'Конкуренты', color: '#f0883e', icon: '🎯' },
    };
    return badges[type] || { label: type, color: '#8b949e', icon: '📝' };
  };

  const getTaskPriorityStyle = (priority: string) => {
    const styles: Record<string, { color: string; bg: string }> = {
      critical: { color: '#f85149', bg: 'rgba(248, 81, 73, 0.1)' },
      high: { color: '#f0883e', bg: 'rgba(240, 136, 62, 0.1)' },
      medium: { color: '#d29922', bg: 'rgba(210, 153, 34, 0.1)' },
      low: { color: '#8b949e', bg: 'rgba(139, 148, 158, 0.1)' },
    };
    return styles[priority] || styles.medium;
  };

  const getTaskStatusStyle = (status: string) => {
    const styles: Record<string, { color: string; label: string }> = {
      pending: { color: '#8b949e', label: 'Ожидает' },
      in_progress: { color: '#58a6ff', label: 'В работе' },
      completed: { color: '#3fb950', label: 'Готово' },
      cancelled: { color: '#f85149', label: 'Отменено' },
    };
    return styles[status] || { color: '#8b949e', label: status };
  };

  if (loading) {
    return (
      <div className="project-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка проекта...</p>

        <style jsx>{`
          .project-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #0d1117;
            color: #e6edf3;
            gap: 1rem;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #30363d;
            border-top-color: #58a6ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="project-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/dashboard')}>
          ← Вернуться к проектам
        </button>

        <style jsx>{`
          .project-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #0d1117;
            color: #e6edf3;
            gap: 1rem;
            text-align: center;
            padding: 2rem;
          }
          .project-error h2 {
            color: #f85149;
          }
          .project-error button {
            background: #21262d;
            color: #c9d1d9;
            border: 1px solid #30363d;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
          }
          .project-error button:hover {
            background: #30363d;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="project-page">
      {/* Header */}
      <header className="project-header">
        <button className="back-btn" onClick={() => router.push('/dashboard')}>
          ← Проекты
        </button>
        <div className="header-actions">
          <button className="btn-analyze" onClick={() => router.push(`/?project=${id}`)}>
            🔬 Новый анализ
          </button>
          <button className="btn-delete" onClick={handleDelete}>
            🗑️ Удалить
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Project info */}
      <section className="project-info">
        {editing ? (
          <div className="edit-form">
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Название проекта"
              maxLength={100}
            />
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              placeholder="Описание проекта..."
              maxLength={5000}
              rows={3}
            />
            <div className="edit-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setEditName(project?.name || '');
                  setEditDescription(project?.description || '');
                }}
              >
                Отмена
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving || !editName.trim()}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="info-header">
              <h1>{project?.name}</h1>
              <button className="edit-btn" onClick={() => setEditing(true)}>
                ✏️ Редактировать
              </button>
            </div>
            {project?.description && (
              <p className="description">{project.description}</p>
            )}
            {project?.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="repo-link"
              >
                🔗 {project.repo_url}
              </a>
            )}
            <div className="meta">
              <span>Создан: {formatDate(project?.created_at || '')}</span>
              <span>Обновлён: {formatDate(project?.updated_at || '')}</span>
            </div>
          </>
        )}
      </section>

      {/* Analyses */}
      <section className="section">
        <div className="section-header">
          <h2>📊 Анализы ({project?.analyses?.length || 0})</h2>
          <button className="btn-analyze-small" onClick={() => router.push(`/?project=${id}`)}>
            + Новый анализ
          </button>
        </div>
        {project?.analyses && project.analyses.length > 0 ? (
          <div className="analyses-list">
            {project.analyses.map(analysis => {
              const badge = getAnalysisTypeBadge(analysis.type);
              const resultData = analysis.result as {
                analysis?: { project_summary?: string };
                alignment_score?: number;
                verdict?: string;
                canvas?: { value_proposition?: string };
                success?: boolean;
              };
              const summary = resultData?.analysis?.project_summary ||
                            resultData?.canvas?.value_proposition ||
                            null;
              const alignmentScore = resultData?.alignment_score;
              const verdict = resultData?.verdict;

              return (
                <div key={analysis.id} className="analysis-card">
                  <div className="analysis-header">
                    <span className="analysis-icon">{badge.icon}</span>
                    <span
                      className="analysis-type"
                      style={{ color: badge.color }}
                    >
                      {badge.label}
                    </span>
                    {verdict && (
                      <span className={`verdict-badge verdict-${verdict.toLowerCase().replace('_', '-')}`}>
                        {verdict === 'ON_TRACK' ? 'В порядке' :
                         verdict === 'ITERATE' ? 'Улучшить' : 'Изменить'}
                      </span>
                    )}
                    <span className="analysis-date">
                      {formatDate(analysis.created_at)}
                    </span>
                  </div>

                  {typeof alignmentScore === 'number' && (
                    <div className="alignment-score-mini">
                      <div className="score-bar">
                        <div
                          className="score-fill"
                          style={{
                            width: `${alignmentScore}%`,
                            backgroundColor: alignmentScore >= 70 ? '#3fb950' :
                                           alignmentScore >= 40 ? '#d29922' : '#f85149'
                          }}
                        />
                      </div>
                      <span className="score-value">{Math.round(alignmentScore)}%</span>
                    </div>
                  )}

                  {summary && (
                    <p className="analysis-summary">
                      {summary.slice(0, 200)}{summary.length > 200 ? '...' : ''}
                    </p>
                  )}

                  <details className="analysis-details">
                    <summary>Показать детали</summary>
                    <div className="analysis-preview">
                      <pre>
                        {JSON.stringify(analysis.result, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-section">
            <p>Пока нет анализов</p>
            <button className="btn-primary" onClick={() => router.push(`/?project=${id}`)}>
              🔬 Запустить анализ
            </button>
          </div>
        )}
      </section>

      {/* Tasks */}
      <section className="section">
        <h2>📋 Задачи ({project?.tasks?.length || 0})</h2>
        {project?.tasks && project.tasks.length > 0 ? (
          <div className="tasks-list">
            {project.tasks.map(task => {
              const priorityStyle = getTaskPriorityStyle(task.priority);
              const statusStyle = getTaskStatusStyle(task.status);
              return (
                <div
                  key={task.id}
                  className="task-card"
                  style={{ borderLeftColor: priorityStyle.color }}
                >
                  <div className="task-header">
                    <span className="task-title">{task.title}</span>
                    <span
                      className="task-status"
                      style={{ color: statusStyle.color }}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  <div className="task-meta">
                    <span
                      className="task-priority"
                      style={{
                        color: priorityStyle.color,
                        backgroundColor: priorityStyle.bg,
                      }}
                    >
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="task-due">
                        До: {new Date(task.due_date).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-section">
            <p>Пока нет задач. Запустите анализ для генерации рекомендаций.</p>
          </div>
        )}
      </section>

      {/* Business Canvas */}
      {project?.business_canvases && project.business_canvases.length > 0 && (
        <section className="section">
          <h2>🎯 Business Canvas</h2>
          <div className="canvas-preview">
            <pre>
              {JSON.stringify(project.business_canvases[0].canvas, null, 2)}
            </pre>
          </div>
        </section>
      )}

      <style jsx>{`
        .project-page {
          min-height: 100vh;
          background: #0d1117;
          color: #e6edf3;
          padding-bottom: 3rem;
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          border-bottom: 1px solid #30363d;
          background: #161b22;
        }

        .back-btn {
          background: none;
          border: none;
          color: #58a6ff;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .back-btn:hover {
          text-decoration: underline;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-analyze {
          background: #238636;
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .btn-analyze:hover {
          background: #2ea043;
        }

        .btn-delete {
          background: transparent;
          color: #f85149;
          border: 1px solid #f85149;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .btn-delete:hover {
          background: rgba(248, 81, 73, 0.1);
        }

        .error-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(248, 81, 73, 0.1);
          border: 1px solid #f85149;
          color: #f85149;
          margin: 1rem 2rem;
          border-radius: 6px;
        }

        .error-banner button {
          background: none;
          border: none;
          color: #f85149;
          cursor: pointer;
          font-size: 1.25rem;
        }

        .project-info {
          padding: 2rem;
          border-bottom: 1px solid #30363d;
        }

        .info-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .info-header h1 {
          margin: 0;
          font-size: 1.75rem;
        }

        .edit-btn {
          background: none;
          border: 1px solid #30363d;
          color: #8b949e;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
        }

        .edit-btn:hover {
          color: #e6edf3;
          border-color: #8b949e;
        }

        .description {
          color: #8b949e;
          margin: 0 0 1rem;
          line-height: 1.5;
        }

        .repo-link {
          display: inline-block;
          color: #58a6ff;
          font-size: 0.875rem;
          text-decoration: none;
          margin-bottom: 1rem;
        }

        .repo-link:hover {
          text-decoration: underline;
        }

        .meta {
          display: flex;
          gap: 2rem;
          color: #8b949e;
          font-size: 0.75rem;
        }

        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .edit-form input,
        .edit-form textarea {
          width: 100%;
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 6px;
          padding: 0.75rem;
          color: #e6edf3;
          font-size: 1rem;
        }

        .edit-form input:focus,
        .edit-form textarea:focus {
          outline: none;
          border-color: #58a6ff;
        }

        .edit-form textarea {
          resize: vertical;
          min-height: 80px;
        }

        .edit-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .btn-primary {
          background: #238636;
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #21262d;
          color: #c9d1d9;
          border: 1px solid #30363d;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .section {
          padding: 2rem;
          border-bottom: 1px solid #30363d;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section h2 {
          margin: 0 0 1.5rem;
          font-size: 1.25rem;
        }

        .section-header h2 {
          margin: 0;
        }

        .btn-analyze-small {
          background: rgba(35, 134, 54, 0.15);
          color: #3fb950;
          border: 1px solid #3fb950;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .btn-analyze-small:hover {
          background: rgba(35, 134, 54, 0.25);
        }

        .empty-section {
          text-align: center;
          padding: 2rem;
          color: #8b949e;
        }

        .empty-section p {
          margin: 0 0 1rem;
        }

        .analyses-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .analysis-card {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 1rem;
        }

        .analysis-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .analysis-icon {
          font-size: 1.25rem;
        }

        .analysis-type {
          font-weight: 600;
        }

        .analysis-date {
          margin-left: auto;
          color: #8b949e;
          font-size: 0.75rem;
        }

        .analysis-preview {
          background: #0d1117;
          border-radius: 6px;
          padding: 0.75rem;
          overflow: hidden;
        }

        .analysis-preview pre {
          margin: 0;
          font-size: 0.75rem;
          color: #8b949e;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 400px;
          overflow: auto;
        }

        .verdict-badge {
          font-size: 0.625rem;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .verdict-on-track {
          background: rgba(63, 185, 80, 0.15);
          color: #3fb950;
        }

        .verdict-iterate {
          background: rgba(210, 153, 34, 0.15);
          color: #d29922;
        }

        .verdict-pivot {
          background: rgba(248, 81, 73, 0.15);
          color: #f85149;
        }

        .alignment-score-mini {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0.75rem 0;
        }

        .score-bar {
          flex: 1;
          height: 6px;
          background: #21262d;
          border-radius: 3px;
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .score-value {
          font-size: 0.875rem;
          font-weight: 600;
          min-width: 40px;
          text-align: right;
        }

        .analysis-summary {
          margin: 0.75rem 0;
          font-size: 0.875rem;
          color: #8b949e;
          line-height: 1.5;
        }

        .analysis-details {
          margin-top: 0.75rem;
        }

        .analysis-details summary {
          font-size: 0.75rem;
          color: #58a6ff;
          cursor: pointer;
          padding: 0.5rem 0;
        }

        .analysis-details summary:hover {
          text-decoration: underline;
        }

        .analysis-details[open] .analysis-preview {
          margin-top: 0.5rem;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .task-card {
          background: #161b22;
          border: 1px solid #30363d;
          border-left: 3px solid;
          border-radius: 8px;
          padding: 1rem;
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .task-title {
          font-weight: 600;
        }

        .task-status {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .task-description {
          color: #8b949e;
          font-size: 0.875rem;
          margin: 0 0 0.75rem;
        }

        .task-meta {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .task-priority {
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.625rem;
          text-transform: uppercase;
          font-weight: 600;
        }

        .task-due {
          color: #8b949e;
          font-size: 0.75rem;
        }

        .canvas-preview {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 1rem;
          overflow: auto;
          max-height: 400px;
        }

        .canvas-preview pre {
          margin: 0;
          font-size: 0.75rem;
          color: #8b949e;
        }

        @media (max-width: 768px) {
          .project-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
          }

          .project-info,
          .section {
            padding: 1.5rem 1rem;
          }

          .info-header {
            flex-direction: column;
            gap: 0.75rem;
          }

          .meta {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
