'use client';

import type { BusinessCanvas, BusinessStage, BusinessRecommendation } from '@/types/business';
import { BUSINESS_STAGE_LABELS } from '@/types/business';

// ===========================================
// Types
// ===========================================

interface CanvasViewProps {
  canvas: BusinessCanvas;
  businessStage?: BusinessStage;
  gapsInModel?: string[];
  recommendations?: BusinessRecommendation[];
}

// ===========================================
// Stage Badge Component
// ===========================================

function StageBadge({ stage }: { stage: BusinessStage }) {
  const stageColors: Record<BusinessStage, { bg: string; fg: string; emoji: string }> = {
    idea: { bg: 'var(--color-neutral-subtle)', fg: 'var(--color-fg-muted)', emoji: '💡' },
    building: { bg: 'var(--color-accent-subtle)', fg: 'var(--color-accent-fg)', emoji: '🔨' },
    early_traction: { bg: 'var(--color-attention-subtle)', fg: 'var(--color-attention-fg)', emoji: '🌱' },
    growing: { bg: 'var(--color-success-subtle)', fg: 'var(--color-success-fg)', emoji: '📈' },
    scaling: { bg: 'var(--color-done-subtle)', fg: 'var(--color-done-fg)', emoji: '🚀' },
  };

  const { bg, fg, emoji } = stageColors[stage];

  return (
    <span
      className="stage-badge"
      style={{ background: bg, color: fg }}
    >
      {emoji} {BUSINESS_STAGE_LABELS[stage]}
    </span>
  );
}

// ===========================================
// Canvas Block Component
// ===========================================

interface CanvasBlockProps {
  title: string;
  titleRu: string;
  items: string[] | string;
  color?: string;
  gridArea: string;
}

