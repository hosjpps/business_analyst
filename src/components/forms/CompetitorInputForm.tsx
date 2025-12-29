'use client';

import { useState } from 'react';
import type { CompetitorInput } from '@/types/competitor';

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
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="competitor-card">
      <div className="competitor-header">
        <span className="competitor-number">{index + 1}</span>
        <input
          type="text"
          className="competitor-name"
          placeholder="Название конкурента"
          value={competitor.name}
          onChange={(e) =>
            onUpdate(index, { ...competitor, name: e.target.value })
          }
          disabled={disabled}
        />
        <button
          type="button"
          className="expand-btn"
          onClick={() => setExpanded(!expanded)}
          disabled={disabled}
        >
          {expanded ? '▲' : '▼'}
        </button>
        <button
          type="button"
          className="remove-btn"
          onClick={() => onRemove(index)}
          disabled={disabled}
        >
          ✕
        </button>
      </div>

      <div className="competitor-url">
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

      {expanded && (
        <div className="competitor-details">
          <div className="social-links-grid">
            <div className="social-input">
              <label>Instagram</label>
              <input
                type="url"
                placeholder="https://instagram.com/..."
                value={competitor.social_links?.instagram || ''}
                onChange={(e) =>
                  onUpdate(index, {
                    ...competitor,
                    social_links: {
                      ...competitor.social_links,
                      instagram: e.target.value,
                    },
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="social-input">
              <label>LinkedIn</label>
              <input
                type="url"
                placeholder="https://linkedin.com/company/..."
                value={competitor.social_links?.linkedin || ''}
                onChange={(e) =>
                  onUpdate(index, {
                    ...competitor,
                    social_links: {
                      ...competitor.social_links,
                      linkedin: e.target.value,
                    },
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="social-input">
              <label>Twitter</label>
              <input
                type="url"
                placeholder="https://twitter.com/..."
                value={competitor.social_links?.twitter || ''}
                onChange={(e) =>
                  onUpdate(index, {
                    ...competitor,
                    social_links: {
                      ...competitor.social_links,
                      twitter: e.target.value,
                    },
                  })
                }
                disabled={disabled}
              />
            </div>
          </div>

          <div className="notes-input">
            <label>Заметки о конкуренте</label>
            <textarea
              placeholder="Что вы знаете об этом конкуренте? Чем они отличаются?"
              value={competitor.notes || ''}
              onChange={(e) =>
                onUpdate(index, { ...competitor, notes: e.target.value })
              }
              disabled={disabled}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .competitor-card {
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .competitor-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .competitor-number {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-accent-subtle);
          color: var(--color-accent-fg);
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .competitor-name {
          flex: 1;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: 500;
          background: var(--color-canvas-default);
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
          color: var(--color-fg-default);
        }

        .competitor-name:focus {
          outline: none;
          border-color: var(--color-accent-fg);
        }

        .expand-btn,
        .remove-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
          color: var(--color-fg-muted);
          cursor: pointer;
          font-size: 12px;
        }

        .expand-btn:hover {
          background: var(--color-accent-subtle);
          color: var(--color-accent-fg);
        }

        .remove-btn:hover {
          background: var(--color-danger-subtle);
          color: var(--color-danger-fg);
          border-color: var(--color-danger-fg);
        }

        .competitor-url {
          margin-top: 8px;
        }

        .competitor-url input {
          width: 100%;
          padding: 8px 12px;
          font-size: 13px;
          background: var(--color-canvas-default);
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
          color: var(--color-fg-default);
        }

        .competitor-url input:focus {
          outline: none;
          border-color: var(--color-accent-fg);
        }

        .competitor-details {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--color-border-default);
        }

        .social-links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .social-input label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: var(--color-fg-muted);
          margin-bottom: 4px;
        }

        .social-input input {
          width: 100%;
          padding: 6px 10px;
          font-size: 12px;
          background: var(--color-canvas-default);
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          color: var(--color-fg-default);
        }

        .notes-input label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: var(--color-fg-muted);
          margin-bottom: 4px;
        }

        .notes-input textarea {
          width: 100%;
          min-height: 60px;
          padding: 8px 10px;
          font-size: 13px;
          background: var(--color-canvas-default);
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          color: var(--color-fg-default);
          resize: vertical;
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
  maxCompetitors = 5,
}: CompetitorInputFormProps) {
  const handleAdd = () => {
    if (competitors.length >= maxCompetitors) return;
    onChange([
      ...competitors,
      { name: '', url: '', social_links: {}, notes: '' },
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
      <div className="form-header">
        <h4>Конкуренты</h4>
        <span className="count">
          {competitors.length} / {maxCompetitors}
        </span>
      </div>

      {competitors.length === 0 && (
        <div className="empty-state">
          <p>Добавьте конкурентов для сравнительного анализа</p>
        </div>
      )}

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

      {competitors.length < maxCompetitors && (
        <button
          type="button"
          className="add-btn"
          onClick={handleAdd}
          disabled={disabled}
        >
          + Добавить конкурента
        </button>
      )}

      <style jsx>{`
        .competitor-form {
          margin-bottom: 24px;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .form-header h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-fg-default);
          margin: 0;
        }

        .count {
          font-size: 12px;
          color: var(--color-fg-muted);
        }

        .empty-state {
          padding: 24px;
          text-align: center;
          background: var(--color-canvas-subtle);
          border: 1px dashed var(--color-border-default);
          border-radius: 6px;
          margin-bottom: 12px;
        }

        .empty-state p {
          color: var(--color-fg-muted);
          margin: 0;
          font-size: 13px;
        }

        .add-btn {
          width: 100%;
          padding: 12px;
          font-size: 14px;
          background: transparent;
          border: 1px dashed var(--color-border-default);
          border-radius: 6px;
          color: var(--color-fg-muted);
          cursor: pointer;
        }

        .add-btn:hover:not(:disabled) {
          background: var(--color-accent-subtle);
          border-color: var(--color-accent-fg);
          color: var(--color-accent-fg);
        }

        .add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
