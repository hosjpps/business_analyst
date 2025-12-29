'use client';

import type { Gap, GapTask } from '@/types/gaps';
import { GAP_CATEGORY_LABELS } from '@/types/gaps';
import { formatTimeEstimate } from '@/lib/gaps/task-generator';

// ===========================================
// Types
// ===========================================

interface GapsViewProps {
  gaps: Gap[];
  tasks?: GapTask[];
  nextMilestone?: string;
}

// ===========================================
// Severity Badge
// ===========================================

function SeverityBadge({ severity }: { severity: Gap['type'] }) {
  const config = {
    critical: { emoji: '🔴', label: 'Critical', color: 'var(--color-danger-fg)' },
    warning: { emoji: '🟡', label: 'Warning', color: 'var(--color-attention-fg)' },
    info: { emoji: '🟢', label: 'Info', color: 'var(--color-success-fg)' },
  };

  const { emoji, label, color } = config[severity];

  return (
    <span className="severity-badge" style={{ color }}>
      {emoji} {label}
    </span>
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
// Gap Card
// ===========================================

function GapCard({ gap }: { gap: Gap }) {
  return (
    <div className={`gap-card severity-${gap.type}`}>
      <div className="gap-header">
        <SeverityBadge severity={gap.type} />
        <CategoryBadge category={gap.category} />
      </div>

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
// Task Card
// ===========================================

function TaskCard({ task, index }: { task: GapTask; index: number }) {
  const priorityColors = {
    high: 'var(--color-danger-fg)',
    medium: 'var(--color-attention-fg)',
    low: 'var(--color-success-fg)',
  };

  return (
    <div className="task-card">
      <div className="task-number">{index + 1}</div>
      <div className="task-content">
        <div className="task-header">
          <span className="task-title">{task.title}</span>
          <span
            className="task-priority"
            style={{ color: priorityColors[task.priority] }}
          >
            {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
          </span>
        </div>
        <p className="task-description">{task.description}</p>
        <div className="task-meta">
          <span className="task-category">{task.category}</span>
          <span className="task-time">{formatTimeEstimate(task.estimated_minutes)}</span>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// Main Component
// ===========================================

export function GapsView({ gaps, tasks, nextMilestone }: GapsViewProps) {
  // Group gaps by severity
  const criticalGaps = gaps.filter((g) => g.type === 'critical');
  const warningGaps = gaps.filter((g) => g.type === 'warning');
  const infoGaps = gaps.filter((g) => g.type === 'info');

  return (
    <div className="gaps-view">
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

      {/* Gap Cards */}
      {gaps.length > 0 ? (
        <div className="gaps-list">
          <h4 className="section-title">Найденные разрывы</h4>
          {gaps.map((gap) => (
            <GapCard key={gap.id} gap={gap} />
          ))}
        </div>
      ) : (
        <div className="no-gaps">
          <span className="no-gaps-icon">✅</span>
          <p>Разрывы не обнаружены! Отличная работа.</p>
        </div>
      )}

      {/* Tasks */}
      {tasks && tasks.length > 0 && (
        <div className="tasks-section">
          <h4 className="section-title">Рекомендуемые задачи</h4>
          <div className="tasks-list">
            {tasks.map((task, idx) => (
              <TaskCard key={idx} task={task} index={idx} />
            ))}
          </div>
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

        .gaps-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-item {
          flex: 1;
          padding: 16px;
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
          text-align: center;
        }

        .stat-item.critical {
          border-left: 3px solid var(--color-danger-fg);
        }

        .stat-item.warning {
          border-left: 3px solid var(--color-attention-fg);
        }

        .stat-item.info {
          border-left: 3px solid var(--color-success-fg);
        }

        .stat-number {
          display: block;
          font-size: 24px;
          font-weight: 600;
          color: var(--color-fg-default);
        }

        .stat-label {
          font-size: 12px;
          color: var(--color-fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-fg-default);
          margin: 0 0 16px 0;
        }

        .gaps-list {
          margin-bottom: 24px;
        }

        .gap-card {
          padding: 16px;
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
          margin-bottom: 12px;
        }

        .gap-card.severity-critical {
          border-left: 3px solid var(--color-danger-fg);
        }

        .gap-card.severity-warning {
          border-left: 3px solid var(--color-attention-fg);
        }

        .gap-card.severity-info {
          border-left: 3px solid var(--color-success-fg);
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
        }

        .category-badge {
          font-size: 11px;
          padding: 2px 8px;
          background: var(--color-neutral-subtle);
          color: var(--color-fg-muted);
          border-radius: 12px;
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
          color: var(--color-fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .gap-section-text {
          font-size: 13px;
          color: var(--color-fg-default);
          margin: 4px 0 0 0;
          line-height: 1.5;
        }

        .gap-section-text.highlight {
          background: var(--color-accent-subtle);
          padding: 8px;
          border-radius: 4px;
          border-left: 2px solid var(--color-accent-fg);
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
          color: var(--color-fg-muted);
        }

        .level-dots {
          display: flex;
          gap: 3px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-neutral-muted);
        }

        .dot.active {
          background: var(--color-accent-fg);
        }

        .gap-resources {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--color-border-default);
        }

        .resources-label {
          font-size: 11px;
          color: var(--color-fg-muted);
          margin-right: 8px;
        }

        .gap-resources a {
          font-size: 12px;
          color: var(--color-accent-fg);
          margin-right: 12px;
        }

        .no-gaps {
          text-align: center;
          padding: 32px;
          background: var(--color-success-subtle);
          border: 1px solid var(--color-success-muted);
          border-radius: 6px;
        }

        .no-gaps-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 8px;
        }

        .no-gaps p {
          color: var(--color-success-fg);
          margin: 0;
        }

        .tasks-section {
          margin-bottom: 24px;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .task-card {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
        }

        .task-number {
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

        .task-content {
          flex: 1;
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }

        .task-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-fg-default);
        }

        .task-priority {
          font-size: 12px;
        }

        .task-description {
          font-size: 13px;
          color: var(--color-fg-muted);
          margin: 4px 0 8px 0;
          line-height: 1.4;
        }

        .task-meta {
          display: flex;
          gap: 12px;
        }

        .task-category {
          font-size: 11px;
          padding: 2px 6px;
          background: var(--color-neutral-subtle);
          color: var(--color-fg-muted);
          border-radius: 4px;
        }

        .task-time {
          font-size: 11px;
          color: var(--color-fg-muted);
        }

        .next-milestone {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: var(--color-accent-subtle);
          border: 1px solid var(--color-accent-muted);
          border-radius: 6px;
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
          color: var(--color-accent-fg);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .milestone-text {
          font-size: 14px;
          color: var(--color-fg-default);
          margin: 4px 0 0 0;
        }
      `}</style>
    </div>
  );
}
