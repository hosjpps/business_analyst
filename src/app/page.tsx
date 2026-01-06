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
import { GitHubExportButton } from '@/components/export/GitHubExportButton';
import type { ExportTask } from '@/types/github-issues';
import { AnalysisModeSelector, type AnalysisMode } from '@/components/forms/AnalysisModeSelector';
import { BusinessInputForm } from '@/components/forms/BusinessInputForm';
import { CompetitorInputForm } from '@/components/forms/CompetitorInputForm';
import { AnalysisWizard, type AnalysisWizardData } from '@/components/forms/AnalysisWizard';
import { CanvasView } from '@/components/results/CanvasView';
import { TrendsChart } from '@/components/results/TrendsChart';
import type { TrendResult } from '@/types/trends';
import { ClarificationQuestions } from '@/components/forms/ClarificationQuestions';
import { GapsView } from '@/components/results/GapsView';
import { AlignmentScore } from '@/components/results/AlignmentScore';
import { MultiMetricScore } from '@/components/results/MultiMetricScore';
import { VerdictBadge } from '@/components/results/VerdictBadge';
import { CompetitorComparisonView } from '@/components/results/CompetitorComparisonView';
import { UserNav } from '@/components/UserNav';
import { QuickStart } from '@/components/onboarding/QuickStart';
import { FAQList } from '@/components/ui/FAQ';
import {
  SkeletonScore,
  SkeletonCanvas,
  SkeletonGaps,
  SkeletonAnalysisResults,
} from '@/components/ui/Skeleton';
import { DemoButton, DemoScenarioSelector, DemoBadge } from '@/components/demo';
import type { DemoScenarioInfo, DemoScenarioId, DemoLimitResult } from '@/types/demo';
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

  // Project saving state (saveToProject defaults to true when authenticated with projects)
  const [userProjects, setUserProjects] = useState<SimpleProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [saveToProject, setSaveToProject] = useState(true); // Default ON - user must choose project or disable
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
            const projects = data.projects.map((p: { id: string; name: string }) => ({
              id: p.id,
              name: p.name
            }));
            setUserProjects(projects);

            // Auto-select first project if only one exists and no project param in URL
            if (projects.length === 1 && !projectParam) {
              setSelectedProjectId(projects[0].id);
            }
          }
        } catch (err) {
          console.error('Failed to load projects:', err);
        }
      } else {
        // Not authenticated - disable save by default
        setSaveToProject(false);
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

  // Google Trends state (S3-01)
  const [trendsResults, setTrendsResults] = useState<TrendResult[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);

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

  // Wizard mode for full analysis (default enabled)
  const [useWizardMode, setUseWizardMode] = useState(true);

  // Demo Mode state
  const [isDemo, setIsDemo] = useState(false);
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const [demoScenarios, setDemoScenarios] = useState<DemoScenarioInfo[]>([]);
  const [demoRemaining, setDemoRemaining] = useState(3);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoScenarioName, setDemoScenarioName] = useState<string | null>(null);

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
    setTrendsResults([]);
    setError(null);
    setAnalysisStep('idle');
    setAnalysisMode(null);
    // Clear demo state
    setIsDemo(false);
    setDemoScenarioName(null);
    setShowDemoSelector(false);
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

    // Validate project selection if saving is enabled
    if (saveToProject && !selectedProjectId) {
      setError('Выберите проект для сохранения или отключите сохранение');
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

    // Validate project selection if saving is enabled
    if (saveToProject && !selectedProjectId) {
      setError('Выберите проект для сохранения или отключите сохранение');
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

  const handleFullAnalyze = async (wizardData?: AnalysisWizardData) => {
    // Use wizard data if provided, otherwise use current state
    const bInput = wizardData?.businessInput || businessInput;
    const rUrl = wizardData?.repoUrl || repoUrl;
    const uFiles = wizardData?.uploadedFiles || uploadedFiles;
    const desc = wizardData?.description || description;
    const comps = wizardData?.competitors || competitors;

    // Update state from wizard data (for UI consistency)
    if (wizardData) {
      setBusinessInput(wizardData.businessInput);
      setRepoUrl(wizardData.repoUrl);
      setUploadedFiles(wizardData.uploadedFiles);
      setDescription(wizardData.description);
      setCompetitors(wizardData.competitors);
    }

    // Validate both inputs
    if (bInput.description.length < 50) {
      setError('Описание бизнеса должно быть минимум 50 символов');
      return;
    }
    if (!rUrl && uFiles.length === 0) {
      setError('Укажите GitHub URL или загрузите файлы');
      return;
    }
    // Validate project selection if saving is enabled
    if (saveToProject && !selectedProjectId) {
      setError('Выберите проект для сохранения или отключите сохранение');
      return;
    }
    // In Full Analysis mode, use business description for code analysis (no separate project description needed)

    setLoading(true);
    setError(null);
    setBusinessResult(null);
    setPersistedResult(null);
    setGapResult(null);
    setCompetitorResult(null);
    setAnalysisStep('uploading');

    try {
      // ===========================================
      // PROGRESSIVE ANALYSIS: Show results as they complete
      // ===========================================

      // Step 1: Start Business Analysis first (shows Canvas immediately)
      setAnalysisStep('analyzing');

      const businessResponse = await fetch('/api/analyze-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bInput),
      });

      const businessData: BusinessAnalyzeResponse = await businessResponse.json();

      if (!businessData.success) {
        setError(businessData.error || 'Ошибка анализа бизнеса');
        setAnalysisStep('error');
        return;
      }

      // PROGRESSIVE: Show Business Canvas immediately
      setBusinessResult(businessData);

      // Step 2: Start Code Analysis (parallel with Trends if any)
      setAnalysisStep('fetching');

      const codeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: rUrl || undefined,
          files: uFiles.length > 0 ? uFiles : undefined,
          // Use business description for code analysis in Full Analysis mode
          project_description: bInput.description,
        }),
      });

      const codeData: AnalyzeResponse = await codeResponse.json();

      if (!codeData.success) {
        setError(codeData.error || 'Ошибка анализа кода');
        setAnalysisStep('error');
        return;
      }

      // PROGRESSIVE: Show Code Analysis immediately
      setPersistedResult(codeData);

      // Step 2: Run gap detection if we have both canvas and analysis
      if (businessData.canvas && codeData.analysis) {
        setAnalysisStep('generating');

        // Include competitors if provided - sanitize and transform data
        const validCompetitors = comps
          .filter((c) => c.name.trim())
          .map((c) => {
            // Transform social_links array to object format expected by API
            const socialLinksObj: Record<string, string> = {};
            if (Array.isArray(c.social_links)) {
              c.social_links.forEach((link: { url?: string; platform?: string }) => {
                if (link.url && link.platform) {
                  socialLinksObj[link.platform] = link.url;
                }
              });
            }

            return {
              name: c.name,
              url: c.url?.trim() || undefined,
              notes: c.notes,
              // Use socials field which accepts Record<string, string>
              socials: Object.keys(socialLinksObj).length > 0 ? socialLinksObj : undefined,
            };
          });

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

        // Step 3: Run competitor analysis if competitors provided
        if (validCompetitors.length > 0 && businessData.canvas) {
          try {
            const competitorResponse = await fetch('/api/analyze-competitors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                canvas: businessData.canvas,
                product_description: bInput.description,
                competitors: validCompetitors,
              }),
            });

            const competitorData: CompetitorAnalyzeResponse = await competitorResponse.json();

            if (competitorData.success) {
              setCompetitorResult(competitorData);
            }
            // Don't fail the whole analysis if competitor analysis fails - just log and continue
          } catch (competitorErr) {
            console.error('Competitor analysis failed:', competitorErr);
          }
        }

        // Save to project if enabled - save the gap result for full analysis
        if (saveToProject && selectedProjectId) {
          await saveAnalysisToProject(selectedProjectId, 'full', gapData);
        }
      } else if (codeData.needs_clarification && codeData.questions && codeData.questions.length > 0) {
        // Code analysis needs clarification - show questions to user
        console.log('[Full Analysis] Code analysis needs clarification:', {
          needs_clarification: codeData.needs_clarification,
          questions_count: codeData.questions.length,
          questions: codeData.questions.map(q => q.question),
          has_partial_analysis: !!codeData.partial_analysis,
        });
        // Don't proceed to gap detection - wait for user to answer questions
        // The UI will show ClarificationQuestions component based on codeResult state
      } else if (!codeData.analysis) {
        // No analysis and no clarification needed - something went wrong
        console.warn('[Full Analysis] Code analysis returned no analysis and no clarification:', {
          needs_clarification: codeData.needs_clarification,
          has_questions: !!codeData.questions?.length,
          has_partial_analysis: !!codeData.partial_analysis,
        });
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

    // Validate project selection if saving is enabled
    if (saveToProject && !selectedProjectId) {
      setError('Выберите проект для сохранения или отключите сохранение');
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
  // Fetch Google Trends (S3-01)
  // ===========================================

  const fetchTrends = useCallback(async (keywords: string[], geo = '', timeRange = 'past_year') => {
    if (keywords.length === 0) return;

    setTrendsLoading(true);
    try {
      const response = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, geo, timeRange }),
      });

      const data = await response.json();
      if (data.success && data.results) {
        setTrendsResults(data.results);
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  // Extract keywords from business description for trends
  const extractKeywordsForTrends = useCallback((canvas: BusinessAnalyzeResponse['canvas']) => {
    if (!canvas) return [];

    // Generic/stopwords to filter out (Russian and English)
    const stopwords = new Set([
      'платформа', 'сервис', 'приложение', 'система', 'решение', 'инструмент',
      'открытый', 'альтернатива', 'бесплатный', 'простой', 'удобный',
      'пользователь', 'клиент', 'бизнес', 'компания', 'команда',
      'platform', 'service', 'application', 'system', 'solution', 'tool',
      'open', 'source', 'free', 'simple', 'easy', 'user', 'customer',
      'business', 'company', 'team', 'для', 'это', 'который', 'позволяет'
    ]);

    const keywords: string[] = [];

    // Extract meaningful phrases from key_activities (best source for what the product does)
    if (canvas.key_activities?.length > 0) {
      for (const activity of canvas.key_activities.slice(0, 2)) {
        // Extract 2-3 word phrases
        const words = activity.toLowerCase().split(/[\s,—–-]+/).filter(w =>
          w.length > 3 && !stopwords.has(w)
        );
        if (words.length >= 2) {
          keywords.push(words.slice(0, 2).join(' '));
        } else if (words[0]) {
          keywords.push(words[0]);
        }
      }
    }

    // Extract from value proposition - look for product category/type
    if (canvas.value_proposition && keywords.length < 2) {
      const vpWords = canvas.value_proposition.toLowerCase()
        .split(/[\s,—–-]+/)
        .filter(w => w.length > 4 && !stopwords.has(w));

      // Find meaningful noun phrases (skip first few generic words)
      for (const word of vpWords.slice(0, 5)) {
        if (!keywords.includes(word) && keywords.length < 3) {
          keywords.push(word);
        }
      }
    }

    // Extract target audience from customer_segments
    if (canvas.customer_segments?.length > 0 && keywords.length < 3) {
      const segment = canvas.customer_segments[0].toLowerCase();
      const segmentWords = segment.split(/[\s,—–-]+/).filter(w =>
        w.length > 4 && !stopwords.has(w) && !keywords.includes(w)
      );
      if (segmentWords[0]) {
        keywords.push(segmentWords[0]);
      }
    }

    // Ensure we have at least one keyword - use channels as fallback
    if (keywords.length === 0 && canvas.channels?.length > 0) {
      const channel = canvas.channels[0].toLowerCase();
      const channelWords = channel.split(/[\s,]+/).filter(w => w.length > 3);
      if (channelWords[0]) keywords.push(channelWords[0]);
    }

    return keywords.slice(0, 3);
  }, []);

  // Auto-fetch trends when business canvas is available
  useEffect(() => {
    if (businessResult?.canvas && trendsResults.length === 0 && !trendsLoading) {
      const keywords = extractKeywordsForTrends(businessResult.canvas);
      if (keywords.length > 0) {
        fetchTrends(keywords);
      }
    }
  }, [businessResult?.canvas, trendsResults.length, trendsLoading, extractKeywordsForTrends, fetchTrends]);

  // ===========================================
  // Demo Mode Handlers
  // ===========================================

  // Fetch demo scenarios on button click
  const handleOpenDemoSelector = useCallback(async () => {
    setShowDemoSelector(true);

    try {
      const response = await fetch('/api/demo/analyze');
      const data = await response.json();

      if (data.success) {
        setDemoScenarios(data.scenarios);
        setDemoRemaining(data.remaining);
      }
    } catch (err) {
      console.error('Failed to fetch demo scenarios:', err);
    }
  }, []);

  // Handle demo scenario selection
  const handleDemoSelect = useCallback(async (scenarioId: DemoScenarioId) => {
    setDemoLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/demo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Ошибка демо-анализа');
        return;
      }

      // Set demo mode flag
      setIsDemo(true);
      setShowDemoSelector(false);
      setDemoScenarioName(data.scenarioInfo?.name || null);

      // Update remaining demos
      if (data.demoLimit) {
        setDemoRemaining(data.demoLimit.remaining);
      }

      // Set all results from demo data
      setBusinessResult(data.businessResult);
      setPersistedResult(data.codeResult);
      setGapResult(data.gapResult);
      setCompetitorResult(data.competitorResult);

      // Set analysis mode to full to show all results
      setAnalysisMode('full');
      setAnalysisStep('complete');

    } catch (err) {
      console.error('Failed to load demo:', err);
      setError('Не удалось загрузить демо-анализ');
    } finally {
      setDemoLoading(false);
    }
  }, [setPersistedResult]);

  // Clear demo state when clearing all
  const clearDemoState = useCallback(() => {
    setIsDemo(false);
    setDemoScenarioName(null);
    setShowDemoSelector(false);
  }, []);

  // Handle CTA click from demo badge - go back to real analysis
  const handleDemoCtaClick = useCallback(() => {
    clearDemoState();
    handleClearAll();
  }, [clearDemoState, handleClearAll]);

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
  // Handle Full Analysis Clarification (for code questions)
  // ===========================================

  const handleFullAnalysisClarification = async (answers: Record<string, string>) => {
    // Add answers to project description
    const answersText = Object.entries(answers)
      .map(([questionId, answer]) => {
        const question = codeResult?.questions?.find(q => q.id === questionId);
        return `\n\n[Уточнение к "${question?.question || questionId}"]: ${answer}`;
      })
      .join('');

    const updatedDescription = description + answersText;
    setDescription(updatedDescription);

    setLoading(true);
    setError(null);
    setAnalysisStep('analyzing');

    try {
      // Re-run code analysis with clarification answers
      const codeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl || undefined,
          files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
          project_description: updatedDescription,
        }),
      });

      const newCodeData: AnalyzeResponse = await codeResponse.json();

      if (!newCodeData.success) {
        setError(newCodeData.error || 'Ошибка анализа кода');
        setAnalysisStep('error');
        return;
      }

      setPersistedResult(newCodeData);

      // If we now have analysis AND canvas - run gap detection
      if (newCodeData.analysis && businessResult?.canvas) {
        setAnalysisStep('generating');

        // Sanitize competitors - transform social_links array to object
        const validCompetitors = competitors
          .filter((c) => c.name.trim())
          .map((c) => {
            // Transform social_links array to object format expected by API
            const socialLinksObj: Record<string, string> = {};
            if (Array.isArray(c.social_links)) {
              c.social_links.forEach((link: { url?: string; platform?: string }) => {
                if (link.url && link.platform) {
                  socialLinksObj[link.platform] = link.url;
                }
              });
            }

            return {
              name: c.name,
              url: c.url?.trim() || undefined,
              notes: c.notes,
              socials: Object.keys(socialLinksObj).length > 0 ? socialLinksObj : undefined,
            };
          });

        const gapResponse = await fetch('/api/analyze-gaps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canvas: businessResult.canvas,
            code_analysis: newCodeData.analysis,
            competitors: validCompetitors.length > 0 ? validCompetitors : undefined,
          }),
        });

        const gapData: GapAnalyzeResponse = await gapResponse.json();

        if (gapData.success) {
          setGapResult(gapData);

          // Save to project if enabled
          if (saveToProject && selectedProjectId) {
            await saveAnalysisToProject(selectedProjectId, 'full', gapData);
          }
        } else {
          setError(gapData.error || 'Ошибка анализа разрывов');
          setAnalysisStep('error');
          return;
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
        (repoUrl || uploadedFiles.length > 0)
        // Note: no separate project description needed - uses business description
      : analysisMode === 'competitor'
      ? competitors.filter((c) => c.name.trim()).length > 0
      : false;

  // Validation errors for showing what's missing
  const getValidationErrors = (): string[] => {
    const errors: string[] = [];

    if (analysisMode === 'code') {
      if (!repoUrl && uploadedFiles.length === 0) {
        errors.push('Укажите GitHub URL или загрузите файлы');
      }
      if (!description.trim()) {
        errors.push('Опишите проект (что он делает)');
      }
    } else if (analysisMode === 'business') {
      if (businessInput.description.length < 50) {
        const remaining = 50 - businessInput.description.length;
        errors.push(`Описание бизнеса слишком короткое (ещё ${remaining} символов)`);
      }
    } else if (analysisMode === 'full') {
      if (businessInput.description.length < 50) {
        const remaining = 50 - businessInput.description.length;
        errors.push(`Описание бизнеса слишком короткое (ещё ${remaining} символов)`);
      }
      if (!repoUrl && uploadedFiles.length === 0) {
        errors.push('Укажите GitHub URL или загрузите файлы');
      }
      // Note: project description is taken from business description automatically
    } else if (analysisMode === 'competitor') {
      if (competitors.filter((c) => c.name.trim()).length === 0) {
        errors.push('Добавьте хотя бы одного конкурента');
      }
    }

    // Check project selection if saving
    if (saveToProject && !selectedProjectId) {
      errors.push('Выберите проект для сохранения');
    }

    return errors;
  };

  const validationErrors = getValidationErrors();

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

      {/* Demo Button - show when no results */}
      {!hasAnyResult && !loading && (
        <div className="demo-button-container">
          <DemoButton
            onClick={handleOpenDemoSelector}
            remaining={demoRemaining}
          />
        </div>
      )}

      {/* Demo Scenario Selector Modal */}
      {showDemoSelector && (
        <DemoScenarioSelector
          scenarios={demoScenarios}
          onSelect={handleDemoSelect}
          onClose={() => setShowDemoSelector(false)}
          remaining={demoRemaining}
          isLoading={demoLoading}
        />
      )}

      {/* Demo Badge - show when viewing demo results */}
      {isDemo && hasAnyResult && (
        <DemoBadge
          scenarioName={demoScenarioName || undefined}
          showCTA={true}
          onCTAClick={handleDemoCtaClick}
        />
      )}

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
              {/* Wizard Mode Toggle */}
              <div className="wizard-mode-toggle">
                <button
                  type="button"
                  className={`toggle-btn ${useWizardMode ? 'active' : ''}`}
                  onClick={() => setUseWizardMode(true)}
                >
                  Пошаговый режим
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${!useWizardMode ? 'active' : ''}`}
                  onClick={() => setUseWizardMode(false)}
                >
                  Все поля сразу
                </button>
              </div>

              {/* Wizard Mode */}
              {useWizardMode ? (
                <AnalysisWizard
                  initialData={{
                    businessInput,
                    repoUrl,
                    uploadedFiles,
                    description,
                    competitors,
                  }}
                  onComplete={handleFullAnalyze}
                  disabled={loading}
                />
              ) : (
                <>
                  {/* Classic Mode: Business Section */}
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

                  {/* Classic Mode: Code Section */}
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

                      {/* Note: Project description is taken from business description in Full Analysis */}
                      <p className="form-hint" style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-fg-muted)' }}>
                        💡 Описание проекта будет взято из бизнес-описания (Шаг 1)
                      </p>
                    </div>
                  </div>

                  {/* Classic Mode: Competitors Section - Optional */}
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
                <span className="toggle-switch">
                  <span className="toggle-slider" />
                </span>
                <span className="toggle-label">
                  💾 Сохранить в проект
                  {!saveToProject && <span className="toggle-hint">(отключено)</span>}
                </span>
              </label>

              {saveToProject && (
                <>
                  <select
                    className={`project-selector ${!selectedProjectId ? 'required' : ''}`}
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value || null)}
                    disabled={loading}
                  >
                    <option value="">⚠️ Выберите проект...</option>
                    {userProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {!selectedProjectId && (
                    <p className="project-required-hint">
                      Выберите проект или отключите сохранение
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Submit Button (hidden in wizard mode for full analysis) */}
          {!(analysisMode === 'full' && useWizardMode) && (
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

            {/* Validation errors - show when button is disabled */}
            {!loading && !canSubmit && validationErrors.length > 0 && (
              <div className="validation-errors">
                <span className="validation-icon">ℹ️</span>
                <ul className="validation-list">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          )}

        </>
      )}

      {/* Error */}
      {error && <div className="error">{error}</div>}

      {/* Progress Indicator */}
      <ProgressIndicator currentStep={analysisStep} />

      {/* Loading Skeletons (shows expected result structure) */}
      {loading && (
        <div className="loading-skeletons">
          {analysisMode === 'full' && <SkeletonAnalysisResults />}
          {analysisMode === 'business' && <SkeletonCanvas />}
          {analysisMode === 'code' && (
            <div className="skeleton-code-results">
              <SkeletonGaps />
            </div>
          )}
          {analysisMode === 'competitor' && <SkeletonGaps />}
        </div>
      )}

      {/* Business Results */}
      {businessResult && analysisMode === 'business' && (
        <div className="results animate-fade-in-up">
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

          {/* Google Trends (S3-01) */}
          <TrendsChart
            results={trendsResults}
            onRefresh={fetchTrends}
            isLoading={trendsLoading}
          />

          {/* Export Buttons */}
          <ExportButtons businessResult={businessResult} mode="compact" />

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
        <div className="results animate-fade-in-up">
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
                {(codeResult as unknown as { _debug?: { llm_response_length: number; llm_response_preview: string; llm_response_end: string } })._debug && (
                  <>
                    <p style={{ marginTop: '12px', fontWeight: 'bold' }}>Сырой ответ LLM ({(codeResult as unknown as { _debug: { llm_response_length: number } })._debug.llm_response_length} символов):</p>
                    <pre style={{ marginTop: '4px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'auto', maxHeight: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {(codeResult as unknown as { _debug: { llm_response_preview: string } })._debug.llm_response_preview}
                    </pre>
                    <p style={{ marginTop: '8px', fontWeight: 'bold' }}>Конец ответа:</p>
                    <pre style={{ marginTop: '4px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'auto', maxHeight: '200px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {(codeResult as unknown as { _debug: { llm_response_end: string } })._debug.llm_response_end}
                    </pre>
                  </>
                )}
              </details>
            </div>
          ) : null}

          {/* Export Buttons */}
          <ExportButtons codeResult={codeResult} mode="compact" />

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
            <ChatSection analysis={codeResult.analysis} mode="code" onError={setError} />
          )}
        </div>
      )}

      {/* Competitor Analysis Results */}
      {competitorResult && analysisMode === 'competitor' && (
        <div className="results animate-fade-in-up">
          <CompetitorComparisonView result={competitorResult} />

          {/* Export Buttons */}
          <ExportButtons competitorResult={competitorResult} mode="compact" />
        </div>
      )}

      {/* Full Analysis Results */}
      {analysisMode === 'full' && (hasBusinessResult || hasCodeResult || hasGapResult) && (
        <div className="results full-results animate-fade-in-up">

          {/* CASE 1: Full results available (Gap Detection completed) */}
          {gapResult && (
            <>
              <div className="full-results-header">
                <h3>Результаты анализа</h3>
              </div>

              {/* Multi-Metric Score (includes verdict) */}
              {typeof gapResult.alignment_score === 'number' && gapResult.gaps && gapResult.verdict && (
                <div className="score-section">
                  <MultiMetricScore
                    gaps={gapResult.gaps}
                    alignmentScore={gapResult.alignment_score}
                    verdict={gapResult.verdict}
                    verdictExplanation={gapResult.verdict_explanation}
                  />
                </div>
              )}

              {/* Gaps */}
              {gapResult.gaps && gapResult.gaps.length > 0 && (
                <GapsView
                  gaps={gapResult.gaps}
                  tasks={gapResult.tasks}
                  nextMilestone={gapResult.next_milestone}
                  summary={gapResult.summary}
                  strengths={gapResult.strengths}
                  marketInsights={gapResult.market_insights}
                />
              )}
            </>
          )}

          {/* CASE 2: Code needs clarification - show questions */}
          {!gapResult && codeResult?.needs_clarification === true && codeResult?.questions && codeResult.questions.length > 0 && (
            <div className="clarification-needed-section">
              <div className="full-results-header">
                <h3>⚠️ Требуется уточнение</h3>
              </div>

              <p className="clarification-explanation">
                Для полного анализа нужно уточнить несколько деталей о вашем проекте.
                После ответа мы сможем найти разрывы между бизнесом и кодом.
              </p>

              {/* Partial analysis info if available */}
              {codeResult.partial_analysis && (
                <div className="partial-analysis-info">
                  <h4>Что удалось определить:</h4>
                  <ul>
                    {codeResult.partial_analysis.tech_stack && codeResult.partial_analysis.tech_stack.length > 0 && (
                      <li>Технологии: {codeResult.partial_analysis.tech_stack.join(', ')}</li>
                    )}
                    {codeResult.partial_analysis.detected_stage && (
                      <li>Стадия: {codeResult.partial_analysis.detected_stage}</li>
                    )}
                    {codeResult.partial_analysis.project_summary && (
                      <li>{codeResult.partial_analysis.project_summary}</li>
                    )}
                  </ul>
                </div>
              )}

              <ClarificationQuestions
                questions={codeResult.questions}
                onSubmit={handleFullAnalysisClarification}
                disabled={loading}
              />

              {/* Pending sections indicator */}
              <div className="pending-sections">
                <div className="pending-item">
                  <span className="pending-icon">⏳</span>
                  <span>Поиск разрывов — ожидает ответа</span>
                </div>
                <div className="pending-item">
                  <span className="pending-icon">⏳</span>
                  <span>Задачи на неделю — ожидает ответа</span>
                </div>
              </div>
            </div>
          )}

          {/* CASE 3: needs_clarification is true but questions are missing/empty */}
          {!gapResult && codeResult?.needs_clarification === true && (!codeResult?.questions || codeResult.questions.length === 0) && (
            <div className="analysis-incomplete">
              <h3>⚠️ Требуется дополнительная информация</h3>
              <p>Для анализа нужны уточнения, но система не смогла сформулировать вопросы.</p>
              <p>Попробуйте добавить больше деталей в описание бизнеса или проверьте, что репозиторий содержит достаточно кода.</p>
            </div>
          )}

          {/* CASE 4: No gap result and no clarification needed - something went wrong */}
          {!gapResult && codeResult?.needs_clarification !== true && codeResult?.success && !codeResult?.analysis && (
            <div className="analysis-incomplete">
              <h3>⚠️ Анализ кода не завершён</h3>
              <p>Не удалось получить полный анализ кода. Попробуйте уточнить описание бизнеса или использовать другой репозиторий.</p>
            </div>
          )}

          {/* Business Canvas (collapsible) - always show if available */}
          {businessResult?.canvas && (
            <details className="results-section" open={!gapResult}>
              <summary>📊 Business Canvas</summary>
              <CanvasView
                canvas={businessResult.canvas}
                businessStage={businessResult.business_stage}
                gapsInModel={businessResult.gaps_in_model}
                recommendations={businessResult.recommendations}
              />
            </details>
          )}

          {/* PROGRESSIVE: Loading indicator for Code Analysis (shows while code is being analyzed) */}
          {loading && businessResult && !codeResult && (
            <div className="progressive-loading-section animate-fade-in">
              <div className="progressive-loading-header">
                <div className="progressive-loading-spinner" />
                <span>💻 Анализируем код...</span>
              </div>
              <SkeletonGaps />
            </div>
          )}

          {/* Google Trends (S3-01) - collapsible in full mode */}
          {(trendsResults.length > 0 || trendsLoading) && (
            <details className="results-section">
              <summary>📈 Рыночный спрос (Google Trends)</summary>
              <TrendsChart
                results={trendsResults}
                onRefresh={fetchTrends}
                isLoading={trendsLoading}
              />
            </details>
          )}

          {/* Code Analysis (collapsible) - only if full analysis available */}
          {codeResult?.analysis && (
            <details className="results-section">
              <summary>💻 Анализ кода</summary>
              <AnalysisView analysis={codeResult.analysis} />
            </details>
          )}

          {/* PROGRESSIVE: Loading indicator for Gap Detection (shows while gaps are being analyzed) */}
          {loading && codeResult?.analysis && !gapResult && (
            <div className="progressive-loading-section animate-fade-in">
              <div className="progressive-loading-header">
                <div className="progressive-loading-spinner" />
                <span>🎯 Ищем разрывы между бизнесом и кодом...</span>
              </div>
              <SkeletonScore />
            </div>
          )}

          {/* Competitor Analysis (collapsible) - only if competitors were analyzed */}
          {competitorResult?.success && (
            <details className="results-section">
              <summary>📊 Анализ конкурентов</summary>
              <CompetitorComparisonView result={competitorResult} />
            </details>
          )}

          {/* Export Panel - full mode with options */}
          <ExportButtons
            businessResult={businessResult}
            codeResult={codeResult}
            gapResult={gapResult}
            competitorResult={competitorResult}
            mode="full"
          />

          {/* GitHub Issues Export - converts tasks to GitHub issues */}
          {gapResult?.tasks && gapResult.tasks.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <GitHubExportButton
                tasks={gapResult.tasks.map((task): ExportTask => ({
                  title: task.title,
                  description: task.description,
                  priority: task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low',
                  category: task.category,
                  effort: `${task.estimated_minutes} мин`,
                }))}
                defaultRepoUrl={repoUrl}
              />
            </div>
          )}

          {/* Metadata */}
          <div className="metadata">
            {businessResult?.metadata && (
              <span>Бизнес: {Math.round(businessResult.metadata.analysis_duration_ms / 1000)}с</span>
            )}
            {codeResult?.metadata && (
              <span>Код: {Math.round(codeResult.metadata.analysis_duration_ms / 1000)}с</span>
            )}
            {gapResult?.metadata && (
              <span>Разрывы: {Math.round(gapResult.metadata.analysis_duration_ms / 1000)}с</span>
            )}
            {competitorResult?.metadata && (
              <span>Конкуренты: {Math.round(competitorResult.metadata.analysis_duration_ms / 1000)}с</span>
            )}
            <span>
              Токенов: {(businessResult?.metadata?.tokens_used || 0) + (codeResult?.metadata?.tokens_used || 0) + (gapResult?.metadata?.tokens_used || 0) + (competitorResult?.metadata?.tokens_used || 0)}
            </span>
          </div>

          {/* Chat - Full Analysis mode with all context */}
          {(codeResult?.analysis || gapResult?.success || businessResult?.canvas) && (
            <ChatSection
              analysis={codeResult?.analysis}
              businessCanvas={businessResult?.canvas}
              gapAnalysis={gapResult}
              competitorAnalysis={competitorResult}
              mode="full"
              onError={setError}
            />
          )}
        </div>
      )}

      {/* FAQ Section - always visible at bottom */}
      <div className="faq-section-wrapper">
        <h2 className="faq-section-title">Частые вопросы</h2>
        <FAQList items={FAQ_ITEMS} allowMultiple={true} />
      </div>

      {/* QuickStart Onboarding Modal - shows only for new users */}
      <QuickStart
        onStart={() => {
          // Focus on the business description textarea
          const textarea = document.querySelector('textarea[placeholder*="Опишите"]') as HTMLTextAreaElement;
          if (textarea) {
            textarea.focus();
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
        onLogin={() => router.push('/login')}
      />

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
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }
        .save-toggle input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-switch {
          position: relative;
          width: 48px;
          height: 26px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          border-radius: 26px;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .toggle-slider {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          background: var(--text-muted);
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .save-toggle input[type="checkbox"]:checked + .toggle-switch {
          background: var(--accent-green);
          border-color: var(--accent-green);
        }
        .save-toggle input[type="checkbox"]:checked + .toggle-switch .toggle-slider {
          transform: translateX(22px);
          background: #ffffff;
        }
        .save-toggle input[type="checkbox"]:disabled + .toggle-switch {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .save-toggle:hover .toggle-switch {
          border-color: var(--accent-blue);
        }
        .toggle-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .toggle-hint {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 400;
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
        .project-selector.required {
          border-color: var(--accent-orange);
          background: rgba(210, 153, 34, 0.05);
        }
        .project-selector:focus {
          outline: none;
          border-color: var(--accent-blue);
        }
        .project-selector option {
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        .project-required-hint {
          font-size: 12px;
          color: var(--accent-orange);
          margin: 6px 0 0 0;
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

        /* Clarification Needed Section */
        .clarification-needed-section {
          background: var(--bg-secondary);
          border: 2px solid var(--warning-yellow);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .clarification-explanation {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 20px 0;
          line-height: 1.5;
        }
        .partial-analysis-info {
          background: var(--bg-tertiary);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .partial-analysis-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 12px 0;
        }
        .partial-analysis-info ul {
          margin: 0;
          padding-left: 20px;
        }
        .partial-analysis-info li {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .pending-sections {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border-default);
        }
        .pending-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--bg-tertiary);
          border-radius: 6px;
          margin-bottom: 8px;
          font-size: 14px;
          color: var(--text-muted);
        }
        .pending-icon {
          font-size: 16px;
        }
        .analysis-incomplete {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .analysis-incomplete h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--warning-yellow);
          margin: 0 0 8px 0;
        }
        .analysis-incomplete p {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Validation Errors */
        .validation-errors {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 12px;
          padding: 12px 16px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
        }
        .validation-icon {
          flex-shrink: 0;
          font-size: 14px;
        }
        .validation-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .validation-list li {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .validation-list li::before {
          content: "• ";
          color: rgba(139, 92, 246, 0.8);
        }
        .validation-list li + li {
          margin-top: 4px;
        }

        /* Loading Skeletons */
        .loading-skeletons {
          margin-top: 24px;
          animation: fadeIn 0.3s ease;
        }
        .skeleton-code-results {
          display: flex;
          flex-direction: column;
          gap: 16px;
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

        /* Demo Button Container */
        .demo-button-container {
          width: 100%;
          margin: 24px 0 32px 0;
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
