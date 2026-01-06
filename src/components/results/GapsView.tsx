'use client';

import { useState } from 'react';
import type { Gap, GapTask } from '@/types/gaps';
import { GAP_CATEGORY_LABELS } from '@/types/gaps';
import { formatTimeEstimate } from '@/lib/gaps/task-generator';
import { Checklist } from '@/components/ui/Checklist';
import { TermTooltip } from '@/components/ui/TermTooltip';
import type { ChecklistItem } from '@/types/ux';

// ===========================================
// Types
// ===========================================

interface GapsViewProps {
  gaps: Gap[];
  tasks?: GapTask[];
  nextMilestone?: string;
  projectId?: string; // For localStorage persistence of checklist
  // NEW: From skills analysis
  summary?: string;
  strengths?: string[];
  marketInsights?: {
    icp?: string;
    go_to_market?: string[];
    fit_score?: number;
  };
}

// ===========================================
// Helper: Convert GapTask to ChecklistItem
// ===========================================

function convertTasksToChecklist(tasks: GapTask[], projectId?: string): ChecklistItem[] {
  return tasks.map((task, idx) => ({
    id: `task-${projectId || 'default'}-${idx}`,
    title: task.title,
    description: task.description,
    priority: task.priority,
    estimatedTime: formatTimeEstimate(task.estimated_minutes),
    completed: false,
    steps: [], // Tasks don't have sub-steps by default
    whyImportant: task.addresses_gap
      ? `Устраняет разрыв: ${GAP_CATEGORY_LABELS[task.addresses_gap as keyof typeof GAP_CATEGORY_LABELS] || task.addresses_gap}`
      : undefined,
  }));
}

// ===========================================
// Severity Badge
// ===========================================

function SeverityBadge({ severity }: { severity: Gap['type'] }) {
  const config = {
    critical: {
      emoji: '🔴',
      label: 'Critical',
      color: 'var(--accent-red)',
      termKey: 'critical_gap',
    },
    warning: {
      emoji: '🟡',
      label: 'Warning',
      color: 'var(--accent-orange)',
      termKey: 'warning_gap',
    },
    info: {
      emoji: '🟢',
      label: 'Info',
      color: 'var(--accent-green)',
      termKey: 'info_gap',
    },
  };

  const { emoji, label, color, termKey } = config[severity];

  return (
    <TermTooltip termKey={termKey}>
      <span className="severity-badge" style={{ color }}>
        {emoji} {label}
      </span>
    </TermTooltip>
  );
}

// ===========================================
// Category Badge
// ===========================================

function CategoryBadge({ category }: { category: Gap['category'] }) {
  return (
    <span className="category-badge">
      {GAP_CATEGORY_LABELS[category]}
    </span>
  );
}

// ===========================================
// Effort/Impact Indicator
// ===========================================

function LevelIndicator({
  label,
  level,
}: {
  label: string;
  level: 'low' | 'medium' | 'high';
}) {
  const dots = {
    low: 1,
    medium: 2,
    high: 3,
  };

  return (
    <span className="level-indicator">
      <span className="level-label">{label}:</span>
      <span className="level-dots">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`dot ${i <= dots[level] ? 'active' : ''}`}
          />
        ))}
      </span>
    </span>
  );
}

// ===========================================
// Category Icons
// ===========================================

const CATEGORY_ICONS: Record<Gap['category'], string> = {
  monetization: '💰',
  growth: '📈',
  security: '🔒',
  ux: '🎨',
  infrastructure: '🏗️',
  marketing: '📢',
  scalability: '⚡',
  documentation: '📚',
  testing: '🧪',
  fundamental_mismatch: '⚠️',
};

const CATEGORY_LABELS_RU: Record<Gap['category'], string> = {
  monetization: 'Монетизация',
  growth: 'Рост',
  security: 'Безопасность',
  ux: 'UX',
  infrastructure: 'Инфраструктура',
  marketing: 'Маркетинг',
  scalability: 'Масштабируемость',
  documentation: 'Документация',
  testing: 'Тестирование',
  fundamental_mismatch: 'Несоответствие',
};

