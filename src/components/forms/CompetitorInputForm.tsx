'use client';

import { useState, useCallback } from 'react';
import type { CompetitorInput, SocialLinkItem } from '@/types/competitor';
import { getPlatformInfo, isValidUrl } from '@/lib/utils/social-detector';

// ===========================================
// Types
// ===========================================

interface CompetitorInputFormProps {
  competitors: CompetitorInput[];
  onChange: (competitors: CompetitorInput[]) => void;
  disabled?: boolean;
  maxCompetitors?: number;
}

// ===========================================
// Social Link Item Component
// ===========================================

function SocialLinkInput({
  link,
  onUpdate,
  onRemove,
  disabled,
}: {
  link: SocialLinkItem;
  onUpdate: (updated: SocialLinkItem) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);

  // Get platform info from URL
  const platformInfo = link.url ? getPlatformInfo(link.url) : null;
  const showPlatform = platformInfo && link.url && isValidUrl(link.url);

  const handleChange = useCallback((url: string) => {
    // Auto-detect platform when URL changes
    const platform = url ? getPlatformInfo(url) : null;
    onUpdate({
      url,
      platform: platform?.id,
    });
  }, [onUpdate]);

  return (
    <div className="social-link-item">
      <div className={`input-wrapper ${isFocused ? 'focused' : ''} ${showPlatform ? 'has-platform' : ''}`}>
        {showPlatform && (
          <span
            className="platform-badge"
            style={{ backgroundColor: platformInfo.color }}
            title={platformInfo.name}
          >
            {platformInfo.icon}
          </span>
        )}
        <input
          type="url"
          placeholder="Вставьте ссылку на соцсеть..."
          value={link.url}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
        />
        <button
          type="button"
          className="remove-link-btn"
          onClick={onRemove}
          disabled={disabled}
          title="Удалить ссылку"
        >
          ✕
        </button>
      </div>
      {showPlatform && (
        <span className="platform-name">{platformInfo.name}</span>
      )}

      <style jsx>{`
        .social-link-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          padding: 4px 8px;
          transition: all 0.2s;
        }

        .input-wrapper.focused {
          border-color: var(--accent-blue);
        }

        .input-wrapper.has-platform {
          border-color: var(--color-success-muted);
        }

        .platform-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          font-size: 14px;
          flex-shrink: 0;
        }

        .input-wrapper input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 6px 0;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          min-width: 0;
        }

        .input-wrapper input::placeholder {
          color: var(--text-muted);
        }

        .input-wrapper input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .remove-link-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 11px;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .remove-link-btn:hover:not(:disabled) {
          background: rgba(248, 81, 73, 0.15);
          color: var(--accent-red);
        }

        .remove-link-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .platform-name {
          font-size: 11px;
          color: var(--color-success-fg);
          padding-left: 36px;
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Single Competitor Card
// ===========================================

function CompetitorCard({
  competitor,
  index,
  onUpdate,
  onRemove,
  disabled,
}: {
  competitor: CompetitorInput;
  index: number;
  onUpdate: (index: number, updated: CompetitorInput) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}) {
  // Ensure social_links is always an array
  const socialLinks: SocialLinkItem[] = Array.isArray(competitor.social_links)
    ? competitor.social_links
    : [];

  const handleAddSocialLink = () => {
    onUpdate(index, {
      ...competitor,
      social_links: [...socialLinks, { url: '' }],
    });
  };

  const handleUpdateSocialLink = (linkIndex: number, updated: SocialLinkItem) => {
    const newLinks = [...socialLinks];
    newLinks[linkIndex] = updated;
    onUpdate(index, {
      ...competitor,
      social_links: newLinks,
    });
  };

  const handleRemoveSocialLink = (linkIndex: number) => {
    onUpdate(index, {
      ...competitor,
      social_links: socialLinks.filter((_, i) => i !== linkIndex),
    });
  };

  return (
    <div className="competitor-card">
      {/* Header with number and remove button */}
      <div className="card-header">
        <span className="competitor-number">{index + 1}</span>
        <span className="competitor-title">Конкурент {index + 1}</span>
        <button
          type="button"
          className="remove-btn"
          onClick={() => onRemove(index)}
          disabled={disabled}
          title="Удалить"
        >
          ✕
        </button>
      </div>

      {/* Main fields */}
      <div className="card-content">
        {/* Name */}
        <div className="form-field">
          <label>Название *</label>
          <input
            type="text"
            placeholder="Например: Notion, Figma, Slack"
            value={competitor.name}
            onChange={(e) =>
              onUpdate(index, { ...competitor, name: e.target.value })
            }
            disabled={disabled}
          />
        </div>

        {/* URL */}
        <div className="form-field">
          <label>Сайт</label>
          <input
            type="url"
            placeholder="https://competitor.com"
            value={competitor.url || ''}
            onChange={(e) =>
              onUpdate(index, { ...competitor, url: e.target.value })
            }
            disabled={disabled}
          />
        </div>

        {/* Dynamic Social Links */}
        <div className="social-section">
          <label className="section-label">
            Соцсети <span className="optional-badge">опционально</span>
          </label>

          {/* List of social links */}
          <div className="social-links-list">
            {socialLinks.map((link, linkIndex) => (
              <SocialLinkInput
                key={linkIndex}
                link={link}
                onUpdate={(updated) => handleUpdateSocialLink(linkIndex, updated)}
                onRemove={() => handleRemoveSocialLink(linkIndex)}
                disabled={disabled}
              />
            ))}
          </div>

          {/* Add social link button */}
          <button
            type="button"
            className="add-social-btn"
            onClick={handleAddSocialLink}
            disabled={disabled}
          >
            <span className="add-icon">+</span>
            <span>Добавить соцсеть</span>
          </button>

          <p className="social-hint">
            VK, Telegram, Instagram, YouTube, TikTok, LinkedIn и другие — определятся автоматически
          </p>
        </div>

        {/* Notes */}
        <div className="form-field">
          <label>
            Заметки <span className="optional-badge">опционально</span>
          </label>
          <textarea
            placeholder="Что вы знаете об этом конкуренте? Чем они отличаются?"
            value={competitor.notes || ''}
            onChange={(e) =>
              onUpdate(index, { ...competitor, notes: e.target.value })
            }
            disabled={disabled}
            rows={2}
          />
        </div>
      </div>

      <style jsx>{`
        .competitor-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-default);
        }

        .competitor-number {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(88, 166, 255, 0.15);
          color: var(--accent-blue);
          border-radius: 50%;
          font-size: 13px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .competitor-title {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .remove-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid var(--border-default);
          border-radius: 6px;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .remove-btn:hover:not(:disabled) {
          background: rgba(248, 81, 73, 0.15);
          color: var(--accent-red);
          border-color: var(--accent-red);
        }

        .remove-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .card-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-field label,
        .section-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .optional-badge {
          font-size: 10px;
          font-weight: 400;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 6px;
        }

        .form-field input,
        .form-field textarea {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          color: var(--text-primary);
          transition: border-color 0.2s;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          outline: none;
          border-color: var(--accent-blue);
        }

        .form-field input:disabled,
        .form-field textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-field textarea {
          resize: vertical;
          min-height: 60px;
        }

        .social-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .social-links-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .add-social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 500;
          background: transparent;
          border: 1px dashed var(--border-default);
          border-radius: 6px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-social-btn:hover:not(:disabled) {
          background: rgba(88, 166, 255, 0.08);
          border-color: var(--accent-blue);
          color: var(--accent-blue);
        }

        .add-social-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .add-social-btn .add-icon {
          font-size: 14px;
          font-weight: 300;
        }

        .social-hint {
          font-size: 11px;
          color: var(--text-muted);
          margin: 0;
          padding-left: 2px;
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Main Form Component
// ===========================================

export function CompetitorInputForm({
  competitors,
  onChange,
  disabled = false,
  maxCompetitors = 10,
}: CompetitorInputFormProps) {
  const handleAdd = () => {
    if (competitors.length >= maxCompetitors) return;
    onChange([
      ...competitors,
      { name: '', url: '', social_links: [], notes: '' },
    ]);
  };

  const handleUpdate = (index: number, updated: CompetitorInput) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = updated;
    onChange(newCompetitors);
  };

  const handleRemove = (index: number) => {
    onChange(competitors.filter((_, i) => i !== index));
  };

  return (
    <div className="competitor-form">
      {/* Header */}
      <div className="form-header">
        <h4>Конкуренты</h4>
        <span className="count">
          {competitors.length} / {maxCompetitors}
        </span>
      </div>

      {/* Competitor Cards */}
      <div className="competitors-list">
        {competitors.map((competitor, index) => (
          <CompetitorCard
            key={index}
            competitor={competitor}
            index={index}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Add Button */}
      {competitors.length < maxCompetitors && (
        <button
          type="button"
          className="add-btn"
          onClick={handleAdd}
          disabled={disabled}
        >
          <span className="add-icon">+</span>
          <span>Добавить конкурента</span>
        </button>
      )}

      {/* Empty state hint */}
      {competitors.length === 0 && (
        <p className="hint">
          Добавьте конкурентов для более точного анализа позиционирования
        </p>
      )}

      <style jsx>{`
        .competitor-form {
          margin-bottom: 16px;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .form-header h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .count {
          font-size: 12px;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 4px 10px;
          border-radius: 12px;
        }

        .competitors-list {
          margin-bottom: 16px;
        }

        .add-btn {
          width: 100%;
          padding: 14px 20px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--bg-secondary);
          border: 2px dashed var(--border-default);
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-btn:hover:not(:disabled) {
          background: rgba(88, 166, 255, 0.1);
          border-color: var(--accent-blue);
          color: var(--accent-blue);
        }

        .add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .add-icon {
          font-size: 18px;
          font-weight: 300;
        }

        .hint {
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
          margin: 12px 0 0 0;
        }
      `}</style>
    </div>
  );
}
