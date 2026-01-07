'use client';

import { useState, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import type { FileInput } from '@/types';

// Лимиты файлов (увеличены — smart file selector отсеет лишнее)
const MAX_FILE_SIZE = 1024 * 1024; // 1MB для отдельных файлов
const MAX_ZIP_SIZE = 5 * 1024 * 1024; // 5MB для zip-архивов
const MAX_TOTAL_FILES = 200;

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

interface UploadFormProps {
  files: FileInput[];
  onFilesChange: (files: FileInput[]) => void;
  onError: (error: string | null) => void;
  disabled?: boolean;
}

export function UploadForm({ files, onFilesChange, onError, disabled }: UploadFormProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработка zip-архива
  const handleZipFile = useCallback(async (file: File): Promise<FileInput[]> => {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const extractedFiles: FileInput[] = [];

    const entries = Object.entries(contents.files);
    let processed = 0;

    for (const [path, zipEntry] of entries) {
      if (zipEntry.dir) continue;
      if (!shouldIncludeFile(path)) continue;

      if (extractedFiles.length >= MAX_TOTAL_FILES) {
        setUploadStatus(`Достигнут лимит ${MAX_TOTAL_FILES} файлов`);
        break;
      }

      try {
        const content = await zipEntry.async('string');
        if (content.length > MAX_FILE_SIZE) continue;
        if (/[\x00-\x08\x0E-\x1F]/.test(content.slice(0, 1000))) continue;

        extractedFiles.push({ path, content });
        processed++;
        setUploadStatus(`Распаковка: ${processed} файлов...`);
      } catch {
        // Skip files that can't be read as text
      }
    }

    return extractedFiles;
  }, []);

  // File handling
  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: FileInput[] = [];
    setUploadStatus('Обработка файлов...');
    onError(null);

    for (const file of Array.from(fileList)) {
      // ZIP archive handling
      if (file.name.endsWith('.zip')) {
        if (file.size > MAX_ZIP_SIZE) {
          onError(`Zip-архив слишком большой (макс. ${MAX_ZIP_SIZE / 1024 / 1024}MB)`);
          continue;
        }

        try {
          const zipFiles = await handleZipFile(file);
          newFiles.push(...zipFiles);
          setUploadStatus(`Извлечено ${zipFiles.length} файлов из ${file.name}`);
        } catch (err) {
          onError(`Не удалось распаковать ${file.name}`);
          console.error(err);
        }
        continue;
      }

      // Regular files
      if (file.size > MAX_FILE_SIZE) {
        console.log(`Пропущен ${file.name}: слишком большой`);
        continue;
      }

      const path = file.webkitRelativePath || file.name;
      if (!shouldIncludeFile(path)) continue;

      try {
        const content = await file.text();
        if (/[\x00-\x08\x0E-\x1F]/.test(content.slice(0, 1000))) continue;
        newFiles.push({ path, content });
      } catch {
        // Skip files that can't be read
      }
    }

    if (newFiles.length > 0) {
      const combined = [...files, ...newFiles].slice(0, MAX_TOTAL_FILES);
      onFilesChange(combined);
      setUploadStatus(`Добавлено ${newFiles.length} файлов`);
    } else {
      setUploadStatus(null);
    }

    setTimeout(() => setUploadStatus(null), 3000);
  }, [files, onFilesChange, onError, handleZipFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    onFilesChange([]);
    setUploadStatus(null);
  };

  return (
    <div className="upload-form" data-testid="upload-form">
      <label className="upload-label">Загрузить файлы или ZIP-архив</label>
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        data-testid="file-upload-zone"
      >
        <span className="upload-icon">📁</span>
        <p className="upload-text">Перетащите файлы или ZIP-архив сюда</p>
        <p className="upload-hint">или нажмите для выбора</p>
        <p className="upload-limits">Файлы до 1MB, ZIP до 5MB</p>
        {uploadStatus && (
          <p className="upload-status">{uploadStatus}</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*,.zip"
          className="upload-input"
          onChange={e => e.target.files && handleFiles(e.target.files)}
          disabled={disabled}
          data-testid="file-upload"
        />
      </div>

      {files.length > 0 && (
        <div className="upload-file-list">
          <div className="upload-file-list-header">
            <span className="upload-file-count">{files.length} файлов загружено</span>
            <button className="upload-clear-btn" onClick={clearAllFiles}>
              Очистить все
            </button>
          </div>
          <div className="upload-file-items">
            {files.slice(0, 20).map((file, i) => (
              <div key={i} className="upload-file-item">
                <span className="upload-file-name">{file.path}</span>
                <button className="upload-file-remove" onClick={() => removeFile(i)}>
                  ×
                </button>
              </div>
            ))}
            {files.length > 20 && (
              <div className="upload-file-item upload-file-more">
                ... и ещё {files.length - 20} файлов
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .upload-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .upload-zone {
          border: 2px dashed var(--border-default);
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--bg-primary);
        }

        .upload-zone:hover:not(.disabled) {
          border-color: var(--accent-blue);
          background: var(--bg-secondary);
        }

        .upload-zone.drag-over {
          border-color: var(--accent-blue);
          background: rgba(88, 166, 255, 0.1);
        }

        .upload-zone.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .upload-icon {
          font-size: 36px;
          display: block;
          margin-bottom: 12px;
          opacity: 0.8;
        }

        .upload-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
        }

        .upload-hint {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 4px 0 0 0;
        }

        .upload-limits {
          font-size: 12px;
          color: var(--text-muted);
          margin: 8px 0 0 0;
        }

        .upload-status {
          font-size: 13px;
          color: var(--accent-blue);
          margin: 12px 0 0 0;
          font-weight: 500;
        }

        .upload-input {
          display: none;
        }

        .upload-file-list {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          overflow: hidden;
        }

        .upload-file-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-tertiary);
        }

        .upload-file-count {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .upload-clear-btn {
          font-size: 12px;
          padding: 4px 8px;
          background: transparent;
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-clear-btn:hover {
          background: rgba(248, 81, 73, 0.1);
          border-color: var(--accent-red);
          color: var(--accent-red);
        }

        .upload-file-items {
          max-height: 200px;
          overflow-y: auto;
        }

        .upload-file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          font-size: 13px;
          border-bottom: 1px solid var(--border-muted);
        }

        .upload-file-item:last-child {
          border-bottom: none;
        }

        .upload-file-name {
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .upload-file-more {
          color: var(--text-muted);
          font-style: italic;
        }

        .upload-file-remove {
          width: 20px;
          height: 20px;
          padding: 0;
          font-size: 16px;
          line-height: 1;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .upload-file-remove:hover {
          background: rgba(248, 81, 73, 0.1);
          color: var(--accent-red);
        }
      `}</style>
    </div>
  );
}
