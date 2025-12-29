/**
 * UX Types
 *
 * Types for UX improvements:
 * - Tooltips and term dictionary
 * - Progress/readiness scores
 * - Checklist items
 * - Wizard steps
 * - FAQ items
 */

// ===========================================
// Tooltip Types
// ===========================================

export interface TooltipTerm {
  term: string;
  simple: string;           // Простое объяснение для non-tech
  example?: string;         // Конкретный пример
  whyMatters?: string;      // Почему это важно для бизнеса
}

// ===========================================
// Business Readiness Types
// ===========================================

export interface ReadinessCategory {
  name: string;
  label: string;
  score: number;           // 0-100
  icon: string;
  color: string;
  items: ReadinessItem[];
}

export interface ReadinessItem {
  label: string;
  completed: boolean;
  weight: number;          // Вес в общем скоре
}

export interface BusinessReadiness {
  overall: number;         // 0-100
  categories: ReadinessCategory[];
  topPriority: string;     // Главное действие
  summary: string;         // Краткое резюме
}

// ===========================================
// Checklist Types
// ===========================================

export interface ChecklistStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  steps: ChecklistStep[];
  priority: 'high' | 'medium' | 'low';
  category?: string;
  estimatedTime: string;   // "~2 часа"
  whyImportant?: string;   // Объяснение важности
  completed: boolean;
}

export interface ChecklistProgress {
  total: number;
  completed: number;
  percentage: number;
  byPriority: {
    high: { total: number; completed: number };
    medium: { total: number; completed: number };
    low: { total: number; completed: number };
  };
}

// ===========================================
// Wizard Types
// ===========================================

export interface WizardStepConfig {
  id: string;
  title: string;
  description: string;
  example?: string;
  required: boolean;
  validate?: (value: unknown) => string | null;  // null = valid
}

export interface WizardState {
  currentStep: number;
  totalSteps: number;
  data: Record<string, unknown>;
  completed: boolean;
}

// ===========================================
// FAQ Types
// ===========================================

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  example?: string;
  learnMoreUrl?: string;
}

export interface FAQSection {
  title: string;
  description?: string;
  items: FAQItem[];
}

// ===========================================
// Action Steps Types (1-2-3)
// ===========================================

export interface ActionStep {
  number: number;
  title: string;
  description: string;
  estimatedTime?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tools?: string[];        // Инструменты/сервисы
}

export interface ActionPlan {
  title: string;
  whyImportant: string;
  steps: ActionStep[];
  expectedResult: string;
}

// ===========================================
// Before/After Comparison Types
// ===========================================

export interface AnalysisSnapshot {
  id: string;
  date: string;
  score: number;
  gapsCount: { critical: number; warning: number; info: number };
  completedTasks: number;
  totalTasks: number;
}

export interface ComparisonResult {
  previous: AnalysisSnapshot;
  current: AnalysisSnapshot;
  scoreChange: number;
  gapsResolved: number;
  newGaps: number;
  tasksCompleted: number;
  trend: 'improving' | 'stable' | 'declining';
}

// ===========================================
// Icon Types
// ===========================================

export type IconName =
  | 'check'
  | 'warning'
  | 'error'
  | 'info'
  | 'money'
  | 'users'
  | 'growth'
  | 'security'
  | 'code'
  | 'chart'
  | 'target'
  | 'clock'
  | 'star'
  | 'lightning'
  | 'question'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down';

export type IconSize = 'sm' | 'md' | 'lg';

export type SeverityColor = 'success' | 'warning' | 'error' | 'info' | 'neutral';
