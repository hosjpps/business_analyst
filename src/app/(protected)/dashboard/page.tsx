'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/types/database';

type Project = Tables<'projects'> & {
  analyses?: Array<{
    id: string;
    type: string;
    created_at: string;
  }>;
};

export default function DashboardPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New project form
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Check auth and load projects
  useEffect(() => {
    if (!supabase) {
      router.push('/');
      return;
    }

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      await loadProjects();
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
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
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
      </header>

      {/* Error message */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* New project form */}
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
          <div className="projects-grid">
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

      {/* Quick action - go to main analysis */}
      <div className="quick-action">
        <button
          className="btn-analyze"
          onClick={() => router.push('/')}
        >
          🔬 Быстрый анализ (без сохранения)
        </button>
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #0d1117;
          color: #e6edf3;
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
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #30363d;
          background: #161b22;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-left h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .user-email {
          color: #8b949e;
          font-size: 0.875rem;
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
          padding: 2rem;
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

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
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

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
          }

          .header-left {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .dashboard-content {
            padding: 1rem;
          }

          .projects-grid {
            grid-template-columns: 1fr;
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
