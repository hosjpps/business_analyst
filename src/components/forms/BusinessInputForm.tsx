'use client';

import { useState, useCallback, useRef } from 'react';
import type { BusinessInput, DocumentInput, SocialLinks, DocumentType } from '@/types/business';
import { isValidDocumentType, getDocumentTypeFromFilename } from '@/lib/business/document-parser';

// ===========================================
// Types
// ===========================================

interface BusinessInputFormProps {
  value: BusinessInput;
  onChange: (value: BusinessInput) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

// ===========================================
// Constants
// ===========================================

const MIN_DESCRIPTION_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 10000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10;

const SOCIAL_FIELDS: Array<{ key: keyof SocialLinks; label: string; placeholder: string; icon: string }> = [
  { key: 'website', label: 'Сайт', placeholder: 'https://example.com', icon: '🌐' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username', icon: '📷' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username', icon: '💼' },
  { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/username', icon: '🐦' },
];

// ===========================================
// Component
// ===========================================

export function BusinessInputForm({
  value,
  onChange,
  onError,
  disabled = false,
}: BusinessInputFormProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Character counter
  const charCount = value.description.length;
  const charCountColor =
    charCount < MIN_DESCRIPTION_LENGTH
      ? 'var(--accent-red)'
      : charCount > MAX_DESCRIPTION_LENGTH * 0.9
      ? 'var(--accent-orange)'
      : 'var(--text-muted)';

  // Update description
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...value,
      description: e.target.value,
    });
  };

  // Update social link
  const handleSocialChange = (key: keyof SocialLinks, linkValue: string) => {
    onChange({
      ...value,
      social_links: {
        ...value.social_links,
        [key]: linkValue,
      },
    });
  };

  // File handling
  const processFile = useCallback(async (file: File): Promise<DocumentInput | null> => {
    const type = getDocumentTypeFromFilename(file.name);
    if (!type) {
      onError?.(`Неподдерживаемый формат файла: ${file.name}. Используйте PDF, DOCX, MD или TXT.`);
      return null;
    }

    if (file.size > MAX_FILE_SIZE) {
      onError?.(`Файл ${file.name} превышает лимит 5MB`);
      return null;
    }

    try {
      let content: string;

      if (type === 'pdf' || type === 'docx') {
        // Binary files - read as base64
        const buffer = await file.arrayBuffer();
        content = Buffer.from(buffer).toString('base64');
      } else {
        // Text files - read as text
        content = await file.text();
      }

      return {
        name: file.name,
        type,
        content,
        size: file.size,
      };
    } catch (error) {
      onError?.(`Ошибка чтения файла: ${file.name}`);
      return null;
    }
  }, [onError]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const currentDocs = value.documents || [];

    if (currentDocs.length + files.length > MAX_FILES) {
      onError?.(`Максимум ${MAX_FILES} файлов`);
      return;
    }

    const newDocs: DocumentInput[] = [];

    for (const file of Array.from(files)) {
      const doc = await processFile(file);
      if (doc) {
        newDocs.push(doc);
      }
    }

    onChange({
      ...value,
      documents: [...currentDocs, ...newDocs],
    });
  }, [value, onChange, onError, processFile]);

  // Drag & Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // Remove document
  const handleRemoveDoc = (index: number) => {
    const newDocs = [...(value.documents || [])];
    newDocs.splice(index, 1);
    onChange({
      ...value,
      documents: newDocs.length > 0 ? newDocs : undefined,
    });
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="business-input-form" data-testid="business-input-form">
      {/* Description */}
      <div className="form-section">
        <label htmlFor="business-description" className="form-label">
          Описание бизнеса <span className="required">*</span>
        </label>
        <p className="form-hint">
          Расскажите о своём бизнесе: что делаете, для кого, как зарабатываете, какие цели
        </p>
        <textarea
          id="business-description"
          className="form-textarea"
          placeholder="Мы делаем сервис для... Наши клиенты — это... Зарабатываем на... Хотим достичь..."
          value={value.description}
          onChange={handleDescriptionChange}
          disabled={disabled}
          rows={6}
          data-testid="business-description"
        />
        <div className="char-counter" style={{ color: charCountColor }}>
          {charCount} / {MAX_DESCRIPTION_LENGTH}
          {charCount < MIN_DESCRIPTION_LENGTH && (
            <span className="char-hint"> (минимум {MIN_DESCRIPTION_LENGTH})</span>
          )}
        </div>
      </div>

      {/* Social Links */}
      <div className="form-section">
        <label className="form-label">
          Ссылки на соцсети <span className="optional">(опционально)</span>
        </label>
        <p className="form-hint">
          Например: Instagram, X (Twitter), VK, Telegram, YouTube, TikTok
        </p>
        <div className="social-grid">
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.key} className="social-field">
              <span className="social-icon">{field.icon}</span>
              <input
                type="url"
                placeholder={field.placeholder}
                value={value.social_links?.[field.key] || ''}
                onChange={(e) => handleSocialChange(field.key, e.target.value)}
                disabled={disabled}
                className="social-input"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="form-section">
        <label className="form-label">
          Документы <span className="optional">(опционально)</span>
        </label>
        <p className="form-hint">
          Презентация, бизнес-план, описание продукта
        </p>

        <div
          className={`drop-zone ${dragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          data-testid="document-upload"
        >
          <div className="drop-zone-content">
            <span className="drop-icon">📄</span>
            <p className="drop-text">
              {dragActive ? 'Отпустите файлы' : 'Перетащите файлы сюда'}
            </p>
            <p className="drop-hint">или нажмите для выбора</p>
            <p className="drop-formats">PDF, DOCX, MD, TXT • до 5MB на файл</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.md,.txt"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={disabled}
            className="file-input-hidden"
          />
        </div>

        {/* File list */}
        {value.documents && value.documents.length > 0 && (
          <div className="file-list">
            {value.documents.map((doc, idx) => (
              <div key={idx} className="file-item">
                <span className="file-icon">📎</span>
                <span className="file-name">{doc.name}</span>
                <span className="file-size">({formatSize(doc.size)})</span>
                <button
                  className="file-remove"
                  onClick={() => handleRemoveDoc(idx)}
                  disabled={disabled}
                  title="Удалить"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .business-input-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .required {
          color: var(--accent-red);
        }

        .optional {
          font-weight: 400;
          color: var(--text-muted);
        }

        .form-hint {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .form-textarea {
          width: 100%;
          padding: 12px;
          font-size: 14px;
          line-height: 1.5;
          border: 1px solid var(--border-default);
          border-radius: 6px;
          background: var(--bg-primary);
          color: var(--text-primary);
          resize: vertical;
          font-family: inherit;
        }

        .form-textarea:focus {
          outline: none;
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
        }

        .form-textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-textarea::placeholder {
          color: var(--text-muted);
        }

        .char-counter {
          font-size: 12px;
          text-align: right;
        }

        .char-hint {
          font-style: italic;
        }

        .social-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (max-width: 640px) {
          .social-grid {
            grid-template-columns: 1fr;
          }
        }

        .social-field {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          transition: border-color 0.2s;
        }

        .social-field:focus-within {
          border-color: var(--accent-blue);
        }

        .social-icon {
          font-size: 16px;
          width: 24px;
          text-align: center;
          flex-shrink: 0;
        }

        .social-input {
          flex: 1;
          padding: 0;
          font-size: 13px;
          border: none;
          background: transparent;
          color: var(--text-primary);
        }

        .social-input:focus {
          outline: none;
        }

        .social-input::placeholder {
          color: var(--text-muted);
        }

        .social-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .drop-zone {
          border: 2px dashed var(--border-default);
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--bg-primary);
        }

        .drop-zone:hover:not(.disabled) {
          border-color: var(--accent-blue);
          background: var(--bg-secondary);
        }

        .drop-zone.active {
          border-color: var(--accent-blue);
          background: rgba(88, 166, 255, 0.1);
        }

        .drop-zone.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .drop-zone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .drop-icon {
          font-size: 36px;
          margin-bottom: 8px;
          opacity: 0.8;
        }

        .drop-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
        }

        .drop-hint {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .drop-formats {
          font-size: 12px;
          color: var(--text-muted);
          margin: 8px 0 0 0;
        }

        .file-input-hidden {
          display: none;
        }

        .file-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
        }

        .file-icon {
          font-size: 14px;
        }

        .file-name {
          flex: 1;
          font-size: 13px;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 12px;
          color: var(--text-muted);
        }

        .file-remove {
          width: 24px;
          height: 24px;
          padding: 0;
          font-size: 18px;
          line-height: 1;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .file-remove:hover:not(:disabled) {
          background: rgba(248, 81, 73, 0.1);
          color: var(--accent-red);
        }

        .file-remove:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
