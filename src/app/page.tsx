'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { AnalyzeResponse, FileInput } from '@/types';
import type { BusinessInput, BusinessAnalyzeResponse } from '@/types/business';
import type { GapAnalyzeResponse } from '@/types/gaps';
import type { CompetitorInput, CompetitorAnalyzeResponse } from '@/types/competitor';
import { UploadForm } from '@/components/UploadForm';
import { ProgressIndicator, type AnalysisStep } from '@/components/ProgressIndicator';
import { AnalysisView } from '@/components/AnalysisView';
import { ChatSection } from '@/components/ChatSection';
import { ExportButtons } from '@/components/ExportButtons';
import { AnalysisModeSelector, type AnalysisMode } from '@/components/forms/AnalysisModeSelector';
import { BusinessInputForm } from '@/components/forms/BusinessInputForm';
import { CompetitorInputForm } from '@/components/forms/CompetitorInputForm';
import { CanvasView } from '@/components/results/CanvasView';
import { ClarificationQuestions } from '@/components/forms/ClarificationQuestions';
import { GapsView } from '@/components/results/GapsView';
import { AlignmentScore } from '@/components/results/AlignmentScore';
import { VerdictBadge } from '@/components/results/VerdictBadge';
import { CompetitorComparisonView } from '@/components/results/CompetitorComparisonView';
import { UserNav } from '@/components/UserNav';
import { FAQList } from '@/components/ui/FAQ';
import { createClient } from '@/lib/supabase/client';
import {
  usePersistedDescription,
  usePersistedRepoUrl,
  usePersistedResult,
  clearAllAnalyzerData,
} from '@/hooks/useLocalStorage';
import { useAnalysisCache } from '@/hooks/useAnalysisCache';
import type { FAQItem } from '@/types/ux';

// ===========================================
// Project Types
// ===========================================

interface SimpleProject {
  id: string;
  name: string;
}

// ===========================================
// FAQ Data
// ===========================================

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what-is-this',
    question: 'Что делает этот инструмент?',
    answer: 'Анализирует ваш бизнес и код, находит разрывы между бизнес-целями и текущим состоянием продукта, и даёт конкретные рекомендации по улучшению.',
    example: 'Вы хотите монетизировать продукт, но у вас нет платёжной системы — это разрыв, который мы поможем закрыть.',
  },
  {
    id: 'what-is-alignment-score',
    question: 'Что такое Alignment Score?',
    answer: 'Оценка от 0 до 100, показывающая насколько ваш продукт соответствует бизнес-целям. 70+ = всё хорошо, 40-69 = нужны улучшения, <40 = требуется серьёзная доработка.',
    example: 'Если вы на стадии роста, но у вас нет аналитики — это снижает скор, потому что без данных сложно масштабироваться.',
  },
  {
    id: 'what-is-gap',
    question: 'Что такое "разрыв" (Gap)?',
    answer: 'Разрыв — это разница между тем, что нужно вашему бизнесу на текущей стадии, и тем, что есть в продукте. Разрывы бывают критические (срочно исправить), предупреждения (важно, но не срочно) и информационные (хорошо бы сделать).',
    example: 'Нет способа принимать оплату = критический разрыв в монетизации.',
  },
  {
    id: 'how-safe',
    question: 'Безопасно ли загружать код?',
    answer: 'Да, ваш код обрабатывается только для анализа и не сохраняется. Мы используем только публичные репозитории или файлы, которые вы явно загрузили. Анализ выполняется через зашифрованное соединение.',
  },
  {
    id: 'what-modes',
    question: 'Какие режимы анализа доступны?',
    answer: 'Четыре режима: 1) Только код — быстрый технический анализ, 2) Только бизнес — Business Canvas и рекомендации, 3) Полный анализ — бизнес + код + поиск разрывов, 4) Конкуренты — сравнение с конкурентами.',
    example: 'Для стартапа рекомендуем "Полный анализ" — это даст полную картину.',
  },
  {
    id: 'how-long',
    question: 'Сколько занимает анализ?',
    answer: 'Обычно 15-60 секунд в зависимости от размера проекта. Для повторных анализов GitHub репозиториев используется кэширование — результат возвращается мгновенно, если код не менялся.',
  },
];


// ===========================================
// Main Component
// ===========================================

