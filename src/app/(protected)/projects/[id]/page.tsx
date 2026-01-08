'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Checklist } from '@/components/ui/Checklist';
import { TermTooltip, AutoTooltipText } from '@/components/ui/TermTooltip';
import { ProgressTrackerAdvanced } from '@/components/results/ProgressTrackerAdvanced';
import { AnalysisTimeline } from '@/components/results/AnalysisTimeline';
import { VersionDiff } from '@/components/results/VersionDiff';
import type { Tables } from '@/types/database';
import type { ChecklistItem, TooltipTerm } from '@/types/ux';

type Analysis = Tables<'analyses'>;
type BusinessCanvas = Tables<'business_canvases'>;
type Task = Tables<'tasks'>;

type ProjectWithRelations = Tables<'projects'> & {
  analyses: Analysis[];
  business_canvases: BusinessCanvas[];
  tasks: Task[];
};

// Типы анализов для табов
type AnalysisTabType = 'all' | 'code' | 'business' | 'full' | 'competitor' | 'progress' | 'history';

// Type guard for analysis result with alignment_score
interface AnalysisResultWithScore {
  alignment_score?: number;
  analysis?: { alignment_score?: number };
}

function hasAlignmentScore(result: unknown): result is AnalysisResultWithScore {
  if (!result || typeof result !== 'object') return false;
  const r = result as Record<string, unknown>;
  // Check direct alignment_score
  if (typeof r.alignment_score === 'number') return true;
  // Check nested analysis.alignment_score
  if (r.analysis && typeof r.analysis === 'object') {
    const analysis = r.analysis as Record<string, unknown>;
    if (typeof analysis.alignment_score === 'number') return true;
  }
  return false;
}

