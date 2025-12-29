'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from './Icon';
import { ProgressBar, CompletionProgress } from './ProgressBar';
import type { ChecklistItem, ChecklistStep, ChecklistProgress } from '@/types/ux';

// ===========================================
// Checklist Component
// ===========================================

interface ChecklistProps {
  items: ChecklistItem[];
  onChange?: (items: ChecklistItem[]) => void;
  storageKey?: string; // For localStorage persistence
  groupByPriority?: boolean;
  showProgress?: boolean;
}

export function Checklist({
  items: initialItems,
  onChange,
  storageKey,
  groupByPriority = true,
  showProgress = true,
}: ChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setItems(mergeWithInitial(initialItems, parsed));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [storageKey, initialItems]);

  // Save to localStorage on change
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
    onChange?.(items);
  }, [items, storageKey, onChange]);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
              steps: item.steps.map((s) => ({
                ...s,
                completed: !item.completed,
              })),
            }
          : item
      )
    );
  }, []);

  const toggleStep = useCallback((itemId: string, stepId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const newSteps = item.steps.map((s) =>
          s.id === stepId ? { ...s, completed: !s.completed } : s
        );

        const allCompleted = newSteps.every((s) => s.completed);

        return {
          ...item,
          steps: newSteps,
          completed: allCompleted,
        };
      })
    );
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const progress = calculateProgress(items);

  // Group by priority if enabled
  const groupedItems = groupByPriority
    ? {
        high: items.filter((i) => i.priority === 'high'),
        medium: items.filter((i) => i.priority === 'medium'),
        low: items.filter((i) => i.priority === 'low'),
      }
    : null;

  return (
    <div className="checklist">
      {showProgress && (
        <div className="checklist-progress">
          <CompletionProgress
            completed={progress.completed}
            total={progress.total}
            label="Выполнено задач"
          />
        </div>
      )}

      {groupByPriority && groupedItems ? (
        <>
          {groupedItems.high.length > 0 && (
            <ChecklistGroup
              title="Высокий приоритет"
              priority="high"
              items={groupedItems.high}
              expandedIds={expandedIds}
              onToggle={toggleItem}
              onToggleStep={toggleStep}
              onToggleExpand={toggleExpand}
            />
          )}
          {groupedItems.medium.length > 0 && (
            <ChecklistGroup
              title="Средний приоритет"
              priority="medium"
              items={groupedItems.medium}
              expandedIds={expandedIds}
              onToggle={toggleItem}
              onToggleStep={toggleStep}
              onToggleExpand={toggleExpand}
            />
          )}
          {groupedItems.low.length > 0 && (
            <ChecklistGroup
              title="Низкий приоритет"
              priority="low"
              items={groupedItems.low}
              expandedIds={expandedIds}
              onToggle={toggleItem}
              onToggleStep={toggleStep}
              onToggleExpand={toggleExpand}
            />
          )}
        </>
      ) : (
        <div className="checklist-items">
          {items.map((item) => (
            <ChecklistItemCard
              key={item.id}
              item={item}
              expanded={expandedIds.has(item.id)}
              onToggle={() => toggleItem(item.id)}
              onToggleStep={(stepId) => toggleStep(item.id, stepId)}
              onToggleExpand={() => toggleExpand(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===========================================
// Checklist Group
// ===========================================

interface ChecklistGroupProps {
  title: string;
  priority: 'high' | 'medium' | 'low';
  items: ChecklistItem[];
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleStep: (itemId: string, stepId: string) => void;
  onToggleExpand: (id: string) => void;
}

function ChecklistGroup({
  title,
  priority,
  items,
  expandedIds,
  onToggle,
  onToggleStep,
  onToggleExpand,
}: ChecklistGroupProps) {
  const completed = items.filter((i) => i.completed).length;
  const total = items.length;

  return (
    <div className={`checklist-group priority-${priority}`}>
      <div className="checklist-group-header">
        <div className="checklist-group-title">
          <PriorityBadge priority={priority} />
          <span>{title}</span>
          <span className="checklist-group-count">
            {completed}/{total}
          </span>
        </div>
        <ProgressBar
          value={(completed / total) * 100}
          size="sm"
          color={priority === 'high' ? 'error' : priority === 'medium' ? 'warning' : 'success'}
        />
      </div>
      <div className="checklist-items">
        {items.map((item) => (
          <ChecklistItemCard
            key={item.id}
            item={item}
            expanded={expandedIds.has(item.id)}
            onToggle={() => onToggle(item.id)}
            onToggleStep={(stepId) => onToggleStep(item.id, stepId)}
            onToggleExpand={() => onToggleExpand(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ===========================================
// Checklist Item Card
// ===========================================

interface ChecklistItemCardProps {
  item: ChecklistItem;
  expanded: boolean;
  onToggle: () => void;
  onToggleStep: (stepId: string) => void;
  onToggleExpand: () => void;
}

function ChecklistItemCard({
  item,
  expanded,
  onToggle,
  onToggleStep,
  onToggleExpand,
}: ChecklistItemCardProps) {
  const stepsCompleted = item.steps.filter((s) => s.completed).length;

  return (
    <div className={`checklist-item ${item.completed ? 'completed' : ''}`}>
      <div className="checklist-item-header">
        <button
          type="button"
          className="checklist-checkbox"
          onClick={onToggle}
          aria-checked={item.completed}
        >
          {item.completed ? (
            <Icon name="check" size="sm" color="success" />
          ) : (
            <span className="checklist-checkbox-empty" />
          )}
        </button>

        <div className="checklist-item-content" onClick={onToggleExpand}>
          <div className="checklist-item-title">{item.title}</div>
          <div className="checklist-item-meta">
            <span className="checklist-item-time">
              <Icon name="clock" size="sm" />
              {item.estimatedTime}
            </span>
            {item.steps.length > 0 && (
              <span className="checklist-item-steps">
                {stepsCompleted}/{item.steps.length} шагов
              </span>
            )}
          </div>
        </div>

        {item.steps.length > 0 && (
          <button
            type="button"
            className={`checklist-expand ${expanded ? 'expanded' : ''}`}
            onClick={onToggleExpand}
          >
            <Icon name="arrow-down" size="sm" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="checklist-item-details">
          <p className="checklist-item-description">{item.description}</p>

          {item.whyImportant && (
            <div className="checklist-why-important">
              <Icon name="lightning" size="sm" color="warning" />
              <span>{item.whyImportant}</span>
            </div>
          )}

          {item.steps.length > 0 && (
            <div className="checklist-steps">
              {item.steps.map((step) => (
                <div
                  key={step.id}
                  className={`checklist-step ${step.completed ? 'completed' : ''}`}
                >
                  <button
                    type="button"
                    className="checklist-step-checkbox"
                    onClick={() => onToggleStep(step.id)}
                  >
                    {step.completed ? (
                      <Icon name="check" size="sm" color="success" />
                    ) : (
                      <span className="checklist-step-number">
                        {item.steps.indexOf(step) + 1}
                      </span>
                    )}
                  </button>
                  <span className="checklist-step-text">{step.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===========================================
// Priority Badge
// ===========================================

interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low';
  showLabel?: boolean;
}

export function PriorityBadge({ priority, showLabel = false }: PriorityBadgeProps) {
  const config = {
    high: { icon: 'arrow-up' as const, color: 'error' as const, label: 'Высокий' },
    medium: { icon: 'arrow-right' as const, color: 'warning' as const, label: 'Средний' },
    low: { icon: 'arrow-down' as const, color: 'success' as const, label: 'Низкий' },
  };

  const { icon, color, label } = config[priority];

  return (
    <span className={`priority-badge priority-${priority}`}>
      <Icon name={icon} size="sm" color={color} />
      {showLabel && <span>{label}</span>}
    </span>
  );
}

// ===========================================
// Helper Functions
// ===========================================

function calculateProgress(items: ChecklistItem[]): ChecklistProgress {
  const total = items.length;
  const completed = items.filter((i) => i.completed).length;

  const byPriority = {
    high: {
      total: items.filter((i) => i.priority === 'high').length,
      completed: items.filter((i) => i.priority === 'high' && i.completed).length,
    },
    medium: {
      total: items.filter((i) => i.priority === 'medium').length,
      completed: items.filter((i) => i.priority === 'medium' && i.completed).length,
    },
    low: {
      total: items.filter((i) => i.priority === 'low').length,
      completed: items.filter((i) => i.priority === 'low' && i.completed).length,
    },
  };

  return {
    total,
    completed,
    percentage: total > 0 ? (completed / total) * 100 : 0,
    byPriority,
  };
}

function mergeWithInitial(
  initial: ChecklistItem[],
  saved: ChecklistItem[]
): ChecklistItem[] {
  // Keep initial structure but restore completion state from saved
  return initial.map((item) => {
    const savedItem = saved.find((s) => s.id === item.id);
    if (!savedItem) return item;

    return {
      ...item,
      completed: savedItem.completed,
      steps: item.steps.map((step) => {
        const savedStep = savedItem.steps.find((s) => s.id === step.id);
        return savedStep ? { ...step, completed: savedStep.completed } : step;
      }),
    };
  });
}

// ===========================================
// Export Progress Calculator
// ===========================================

export { calculateProgress };
