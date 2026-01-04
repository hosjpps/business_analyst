'use client';

import { useState } from 'react';
import type {
  CompetitorAnalyzeResponse,
  CompetitorProfile,
  ComparisonItem,
} from '@/types/competitor';
import { MARKET_POSITION_LABELS, COMPARISON_CATEGORY_LABELS } from '@/types/competitor';

// ===========================================
// Types
// ===========================================

interface CompetitorComparisonViewProps {
  result: CompetitorAnalyzeResponse;
}

// ===========================================
// Market Position Badge
// ===========================================

function MarketPositionBadge({
  position,
  explanation,
}: {
  position: 'leader' | 'challenger' | 'follower' | 'niche';
  explanation?: string;
}) {
  const icons = {
    leader: '👑',
    challenger: '⚔️',
    follower: '📈',
    niche: '🎯',
  };

  const positionInfo = MARKET_POSITION_LABELS[position];
  const icon = icons[position];

  return (
    <div className="market-position">
      <div
        className="position-badge"
        style={{ color: positionInfo.color }}
      >
        <span className="icon">{icon}</span>
        <span className="label">{positionInfo.label}</span>
      </div>
      {explanation && <p className="explanation">{explanation}</p>}

      <style jsx>{`
        .market-position {
          margin-bottom: 24px;
        }

        .position-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .icon {
          font-size: 16px;
        }

        .explanation {
          margin-top: 12px;
          font-size: 14px;
          color: var(--color-fg-muted);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Advantages & Gaps Section
// ===========================================

function AdvantagesGapsSection({
  advantages,
  gaps,
}: {
  advantages: string[];
  gaps: string[];
}) {
  return (
    <div className="advantages-gaps">
      <div className="column advantages">
        <h4>
          <span className="icon">✅</span>
          Ваши преимущества
        </h4>
        {advantages.length === 0 ? (
          <p className="empty">Не выявлены</p>
        ) : (
          <ul>
            {advantages.map((adv, i) => (
              <li key={i}>{adv}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="column gaps">
        <h4>
          <span className="icon">⚠️</span>
          Что нужно улучшить
        </h4>
        {gaps.length === 0 ? (
          <p className="empty">Не выявлены</p>
        ) : (
          <ul>
            {gaps.map((gap, i) => (
              <li key={i}>{gap}</li>
            ))}
          </ul>
        )}
      </div>

      <style jsx>{`
        .advantages-gaps {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .advantages-gaps {
            grid-template-columns: 1fr;
          }
        }

        .column {
          padding: 16px;
          border-radius: 8px;
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
        }

        .column h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-fg-default);
        }

        .icon {
          font-size: 14px;
        }

        .advantages {
          border-left: 3px solid var(--color-success-fg);
        }

        .gaps {
          border-left: 3px solid var(--color-attention-fg);
        }

        ul {
          margin: 0;
          padding-left: 20px;
        }

        li {
          font-size: 13px;
          color: var(--color-fg-default);
          margin-bottom: 8px;
          line-height: 1.4;
        }

        li:last-child {
          margin-bottom: 0;
        }

        .empty {
          font-size: 13px;
          color: var(--color-fg-muted);
          font-style: italic;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Competitor Profile Card
// ===========================================

function CompetitorProfileCard({ profile }: { profile: CompetitorProfile }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="profile-card">
      <div className="profile-header" onClick={() => setExpanded(!expanded)}>
        <div className="profile-info">
          <h4>{profile.name}</h4>
          {profile.url && (
            <a
              href={profile.url.startsWith('http') ? profile.url : `https://${profile.url}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {profile.url}
            </a>
          )}
        </div>
        <button className="expand-btn">{expanded ? '▲' : '▼'}</button>
      </div>

      <p className="description">{profile.description}</p>

      {profile.value_proposition && (
        <div className="value-prop">
          <span className="label">Value Proposition:</span>
          <span className="value">{profile.value_proposition}</span>
        </div>
      )}

      {expanded && (
        <div className="profile-details">
          {profile.target_audience && (
            <div className="detail-row">
              <span className="label">Целевая аудитория:</span>
              <span className="value">{profile.target_audience}</span>
            </div>
          )}

          {profile.pricing_model && (
            <div className="detail-row">
              <span className="label">Модель ценообразования:</span>
              <span className="value">{profile.pricing_model}</span>
            </div>
          )}

          {profile.key_features.length > 0 && (
            <div className="detail-section">
              <span className="label">Ключевые функции:</span>
              <ul>
                {profile.key_features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="strengths-weaknesses">
            {profile.strengths.length > 0 && (
              <div className="sw-column">
                <span className="label success">Сильные стороны:</span>
                <ul>
                  {profile.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {profile.weaknesses.length > 0 && (
              <div className="sw-column">
                <span className="label warning">Слабые стороны:</span>
                <ul>
                  {profile.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {profile.differentiators.length > 0 && (
            <div className="detail-section">
              <span className="label accent">Дифференциаторы:</span>
              <ul>
                {profile.differentiators.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .profile-card {
          background: var(--color-canvas-subtle);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .profile-card:not(:last-child) {
          border-bottom: 2px solid var(--border-default);
        }

        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          cursor: pointer;
        }

        .profile-info h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--color-fg-default);
        }

        .profile-info a {
          font-size: 12px;
          color: var(--color-accent-fg);
          text-decoration: none;
        }

        .profile-info a:hover {
          text-decoration: underline;
        }

        .expand-btn {
          background: var(--accent-green);
          border: none;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(35, 134, 54, 0.3);
        }

        .expand-btn:hover {
          background: #2ea043;
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(35, 134, 54, 0.4);
        }

        .description {
          font-size: 13px;
          color: var(--color-fg-muted);
          margin: 12px 0;
          line-height: 1.5;
        }

        .value-prop {
          display: flex;
          gap: 8px;
          font-size: 13px;
          padding: 8px 12px;
          background: var(--color-accent-subtle);
          border-radius: 6px;
        }

        .value-prop .label {
          color: var(--color-accent-fg);
          font-weight: 500;
        }

        .value-prop .value {
          color: var(--color-fg-default);
        }

        .profile-details {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border-default);
        }

        .detail-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .detail-row .label {
          color: var(--color-fg-muted);
          font-weight: 500;
        }

        .detail-row .value {
          color: var(--color-fg-default);
        }

        .detail-section {
          margin-top: 12px;
        }

        .detail-section .label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-fg-muted);
          margin-bottom: 6px;
        }

        .detail-section ul {
          margin: 0;
          padding-left: 18px;
        }

        .detail-section li {
          font-size: 13px;
          color: var(--color-fg-default);
          margin-bottom: 4px;
        }

        .strengths-weaknesses {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 12px;
        }

        @media (max-width: 600px) {
          .strengths-weaknesses {
            grid-template-columns: 1fr;
          }
        }

        .sw-column .label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 6px;
        }

        .sw-column .label.success {
          color: var(--color-success-fg);
        }

        .sw-column .label.warning {
          color: var(--color-attention-fg);
        }

        .sw-column ul {
          margin: 0;
          padding-left: 18px;
        }

        .sw-column li {
          font-size: 12px;
          color: var(--color-fg-default);
          margin-bottom: 4px;
        }

        .label.accent {
          color: var(--color-accent-fg);
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Comparison Matrix Table
// ===========================================

function ComparisonMatrix({
  matrix,
  competitorNames,
}: {
  matrix: ComparisonItem[];
  competitorNames: string[];
}) {
  if (matrix.length === 0) {
    return (
      <div className="empty-matrix">
        <p>Матрица сравнения недоступна</p>
        <style jsx>{`
          .empty-matrix {
            padding: 24px;
            text-align: center;
            background: var(--color-canvas-subtle);
            border: 1px dashed var(--color-border-default);
            border-radius: 8px;
          }
          p {
            margin: 0;
            color: var(--color-fg-muted);
            font-size: 13px;
          }
        `}</style>
      </div>
    );
  }

  // Group by category
  const categories = [...new Set(matrix.map((m) => m.category))];

  return (
    <div className="matrix-container">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="aspect-col">Аспект</th>
              <th className="you-col">Вы</th>
              {competitorNames.map((name) => (
                <th key={name} className="comp-col">
                  {name}
                </th>
              ))}
              <th className="winner-col">Лидер</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <>
                <tr key={`cat-${category}`} className="category-row">
                  <td colSpan={3 + competitorNames.length}>
                    {COMPARISON_CATEGORY_LABELS[category as keyof typeof COMPARISON_CATEGORY_LABELS] || category}
                  </td>
                </tr>
                {matrix
                  .filter((m) => m.category === category)
                  .map((item, idx) => (
                    <tr key={`${category}-${idx}`}>
                      <td className="aspect-cell">{item.aspect}</td>
                      <td className="value-cell you">
                        {item.your_product}
                      </td>
                      {competitorNames.map((name) => (
                        <td key={name} className="value-cell">
                          {item.competitors[name] || '—'}
                        </td>
                      ))}
                      <td className="winner-cell">
                        {item.winner === 'you' ? (
                          <span className="winner-you">Вы</span>
                        ) : (
                          <span className="winner-comp">{item.winner}</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .matrix-container {
          margin-bottom: 24px;
        }

        .table-wrapper {
          overflow-x: auto;
          border: 1px solid var(--color-border-default);
          border-radius: 8px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        th {
          background: var(--color-canvas-subtle);
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          color: var(--color-fg-default);
          border: 1px solid var(--border-default);
          white-space: nowrap;
        }

        .aspect-col {
          min-width: 150px;
        }

        .you-col {
          min-width: 100px;
        }

        .comp-col {
          min-width: 100px;
        }

        .winner-col {
          min-width: 80px;
        }

        td {
          padding: 10px 8px;
          border: 1px solid var(--border-default);
          color: var(--color-fg-default);
        }

        .category-row td {
          background: var(--color-canvas-inset);
          font-weight: 600;
          font-size: 12px;
          color: var(--color-fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .aspect-cell {
          font-weight: 500;
        }

        .value-cell {
          color: var(--color-fg-muted);
        }

        .value-cell.you {
          color: var(--color-accent-fg);
          font-weight: 500;
        }

        .winner-cell {
          text-align: center;
        }

        .winner-you {
          display: inline-block;
          padding: 2px 8px;
          background: var(--color-success-subtle);
          color: var(--color-success-fg);
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .winner-comp {
          font-size: 12px;
          color: var(--color-fg-muted);
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Recommendations Section
// ===========================================

function RecommendationsSection({ recommendations }: { recommendations: string[] }) {
  if (recommendations.length === 0) return null;

  return (
    <div className="recommendations">
      <h4>
        <span className="icon">💡</span>
        Рекомендации
      </h4>
      <ul>
        {recommendations.map((rec, i) => (
          <li key={i}>{rec}</li>
        ))}
      </ul>

      <style jsx>{`
        .recommendations {
          padding: 16px;
          background: var(--color-accent-subtle);
          border: 1px solid var(--color-accent-muted);
          border-radius: 8px;
          margin-bottom: 24px;
        }

        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-accent-fg);
        }

        .icon {
          font-size: 16px;
        }

        ul {
          margin: 0;
          padding-left: 20px;
        }

        li {
          font-size: 13px;
          color: var(--color-fg-default);
          margin-bottom: 8px;
          line-height: 1.5;
        }

        li:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Main Component
// ===========================================

export function CompetitorComparisonView({ result }: CompetitorComparisonViewProps) {
  if (!result.success) {
    return (
      <div className="error-state">
        <p>Ошибка анализа: {result.error}</p>
        <style jsx>{`
          .error-state {
            padding: 24px;
            text-align: center;
            background: var(--color-danger-subtle);
            border: 1px solid var(--color-danger-fg);
            border-radius: 8px;
          }
          p {
            margin: 0;
            color: var(--color-danger-fg);
          }
        `}</style>
      </div>
    );
  }

  const competitors = result.competitors || [];
  const competitorNames = competitors.map((c) => c.name);

  return (
    <div className="competitor-view">
      {/* Market Position */}
      {result.market_position && (
        <section className="section">
          <h3>Ваша позиция на рынке</h3>
          <MarketPositionBadge
            position={result.market_position}
            explanation={result.market_position_explanation}
          />
        </section>
      )}

      {/* Advantages & Gaps */}
      {(result.your_advantages?.length || result.your_gaps?.length) && (
        <section className="section">
          <h3>Ваше положение</h3>
          <AdvantagesGapsSection
            advantages={result.your_advantages || []}
            gaps={result.your_gaps || []}
          />
        </section>
      )}

      {/* Comparison Matrix */}
      {result.comparison_matrix && result.comparison_matrix.length > 0 && (
        <section className="section">
          <h3>Матрица сравнения</h3>
          <ComparisonMatrix
            matrix={result.comparison_matrix}
            competitorNames={competitorNames}
          />
        </section>
      )}

      {/* Competitor Profiles */}
      {competitors.length > 0 && (
        <section className="section">
          <h3>Профили конкурентов</h3>
          {competitors.map((profile, i) => (
            <CompetitorProfileCard key={i} profile={profile} />
          ))}
        </section>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <section className="section">
          <RecommendationsSection recommendations={result.recommendations} />
        </section>
      )}

      {/* Metadata */}
      {result.metadata && (
        <div className="metadata">
          <span>Конкурентов: {result.metadata.competitors_analyzed}</span>
          <span>•</span>
          <span>Сайтов распарсено: {result.metadata.websites_parsed}</span>
          <span>•</span>
          <span>Время: {(result.metadata.analysis_duration_ms / 1000).toFixed(1)}с</span>
        </div>
      )}

      <style jsx>{`
        .competitor-view {
          padding: 16px 0;
        }

        .section {
          margin-bottom: 32px;
        }

        .section h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-fg-default);
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--color-border-default);
        }

        .metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 12px;
          color: var(--color-fg-muted);
          padding: 12px;
          background: var(--color-canvas-subtle);
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
