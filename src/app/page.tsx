'use client';

import { useState, useCallback } from 'react';
import type { AnalyzeResponse, FileInput } from '@/types';
import { UploadForm } from '@/components/UploadForm';
import { ProgressIndicator, type AnalysisStep } from '@/components/ProgressIndicator';
import { AnalysisView } from '@/components/AnalysisView';
import { ChatSection } from '@/components/ChatSection';
import { ExportButtons } from '@/components/ExportButtons';
import {
  usePersistedDescription,
  usePersistedRepoUrl,
  usePersistedResult,
  clearAllAnalyzerData,
} from '@/hooks/useLocalStorage';

export default function Home() {
  // Persisted state (localStorage)
  const [repoUrl, setRepoUrl] = usePersistedRepoUrl();
  const [description, setDescription] = usePersistedDescription();
  const [persistedResult, setPersistedResult] = usePersistedResult();

  // Non-persisted state
  const [uploadedFiles, setUploadedFiles] = useState<FileInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('idle');

  // Cast persisted result to proper type
  const result = persistedResult as AnalyzeResponse | null;

  // Clear all saved data
  const handleClearAll = useCallback(() => {
    clearAllAnalyzerData();
    setUploadedFiles([]);
    setError(null);
    setAnalysisStep('idle');
    // Force re-render by resetting state
    window.location.reload();
  }, []);

  // Analyze
  const handleAnalyze = async () => {
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

    // Determine starting step
    if (uploadedFiles.length > 0) {
      setAnalysisStep('uploading');
    } else {
      setAnalysisStep('fetching');
    }

    try {
      // Simulate progress steps
      setTimeout(() => setAnalysisStep('analyzing'), 500);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl || undefined,
          files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
          project_description: description
        })
      });

      setAnalysisStep('generating');

      const data: AnalyzeResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Ошибка анализа');
        setAnalysisStep('error');
      } else {
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

  return (
    <div className="container">
      <div className="header-row">
        <h1>GitHub Repository Analyzer</h1>
        {(result || description || repoUrl) && (
          <button className="clear-btn" onClick={handleClearAll} title="Очистить все данные">
            Очистить
          </button>
        )}
      </div>
      <p className="subtitle">
        Анализ репозиториев и генерация задач на неделю
      </p>

      {/* GitHub URL */}
      <div className="form-group">
        <label htmlFor="repo-url">GitHub URL</label>
        <input
          id="repo-url"
          type="text"
          placeholder="https://github.com/username/repo"
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
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
          onChange={e => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Submit */}
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Анализирую...' : 'Анализировать'}
      </button>

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

      {/* Results */}
      {result && (
        <div className="results">
          {/* Questions */}
          {result.needs_clarification && result.questions && (
            <div className="questions">
              <h3>Нужна дополнительная информация</h3>
              {result.questions.map((q, i) => (
                <div key={i} className="question-item">
                  <p className="question-text">{q.question}</p>
                  <p className="question-why">{q.why}</p>
                </div>
              ))}
            </div>
          )}

          {/* Analysis */}
          {result.analysis && <AnalysisView analysis={result.analysis} />}

          {/* Export Buttons */}
          <ExportButtons result={result} />

          {/* Metadata */}
          <div className="metadata">
            <span>
              Файлов: {result.metadata.files_analyzed}
              {result.metadata.files_total && result.metadata.files_total > result.metadata.files_analyzed
                ? ` / ${result.metadata.files_total}`
                : ''}
            </span>
            {result.metadata.files_truncated ? (
              <span>Усечено: {result.metadata.files_truncated}</span>
            ) : null}
            <span>Строк: {result.metadata.total_lines}</span>
            <span>Токенов: {result.metadata.tokens_used}</span>
            <span>
              Время: {result.metadata.analysis_duration_ms}ms
              {result.metadata.cached ? ' (кэш)' : ''}
            </span>
          </div>

          {/* Chat */}
          {result.analysis && (
            <ChatSection
              analysis={result.analysis}
              onError={setError}
            />
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
      `}</style>
    </div>
  );
}
