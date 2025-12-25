'use client';

import { useState, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import type { AnalyzeResponse, ChatResponse, Analysis, FileInput } from '@/types';

// Лимиты файлов
const MAX_FILE_SIZE = 500 * 1024; // 500KB для отдельных файлов
const MAX_ZIP_SIZE = 2 * 1024 * 1024; // 2MB для zip-архивов
const MAX_TOTAL_FILES = 100;

// Паттерны для игнорирования
const IGNORE_PATTERNS = [
  /^node_modules\//,
  /^\.git\//,
  /^dist\//,
  /^build\//,
  /^\.next\//,
  /^__pycache__\//,
  /^\.venv\//,
  /^venv\//,
  /^target\//,
  /^vendor\//,
  /\.min\.js$/,
  /\.min\.css$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.DS_Store$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.ico$/,
  /\.woff$/,
  /\.woff2$/,
  /\.ttf$/,
  /\.eot$/,
  /\.mp3$/,
  /\.mp4$/,
  /\.pdf$/,
];

function shouldIncludeFile(path: string): boolean {
  return !IGNORE_PATTERNS.some(pattern => pattern.test(path));
}

export default function Home() {
  // Form state
  const [repoUrl, setRepoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<FileInput[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Result state
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{question: string, answer: string}>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Обработка zip-архива
  const handleZipFile = useCallback(async (file: File): Promise<FileInput[]> => {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const files: FileInput[] = [];

    const entries = Object.entries(contents.files);
    let processed = 0;

    for (const [path, zipEntry] of entries) {
      // Пропускаем папки
      if (zipEntry.dir) continue;

      // Фильтруем ненужные файлы
      if (!shouldIncludeFile(path)) continue;

      // Лимит количества файлов
      if (files.length >= MAX_TOTAL_FILES) {
        setUploadStatus(`Достигнут лимит ${MAX_TOTAL_FILES} файлов`);
        break;
      }

      try {
        const content = await zipEntry.async('string');

        // Пропускаем слишком большие файлы внутри архива
        if (content.length > MAX_FILE_SIZE) continue;

        // Пропускаем бинарные файлы (проверка на нечитаемые символы)
        if (/[\x00-\x08\x0E-\x1F]/.test(content.slice(0, 1000))) continue;

        files.push({ path, content });
        processed++;
        setUploadStatus(`Распаковка: ${processed} файлов...`);
      } catch {
        // Пропускаем файлы, которые не удалось прочитать как текст
      }
    }

    return files;
  }, []);

  // File handling
  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: FileInput[] = [];
    setUploadStatus('Обработка файлов...');
    setError(null);

    for (const file of Array.from(fileList)) {
      // Обработка zip-архива
      if (file.name.endsWith('.zip')) {
        if (file.size > MAX_ZIP_SIZE) {
          setError(`Zip-архив слишком большой (макс. ${MAX_ZIP_SIZE / 1024 / 1024}MB)`);
          continue;
        }

        try {
          const zipFiles = await handleZipFile(file);
          newFiles.push(...zipFiles);
          setUploadStatus(`Извлечено ${zipFiles.length} файлов из ${file.name}`);
        } catch (err) {
          setError(`Не удалось распаковать ${file.name}`);
          console.error(err);
        }
        continue;
      }

      // Обычные файлы
      if (file.size > MAX_FILE_SIZE) {
        console.log(`Пропущен ${file.name}: слишком большой`);
        continue;
      }

      // Фильтрация по паттернам
      const path = file.webkitRelativePath || file.name;
      if (!shouldIncludeFile(path)) continue;

      try {
        const content = await file.text();

        // Проверка на бинарный файл
        if (/[\x00-\x08\x0E-\x1F]/.test(content.slice(0, 1000))) continue;

        newFiles.push({ path, content });
      } catch {
        // Пропускаем файлы, которые не удалось прочитать
      }
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => {
        const combined = [...prev, ...newFiles];
        // Ограничиваем общее количество
        return combined.slice(0, MAX_TOTAL_FILES);
      });
      setUploadStatus(`Добавлено ${newFiles.length} файлов`);
    } else {
      setUploadStatus(null);
    }

    // Очищаем статус через 3 секунды
    setTimeout(() => setUploadStatus(null), 3000);
  }, [handleZipFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setUploadStatus(null);
  };

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
    setResult(null);
    setChatHistory([]);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl || undefined,
          files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
          project_description: description
        })
      });

      const data: AnalyzeResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Ошибка анализа');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Не удалось выполнить запрос');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Chat
  const handleChat = async () => {
    if (!chatMessage.trim() || !result?.analysis) return;

    const currentQuestion = chatMessage.trim();
    setChatLoading(true);
    setChatMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: Date.now().toString(),
          message: currentQuestion,
          previous_analysis: result.analysis
        })
      });

      const data: ChatResponse = await response.json();

      if (data.success) {
        setChatHistory(prev => [...prev, {
          question: currentQuestion,
          answer: data.answer
        }]);
      } else {
        setError(data.error || 'Ошибка чата');
      }
    } catch (err) {
      setError('Не удалось отправить сообщение');
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // Копирование текста
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback для старых браузеров
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="container">
      <h1>GitHub Repository Analyzer</h1>
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
          disabled={uploadedFiles.length > 0}
        />
      </div>

      <div className="divider">
        <span>или</span>
      </div>

      {/* File Upload */}
      <div className="form-group">
        <label>Загрузить файлы или ZIP-архив</label>
        <div
          className={`file-upload ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <p>Перетащите файлы или ZIP-архив сюда</p>
          <p style={{ fontSize: 14, color: '#888', marginTop: 8 }}>
            Файлы до 500KB, ZIP до 2MB
          </p>
          {uploadStatus && (
            <p style={{ fontSize: 14, color: '#0070f3', marginTop: 8 }}>
              {uploadStatus}
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="*/*,.zip"
            style={{ display: 'none' }}
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="file-list">
            <div className="file-list-header">
              <span>{uploadedFiles.length} файлов загружено</span>
              <button className="clear-files" onClick={clearAllFiles}>
                Очистить все
              </button>
            </div>
            <div className="file-list-items">
              {uploadedFiles.slice(0, 20).map((file, i) => (
                <div key={i} className="file-item">
                  <span>{file.path}</span>
                  <button className="remove-file" onClick={() => removeFile(i)}>
                    ✕
                  </button>
                </div>
              ))}
              {uploadedFiles.length > 20 && (
                <div className="file-item" style={{ color: '#888' }}>
                  ... и ещё {uploadedFiles.length - 20} файлов
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Project Description */}
      <div className="form-group">
        <label htmlFor="description">Опиши свой проект</label>
        <textarea
          id="description"
          placeholder="Чем занимается твой проект? Какую проблему решает? Кто целевая аудитория?"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {/* Submit */}
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Анализирую...' : 'Анализировать'}
      </button>

      {/* Error */}
      {error && <div className="error">{error}</div>}

      {/* Loading */}
      {loading && (
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

          {/* Metadata */}
          <div className="metadata">
            <span>Файлов: {result.metadata.files_analyzed}</span>
            <span>Строк: {result.metadata.total_lines}</span>
            <span>Токенов: {result.metadata.tokens_used}</span>
            <span>Время: {result.metadata.analysis_duration_ms}ms</span>
          </div>

          {/* Chat */}
          {result.analysis && (
            <div className="chat-section">
              <h3>Задать вопрос</h3>

              {/* История чата */}
              {chatHistory.length > 0 && (
                <div className="chat-history">
                  {chatHistory.map((item, i) => (
                    <div key={i} className="chat-item">
                      <div className="chat-question">
                        <span className="chat-label">Вопрос:</span>
                        <p>{item.question}</p>
                      </div>
                      <div className="chat-answer">
                        <div className="chat-answer-header">
                          <span className="chat-label">Ответ:</span>
                          <button
                            className="copy-button"
                            onClick={() => copyToClipboard(item.answer)}
                            title="Копировать"
                          >
                            📋 Копировать
                          </button>
                        </div>
                        <div className="chat-answer-content">{item.answer}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Форма ввода */}
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Как мне сделать первую задачу? Почему это важно?"
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !chatLoading && handleChat()}
                  disabled={chatLoading}
                />
                <button onClick={handleChat} disabled={chatLoading || !chatMessage.trim()}>
                  {chatLoading ? '...' : 'Отправить'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===========================================
// Legend Component
// ===========================================

function Legend() {
  return (
    <div className="legend">
      <div className="legend-group">
        <span className="legend-title">Приоритет / Критичность:</span>
        <span className="legend-item"><span className="legend-dot high"></span>high — критично</span>
        <span className="legend-item"><span className="legend-dot medium"></span>medium — важно</span>
        <span className="legend-item"><span className="legend-dot low"></span>low — желательно</span>
      </div>
      <div className="legend-group">
        <span className="legend-title">Категории:</span>
        <span className="category-badge category-documentation">documentation</span>
        <span className="category-badge category-technical">technical</span>
        <span className="category-badge category-product">product</span>
        <span className="category-badge category-marketing">marketing</span>
        <span className="category-badge category-business">business</span>
      </div>
    </div>
  );
}

// ===========================================
// Analysis View Component
// ===========================================

function AnalysisView({ analysis }: { analysis: Analysis }) {
  return (
    <>
      {/* Summary */}
      <div className="section">
        <h2>
          Анализ проекта
          <span className={`stage-badge stage-${analysis.detected_stage}`}>
            {analysis.detected_stage}
          </span>
        </h2>
        <p>{analysis.project_summary}</p>
      </div>

      {/* Tech Stack */}
      {analysis.tech_stack.length > 0 && (
        <div className="section">
          <h3>Технологии</h3>
          <div className="tech-stack">
            {analysis.tech_stack.map((tech, i) => (
              <span key={i} className="tech-tag">{tech}</span>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <Legend />

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div className="section">
          <h3>Сильные стороны</h3>
          {analysis.strengths.map((s, i) => (
            <div key={i} className="strength-item">
              <div className="item-header">
                <span className="item-title">{s.area}</span>
              </div>
              <p className="item-detail">{s.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div className="section">
          <h3>Проблемы</h3>
          {analysis.issues.map((issue, i) => (
            <div key={i} className={`issue-item severity-${issue.severity}`}>
              <div className="item-header">
                <span className="item-title">{issue.area}</span>
                <span className="item-meta">
                  {issue.severity} {issue.file_path && `• ${issue.file_path}`}
                </span>
              </div>
              <p className="item-detail">{issue.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tasks */}
      {analysis.tasks.length > 0 && (
        <div className="section">
          <h3>Задачи на неделю</h3>
          {analysis.tasks.map((task, i) => (
            <div key={i} className={`task-item priority-${task.priority}`}>
              <div className="item-header">
                <span className="item-title">{task.title}</span>
                <span className="item-meta">
                  <span className={`category-badge category-${task.category}`}>
                    {task.category}
                  </span>
                  {' '}~{task.estimated_minutes} мин
                </span>
              </div>
              <p className="item-detail">{task.description}</p>
              {task.depends_on && (
                <p className="item-meta" style={{ marginTop: 8 }}>
                  Зависит от: {task.depends_on}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Next Milestone */}
      {analysis.next_milestone && (
        <div className="section">
          <h3>Следующая цель</h3>
          <p>{analysis.next_milestone}</p>
        </div>
      )}
    </>
  );
}