const IMPACT_LABELS: Record<Gap['impact'], string> = {
  low: 'Низкое влияние',
  medium: 'Среднее влияние',
  high: 'Высокое влияние',
};

// ===========================================
// Actionable Gap Card (NEW DESIGN with Mobile Collapse)
// ===========================================

function ActionableGapCard({ gap, defaultCollapsed = false }: { gap: Gap; defaultCollapsed?: boolean }) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const categoryIcon = CATEGORY_ICONS[gap.category];
  const categoryLabel = CATEGORY_LABELS_RU[gap.category];
  const impactLabel = IMPACT_LABELS[gap.impact];

  // Determine problem summary: use hook or create from current_state
  const problemSummary = gap.hook || gap.current_state;

  return (
    <div className={`actionable-gap-card severity-${gap.type} ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header: Category + Severity + Collapse Toggle */}
      <div className="agc-header">
        <div className="agc-category">
          <span className="agc-category-icon">{categoryIcon}</span>
          <span className="agc-category-label">{categoryLabel.toUpperCase()}</span>
        </div>
        <div className="agc-header-right">
          <SeverityBadge severity={gap.type} />
          <button
            className="agc-collapse-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            <span className={`agc-toggle-icon ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
          </button>
        </div>
      </div>

      {/* Problem Summary - Always visible */}
      <div className="agc-problem">
        <span className="agc-problem-icon">⚠️</span>
        <span className="agc-problem-text">{problemSummary}</span>
      </div>

      {/* Collapsible Content */}
      <div className={`agc-collapsible ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Why Matters */}
        {gap.why_matters && (
          <p className="agc-why-matters">{gap.why_matters}</p>
        )}

        {/* If no why_matters, show business goal context */}
        {!gap.why_matters && (
          <p className="agc-context">
            <strong>Цель:</strong> {gap.business_goal}
          </p>
        )}

        {/* Action Steps Card */}
        {gap.action_steps && gap.action_steps.length > 0 && (
          <div className="agc-actions-card">
            <div className="agc-actions-header">
              <span className="agc-actions-icon">💡</span>
              <span className="agc-actions-title">Что делать:</span>
            </div>
            <ol className="agc-steps">
              {gap.action_steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
            <div className="agc-actions-footer">
              {gap.time_to_fix && (
                <span className="agc-time">
                  <span className="agc-time-icon">⏱️</span>
                  {gap.time_to_fix}
                </span>
              )}
              <span className={`agc-impact impact-${gap.impact}`}>
                <span className="agc-impact-icon">📈</span>
                {impactLabel}
              </span>
            </div>
          </div>
        )}

        {/* Recommendation (if no action steps) */}
        {(!gap.action_steps || gap.action_steps.length === 0) && (
          <div className="agc-recommendation">
            <span className="agc-rec-label">Рекомендация:</span>
            <p className="agc-rec-text">{gap.recommendation}</p>
            <div className="agc-meta">
              {gap.time_to_fix && (
                <span className="agc-time">
                  <span className="agc-time-icon">⏱️</span>
                  {gap.time_to_fix}
                </span>
              )}
              <span className={`agc-impact impact-${gap.impact}`}>
                <span className="agc-impact-icon">📈</span>
                {impactLabel}
              </span>
              <LevelIndicator label="Усилия" level={gap.effort} />
            </div>
          </div>
        )}

        {/* Resources & Actions */}
        {gap.resources && gap.resources.length > 0 && (
          <div className="agc-resources">
            {gap.resources.map((resource, idx) => (
              <a
                key={idx}
                href={resource}
                target="_blank"
                rel="noopener noreferrer"
                className="agc-resource-link"
              >
                📚 Документация
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================
// Legacy Gap Card (for backward compatibility)
// ===========================================

function GapCard({ gap }: { gap: Gap }) {
  return (
    <div className={`gap-card severity-${gap.type}`}>
      <div className="gap-header">
        <SeverityBadge severity={gap.type} />
        <CategoryBadge category={gap.category} />
        {gap.time_to_fix && (
          <span className="time-badge">⏱️ {gap.time_to_fix}</span>
        )}
      </div>

      {/* Hook - attention grabbing sentence */}
      {gap.hook && (
        <div className="gap-hook">
          💡 {gap.hook}
        </div>
      )}

      <div className="gap-content">
        <div className="gap-section">
          <span className="gap-section-label">Цель бизнеса:</span>
          <p className="gap-section-text">{gap.business_goal}</p>
        </div>

        <div className="gap-section">
          <span className="gap-section-label">Текущее состояние:</span>
          <p className="gap-section-text">{gap.current_state}</p>
        </div>

        <div className="gap-section">
          <span className="gap-section-label">Рекомендация:</span>
          <p className="gap-section-text highlight">{gap.recommendation}</p>
        </div>

        {/* Action Steps */}
        {gap.action_steps && gap.action_steps.length > 0 && (
          <div className="gap-section">
            <span className="gap-section-label">Шаги по исправлению:</span>
            <ul className="action-steps">
              {gap.action_steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Why Matters */}
        {gap.why_matters && (
          <div className="gap-section">
            <span className="gap-section-label">Почему это важно:</span>
            <p className="gap-section-text why-matters">{gap.why_matters}</p>
          </div>
        )}
      </div>

      <div className="gap-footer">
        <LevelIndicator label="Усилия" level={gap.effort} />
        <LevelIndicator label="Влияние" level={gap.impact} />
      </div>

      {gap.resources && gap.resources.length > 0 && (
        <div className="gap-resources">
          <span className="resources-label">Ресурсы:</span>
          {gap.resources.map((resource, idx) => (
            <a key={idx} href={resource} target="_blank" rel="noopener noreferrer">
              {resource}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ===========================================
// Main Component
// ===========================================

export function GapsView({ gaps, tasks, nextMilestone, projectId, summary, strengths, marketInsights }: GapsViewProps) {
  // Group gaps by severity
  const criticalGaps = gaps.filter((g) => g.type === 'critical');
  const warningGaps = gaps.filter((g) => g.type === 'warning');
  const infoGaps = gaps.filter((g) => g.type === 'info');

  // Convert tasks to checklist items
  const checklistItems = tasks ? convertTasksToChecklist(tasks, projectId) : [];
  const storageKey = projectId ? `checklist-${projectId}` : undefined;

  return (
    <div className="gaps-view">
      {/* Summary */}
      {summary && (
        <div className="analysis-summary">
          <h4 className="section-title">📊 Обзор анализа</h4>
          <p className="summary-text">{summary}</p>
        </div>
      )}

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <div className="strengths-section">
          <h4 className="section-title">✅ Сильные стороны</h4>
          <ul className="strengths-list">
            {strengths.map((strength, idx) => (
              <li key={idx}>{strength}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Market Insights */}
      {marketInsights && (marketInsights.icp || marketInsights.go_to_market?.length) && (
        <div className="market-insights">
          <h4 className="section-title">🎯 Рыночные инсайты</h4>
          {marketInsights.icp && (
            <div className="insight-item">
              <span className="insight-label">Идеальный клиент (ICP):</span>
              <p className="insight-text">{marketInsights.icp}</p>
            </div>
          )}
          {marketInsights.go_to_market && marketInsights.go_to_market.length > 0 && (
            <div className="insight-item">
              <span className="insight-label">Стратегии выхода на рынок:</span>
              <ul className="gtm-list">
                {marketInsights.go_to_market.map((strategy, idx) => (
                  <li key={idx}>{strategy}</li>
                ))}
              </ul>
            </div>
          )}
          {marketInsights.fit_score && (
            <div className="fit-score">
              <span className="fit-label">Product-Market Fit:</span>
              <div className="fit-bar">
                <div
                  className="fit-fill"
                  style={{ width: `${marketInsights.fit_score * 10}%` }}
                />
              </div>
              <span className="fit-value">{marketInsights.fit_score}/10</span>
            </div>
          )}
        </div>
      )}

      {/* Stats Summary */}
      <div className="gaps-stats">
        <div className="stat-item critical">
          <span className="stat-number">{criticalGaps.length}</span>
          <span className="stat-label">Critical</span>
        </div>
        <div className="stat-item warning">
          <span className="stat-number">{warningGaps.length}</span>
          <span className="stat-label">Warning</span>
        </div>
        <div className="stat-item info">
          <span className="stat-number">{infoGaps.length}</span>
          <span className="stat-label">Info</span>
        </div>
      </div>

      {/* Gap Cards - NEW Actionable Design */}
      {gaps.length > 0 ? (
        <div className="gaps-list actionable">
          <h4 className="section-title">🎯 Найденные разрывы</h4>
          {gaps.map((gap, index) => (
            <div
              key={gap.id}
              className="gap-card-wrapper"
              style={{ animationDelay: `${0.1 + index * 0.08}s` }}
            >
              <ActionableGapCard gap={gap} />
            </div>
          ))}
        </div>
      ) : (
        <div className="no-gaps">
          <span className="no-gaps-icon">✅</span>
          <p>Разрывы не обнаружены! Отличная работа.</p>
        </div>
      )}

      {/* Tasks as Checklist */}
      {checklistItems.length > 0 && (
        <div className="tasks-section">
          <h4 className="section-title">
            <TermTooltip termKey="gap" showIcon={false}>
              Рекомендуемые задачи
            </TermTooltip>
          </h4>
          <Checklist
            items={checklistItems}
            storageKey={storageKey}
            groupByPriority={true}
            showProgress={true}
          />
        </div>
      )}

      {/* Next Milestone */}
      {nextMilestone && (
        <div className="next-milestone">
          <span className="milestone-icon">🎯</span>
          <div className="milestone-content">
            <span className="milestone-label">Следующая цель:</span>
            <p className="milestone-text">{nextMilestone}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .gaps-view {
          margin: 24px 0;
        }

        /* Summary Section */
        .analysis-summary {
          margin-bottom: 24px;
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
        }

        .summary-text {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.6;
          margin: 8px 0 0 0;
        }

        /* Strengths Section */
        .strengths-section {
          margin-bottom: 24px;
          padding: 16px;
          background: rgba(35, 134, 54, 0.1);
          border: 1px solid rgba(35, 134, 54, 0.3);
          border-radius: 8px;
        }

        .strengths-list {
          margin: 8px 0 0 0;
          padding-left: 20px;
        }

        .strengths-list li {
          font-size: 13px;
          color: var(--text-primary);
          margin-bottom: 6px;
          line-height: 1.5;
        }

        /* Market Insights */
        .market-insights {
          margin-bottom: 24px;
          padding: 16px;
          background: rgba(88, 166, 255, 0.1);
          border: 1px solid rgba(88, 166, 255, 0.3);
          border-radius: 8px;
        }

        .insight-item {
          margin-bottom: 12px;
        }

        .insight-item:last-child {
          margin-bottom: 0;
        }

        .insight-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--accent-blue);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .insight-text {
          font-size: 13px;
          color: var(--text-primary);
          margin: 4px 0 0 0;
          line-height: 1.5;
        }

        .gtm-list {
          margin: 4px 0 0 0;
          padding-left: 20px;
        }

        .gtm-list li {
          font-size: 13px;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .fit-score {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
        }

        .fit-label {
          font-size: 12px;
          color: var(--text-muted);
        }

        .fit-bar {
          flex: 1;
          max-width: 200px;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
        }

        .fit-fill {
          height: 100%;
          background: var(--accent-blue);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .fit-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--accent-blue);
        }

        .gaps-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-item {
          flex: 1;
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          text-align: center;
          transition: all 0.25s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
          animation: statFadeIn 0.4s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
        }

        .stat-item:nth-child(1) { animation-delay: 0.1s; }
        .stat-item:nth-child(2) { animation-delay: 0.2s; }
        .stat-item:nth-child(3) { animation-delay: 0.3s; }

        @keyframes statFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .stat-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.3));
        }

        .stat-item.critical {
          border-left: 3px solid var(--accent-red);
        }

        .stat-item.critical:hover {
          box-shadow: 0 4px 12px rgba(248, 81, 73, 0.15);
        }

        .stat-item.warning {
          border-left: 3px solid var(--accent-orange);
        }

        .stat-item.warning:hover {
          box-shadow: 0 4px 12px rgba(210, 153, 34, 0.15);
        }

        .stat-item.info {
          border-left: 3px solid var(--accent-green);
        }

        .stat-item.info:hover {
          box-shadow: 0 4px 12px rgba(35, 134, 54, 0.15);
        }

        .stat-number {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
          transition: transform 0.2s ease;
        }

        .stat-item:hover .stat-number {
          transform: scale(1.1);
        }

        .stat-label {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 16px 0;
        }

        .gaps-list {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .gap-card-wrapper {
          animation: gapSlideIn 0.4s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
        }

        @keyframes gapSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .gap-card {
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .gap-card.severity-critical {
          border-left: 3px solid var(--accent-red);
        }

        .gap-card.severity-warning {
          border-left: 3px solid var(--accent-orange);
        }

        .gap-card.severity-info {
          border-left: 3px solid var(--accent-green);
        }

        .gap-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .severity-badge {
          font-size: 12px;
          font-weight: 500;
          transition: transform 0.2s ease;
        }

        .actionable-gap-card.severity-critical .severity-badge {
          animation: criticalPulse 2s ease-in-out infinite;
        }

        @keyframes criticalPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .actionable-gap-card:hover .severity-badge {
          transform: scale(1.05);
        }

        .category-badge {
          font-size: 11px;
          padding: 2px 8px;
          background: var(--bg-tertiary);
          color: var(--text-muted);
          border-radius: 12px;
        }

        .time-badge {
          font-size: 11px;
          color: var(--text-muted);
          margin-left: auto;
        }

        .gap-hook {
          font-size: 14px;
          font-weight: 500;
          color: var(--accent-blue);
          margin-bottom: 12px;
          padding: 8px 12px;
          background: rgba(88, 166, 255, 0.08);
          border-radius: 6px;
          line-height: 1.4;
        }

        .action-steps {
          margin: 8px 0 0 0;
          padding-left: 20px;
        }

        .action-steps li {
          font-size: 13px;
          color: var(--text-primary);
          margin-bottom: 4px;
          line-height: 1.5;
        }

        .action-steps li::marker {
          color: var(--accent-blue);
        }

        .gap-section-text.why-matters {
          font-style: italic;
          color: var(--text-secondary);
          background: rgba(136, 87, 44, 0.1);
          padding: 8px;
          border-radius: 4px;
          border-left: 2px solid var(--accent-orange);
        }

        .gap-content {
          margin-bottom: 12px;
        }

        .gap-section {
          margin-bottom: 8px;
        }

        .gap-section-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .gap-section-text {
          font-size: 13px;
          color: var(--text-primary);
          margin: 4px 0 0 0;
          line-height: 1.5;
        }

        .gap-section-text.highlight {
          background: rgba(88, 166, 255, 0.1);
          padding: 8px;
          border-radius: 4px;
          border-left: 2px solid var(--accent-blue);
        }

        .gap-footer {
          display: flex;
          gap: 24px;
        }

        .level-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .level-label {
          font-size: 11px;
          color: var(--text-muted);
        }

        .level-dots {
          display: flex;
          gap: 3px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--bg-tertiary);
        }

        .dot.active {
          background: var(--accent-blue);
        }

        .gap-resources {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-default);
        }

        .resources-label {
          font-size: 11px;
          color: var(--text-muted);
          margin-right: 8px;
        }

        .gap-resources a {
          font-size: 12px;
          color: var(--accent-blue);
          margin-right: 12px;
        }

        .no-gaps {
          text-align: center;
          padding: 32px;
          background: rgba(35, 134, 54, 0.1);
          border: 1px solid rgba(35, 134, 54, 0.3);
          border-radius: 8px;
        }

        .no-gaps-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 8px;
        }

        .no-gaps p {
          color: var(--accent-green);
          margin: 0;
        }

        .tasks-section {
          margin-bottom: 24px;
        }

        .next-milestone {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: rgba(88, 166, 255, 0.1);
          border: 1px solid rgba(88, 166, 255, 0.3);
          border-radius: 8px;
        }

        .milestone-icon {
          font-size: 20px;
        }

        .milestone-content {
          flex: 1;
        }

        .milestone-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--accent-blue);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .milestone-text {
          font-size: 14px;
          color: var(--text-primary);
          margin: 4px 0 0 0;
        }

        /* ===== Actionable Gap Card (NEW) ===== */
        .actionable-gap-card {
          padding: 24px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          margin-bottom: 0; /* Using gap in parent instead */
          transition: all 0.25s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
        }

        .actionable-gap-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.3));
          border-color: var(--border-muted);
        }

        .actionable-gap-card.severity-critical {
          border-left: 4px solid var(--accent-red);
        }

        .actionable-gap-card.severity-critical:hover {
          box-shadow: 0 8px 24px rgba(248, 81, 73, 0.2);
        }

        .actionable-gap-card.severity-warning {
          border-left: 4px solid var(--accent-orange);
        }

        .actionable-gap-card.severity-warning:hover {
          box-shadow: 0 8px 24px rgba(210, 153, 34, 0.2);
        }

        .actionable-gap-card.severity-info {
          border-left: 4px solid var(--accent-green);
        }

        .actionable-gap-card.severity-info:hover {
          box-shadow: 0 8px 24px rgba(35, 134, 54, 0.2);
        }

        .agc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .agc-category {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .agc-category-icon {
          font-size: 20px;
        }

        .agc-category-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }

        .agc-problem {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          background: rgba(248, 81, 73, 0.08);
          border-radius: 8px;
          margin-bottom: 16px;
          margin-left: 12px;
          margin-top: 12px;
        }

        .actionable-gap-card.severity-warning .agc-problem {
          background: rgba(210, 153, 34, 0.08);
        }

        .actionable-gap-card.severity-info .agc-problem {
          background: rgba(35, 134, 54, 0.08);
        }

        .agc-problem-icon {
          font-size: 18px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .agc-problem-text {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.5;
        }

        .agc-why-matters {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0 0 16px 0;
          padding: 12px 16px;
          background: rgba(88, 166, 255, 0.06);
          border-radius: 8px;
          border-left: 3px solid var(--accent-blue);
        }

        .agc-context {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 16px 0;
          padding: 12px 16px;
          background: var(--color-canvas-subtle);
          border-radius: 8px;
        }

        .agc-context strong {
          color: var(--text-primary);
        }

        .agc-actions-card {
          background: rgba(35, 134, 54, 0.06);
          border: 1px solid rgba(35, 134, 54, 0.2);
          border-left: 3px solid var(--accent-green);
          border-radius: 8px;
          padding: 16px 18px;
          margin-bottom: 12px;
        }

        .agc-actions-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .agc-actions-icon {
          font-size: 18px;
        }

        .agc-actions-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .agc-steps {
          margin: 0;
          padding-left: 24px;
        }

        .agc-steps li {
          font-size: 14px;
          color: var(--text-primary);
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .agc-steps li:last-child {
          margin-bottom: 0;
        }

        .agc-steps li::marker {
          color: var(--accent-blue);
          font-weight: 600;
        }

        .agc-actions-footer {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--border-muted);
        }

        .agc-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted);
        }

        .agc-time-icon {
          font-size: 14px;
        }

        .agc-impact {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
        }

        .agc-impact.impact-low {
          color: var(--text-muted);
        }

        .agc-impact.impact-medium {
          color: var(--accent-orange);
        }

        .agc-impact.impact-high {
          color: var(--accent-green);
        }

        .agc-impact-icon {
          font-size: 14px;
        }

        .agc-recommendation {
          background: rgba(88, 166, 255, 0.06);
          border: 1px solid rgba(88, 166, 255, 0.2);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .agc-rec-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-blue);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .agc-rec-text {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.6;
          margin: 8px 0 12px 0;
        }

        .agc-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .agc-resources {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-muted);
        }

        .agc-resource-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--accent-blue);
          text-decoration: none;
          padding: 6px 12px;
          background: rgba(88, 166, 255, 0.08);
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .agc-resource-link:hover {
          background: rgba(88, 166, 255, 0.15);
        }

        @media (prefers-reduced-motion: reduce) {
          .gap-card-wrapper,
          .stat-item,
          .actionable-gap-card {
            animation: none;
          }

          .stat-item:hover,
          .actionable-gap-card:hover {
            transform: none;
          }

          .actionable-gap-card.severity-critical .severity-badge {
            animation: none;
          }
        }

        /* ===== Collapse Toggle Button ===== */
        .agc-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .agc-collapse-toggle {
          display: flex; /* Always visible */
          background: var(--accent-green);
          border: none;
          padding: 6px 10px;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          min-width: 32px;
          min-height: 32px;
          justify-content: center;
          align-items: center;
        }

        .agc-collapse-toggle:hover {
          background: #2ea043;
        }

        .agc-collapse-toggle:focus {
          outline: 2px solid var(--accent-blue);
          outline-offset: 2px;
        }

        .agc-toggle-icon {
          display: inline-block;
          font-size: 12px;
          color: white;
          font-weight: bold;
          transition: transform 0.25s ease;
        }

        .agc-toggle-icon.collapsed {
          transform: rotate(-90deg);
        }

        /* ===== Collapsible Content ===== */
        .agc-collapsible {
          overflow: hidden;
          transition: max-height 0.3s ease, opacity 0.2s ease;
          max-height: 2000px; /* Large enough for any content */
          opacity: 1;
          padding-left: 12px;
          padding-top: 8px;
        }

        .agc-collapsible.collapsed {
          max-height: 0;
          opacity: 0;
        }

        /* ===== MOBILE STYLES (768px and below) ===== */
        @media (max-width: 768px) {
          .gaps-view {
            margin: 16px 0;
          }

          /* Stats: Stack vertically on mobile */
          .gaps-stats {
            flex-direction: column;
            gap: 12px;
          }

          .stat-item {
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .stat-number {
            font-size: 24px;
          }

          /* Keep collapse toggle visible on mobile too */
          .agc-collapse-toggle {
            display: flex;
            min-width: 44px;
            min-height: 44px;
          }

          /* Actionable Gap Card mobile adjustments */
          .actionable-gap-card {
            padding: 16px;
          }

          .agc-header {
            flex-wrap: wrap;
            gap: 8px;
          }

          .agc-problem {
            padding: 10px 12px;
          }

          .agc-problem-text {
            font-size: 14px;
          }

          .agc-actions-card {
            padding: 12px;
          }

          .agc-actions-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .agc-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          /* Strengths and market insights */
          .strengths-section,
          .market-insights,
          .analysis-summary {
            padding: 12px;
          }

          .section-title {
            font-size: 13px;
          }

          /* Next milestone */
          .next-milestone {
            flex-direction: column;
            gap: 8px;
            padding: 12px;
          }

          .milestone-icon {
            font-size: 24px;
          }
        }

        /* ===== SMALL MOBILE (480px and below) ===== */
        @media (max-width: 480px) {
          .gaps-view {
            margin: 12px 0;
          }

          /* Even smaller stats */
          .stat-item {
            padding: 10px 12px;
          }

          .stat-number {
            font-size: 20px;
          }

          .stat-label {
            font-size: 11px;
          }

          /* Gap card */
          .actionable-gap-card {
            padding: 12px;
            border-radius: 8px;
          }

          .agc-category-label {
            font-size: 10px;
          }

          .agc-category-icon {
            font-size: 16px;
          }

          .agc-problem {
            padding: 8px 10px;
          }

          .agc-problem-icon {
            font-size: 14px;
          }

          .agc-problem-text {
            font-size: 13px;
          }

          .agc-why-matters,
          .agc-context,
          .agc-rec-text {
            font-size: 13px;
          }

          .agc-steps li {
            font-size: 13px;
          }

          .agc-time,
          .agc-impact {
            font-size: 12px;
          }

          /* Level indicator dots smaller */
          .dot {
            width: 6px;
            height: 6px;
          }

          /* Summary text */
          .summary-text {
            font-size: 13px;
          }

          /* Strengths */
          .strengths-list li,
          .gtm-list li {
            font-size: 12px;
          }

          /* Fit score bar */
          .fit-score {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .fit-bar {
            width: 100%;
            max-width: none;
          }
        }

        /* ===== TOUCH-FRIENDLY: Ensure min 44px tap targets ===== */
        @media (pointer: coarse) {
          .agc-collapse-toggle,
          .agc-resource-link {
            min-width: 44px;
            min-height: 44px;
          }

          .severity-badge {
            padding: 4px 8px;
          }
        }
      `}</style>
    </div>
  );
}
