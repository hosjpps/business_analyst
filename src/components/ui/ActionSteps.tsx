'use client';

import { Icon } from './Icon';
import type { ActionStep, ActionPlan, IconName } from '@/types/ux';

// ===========================================
// Action Steps Component (1-2-3)
// ===========================================

interface ActionStepsProps {
  steps: ActionStep[];
  title?: string;
}

export function ActionSteps({ steps, title }: ActionStepsProps) {
  return (
    <div className="action-steps">
      {title && <h4 className="action-steps-title">{title}</h4>}
      <div className="action-steps-list">
        {steps.map((step, index) => (
          <ActionStepCard key={index} step={step} />
        ))}
      </div>
    </div>
  );
}

// ===========================================
// Action Step Card
// ===========================================

interface ActionStepCardProps {
  step: ActionStep;
}

const DIFFICULTY_CONFIG = {
  easy: { label: 'Легко', color: 'success' as const, icon: 'check' as IconName },
  medium: { label: 'Средне', color: 'warning' as const, icon: 'warning' as IconName },
  hard: { label: 'Сложно', color: 'error' as const, icon: 'lightning' as IconName },
};

function ActionStepCard({ step }: ActionStepCardProps) {
  const difficulty = DIFFICULTY_CONFIG[step.difficulty];

  return (
    <div className="action-step-card">
      <div className="action-step-number">
        <span>{step.number}</span>
      </div>

      <div className="action-step-content">
        <h5 className="action-step-card-title">{step.title}</h5>
        <p className="action-step-description">{step.description}</p>

        <div className="action-step-meta">
          {step.estimatedTime && (
            <span className="action-step-time">
              <Icon name="clock" size="sm" />
              {step.estimatedTime}
            </span>
          )}
          <span className={`action-step-difficulty difficulty-${step.difficulty}`}>
            <Icon name={difficulty.icon} size="sm" color={difficulty.color} />
            {difficulty.label}
          </span>
        </div>

        {step.tools && step.tools.length > 0 && (
          <div className="action-step-tools">
            <span className="tools-label">Инструменты:</span>
            {step.tools.map((tool, i) => (
              <span key={i} className="tool-tag">
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================
// Full Action Plan Component
// ===========================================

interface ActionPlanCardProps {
  plan: ActionPlan;
  expanded?: boolean;
  onToggle?: () => void;
}

export function ActionPlanCard({ plan, expanded = false, onToggle }: ActionPlanCardProps) {
  return (
    <div className={`action-plan-card ${expanded ? 'expanded' : ''}`}>
      <div className="action-plan-header" onClick={onToggle}>
        <div className="action-plan-info">
          <h4 className="action-plan-title">{plan.title}</h4>
          <div className="action-plan-stats">
            <span className="action-plan-steps-count">
              <Icon name="target" size="sm" />
              {plan.steps.length} шагов
            </span>
          </div>
        </div>

        {onToggle && (
          <button type="button" className="action-plan-toggle">
            <Icon name="arrow-down" size="sm" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="action-plan-content">
          {/* Why Important */}
          <WhyImportant text={plan.whyImportant} />

          {/* Steps */}
          <ActionSteps steps={plan.steps} />

          {/* Expected Result */}
          <div className="action-plan-result">
            <Icon name="star" size="sm" color="success" />
            <div>
              <span className="result-label">Результат:</span>
              <span className="result-text">{plan.expectedResult}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// Why Important Component
// ===========================================

interface WhyImportantProps {
  text: string;
  title?: string;
}

export function WhyImportant({ text, title = 'Почему это важно?' }: WhyImportantProps) {
  return (
    <div className="why-important">
      <div className="why-important-header">
        <Icon name="lightning" size="md" color="warning" />
        <span>{title}</span>
      </div>
      <p className="why-important-text">{text}</p>
    </div>
  );
}

// ===========================================
// Quick Win Badge
// ===========================================

interface QuickWinBadgeProps {
  estimatedTime: string;
}

export function QuickWinBadge({ estimatedTime }: QuickWinBadgeProps) {
  return (
    <span className="quick-win-badge">
      <Icon name="lightning" size="sm" />
      Quick Win: {estimatedTime}
    </span>
  );
}

// ===========================================
// Numbered List Component
// ===========================================

interface NumberedListProps {
  items: string[];
  startFrom?: number;
}

export function NumberedList({ items, startFrom = 1 }: NumberedListProps) {
  return (
    <ol className="numbered-list" start={startFrom}>
      {items.map((item, index) => (
        <li key={index} className="numbered-list-item">
          <span className="numbered-list-number">{startFrom + index}</span>
          <span className="numbered-list-text">{item}</span>
        </li>
      ))}
    </ol>
  );
}

// ===========================================
// Tip Box Component
// ===========================================

interface TipBoxProps {
  children: React.ReactNode;
  type?: 'tip' | 'warning' | 'info' | 'success';
  title?: string;
}

const TIP_CONFIG = {
  tip: { icon: 'lightning' as IconName, color: 'warning' as const, defaultTitle: 'Совет' },
  warning: { icon: 'warning' as IconName, color: 'error' as const, defaultTitle: 'Внимание' },
  info: { icon: 'info' as IconName, color: 'info' as const, defaultTitle: 'Информация' },
  success: { icon: 'check' as IconName, color: 'success' as const, defaultTitle: 'Готово' },
};

export function TipBox({ children, type = 'tip', title }: TipBoxProps) {
  const config = TIP_CONFIG[type];

  return (
    <div className={`tip-box tip-box-${type}`}>
      <div className="tip-box-header">
        <Icon name={config.icon} size="sm" color={config.color} />
        <span>{title || config.defaultTitle}</span>
      </div>
      <div className="tip-box-content">{children}</div>
    </div>
  );
}
