'use client';

import { useState, useCallback } from 'react';
import type { AnalyzeResponse, FileInput } from '@/types';
import type { BusinessInput, BusinessAnalyzeResponse } from '@/types/business';
import { UploadForm } from '@/components/UploadForm';
import { ProgressIndicator, type AnalysisStep } from '@/components/ProgressIndicator';
import { AnalysisView } from '@/components/AnalysisView';
import { ChatSection } from '@/components/ChatSection';
import { ExportButtons } from '@/components/ExportButtons';
import { AnalysisModeSelector, type AnalysisMode } from '@/components/forms/AnalysisModeSelector';
import { BusinessInputForm } from '@/components/forms/BusinessInputForm';
import { CanvasView } from '@/components/results/CanvasView';
import { ClarificationQuestions } from '@/components/forms/ClarificationQuestions';
import {
  usePersistedDescription,
  usePersistedRepoUrl,
  usePersistedResult,
  clearAllAnalyzerData,
} from '@/hooks/useLocalStorage';
import { useAnalysisCache } from '@/hooks/useAnalysisCache';

// ===========================================
// Main Component
// ===========================================

export default function Home() {
  // Mode selection
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('code');

  // Persisted state (localStorage) - for code analysis
  const [repoUrl, setRepoUrl] = usePersistedRepoUrl();
  const [description, setDescription] = usePersistedDescription();
  const [persistedResult, setPersistedResult] = usePersistedResult();

  // Business analysis state
  const [businessInput, setBusinessInput] = useState<BusinessInput>({
    description: '',
    social_links: {},
    documents: [],
  });
  const [businessResult, setBusinessResult] = useState<BusinessAnalyzeResponse | null>(null);

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
    setError(null);
    setAnalysisStep('idle');
    window.location.reload();
  }, [clearAllCaches]);

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
      .map(([id, answer]) => `\n\n[Уточнение: ${answer}]`)
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
      // Full analysis: TODO in PR #2
      setError('Полный анализ будет доступен в следующей версии');
    }
  };

  // Check if can submit
  const canSubmit =
    analysisMode === 'code'
      ? (repoUrl || uploadedFiles.length > 0) && description.trim()
      : analysisMode === 'business'
      ? businessInput.description.length >= 50
      : false;

  // Has any result
  const hasCodeResult = codeResult && codeResult.success;
  const hasBusinessResult = businessResult && businessResult.success;
  const hasAnyResult = hasCodeResult || hasBusinessResult;

  return (
    <div className="container">
      {/* Header */}
      <div className="header-row">
        <h1>Business & Code Analyzer</h1>
        {(hasAnyResult || description || repoUrl || businessInput.description) && (
          <button className="clear-btn" onClick={handleClearAll} title="Очистить все данные">
            Очистить
          </button>
        )}
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

      {/* Business Input Form */}
      {analysisMode === 'business' && (
        <div className="form-section">
          <BusinessInputForm
            value={businessInput}
            onChange={setBusinessInput}
            onError={setError}
            disabled={loading}
          />
        </div>
      )}

      {/* Code Input Form */}
      {analysisMode === 'code' && (
        <>
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
          <div className="form-group">
            <label htmlFor="description">Опиши свой проект</label>
            <textarea
              id="description"
              placeholder="Чем занимается твой проект? Какую проблему решает? Кто целевая аудитория?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
        </>
      )}

      {/* Full Analysis Form */}
      {analysisMode === 'full' && (
        <div className="coming-soon">
          <span className="coming-soon-icon">🚧</span>
          <p>Полный анализ (Бизнес + Код + Gap Detection) будет доступен в следующей версии</p>
          <p className="coming-soon-hint">Пока можно использовать режимы "Разбор бизнеса" или "Проверка кода" отдельно</p>
        </div>
      )}

      {/* Submit Button */}
      {analysisMode !== 'full' && analysisMode !== 'competitor' && (
        <button onClick={handleAnalyze} disabled={loading || !canSubmit}>
          {loading ? 'Анализирую...' : 'Анализировать'}
        </button>
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
          {codeResult.analysis && <AnalysisView analysis={codeResult.analysis} />}

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

      <style jsx>{`
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .clear-btn {
          padding: 6px 12px;
          font-size: 13px;
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
          color: var(--color-fg-muted);
          border-radius: 6px;
          cursor: pointer;
        }
        .clear-btn:hover {
          background: var(--color-danger-subtle);
          border-color: var(--color-danger-fg);
          color: var(--color-danger-fg);
        }
        .form-section {
          margin-bottom: 24px;
        }
        .coming-soon {
          text-align: center;
          padding: 48px 24px;
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .coming-soon-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }
        .coming-soon p {
          color: var(--color-fg-muted);
          margin: 0 0 8px 0;
        }
        .coming-soon-hint {
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