// Определения терминов для нетехнических пользователей
const TERM_DEFINITIONS: Record<string, TooltipTerm> = {
  'alignment_score': {
    term: 'Оценка соответствия',
    simple: 'Показывает, насколько ваш продукт соответствует бизнес-целям (от 0 до 100)',
    example: 'Если хотите монетизировать, но нет оплаты — оценка будет низкой',
    whyMatters: 'Помогает понять, на чём сосредоточиться в первую очередь',
  },
  'gap': {
    term: 'Разрыв',
    simple: 'Разница между тем, что нужно бизнесу, и тем, что есть в продукте',
    example: 'Нужна аналитика для роста, но её нет — это разрыв',
    whyMatters: 'Закрытие разрывов приближает вас к целям',
  },
  'verdict': {
    term: 'Вердикт',
    simple: 'Общая рекомендация: всё хорошо, нужны улучшения, или нужно менять направление',
    whyMatters: 'Помогает быстро понять общее состояние проекта',
  },
  'security': {
    term: 'Безопасность',
    simple: 'Проверка кода на уязвимости, которые могут навредить пользователям',
    example: 'Утечка паролей, SQL-инъекции, незащищённые данные',
    whyMatters: 'Защищает ваших пользователей и репутацию',
  },
  'tech_stack': {
    term: 'Технологии',
    simple: 'Инструменты и языки программирования, которые использует ваш проект',
    example: 'React, Node.js, PostgreSQL',
  },
  'cwe': {
    term: 'CWE',
    simple: 'Классификация типов уязвимостей безопасности',
    example: 'CWE-200 — утечка данных, CWE-89 — SQL-инъекция',
    whyMatters: 'Помогает разработчикам быстро найти решение',
  },
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
  const [activeTab, setActiveTab] = useState<AnalysisTabType>('all');
  const [selectedVersions, setSelectedVersions] = useState<[number | null, number | null]>([null, null]);
  const [showVersionDiff, setShowVersionDiff] = useState(false);

  // Подсчёт анализов по типам
  const analysisCounts = useMemo(() => {
    if (!project?.analyses) return { all: 0, code: 0, business: 0, full: 0, competitor: 0, progress: 0, history: 0 };

    // Count analyses with alignment_score for progress tracking (using type guard)
    const progressCount = project.analyses.filter(a => hasAlignmentScore(a.result)).length;

    const counts = { all: project.analyses.length, code: 0, business: 0, full: 0, competitor: 0, progress: progressCount, history: project.analyses.length };
    project.analyses.forEach(a => {
      if (a.type === 'code') counts.code++;
      else if (a.type === 'business') counts.business++;
      else if (a.type === 'full') counts.full++;
      else if (a.type === 'competitor') counts.competitor++;
    });
    return counts;
  }, [project?.analyses]);

  // Callback for version comparison
  const handleCompareVersions = useCallback((version1: number, version2: number) => {
    setSelectedVersions([version1, version2]);
    setShowVersionDiff(true);
  }, []);

  // Close diff view
  const handleCloseDiff = useCallback(() => {
    setShowVersionDiff(false);
  }, []);

  // Фильтрация анализов по выбранному табу
  const filteredAnalyses = useMemo(() => {
    if (!project?.analyses) return [];
    if (activeTab === 'all') return project.analyses;
    return project.analyses.filter(a => a.type === activeTab);
  }, [project?.analyses, activeTab]);

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
      skipped: { color: '#f85149', label: 'Пропущено' },
    };
    return styles[status] || { color: '#8b949e', label: status };
  };

  // Convert DB tasks to ChecklistItem format
  const convertTasksToChecklist = (tasks: Task[]): ChecklistItem[] => {
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      steps: [], // No sub-steps for project tasks
      priority: (task.priority === 'critical' ? 'high' : task.priority) as 'high' | 'medium' | 'low',
      category: undefined,
      estimatedTime: '', // Not stored in DB
      whyImportant: undefined,
      completed: task.status === 'completed',
    }));
  };

  // Handle task completion toggle
  const handleTasksChange = useCallback(async (updatedItems: ChecklistItem[]) => {
    if (!project) return;

    // Find changed items
    for (const item of updatedItems) {
      const originalTask = project.tasks.find(t => t.id === item.id);
      if (!originalTask) continue;

      const wasCompleted = originalTask.status === 'completed';
      const isNowCompleted = item.completed;

      if (wasCompleted !== isNowCompleted) {
        // Update in DB
        try {
          const response = await fetch(`/api/projects/${id}/tasks/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: isNowCompleted ? 'completed' : 'pending',
            }),
          });

          if (!response.ok) {
            console.error('Failed to update task status');
          } else {
            // Update local state
            setProject(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                tasks: prev.tasks.map(t =>
                  t.id === item.id
                    ? { ...t, status: isNowCompleted ? 'completed' : 'pending' }
                    : t
                ),
              };
            });
          }
        } catch (err) {
          console.error('Error updating task:', err);
        }
      }
    }
  }, [project, id]);

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

  // Табы анализов
  const analysisTabs: { key: AnalysisTabType; label: string; icon: string; description: string }[] = [
    { key: 'all', label: 'Все', icon: '📋', description: 'Все виды анализа' },
    { key: 'code', label: 'Код', icon: '💻', description: 'Технический анализ кода' },
    { key: 'business', label: 'Бизнес', icon: '📊', description: 'Анализ бизнес-модели' },
    { key: 'full', label: 'Полный', icon: '🔬', description: 'Код + Бизнес + Разрывы' },
    { key: 'competitor', label: 'Конкуренты', icon: '🎯', description: 'Сравнение с конкурентами' },
    { key: 'progress', label: 'Прогресс', icon: '📈', description: 'График улучшений проекта' },
    { key: 'history', label: 'История', icon: '🕐', description: 'История версий и сравнение' },
  ];

  return (
    <div className="project-page">
      {/* Header */}
      <header className="project-header">
        <div className="header-container">
          <button className="back-btn" onClick={() => router.push('/dashboard')}>
            ← Проекты
          </button>
          <div className="header-actions">
            <button className="btn-analyze" onClick={() => router.push(`/?project=${id}`)}>
              + Новый анализ
            </button>
            <button className="btn-delete" onClick={handleDelete}>
              Удалить
            </button>
          </div>
        </div>
      </header>

      {/* Main content container */}
      <div className="page-container">
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

        {/* Analysis Tabs */}
        <section className="section analysis-tabs-section">
          <div className="section-header">
            <h2>📊 Анализы</h2>
            <button className="btn-analyze-small" onClick={() => router.push(`/?project=${id}`)}>
              + Новый анализ
            </button>
          </div>

          {/* Tab Navigation */}
          <nav className="tabs-nav">
            {analysisTabs.map(tab => (
              <button
                key={tab.key}
                className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                title={tab.description}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {analysisCounts[tab.key] > 0 && (
                  <span className="tab-count">{analysisCounts[tab.key]}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Tab Content Hint */}
          <p className="tab-hint">
            {analysisTabs.find(t => t.key === activeTab)?.description}
          </p>

          {/* Progress Tab Content */}
          {activeTab === 'progress' && project ? (
            <ProgressTrackerAdvanced
              analyses={project.analyses.map(a => ({
                id: a.id,
                type: a.type,
                result: a.result as Record<string, unknown>,
                created_at: a.created_at,
              }))}
              projectName={project.name}
            />
          ) : activeTab === 'history' && project ? (
            /* History Tab Content */
            <div className="history-tab-content">
              {showVersionDiff && selectedVersions[0] !== null && selectedVersions[1] !== null ? (
                <VersionDiff
                  projectId={id}
                  version1={selectedVersions[0]}
                  version2={selectedVersions[1]}
                  onClose={handleCloseDiff}
                />
              ) : (
                <AnalysisTimeline
                  projectId={id}
                  onCompare={handleCompareVersions}
                  selectedVersions={selectedVersions}
                />
              )}
            </div>
          ) : activeTab !== 'progress' && activeTab !== 'history' && /* Filtered Analyses List */
          filteredAnalyses.length > 0 ? (
            <div className="analyses-list">
              {filteredAnalyses.map(analysis => {
              const badge = getAnalysisTypeBadge(analysis.type);
              const resultData = analysis.result as {
                analysis?: {
                  project_summary?: string;
                  detected_stage?: string;
                  tech_stack?: string[];
                  strengths?: Array<{ area: string; detail: string }>;
                  issues?: Array<{ severity: string; area: string; detail: string; file_path?: string }>;
                  tasks?: Array<{ title: string; description: string; priority: string; category?: string; estimated_minutes?: number }>;
                  next_milestone?: string;
                };
                security_analysis?: {
                  findings: Array<{
                    id: string;
                    type: string;
                    severity: string;
                    file_path: string;
                    line_number?: number;
                    description: string;
                    recommendation: string;
                    cwe_id?: string;
                    code_snippet?: string;
                  }>;
                  stats: { critical: number; high: number; medium: number; low: number; files_scanned: number };
                  has_critical_issues: boolean;
                };
                // Gap type: type = 'critical' | 'warning' | 'info', category = 'monetization' | etc.
                gaps?: Array<{
                  id: string;
                  type: string; // severity: critical/warning/info
                  category: string;
                  business_goal: string;
                  current_state: string;
                  recommendation: string;
                  hook?: string; // short catchy summary
                  why_matters?: string;
                  action_steps?: string[];
                  time_to_fix?: string;
                }>;
                tasks?: Array<{ title: string; description: string; priority: string; category?: string }>;
                alignment_score?: number;
                verdict?: string;
                verdict_explanation?: string;
                summary?: string;
                strengths?: string[];
                market_insights?: {
                  icp?: string;
                  go_to_market?: string[];
                  fit_score?: number;
                };
                canvas?: { value_proposition?: string };
                success?: boolean;
                needs_clarification?: boolean;
              };
              const codeAnalysis = resultData?.analysis;
              const securityAnalysis = resultData?.security_analysis;
              const summary = resultData?.summary ||
                            codeAnalysis?.project_summary ||
                            resultData?.canvas?.value_proposition ||
                            resultData?.verdict_explanation ||
                            null;
              const alignmentScore = resultData?.alignment_score;
              const verdict = resultData?.verdict;
              const gaps = resultData?.gaps;
              const tasks = resultData?.tasks || codeAnalysis?.tasks;
              const marketInsights = resultData?.market_insights;
              const strengths = resultData?.strengths;
              // Only show warning if truly no data at all
              const hasNoMainAnalysis = !codeAnalysis && !resultData?.canvas && !gaps?.length && alignmentScore === undefined;

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
                    <div className="alignment-score-section">
                      <div className="score-header">
                        <span className="score-label">
                          {alignmentScore >= 70 ? '✅ Продукт готов к росту' :
                           alignmentScore >= 40 ? '⚡ Есть возможности для улучшения' : '🔧 Требуется доработка'}
                        </span>
                      </div>
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
                      <p className="score-explanation">
                        {alignmentScore >= 70 ? 'Ваш продукт хорошо соответствует бизнес-целям. Можно масштабировать.' :
                         alignmentScore >= 40 ? 'Есть разрывы между целями и продуктом. Выполните рекомендации ниже.' :
                         'Серьёзные разрывы между целями и продуктом. Сосредоточьтесь на ключевых задачах.'}
                      </p>
                    </div>
                  )}

                  {summary && (
                    <p className="analysis-summary">
                      {summary.slice(0, 400)}{summary.length > 400 ? '...' : ''}
                    </p>
                  )}

                  {/* Strengths */}
                  {strengths && strengths.length > 0 && (
                    <div className="analysis-strengths">
                      <h4>💪 Сильные стороны</h4>
                      <ul className="strengths-list">
                        {strengths.slice(0, 4).map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Market Insights */}
                  {marketInsights && (
                    <div className="analysis-market-insights">
                      <h4>📊 Рыночные инсайты</h4>
                      {marketInsights.icp && (
                        <div className="insight-item">
                          <span className="insight-label">Идеальный клиент:</span>
                          <span className="insight-value">{marketInsights.icp}</span>
                        </div>
                      )}
                      {marketInsights.fit_score && (
                        <div className="insight-item">
                          <span className="insight-label">Product-Market Fit:</span>
                          <span className="insight-value">{marketInsights.fit_score}/10</span>
                        </div>
                      )}
                      {marketInsights.go_to_market && marketInsights.go_to_market.length > 0 && (
                        <div className="insight-item insight-gtm">
                          <span className="insight-label">Выход на рынок:</span>
                          <ul className="gtm-list">
                            {marketInsights.go_to_market.slice(0, 3).map((gtm, i) => (
                              <li key={i}>{gtm}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tech Stack */}
                  {codeAnalysis?.tech_stack && codeAnalysis.tech_stack.length > 0 && (
                    <div className="analysis-tech-stack">
                      {codeAnalysis.tech_stack.slice(0, 6).map((tech, i) => (
                        <span key={i} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  )}

                  {/* Gaps Summary - упрощённые описания */}
                  {gaps && gaps.length > 0 && (
                    <div className="analysis-gaps-summary">
                      <h4>🎯 Что нужно улучшить</h4>
                      <p className="section-hint">Разница между вашими целями и текущим состоянием продукта</p>
                      <div className="gaps-list">
                        {gaps.slice(0, 3).map((gap, i) => {
                          // gap.type is the severity: 'critical' | 'warning' | 'info'
                          const severity = gap.type || 'info';
                          // Use hook (short summary) or fallback to recommendation
                          const gapTitle = gap.hook || gap.recommendation || gap.business_goal || 'Рекомендация';
                          return (
                            <div key={gap.id || i} className={`gap-item gap-${severity}`}>
                              <span className="gap-title">
                                <AutoTooltipText text={gapTitle.length > 80 ? gapTitle.slice(0, 80) + '...' : gapTitle} />
                              </span>
                              <span className={`gap-severity severity-${severity}`}>
                                {severity === 'critical' ? '❗ Важно' : severity === 'warning' ? '⚡ Желательно' : '💡 Совет'}
                              </span>
                            </div>
                          );
                        })}
                        {gaps.length > 3 && (
                          <p className="more-items">и ещё {gaps.length - 3}...</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Issues Summary - упрощённые описания */}
                  {codeAnalysis?.issues && codeAnalysis.issues.length > 0 && (
                    <div className="analysis-issues-summary">
                      <h4>⚠️ Найденные проблемы</h4>
                      <p className="section-hint">Технические проблемы, которые стоит исправить</p>
                      <div className="issues-list">
                        {codeAnalysis.issues.slice(0, 3).map((issue, i) => (
                          <div key={i} className={`issue-item-mini issue-${issue.severity}`}>
                            <span className="issue-title">{issue.area}: {issue.detail?.slice(0, 50)}</span>
                            <span className={`issue-severity severity-${issue.severity}`}>
                              {issue.severity === 'high' ? '❗ Высокий' : issue.severity === 'medium' ? '⚡ Средний' : '💡 Низкий'}
                            </span>
                          </div>
                        ))}
                        {codeAnalysis.issues.length > 3 && (
                          <p className="more-items">и ещё {codeAnalysis.issues.length - 3}...</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tasks Summary - упрощённые описания */}
                  {tasks && tasks.length > 0 && (
                    <div className="analysis-tasks-summary">
                      <h4>✅ Что делать дальше</h4>
                      <p className="section-hint">Конкретные шаги для улучшения продукта</p>
                      <div className="tasks-preview-list">
                        {tasks.slice(0, 3).map((task, i) => (
                          <div key={i} className={`task-item-mini priority-${task.priority}`}>
                            <span className="task-number">{i + 1}.</span>
                            <span className="task-title">
                              <AutoTooltipText text={task.title} />
                            </span>
                          </div>
                        ))}
                        {tasks.length > 3 && (
                          <p className="more-items">и ещё {tasks.length - 3} задач...</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Next Milestone */}
                  {codeAnalysis?.next_milestone && (
                    <div className="analysis-milestone">
                      <span className="milestone-label">🎯 Следующая цель:</span>
                      <span className="milestone-text">
                        <AutoTooltipText text={codeAnalysis.next_milestone} />
                      </span>
                    </div>
                  )}

                  {/* Security Analysis - с понятными описаниями */}
                  {securityAnalysis && securityAnalysis.findings.length > 0 && (
                    <div className="security-analysis-section">
                      <h4>🔒 Защита от угроз</h4>
                      <p className="section-hint">Проверка кода на уязвимости, которые могут навредить вашим пользователям</p>
                      <div className="security-stats">
                        {securityAnalysis.stats.critical > 0 && (
                          <span className="security-stat critical">
                            ❗ {securityAnalysis.stats.critical} срочных
                          </span>
                        )}
                        {securityAnalysis.stats.high > 0 && (
                          <span className="security-stat high">
                            ⚠️ {securityAnalysis.stats.high} важных
                          </span>
                        )}
                        {securityAnalysis.stats.medium > 0 && (
                          <span className="security-stat medium">
                            💡 {securityAnalysis.stats.medium} средних
                          </span>
                        )}
                        {securityAnalysis.stats.low > 0 && (
                          <span className="security-stat low">
                            ℹ️ {securityAnalysis.stats.low} мелких
                          </span>
                        )}
                      </div>
                      <div className="security-findings-list">
                        {securityAnalysis.findings.slice(0, 3).map((finding, i) => (
                          <div key={i} className={`security-finding severity-${finding.severity}`}>
                            <div className="finding-header">
                              <span className="finding-type">{finding.type.replace(/_/g, ' ')}</span>
                            </div>
                            <p className="finding-desc">{finding.description}</p>
                            <span className="finding-file">📁 {finding.file_path}</span>
                          </div>
                        ))}
                        {securityAnalysis.findings.length > 3 && (
                          <p className="more-items">и ещё {securityAnalysis.findings.length - 3}...</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No Analysis Warning */}
                  {hasNoMainAnalysis && (
                    <div className="no-analysis-warning">
                      <span className="warning-icon">⚠️</span>
                      <span className="warning-text">
                        AI анализ не выполнен или данные повреждены.
                        {securityAnalysis ? ' Доступен только анализ безопасности (паттерны).' : ''}
                      </span>
                    </div>
                  )}

                  <details className="analysis-details">
                    <summary>Показать полные данные (JSON)</summary>
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
              <p>
                {activeTab === 'all'
                  ? 'Пока нет анализов. Запустите первый анализ!'
                  : `Нет анализов типа "${analysisTabs.find(t => t.key === activeTab)?.label}"`}
              </p>
              <button className="btn-primary" onClick={() => router.push(`/?project=${id}`)}>
                + Запустить анализ
              </button>
            </div>
          )}
        </section>

        {/* Tasks */}
        <section className="section tasks-section">
          <h2>📋 Задачи ({project?.tasks?.length || 0})</h2>
          {project?.tasks && project.tasks.length > 0 ? (
            <Checklist
              items={convertTasksToChecklist(project.tasks)}
              onChange={handleTasksChange}
              groupByPriority={true}
              showProgress={true}
            />
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
      </div> {/* End of page-container */}

      <style jsx>{`
        .project-page {
          min-height: 100vh;
          background: #0d1117;
          color: #e6edf3;
          padding-bottom: 3rem;
        }

        /* Container with max width like main page */
        .page-container {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .project-header {
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
          border: 1px solid #30363d;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .btn-delete:hover {
          background: rgba(248, 81, 73, 0.1);
          border-color: #f85149;
          color: #f85149;
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

        .project-info {
          padding: 2rem 0;
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
          font-size: 1.5rem;
        }

        /* Tabs Navigation */
        .analysis-tabs-section {
          padding-top: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }

        .btn-analyze-small {
          background: #238636;
          color: #fff;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .btn-analyze-small:hover {
          background: #2ea043;
        }

        .tabs-nav {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: #161b22;
          border-radius: 8px;
          border: 1px solid #30363d;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          color: #8b949e;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.15s ease;
        }

        .tab-btn:hover {
          background: #21262d;
          color: #e6edf3;
        }

        .tab-btn.active {
          background: #238636;
          color: #fff;
          border-color: #238636;
        }

        .tab-icon {
          font-size: 1rem;
        }

        .tab-count {
          background: #30363d;
          padding: 0.1rem 0.4rem;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .tab-btn.active .tab-count {
          background: rgba(255, 255, 255, 0.2);
        }

        .tab-hint {
          color: #8b949e;
          font-size: 0.8rem;
          margin: 0 0 1.5rem 0;
          padding-left: 0.5rem;
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

        /* Улучшенные стили для упрощённых терминов */
        .section-hint {
          color: #8b949e;
          font-size: 0.8rem;
          margin: 0 0 0.75rem;
          line-height: 1.4;
        }

        .alignment-score-section {
          background: #0d1117;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }

        .score-header {
          margin-bottom: 0.5rem;
        }

        .score-label {
          font-size: 1rem;
          font-weight: 600;
        }

        .score-explanation {
          color: #8b949e;
          font-size: 0.8rem;
          margin: 0.5rem 0 0;
          line-height: 1.4;
        }

        .alignment-score-mini {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0.5rem 0;
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

        /* Analysis Details - Tech Stack, Gaps, Issues, Tasks */
        .analysis-tech-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 0.75rem 0;
        }

        .tech-tag {
          background: rgba(88, 166, 255, 0.1);
          color: #58a6ff;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* Strengths Section */
        .analysis-strengths {
          margin: 1rem 0;
          padding: 0.75rem;
          background: rgba(63, 185, 80, 0.05);
          border-radius: 6px;
          border: 1px solid rgba(63, 185, 80, 0.2);
        }

        .analysis-strengths h4 {
          margin: 0 0 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #3fb950;
        }

        .strengths-list {
          margin: 0;
          padding-left: 1.25rem;
          color: #8b949e;
          font-size: 0.8125rem;
          line-height: 1.6;
        }

        .strengths-list li {
          margin-bottom: 0.25rem;
        }

        /* Market Insights Section */
        .analysis-market-insights {
          margin: 1rem 0;
          padding: 0.75rem;
          background: rgba(163, 113, 247, 0.05);
          border-radius: 6px;
          border: 1px solid rgba(163, 113, 247, 0.2);
        }

        .analysis-market-insights h4 {
          margin: 0 0 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #a371f7;
        }

        .insight-item {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.8125rem;
        }

        .insight-item.insight-gtm {
          flex-direction: column;
          gap: 0.25rem;
        }

        .insight-label {
          color: #8b949e;
          font-weight: 500;
          flex-shrink: 0;
        }

        .insight-value {
          color: #c9d1d9;
        }

        .gtm-list {
          margin: 0.25rem 0 0;
          padding-left: 1.25rem;
          color: #8b949e;
          font-size: 0.75rem;
          line-height: 1.5;
        }

        .gtm-list li {
          margin-bottom: 0.25rem;
        }

        .analysis-gaps-summary,
        .analysis-issues-summary,
        .analysis-tasks-summary {
          margin: 1rem 0;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
          border: 1px solid #21262d;
        }

        .analysis-gaps-summary h4,
        .analysis-issues-summary h4,
        .analysis-tasks-summary h4 {
          margin: 0 0 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #e6edf3;
        }

        .gaps-list,
        .issues-list,
        .tasks-preview-list {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .gap-item,
        .issue-item-mini,
        .task-item-mini {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.375rem 0.5rem;
          background: #0d1117;
          border-radius: 4px;
          font-size: 0.8125rem;
        }

        .gap-item.gap-critical { border-left: 3px solid #f85149; }
        .gap-item.gap-warning { border-left: 3px solid #d29922; }
        .gap-item.gap-info { border-left: 3px solid #58a6ff; }

        .issue-item-mini.issue-high { border-left: 3px solid #f85149; }
        .issue-item-mini.issue-medium { border-left: 3px solid #d29922; }
        .issue-item-mini.issue-low { border-left: 3px solid #3fb950; }

        .task-item-mini.priority-critical,
        .task-item-mini.priority-high { border-left: 3px solid #f85149; }
        .task-item-mini.priority-medium { border-left: 3px solid #d29922; }
        .task-item-mini.priority-low { border-left: 3px solid #3fb950; }

        .gap-title,
        .issue-title,
        .task-title {
          color: #c9d1d9;
          flex: 1;
        }

        .task-number {
          color: #8b949e;
          margin-right: 0.5rem;
          font-weight: 600;
        }

        .gap-severity,
        .issue-severity {
          font-size: 0.6875rem;
          padding: 0.125rem 0.375rem;
          border-radius: 3px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .severity-critical,
        .severity-high { color: #f85149; background: rgba(248, 81, 73, 0.15); }
        .severity-warning,
        .severity-medium { color: #d29922; background: rgba(210, 153, 34, 0.15); }
        .severity-info,
        .severity-low { color: #3fb950; background: rgba(63, 185, 80, 0.15); }

        .more-items {
          margin: 0.375rem 0 0;
          font-size: 0.75rem;
          color: #8b949e;
          font-style: italic;
        }

        .analysis-milestone {
          margin-top: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: rgba(163, 113, 247, 0.1);
          border: 1px solid rgba(163, 113, 247, 0.3);
          border-radius: 6px;
        }

        .milestone-label {
          font-size: 0.75rem;
          color: #a371f7;
          font-weight: 600;
          margin-right: 0.5rem;
        }

        .milestone-text {
          font-size: 0.8125rem;
          color: #c9d1d9;
        }

        /* Security Analysis Styles */
        .security-analysis-section {
          margin: 1rem 0;
          padding: 0.75rem;
          background: rgba(136, 146, 157, 0.05);
          border: 1px solid #30363d;
          border-radius: 6px;
        }

        .security-analysis-section h4 {
          margin: 0 0 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #e6edf3;
        }

        .security-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .security-stat {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .security-stat.critical {
          background: rgba(248, 81, 73, 0.15);
          color: #f85149;
        }

        .security-stat.high {
          background: rgba(240, 136, 62, 0.15);
          color: #f0883e;
        }

        .security-stat.medium {
          background: rgba(210, 153, 34, 0.15);
          color: #d29922;
        }

        .security-stat.low {
          background: rgba(63, 185, 80, 0.15);
          color: #3fb950;
        }

        .security-findings-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .security-finding {
          background: #0d1117;
          border-radius: 4px;
          padding: 0.5rem 0.75rem;
          border-left: 3px solid #8b949e;
        }

        .security-finding.severity-critical { border-left-color: #f85149; }
        .security-finding.severity-high { border-left-color: #f0883e; }
        .security-finding.severity-medium { border-left-color: #d29922; }
        .security-finding.severity-low { border-left-color: #3fb950; }

        .finding-header {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .finding-type {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #e6edf3;
          text-transform: capitalize;
        }

        .finding-cwe {
          font-size: 0.6875rem;
          padding: 0.125rem 0.375rem;
          background: rgba(88, 166, 255, 0.15);
          color: #58a6ff;
          border-radius: 3px;
        }

        .finding-desc {
          font-size: 0.75rem;
          color: #8b949e;
          margin: 0 0 0.25rem;
          line-height: 1.4;
        }

        .finding-file {
          font-size: 0.6875rem;
          color: #58a6ff;
          font-family: monospace;
        }

        /* No Analysis Warning */
        .no-analysis-warning {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(210, 153, 34, 0.1);
          border: 1px solid rgba(210, 153, 34, 0.3);
          border-radius: 6px;
          margin: 0.75rem 0;
        }

        .warning-icon {
          font-size: 1rem;
        }

        .warning-text {
          font-size: 0.8125rem;
          color: #d29922;
        }

        /* History Tab Content */
        .history-tab-content {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 1rem;
          min-height: 300px;
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