function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  // Mode selection - start with null (force selection)
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(null);

  // Persisted state (localStorage) - for code analysis
  const [repoUrl, setRepoUrl] = usePersistedRepoUrl();
  const [description, setDescription] = usePersistedDescription();
  const [persistedResult, setPersistedResult] = usePersistedResult();

  // Project saving state
  const [userProjects, setUserProjects] = useState<SimpleProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [saveToProject, setSaveToProject] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [savingToProject, setSavingToProject] = useState(false);
  const [savedToProjectMessage, setSavedToProjectMessage] = useState<string | null>(null);

  // Check for project param in URL and load projects
  useEffect(() => {
    const projectParam = searchParams.get('project');
    if (projectParam) {
      setSelectedProjectId(projectParam);
      setSaveToProject(true);
    }

    // Load user projects if authenticated
    const loadProjects = async () => {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        try {
          const response = await fetch('/api/projects');
          if (response.ok) {
            const data = await response.json();
            setUserProjects(data.projects.map((p: { id: string; name: string }) => ({
              id: p.id,
              name: p.name
            })));
          }
        } catch (err) {
          console.error('Failed to load projects:', err);
        }
      }
    };

    loadProjects();
  }, [searchParams, supabase]);

  // Business analysis state
  const [businessInput, setBusinessInput] = useState<BusinessInput>({
    description: '',
    social_links: {},
    documents: [],
  });
  const [businessResult, setBusinessResult] = useState<BusinessAnalyzeResponse | null>(null);

  // Gap analysis state (for full mode)
  const [gapResult, setGapResult] = useState<GapAnalyzeResponse | null>(null);

  // Competitor analysis state
  const [competitors, setCompetitors] = useState<CompetitorInput[]>([]);
  const [competitorResult, setCompetitorResult] = useState<CompetitorAnalyzeResponse | null>(null);

  // Non-persisted state
  const [uploadedFiles, setUploadedFiles] = useState<FileInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('idle');

  // Client-side cache for GitHub repos
  const { getCached, setCache, isCacheValid, clearAllCaches } = useAnalysisCache();

  // Cast persisted result to proper type
  const codeResult = persistedResult as AnalyzeResponse | null;

  // Clear all saved data
  const handleClearAll = useCallback(() => {
    clearAllAnalyzerData();
    clearAllCaches();
    setUploadedFiles([]);
    setBusinessInput({ description: '', social_links: {}, documents: [] });
    setBusinessResult(null);
    setGapResult(null);
    setCompetitors([]);
    setCompetitorResult(null);
    setError(null);
    setAnalysisStep('idle');
    setAnalysisMode(null);
    window.location.reload();
  }, [clearAllCaches]);

  // ===========================================
  // Save Analysis to Project
  // ===========================================

  const saveAnalysisToProject = useCallback(async (
    projectId: string,
    type: 'code' | 'business' | 'full' | 'competitor',
    result: AnalyzeResponse | BusinessAnalyzeResponse | GapAnalyzeResponse | CompetitorAnalyzeResponse
  ) => {
    setSavingToProject(true);
    setSavedToProjectMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/analyses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          result,
          metadata: {
            saved_at: new Date().toISOString(),
            analysis_mode: analysisMode,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save analysis');
      }

      const projectName = userProjects.find(p => p.id === projectId)?.name || 'проект';
      setSavedToProjectMessage(`Сохранено в "${projectName}"`);

      // Clear message after 5 seconds
      setTimeout(() => setSavedToProjectMessage(null), 5000);
    } catch (err) {
      console.error('Failed to save analysis:', err);
      setError(err instanceof Error ? err.message : 'Не удалось сохранить анализ');
    } finally {
      setSavingToProject(false);
    }
  }, [analysisMode, userProjects]);

  // ===========================================
  // Code Analysis Handler (existing)
  // ===========================================

  const handleCodeAnalyze = async () => {
    if (!repoUrl && uploadedFiles.length === 0) {
      setError('Укажите GitHub URL или загрузите файлы');
      return;
    }

    if (!description.trim()) {
      setError('Опишите свой проект');
      return;
    }

    setLoading(true);
    setError(null);
    setPersistedResult(null);

    if (uploadedFiles.length > 0) {
      setAnalysisStep('uploading');
    } else {
      setAnalysisStep('fetching');
    }

    try {
      // Check client-side cache for GitHub repos
      if (repoUrl && uploadedFiles.length === 0) {
        setAnalysisStep('fetching');
        const { valid, currentSha } = await isCacheValid(repoUrl);

        if (valid && currentSha) {
          const cached = getCached(repoUrl);
          if (cached) {
            const cachedResponse: AnalyzeResponse = {
              ...cached.response,
              metadata: {
                ...cached.response.metadata,
                cached: true,
                analysis_duration_ms: 0,
              },
            };
            setPersistedResult(cachedResponse);
            setAnalysisStep('complete');
            setLoading(false);
            return;
          }
        }
      }

      setTimeout(() => setAnalysisStep('analyzing'), 500);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl || undefined,
          files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
          project_description: description,
        }),
      });

      setAnalysisStep('generating');

      const data: AnalyzeResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Ошибка анализа');
        setAnalysisStep('error');
      } else {
        if (repoUrl && data.metadata.commit_sha) {
          setCache(repoUrl, data, data.metadata.commit_sha);
        }
        setPersistedResult(data);
        setAnalysisStep('complete');

        // Save to project if enabled
        if (saveToProject && selectedProjectId) {
          await saveAnalysisToProject(selectedProjectId, 'code', data);
        }
      }
    } catch (err) {
      setError('Не удалось выполнить запрос');
      setAnalysisStep('error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // Business Analysis Handler (new)
  // ===========================================

  const handleBusinessAnalyze = async () => {
    if (businessInput.description.length < 50) {
      setError('Описание бизнеса должно быть минимум 50 символов');
      return;
    }

    setLoading(true);
    setError(null);
    setBusinessResult(null);
    setAnalysisStep('uploading');

    try {
      setTimeout(() => setAnalysisStep('analyzing'), 500);

      const response = await fetch('/api/analyze-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessInput),
      });

      setAnalysisStep('generating');

      const data: BusinessAnalyzeResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Ошибка анализа бизнеса');
        setAnalysisStep('error');
      } else {
        setBusinessResult(data);
        setAnalysisStep('complete');

        // Save to project if enabled
        if (saveToProject && selectedProjectId) {
          await saveAnalysisToProject(selectedProjectId, 'business', data);
        }
      }
    } catch (err) {
      setError('Не удалось выполнить запрос');
      setAnalysisStep('error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // Full Analysis Handler (Business + Code + Gaps)
  // ===========================================

  const handleFullAnalyze = async () => {
    // Validate both inputs
    if (businessInput.description.length < 50) {
      setError('Описание бизнеса должно быть минимум 50 символов');
      return;
    }
    if (!repoUrl && uploadedFiles.length === 0) {
      setError('Укажите GitHub URL или загрузите файлы');
      return;
    }
    if (!description.trim()) {
      setError('Опишите свой проект');
      return;
    }

    setLoading(true);
    setError(null);
    setBusinessResult(null);
    setPersistedResult(null);
    setGapResult(null);
    setAnalysisStep('uploading');

    try {
      // Step 1: Run both analyses in parallel
      setAnalysisStep('analyzing');

      const [businessResponse, codeResponse] = await Promise.all([
        fetch('/api/analyze-business', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(businessInput),
        }),
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repo_url: repoUrl || undefined,
            files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
            project_description: description,
          }),
        }),
      ]);

      const businessData: BusinessAnalyzeResponse = await businessResponse.json();
      const codeData: AnalyzeResponse = await codeResponse.json();

      // Check for errors
      if (!businessData.success) {
        setError(businessData.error || 'Ошибка анализа бизнеса');
        setAnalysisStep('error');
        return;
      }
      if (!codeData.success) {
        setError(codeData.error || 'Ошибка анализа кода');
        setAnalysisStep('error');
        return;
      }

      // Save intermediate results
      setBusinessResult(businessData);
      setPersistedResult(codeData);

      // Step 2: Run gap detection if we have both canvas and analysis
      if (businessData.canvas && codeData.analysis) {
        setAnalysisStep('generating');

        // Include competitors if provided
        const validCompetitors = competitors.filter((c) => c.name.trim());

        const gapResponse = await fetch('/api/analyze-gaps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canvas: businessData.canvas,
            code_analysis: codeData.analysis,
            competitors: validCompetitors.length > 0 ? validCompetitors : undefined,
          }),
        });

        const gapData: GapAnalyzeResponse = await gapResponse.json();

        if (!gapData.success) {
          setError(gapData.error || 'Ошибка анализа разрывов');
          setAnalysisStep('error');
          return;
        }

        setGapResult(gapData);

        // Save to project if enabled - save the gap result for full analysis
        if (saveToProject && selectedProjectId) {
          await saveAnalysisToProject(selectedProjectId, 'full', gapData);
        }
      }

      setAnalysisStep('complete');
    } catch (err) {
      setError('Не удалось выполнить запрос');
      setAnalysisStep('error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // Competitor Analysis Handler
  // ===========================================

  const handleCompetitorAnalyze = async () => {
    // Validate inputs
    const validCompetitors = competitors.filter((c) => c.name.trim());
    if (validCompetitors.length === 0) {
      setError('Добавьте хотя бы одного конкурента');
      return;
    }

    setLoading(true);
    setError(null);
    setCompetitorResult(null);
    setAnalysisStep('fetching');

    try {
      setTimeout(() => setAnalysisStep('analyzing'), 500);

      const response = await fetch('/api/analyze-competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitors: validCompetitors,
          canvas: businessResult?.canvas || null,
          product_description: businessInput.description || description || '',
        }),
      });

      setAnalysisStep('generating');

      const data: CompetitorAnalyzeResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Ошибка анализа конкурентов');
        setAnalysisStep('error');
      } else {
        setCompetitorResult(data);
        setAnalysisStep('complete');

        // Save to project if enabled
        if (saveToProject && selectedProjectId) {
          await saveAnalysisToProject(selectedProjectId, 'competitor', data);
        }
      }
    } catch (err) {
      setError('Не удалось выполнить запрос');
      setAnalysisStep('error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // Handle clarification answers
  // ===========================================

  const handleClarificationSubmit = async (answers: Record<string, string>) => {
    // Add answers to description and re-analyze
    const answersText = Object.entries(answers)
      .map(([, answer]) => `\n\n[Уточнение: ${answer}]`)
      .join('');

    setBusinessInput((prev) => ({
      ...prev,
      description: prev.description + answersText,
    }));

    // Clear result and re-analyze
    setBusinessResult(null);
    await handleBusinessAnalyze();
  };

  // ===========================================
  // Main Analyze Handler
  // ===========================================

  const handleAnalyze = () => {
    if (analysisMode === 'code') {
      handleCodeAnalyze();
    } else if (analysisMode === 'business') {
      handleBusinessAnalyze();
    } else if (analysisMode === 'full') {
      handleFullAnalyze();
    } else if (analysisMode === 'competitor') {
      handleCompetitorAnalyze();
    }
  };

  // Check if can submit
  const canSubmit =
    analysisMode === 'code'
      ? (repoUrl || uploadedFiles.length > 0) && description.trim()
      : analysisMode === 'business'
      ? businessInput.description.length >= 50
      : analysisMode === 'full'
      ? businessInput.description.length >= 50 &&
        (repoUrl || uploadedFiles.length > 0) &&
        description.trim()
      : analysisMode === 'competitor'
      ? competitors.filter((c) => c.name.trim()).length > 0
      : false;

  // Has any result
  const hasCodeResult = codeResult && codeResult.success;
  const hasBusinessResult = businessResult && businessResult.success;
  const hasGapResult = gapResult && gapResult.success;
  const hasCompetitorResult = competitorResult && competitorResult.success;
  const hasAnyResult = hasCodeResult || hasBusinessResult || hasGapResult || hasCompetitorResult;

  return (
    <div className="container">
      {/* Header */}
      <div className="header-row">
        <h1>Business & Code Analyzer</h1>
        <div className="header-actions">
          {(hasAnyResult || description || repoUrl || businessInput.description) && (
            <button className="clear-btn" onClick={handleClearAll} title="Очистить все данные">
              Очистить
            </button>
          )}
          <UserNav />
        </div>
      </div>
      <p className="subtitle">
        Ультимативная платформа для улучшения бизнеса
      </p>

      {/* Mode Selector */}
      <AnalysisModeSelector
        selectedMode={analysisMode}
        onModeChange={setAnalysisMode}
        disabled={loading}
      />

      {/* Forms - only show when mode is selected */}
      {analysisMode && (
        <>
          {/* Business Input Form */}
          {analysisMode === 'business' && (
            <div className="form-card">
              <div className="form-card-header">
                <h3>📊 Информация о бизнесе</h3>
              </div>
              <div className="form-card-content">
                <BusinessInputForm
                  value={businessInput}
                  onChange={setBusinessInput}
                  onError={setError}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Code Input Form */}
          {analysisMode === 'code' && (
            <div className="form-card">
              <div className="form-card-header">
                <h3>💻 Код проекта</h3>
              </div>
              <div className="form-card-content">
                {/* GitHub URL */}
                <div className="form-group">
                  <label htmlFor="repo-url">GitHub URL</label>
                  <input
                    id="repo-url"
                    type="text"
                    placeholder="https://github.com/username/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    disabled={uploadedFiles.length > 0 || loading}
                  />
                </div>

                <div className="divider">
                  <span>или</span>
                </div>

                {/* File Upload */}
                <UploadForm
                  files={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                  onError={setError}
                  disabled={loading}
                />

                {/* Project Description */}
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label htmlFor="description">Опишите свой проект</label>
                  <textarea
                    id="description"
                    placeholder="Чем занимается твой проект? Какую проблему решает? Кто целевая аудитория?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Full Analysis Form */}
          {analysisMode === 'full' && (
            <>
              {/* Business Section */}
              <div className="form-card step-card">
                <div className="form-card-header">
                  <h3>📊 Шаг 1: Бизнес</h3>
                  <span className="form-card-badge">Обязательно</span>
                </div>
                <div className="form-card-content">
                  <BusinessInputForm
                    value={businessInput}
                    onChange={setBusinessInput}
                    onError={setError}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Code Section */}
              <div className="form-card step-card">
                <div className="form-card-header">
                  <h3>💻 Шаг 2: Код</h3>
                  <span className="form-card-badge">Обязательно</span>
                </div>
                <div className="form-card-content">
                  {/* GitHub URL */}
                  <div className="form-group">
                    <label htmlFor="repo-url-full">GitHub URL</label>
                    <input
                      id="repo-url-full"
                      type="text"
                      placeholder="https://github.com/username/repo"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      disabled={uploadedFiles.length > 0 || loading}
                    />
                  </div>

                  <div className="divider">
                    <span>или</span>
                  </div>

                  {/* File Upload */}
                  <UploadForm
                    files={uploadedFiles}
                    onFilesChange={setUploadedFiles}
                    onError={setError}
                    disabled={loading}
                  />

                  {/* Project Description */}
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label htmlFor="description-full">Опишите свой проект</label>
                    <textarea
                      id="description-full"
                      placeholder="Чем занимается твой проект? Какую проблему решает?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Competitors Section - Optional */}
              <div className="form-card step-card optional">
                <div className="form-card-header">
                  <h3>🎯 Шаг 3: Конкуренты</h3>
                  <span className="form-card-badge optional">Опционально</span>
                </div>
                <div className="form-card-content">
                  <p className="form-hint">
                    Добавьте конкурентов для более точного анализа разрывов и позиционирования.
                  </p>
                  <CompetitorInputForm
                    competitors={competitors}
                    onChange={setCompetitors}
                    disabled={loading}
                    maxCompetitors={10}
                  />
                </div>
              </div>
            </>
          )}

          {/* Competitor Analysis Form */}
          {analysisMode === 'competitor' && (
            <div className="form-card">
              <div className="form-card-header">
                <h3>🎯 Анализ конкурентов</h3>
              </div>
              <div className="form-card-content">
                <p className="form-hint">
                  Добавьте конкурентов для сравнительного анализа. Система проанализирует их
                  сайты и сравнит с вашим продуктом.
                </p>

                {/* Optional: Your product description */}
                <div className="form-group">
                  <label htmlFor="competitor-product">Опишите ваш продукт (опционально)</label>
                  <textarea
                    id="competitor-product"
                    placeholder="Кратко опишите ваш продукт для более точного сравнения..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    rows={3}
                  />
                </div>

                {/* Competitor Input Form */}
                <CompetitorInputForm
                  competitors={competitors}
                  onChange={setCompetitors}
                  disabled={loading}
                  maxCompetitors={5}
                />
              </div>
            </div>
          )}

          {/* Save to Project Toggle */}
          {isAuthenticated && userProjects.length > 0 && (
            <div className="save-to-project-section">
              <label className="save-toggle">
                <input
                  type="checkbox"
                  checked={saveToProject}
                  onChange={(e) => setSaveToProject(e.target.checked)}
                  disabled={loading}
                />
                <span className="toggle-label">Сохранить в проект</span>
              </label>

              {saveToProject && (
                <select
                  className="project-selector"
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(e.target.value || null)}
                  disabled={loading}
                >
                  <option value="">Выберите проект...</option>
                  {userProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="submit-section">
            <button
              className="submit-btn"
              onClick={handleAnalyze}
              disabled={loading || !canSubmit || (saveToProject && !selectedProjectId)}
            >
              {loading
                ? analysisMode === 'full'
                  ? 'Полный анализ...'
                  : analysisMode === 'competitor'
                  ? 'Анализ конкурентов...'
                  : 'Анализирую...'
                : analysisMode === 'full'
                ? '⚡ Запустить полный анализ'
                : analysisMode === 'competitor'
                ? '🎯 Анализировать конкурентов'
                : '🚀 Анализировать'}
            </button>

            {/* Saved to project notification */}
            {savedToProjectMessage && (
              <div className="saved-notification">
                ✅ {savedToProjectMessage}
              </div>
            )}

            {/* Saving indicator */}
            {savingToProject && (
              <div className="saving-indicator">
                💾 Сохранение в проект...
              </div>
            )}
          </div>
        </>
      )}

      {/* Error */}
      {error && <div className="error">{error}</div>}

      {/* Progress Indicator */}
      <ProgressIndicator currentStep={analysisStep} />

      {/* Loading Spinner (fallback) */}
      {loading && analysisStep === 'idle' && (
        <div className="loading">
          <div className="spinner" />
        </div>
      )}

      {/* Business Results */}
      {businessResult && analysisMode === 'business' && (
        <div className="results">
          {/* Clarification Questions */}
          {businessResult.needs_clarification && businessResult.questions && (
            <ClarificationQuestions
              questions={businessResult.questions}
              onSubmit={handleClarificationSubmit}
              disabled={loading}
            />
          )}

          {/* Canvas View */}
          {businessResult.canvas && (
            <CanvasView
              canvas={businessResult.canvas}
              businessStage={businessResult.business_stage}
              gapsInModel={businessResult.gaps_in_model}
              recommendations={businessResult.recommendations}
            />
          )}

          {/* Metadata */}
          {businessResult.metadata && (
            <div className="metadata">
              <span>Документов: {businessResult.metadata.documents_parsed}</span>
              <span>Символов: {businessResult.metadata.total_text_length}</span>
              <span>Токенов: {businessResult.metadata.tokens_used}</span>
              <span>Время: {businessResult.metadata.analysis_duration_ms}ms</span>
            </div>
          )}
        </div>
      )}

      {/* Code Results (existing) */}
      {codeResult && analysisMode === 'code' && (
        <div className="results">
          {/* Questions */}
          {codeResult.needs_clarification && codeResult.questions && (
            <div className="questions">
              <h3>Нужна дополнительная информация</h3>
              {codeResult.questions.map((q, i) => (
                <div key={i} className="question-item">
                  <p className="question-text">{q.question}</p>
                  <p className="question-why">{q.why}</p>
                </div>
              ))}
            </div>
          )}

          {/* Analysis */}
          {codeResult.analysis ? (
            <AnalysisView analysis={codeResult.analysis} />
          ) : codeResult.partial_analysis ? (
            // Show partial analysis if full analysis is not available
            <div className="partial-analysis">
              <h3>📋 Частичный анализ</h3>
              <p><strong>Стадия:</strong> {codeResult.partial_analysis.detected_stage}</p>
              <p><strong>Резюме:</strong> {codeResult.partial_analysis.project_summary}</p>
              {codeResult.partial_analysis.tech_stack.length > 0 && (
                <p><strong>Технологии:</strong> {codeResult.partial_analysis.tech_stack.join(', ')}</p>
              )}
              <p className="hint">Ответьте на вопросы выше для получения полного анализа.</p>
            </div>
          ) : codeResult.success && !codeResult.needs_clarification ? (
            <div className="analysis-error">
              <h3>⚠️ Анализ не выполнен</h3>
              <p>LLM не смог сгенерировать анализ. Возможные причины:</p>
              <ul>
                <li>Слишком большой или сложный проект</li>
                <li>Недостаточно токенов для полного ответа</li>
                <li>Временная ошибка API</li>
              </ul>
              <p>Попробуйте запустить анализ ещё раз или уменьшить размер проекта.</p>
              {/* Debug info */}
              <details style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <summary>Техническая информация</summary>
                <pre style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'auto', maxHeight: '400px' }}>
                  {JSON.stringify({
                    needs_clarification: codeResult.needs_clarification,
                    has_questions: !!codeResult.questions?.length,
                    has_partial: !!codeResult.partial_analysis,
                    has_analysis: !!codeResult.analysis,
                  }, null, 2)}
                </pre>
                {/* Show raw LLM response if available */}
                {(codeResult as { _debug?: { llm_response_length: number; llm_response_preview: string; llm_response_end: string } })._debug && (
                  <>
                    <p style={{ marginTop: '12px', fontWeight: 'bold' }}>Сырой ответ LLM ({(codeResult as { _debug: { llm_response_length: number } })._debug.llm_response_length} символов):</p>
                    <pre style={{ marginTop: '4px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'auto', maxHeight: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {(codeResult as { _debug: { llm_response_preview: string } })._debug.llm_response_preview}
                    </pre>
                    <p style={{ marginTop: '8px', fontWeight: 'bold' }}>Конец ответа:</p>
                    <pre style={{ marginTop: '4px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'auto', maxHeight: '200px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {(codeResult as { _debug: { llm_response_end: string } })._debug.llm_response_end}
                    </pre>
                  </>
                )}
              </details>
            </div>
          ) : null}

          {/* Export Buttons */}
          <ExportButtons result={codeResult} />

          {/* Metadata */}
          <div className="metadata">
            <span>
              Файлов: {codeResult.metadata.files_analyzed}
              {codeResult.metadata.files_total &&
              codeResult.metadata.files_total > codeResult.metadata.files_analyzed
                ? ` / ${codeResult.metadata.files_total}`
                : ''}
            </span>
            {codeResult.metadata.files_truncated ? (
              <span>Усечено: {codeResult.metadata.files_truncated}</span>
            ) : null}
            <span>Строк: {codeResult.metadata.total_lines}</span>
            <span>Токенов: {codeResult.metadata.tokens_used}</span>
            <span>
              Время: {codeResult.metadata.analysis_duration_ms}ms
              {codeResult.metadata.cached ? ' (кэш)' : ''}
            </span>
          </div>

          {/* Chat */}
          {codeResult.analysis && (
            <ChatSection analysis={codeResult.analysis} onError={setError} />
          )}
        </div>
      )}

      {/* Competitor Analysis Results */}
      {competitorResult && analysisMode === 'competitor' && (
        <div className="results">
          <CompetitorComparisonView result={competitorResult} />
        </div>
      )}

      {/* Full Analysis Results */}
      {analysisMode === 'full' && (hasBusinessResult || hasCodeResult || hasGapResult) && (
        <div className="results full-results">
          {/* Gap Detection Results */}
          {gapResult && (
            <>
              <div className="full-results-header">
                <h3>Результаты анализа</h3>
              </div>

              {/* Verdict */}
              {gapResult.verdict && (
                <VerdictBadge
                  verdict={gapResult.verdict}
                  explanation={gapResult.verdict_explanation}
                  size="large"
                />
              )}

              {/* Alignment Score */}
              {typeof gapResult.alignment_score === 'number' && (
                <div className="score-section">
                  <AlignmentScore score={gapResult.alignment_score} />
                </div>
              )}

              {/* Gaps */}
              {gapResult.gaps && gapResult.gaps.length > 0 && (
                <GapsView
                  gaps={gapResult.gaps}
                  tasks={gapResult.tasks}
                  nextMilestone={gapResult.next_milestone}
                />
              )}
            </>
          )}

          {/* Business Canvas (collapsible) */}
          {businessResult?.canvas && (
            <details className="results-section">
              <summary>📊 Business Canvas</summary>
              <CanvasView
                canvas={businessResult.canvas}
                businessStage={businessResult.business_stage}
                gapsInModel={businessResult.gaps_in_model}
                recommendations={businessResult.recommendations}
              />
            </details>
          )}

          {/* Code Analysis (collapsible) */}
          {codeResult?.analysis && (
            <details className="results-section">
              <summary>💻 Анализ кода</summary>
              <AnalysisView analysis={codeResult.analysis} />
            </details>
          )}

          {/* Metadata */}
          <div className="metadata">
            {businessResult?.metadata && (
              <span>Бизнес: {businessResult.metadata.analysis_duration_ms}ms</span>
            )}
            {codeResult?.metadata && (
              <span>Код: {codeResult.metadata.analysis_duration_ms}ms</span>
            )}
            {gapResult?.metadata && (
              <span>Gaps: {gapResult.metadata.analysis_duration_ms}ms</span>
            )}
          </div>

          {/* Chat */}
          {codeResult?.analysis && (
            <ChatSection analysis={codeResult.analysis} onError={setError} />
          )}
        </div>
      )}

      {/* FAQ Section - always visible at bottom */}
      <div className="faq-section-wrapper">
        <h2 className="faq-section-title">Частые вопросы</h2>
        <FAQList items={FAQ_ITEMS} allowMultiple={true} />
      </div>

      <style jsx>{`
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .clear-btn {
          padding: 6px 12px;
          font-size: 13px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          border-radius: 6px;
          cursor: pointer;
        }
        .clear-btn:hover {
          background: rgba(248, 81, 73, 0.15);
          border-color: var(--accent-red);
          color: var(--accent-red);
        }

        /* Form Cards */
        .form-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .form-card.step-card {
          margin-bottom: 24px;
          border: 2px solid var(--border-default);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .form-card.step-card.optional {
          border-style: dashed;
          opacity: 0.9;
        }
        .form-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-default);
        }
        .form-card.step-card .form-card-header {
          background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
          padding: 20px 24px;
        }
        .form-card-header h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        .form-card.step-card .form-card-header h3 {
          font-size: 17px;
        }
        .form-card-badge {
          font-size: 11px;
          padding: 4px 10px;
          background: rgba(88, 166, 255, 0.15);
          color: var(--accent-blue);
          border-radius: 4px;
          font-weight: 500;
        }
        .form-card-badge.optional {
          background: rgba(139, 148, 158, 0.15);
          color: var(--text-muted);
        }
        .form-card-content {
          padding: 20px;
        }
        .form-hint {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        /* Save to Project Section */
        .save-to-project-section {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .save-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }
        .save-toggle input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--accent-blue);
          cursor: pointer;
        }
        .toggle-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .project-selector {
          flex: 1;
          max-width: 300px;
          padding: 10px 14px;
          font-size: 14px;
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          color: var(--text-primary);
          cursor: pointer;
        }
        .project-selector:focus {
          outline: none;
          border-color: var(--accent-blue);
        }
        .project-selector option {
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        /* Submit Section */
        .submit-section {
          margin-top: 8px;
        }
        .saved-notification {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(63, 185, 80, 0.15);
          border: 1px solid var(--accent-green);
          border-radius: 6px;
          color: var(--accent-green);
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }
        .saving-indicator {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(88, 166, 255, 0.15);
          border: 1px solid var(--accent-blue);
          border-radius: 6px;
          color: var(--accent-blue);
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .submit-btn {
          width: 100%;
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 600;
          background: var(--accent-green);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          background: #2ea043;
          transform: translateY(-1px);
        }
        .submit-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-muted);
          cursor: not-allowed;
          transform: none;
        }

        .full-results {
          margin-top: 24px;
        }
        .full-results-header {
          margin-bottom: 24px;
        }
        .full-results-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        .score-section {
          margin: 24px 0;
        }
        .results-section {
          margin: 24px 0;
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
        }
        .results-section summary {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          padding: 8px 0;
        }
        .results-section summary:hover {
          color: var(--accent-blue);
        }
        .results-section[open] summary {
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-default);
          padding-bottom: 12px;
        }

        /* FAQ Section */
        .faq-section-wrapper {
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid var(--border-default);
        }
        .faq-section-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 24px 0;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Wrapper with Suspense for useSearchParams
// ===========================================

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="container">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            margin: '0 auto',
            border: '3px solid var(--border-default)',
            borderTopColor: 'var(--accent-blue)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </div>
    }>
      <Home />
    </Suspense>
  );
}
