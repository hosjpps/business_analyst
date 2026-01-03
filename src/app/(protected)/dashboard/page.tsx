'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/types/database';

type TaskItem = {
  id: string;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
};

type Project = Tables<'projects'> & {
  analyses?: Array<{
    id: string;
    type: string;
    created_at: string;
  }>;
  tasks?: TaskItem[];
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New project form
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Tasks by project
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState<string | null>(null);

  // Get tasks for selected project
  const selectedProjectTasks = selectedProjectForTasks
    ? projects.find(p => p.id === selectedProjectForTasks)?.tasks || []
    : [];

  // Get all tasks count
  const totalTasksCount = projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
  const completedTasksCount = projects.reduce(
    (acc, p) => acc + (p.tasks?.filter(t => t.status === 'completed').length || 0),
    0
  );

  // Check auth and load projects
  useEffect(() => {
    if (!supabase) {
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
        setUser(user);
        await loadProjects();
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, supabase]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load projects');
      }

      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDescription.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // Add new project to list
      setProjects(prev => [data.project, ...prev]);
      setNewProjectName('');
      setNewProjectDescription('');
      setShowNewProject(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete project');
      }

      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getAnalysisTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      code: { label: 'Код', color: '#58a6ff' },
      business: { label: 'Бизнес', color: '#a371f7' },
      full: { label: 'Полный', color: '#3fb950' },
      competitor: { label: 'Конкуренты', color: '#f0883e' },
    };
    return badges[type] || { label: type, color: '#8b949e' };
  };

  if (loading) {
    return (
      <div className="dashboard">
        {/* Header Skeleton */}
        <header className="dashboard-header">
          <div className="header-container">
            <div className="header-left">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-email" />
            </div>
            <div className="header-right">
              <div className="skeleton skeleton-btn" />
              <div className="skeleton skeleton-btn-sm" />
            </div>
          </div>
        </header>

        {/* Content Skeleton */}
        <div className="page-container">
          <main className="dashboard-content">
            <div className="projects-list">
              {[1, 2, 3].map(i => (
                <div key={i} className="project-card skeleton-card">
                  <div className="skeleton skeleton-card-title" />
                  <div className="skeleton skeleton-card-desc" />
                  <div className="skeleton skeleton-card-desc-short" />
                  <div className="project-footer">
                    <div className="skeleton skeleton-date" />
                    <div className="skeleton skeleton-btn-sm" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>

        <style jsx>{`
          .skeleton {
            background: linear-gradient(90deg, #21262d 25%, #30363d 50%, #21262d 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 6px;
          }

          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          .skeleton-title {
            width: 150px;
            height: 28px;
          }

          .skeleton-email {
            width: 120px;
            height: 16px;
          }

          .skeleton-btn {
            width: 140px;
            height: 36px;
          }

          .skeleton-btn-sm {
            width: 80px;
            height: 36px;
          }

          .skeleton-card {
            min-height: 180px;
          }

          .skeleton-card-title {
            width: 60%;
            height: 24px;
            margin-bottom: 16px;
          }

          .skeleton-card-desc {
            width: 90%;
            height: 16px;
            margin-bottom: 8px;
          }

          .skeleton-card-desc-short {
            width: 50%;
            height: 16px;
            margin-bottom: 24px;
          }

          .skeleton-date {
            width: 100px;
            height: 14px;
          }

          .dashboard {
            min-height: 100vh;
            background: #0d1117;
            color: #e6edf3;
          }

          .page-container {
            max-width: 960px;
            margin: 0 auto;
            padding: 0 24px;
          }

          .dashboard-header {
            border-bottom: 1px solid #30363d;
            background: #161b22;
          }

          .header-container {
            max-width: 960px;
            margin: 0 auto;
            padding: 1rem 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .header-right {
            display: flex;
            gap: 0.75rem;
          }

          .dashboard-content {
            padding: 1.5rem 0;
          }

          .projects-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .project-card {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 12px;
            padding: 1.25rem;
          }

          .project-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 1rem;
            border-top: 1px solid #30363d;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-left">
            <h1>Мои проекты</h1>
            <span className="user-email">{user?.email}</span>
          </div>
          <div className="header-right">
            <button
              className="btn-primary"
              onClick={() => setShowNewProject(true)}
            >
              + Новый проект
            </button>
            <button
              className="btn-secondary"
              onClick={handleLogout}
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Main container with limited width */}
      <div className="page-container">
        {/* Error message */}
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Main content */}
        <main className="dashboard-content">
          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h2>Нет проектов</h2>
              <p>Создайте свой первый проект для анализа</p>
              <button
                className="btn-primary"
                onClick={() => setShowNewProject(true)}
              >
                + Создать проект
              </button>
            </div>
          ) : (
            <div className="projects-list">
              {projects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <h3>{project.name}</h3>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteProject(project.id)}
                      title="Удалить проект"
                    >
                      🗑️
                    </button>
                  </div>

                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}

                  {project.repo_url && (
                    <a
                      href={project.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="repo-link"
                    >
                      🔗 {project.repo_url.replace('https://github.com/', '')}
                    </a>
                  )}

                  {project.analyses && project.analyses.length > 0 && (
                    <div className="project-analyses">
                      <span className="analyses-label">Анализы:</span>
                      <div className="analyses-badges">
                        {project.analyses.slice(0, 3).map(analysis => {
                          const badge = getAnalysisTypeBadge(analysis.type);
                          return (
                            <span
                              key={analysis.id}
                              className="analysis-badge"
                              style={{ backgroundColor: badge.color }}
                            >
                              {badge.label}
                            </span>
                          );
                        })}
                        {project.analyses.length > 3 && (
                          <span className="more-badge">
                            +{project.analyses.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="project-footer">
                    <span className="project-date">
                      Обновлён {formatDate(project.updated_at)}
                    </span>
                    <button
                      className="btn-view"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      Открыть →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Tasks Section - grouped by project */}
        {totalTasksCount > 0 && (
          <section className="tasks-overview-section">
            <div className="tasks-header">
              <h2>📋 Задачи</h2>
              <span className="tasks-stats">
                Выполнено {completedTasksCount} из {totalTasksCount}
              </span>
            </div>

            {/* Project Selector */}
            <div className="project-selector">
              <label>Выберите проект:</label>
              <select
                value={selectedProjectForTasks || ''}
                onChange={e => setSelectedProjectForTasks(e.target.value || null)}
              >
                <option value="">Все проекты</option>
                {projects.filter(p => p.tasks && p.tasks.length > 0).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.tasks?.length || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Tasks List */}
            {selectedProjectForTasks ? (
              <div className="tasks-list">
                {selectedProjectTasks.length > 0 ? (
                  selectedProjectTasks.map(task => (
                    <div key={task.id} className={`task-item task-${task.priority} task-status-${task.status}`}>
                      <span className="task-checkbox">
                        {task.status === 'completed' ? '✅' : '⬜'}
                      </span>
                      <span className="task-title-text">{task.title}</span>
                      <span className={`task-priority priority-${task.priority}`}>
                        {task.priority === 'critical' ? '❗ Срочно' :
                         task.priority === 'high' ? '⚡ Важно' :
                         task.priority === 'medium' ? '📌 Средний' : '💡 Низкий'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-tasks">Нет задач для этого проекта</p>
                )}
              </div>
            ) : (
              <div className="tasks-by-project">
                {projects.filter(p => p.tasks && p.tasks.length > 0).map(project => (
                  <div key={project.id} className="project-tasks-group">
                    <h4 className="project-tasks-title">
                      📁 {project.name}
                      <span className="project-tasks-count">
                        {project.tasks?.filter(t => t.status === 'completed').length || 0}/{project.tasks?.length || 0}
                      </span>
                    </h4>
                    <div className="tasks-list">
                      {project.tasks?.slice(0, 3).map(task => (
                        <div key={task.id} className={`task-item task-${task.priority} task-status-${task.status}`}>
                          <span className="task-checkbox">
                            {task.status === 'completed' ? '✅' : '⬜'}
                          </span>
                          <span className="task-title-text">{task.title}</span>
                        </div>
                      ))}
                      {(project.tasks?.length || 0) > 3 && (
                        <button
                          className="btn-view-more"
                          onClick={() => setSelectedProjectForTasks(project.id)}
                        >
                          Показать все ({project.tasks?.length})
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div> {/* End page-container */}

      {/* New project modal - outside container */}
      {showNewProject && (
        <div className="modal-overlay" onClick={() => setShowNewProject(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Новый проект</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="project-name">Название *</label>
                <input
                  id="project-name"
                  type="text"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="Мой проект"
                  maxLength={100}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="project-description">Описание</label>
                <textarea
                  id="project-description"
                  value={newProjectDescription}
                  onChange={e => setNewProjectDescription(e.target.value)}
                  placeholder="Краткое описание проекта..."
                  maxLength={5000}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewProject(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating || !newProjectName.trim()}
                >
                  {creating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick action - go to main analysis */}
      <div className="quick-action">
        <button
          className="btn-analyze"
          onClick={() => router.push('/')}
        >
          + Быстрый анализ
        </button>
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #0d1117;
          color: #e6edf3;
        }

        /* Container with max width */
        .page-container {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
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

        .dashboard-header {
          border-bottom: 1px solid #30363d;
          background: #161b22;
          padding: 0;
        }

        .header-container {
          max-width: 960px;
          margin: 0 auto;
          padding: 1rem 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-left h1 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .user-email {
          color: #8b949e;
          font-size: 0.8rem;
        }

        .header-right {
          display: flex;
          gap: 0.75rem;
        }

        .btn-primary {
          background: #238636;
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2ea043;
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
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #30363d;
        }

        .error-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(248, 81, 73, 0.1);
          border: 1px solid #f85149;
          color: #f85149;
          margin: 1rem 0;
          border-radius: 6px;
        }

        .error-banner button {
          background: none;
          border: none;
          color: #f85149;
          cursor: pointer;
          font-size: 1.25rem;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .modal {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 1.5rem;
          width: 100%;
          max-width: 480px;
          margin: 1rem;
        }

        .modal h2 {
          margin: 0 0 1.5rem;
          font-size: 1.25rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #8b949e;
          font-size: 0.875rem;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 6px;
          padding: 0.75rem;
          color: #e6edf3;
          font-size: 0.875rem;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #58a6ff;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .dashboard-content {
          padding: 1.5rem 0;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h2 {
          margin: 0 0 0.5rem;
          font-size: 1.5rem;
        }

        .empty-state p {
          color: #8b949e;
          margin: 0 0 1.5rem;
        }

        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .project-card {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 1.25rem;
          transition: border-color 0.2s;
        }

        .project-card:hover {
          border-color: #58a6ff;
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .project-header h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.2s;
          font-size: 1rem;
        }

        .delete-btn:hover {
          opacity: 1;
        }

        .project-description {
          color: #8b949e;
          font-size: 0.875rem;
          margin: 0 0 0.75rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .repo-link {
          display: inline-block;
          color: #58a6ff;
          font-size: 0.75rem;
          text-decoration: none;
          margin-bottom: 0.75rem;
        }

        .repo-link:hover {
          text-decoration: underline;
        }

        .project-analyses {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .analyses-label {
          color: #8b949e;
          font-size: 0.75rem;
        }

        .analyses-badges {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .analysis-badge {
          padding: 0.125rem 0.5rem;
          border-radius: 10px;
          font-size: 0.625rem;
          font-weight: 600;
          color: #fff;
          text-transform: uppercase;
        }

        .more-badge {
          padding: 0.125rem 0.5rem;
          background: #30363d;
          border-radius: 10px;
          font-size: 0.625rem;
          color: #8b949e;
        }

        .project-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #30363d;
        }

        .project-date {
          color: #8b949e;
          font-size: 0.75rem;
        }

        .btn-view {
          background: none;
          border: 1px solid #30363d;
          color: #58a6ff;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-view:hover {
          background: #58a6ff;
          color: #fff;
        }

        .quick-action {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
        }

        .btn-analyze {
          background: linear-gradient(135deg, #238636 0%, #1f6feb 100%);
          color: #fff;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(35, 134, 54, 0.3);
          transition: all 0.2s;
        }

        .btn-analyze:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(35, 134, 54, 0.4);
        }

        /* Tasks Overview Section */
        .tasks-overview-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
        }

        .tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .tasks-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }

        .tasks-stats {
          color: #8b949e;
          font-size: 0.875rem;
        }

        .project-selector {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #30363d;
        }

        .project-selector label {
          color: #8b949e;
          font-size: 0.875rem;
        }

        .project-selector select {
          flex: 1;
          max-width: 300px;
          padding: 0.5rem 0.75rem;
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 6px;
          color: #e6edf3;
          font-size: 0.875rem;
        }

        .project-selector select:focus {
          outline: none;
          border-color: #58a6ff;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .task-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          background: #0d1117;
          border-radius: 6px;
          border-left: 3px solid #30363d;
        }

        .task-item.task-critical {
          border-left-color: #f85149;
        }

        .task-item.task-high {
          border-left-color: #d29922;
        }

        .task-item.task-medium {
          border-left-color: #58a6ff;
        }

        .task-item.task-low {
          border-left-color: #8b949e;
        }

        .task-item.task-status-completed {
          opacity: 0.6;
        }

        .task-item.task-status-completed .task-title-text {
          text-decoration: line-through;
        }

        .task-checkbox {
          font-size: 0.9rem;
        }

        .task-title-text {
          flex: 1;
          font-size: 0.875rem;
        }

        .task-priority {
          font-size: 0.7rem;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          background: #21262d;
        }

        .tasks-by-project {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .project-tasks-group {
          padding: 1rem;
          background: #0d1117;
          border-radius: 8px;
        }

        .project-tasks-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 0 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .project-tasks-count {
          color: #8b949e;
          font-size: 0.75rem;
          font-weight: normal;
        }

        .btn-view-more {
          background: transparent;
          border: 1px solid #30363d;
          color: #58a6ff;
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          margin-top: 0.5rem;
        }

        .btn-view-more:hover {
          background: #21262d;
        }

        .no-tasks {
          color: #8b949e;
          font-size: 0.875rem;
          text-align: center;
          padding: 1rem;
        }

        @media (max-width: 768px) {
          .header-container {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem 16px;
          }

          .header-left {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .page-container {
            padding: 0 16px;
          }

          .quick-action {
            bottom: 1rem;
            right: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