function CanvasBlock({ title, titleRu, items, color, gridArea }: CanvasBlockProps) {
  const content = Array.isArray(items) ? items : [items].filter(Boolean);

  return (
    <div className="canvas-block" style={{ gridArea, borderLeftColor: color }}>
      <div className="block-header">
        <span className="block-title">{titleRu}</span>
        <span className="block-title-en">{title}</span>
      </div>
      {content.length > 0 ? (
        <ul className="block-list">
          {content.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="block-empty">Не определено</p>
      )}

      <style jsx>{`
        .canvas-block {
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
          border-left: 3px solid var(--color-border-default);
          border-radius: 6px;
          padding: 12px;
          min-height: 100px;
        }

        .block-header {
          margin-bottom: 8px;
        }

        .block-title {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-fg-default);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .block-title-en {
          font-size: 10px;
          color: var(--color-fg-muted);
        }

        .block-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .block-list li {
          font-size: 13px;
          color: var(--color-fg-default);
          padding: 4px 0;
          line-height: 1.4;
        }

        .block-list li::before {
          content: '•';
          color: var(--color-fg-muted);
          margin-right: 6px;
        }

        .block-empty {
          font-size: 12px;
          color: var(--color-fg-muted);
          font-style: italic;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Main Component
// ===========================================

export function CanvasView({
  canvas,
  businessStage,
  gapsInModel,
  recommendations,
}: CanvasViewProps) {
  const blockColors = {
    partners: 'var(--color-accent-fg)',
    activities: 'var(--color-success-fg)',
    resources: 'var(--color-success-fg)',
    value: 'var(--color-done-fg)',
    relationships: 'var(--color-attention-fg)',
    channels: 'var(--color-attention-fg)',
    segments: 'var(--color-danger-fg)',
    costs: 'var(--color-neutral-emphasis)',
    revenue: 'var(--color-success-fg)',
  };

  return (
    <div className="canvas-view">
      {/* Header */}
      <div className="canvas-header">
        <h3 className="canvas-title">Business Model Canvas</h3>
        {businessStage && <StageBadge stage={businessStage} />}
      </div>

      {/* Canvas Grid */}
      <div className="canvas-grid">
        <CanvasBlock
          gridArea="partners"
          title="Key Partners"
          titleRu="Ключевые партнёры"
          items={canvas.key_partners}
          color={blockColors.partners}
        />
        <CanvasBlock
          gridArea="activities"
          title="Key Activities"
          titleRu="Ключевые активности"
          items={canvas.key_activities}
          color={blockColors.activities}
        />
        <CanvasBlock
          gridArea="resources"
          title="Key Resources"
          titleRu="Ключевые ресурсы"
          items={canvas.key_resources}
          color={blockColors.resources}
        />
        <CanvasBlock
          gridArea="value"
          title="Value Proposition"
          titleRu="Ценностное предложение"
          items={canvas.value_proposition}
          color={blockColors.value}
        />
        <CanvasBlock
          gridArea="relationships"
          title="Customer Relationships"
          titleRu="Отношения с клиентами"
          items={canvas.customer_relationships}
          color={blockColors.relationships}
        />
        <CanvasBlock
          gridArea="channels"
          title="Channels"
          titleRu="Каналы"
          items={canvas.channels}
          color={blockColors.channels}
        />
        <CanvasBlock
          gridArea="segments"
          title="Customer Segments"
          titleRu="Сегменты клиентов"
          items={canvas.customer_segments}
          color={blockColors.segments}
        />
        <CanvasBlock
          gridArea="costs"
          title="Cost Structure"
          titleRu="Структура затрат"
          items={canvas.cost_structure}
          color={blockColors.costs}
        />
        <CanvasBlock
          gridArea="revenue"
          title="Revenue Streams"
          titleRu="Потоки доходов"
          items={canvas.revenue_streams}
          color={blockColors.revenue}
        />
      </div>

      {/* Gaps in Model */}
      {gapsInModel && gapsInModel.length > 0 && (
        <div className="canvas-gaps">
          <h4 className="gaps-title">⚠️ Пробелы в модели</h4>
          <ul className="gaps-list">
            {gapsInModel.map((gap, idx) => (
              <li key={idx}>{gap}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="canvas-recommendations">
          <h4 className="recommendations-title">💡 Рекомендации</h4>
          <div className="recommendations-list">
            {recommendations.map((rec, idx) => (
              <div key={idx} className={`recommendation-item priority-${rec.priority}`}>
                <span className="rec-area">{rec.area}</span>
                <p className="rec-text">{rec.recommendation}</p>
                <span className={`rec-priority ${rec.priority}`}>
                  {rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'}{' '}
                  {rec.priority === 'high' ? 'Важно' : rec.priority === 'medium' ? 'Средний' : 'Низкий'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .canvas-view {
          margin: 24px 0;
        }

        .canvas-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .canvas-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-fg-default);
          margin: 0;
        }

        .stage-badge {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 16px;
          font-weight: 500;
        }

        .canvas-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          grid-template-rows: repeat(4, auto);
          gap: 8px;
          grid-template-areas:
            "partners activities value relationships segments"
            "partners activities value relationships segments"
            "partners resources  value channels     segments"
            "costs    costs      costs  revenue     revenue";
        }

        @media (max-width: 900px) {
          .canvas-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-template-areas:
              "partners activities"
              "resources value"
              "relationships channels"
              "segments segments"
              "costs revenue";
          }
        }

        @media (max-width: 600px) {
          .canvas-grid {
            grid-template-columns: 1fr;
            grid-template-areas:
              "value"
              "segments"
              "channels"
              "relationships"
              "activities"
              "resources"
              "partners"
              "revenue"
              "costs";
          }
        }

        .canvas-gaps {
          margin-top: 24px;
          padding: 16px;
          background: var(--color-attention-subtle);
          border: 1px solid var(--color-attention-muted);
          border-radius: 6px;
        }

        .gaps-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-attention-fg);
          margin: 0 0 12px 0;
        }

        .gaps-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .gaps-list li {
          font-size: 13px;
          color: var(--color-fg-default);
          padding: 4px 0;
        }

        .gaps-list li::before {
          content: '•';
          color: var(--color-attention-fg);
          margin-right: 8px;
        }

        .canvas-recommendations {
          margin-top: 24px;
        }

        .recommendations-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-fg-default);
          margin: 0 0 12px 0;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-item {
          padding: 12px 16px;
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
        }

        .recommendation-item.priority-high {
          border-left: 3px solid var(--color-danger-fg);
        }

        .recommendation-item.priority-medium {
          border-left: 3px solid var(--color-attention-fg);
        }

        .recommendation-item.priority-low {
          border-left: 3px solid var(--color-success-fg);
        }

        .rec-area {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rec-text {
          font-size: 14px;
          color: var(--color-fg-default);
          margin: 4px 0 8px 0;
          line-height: 1.5;
        }

        .rec-priority {
          font-size: 11px;
          color: var(--color-fg-muted);
        }
      `}</style>
    </div>
  );
}
