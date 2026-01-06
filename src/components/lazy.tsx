'use client';

/**
 * Lazy-loaded компоненты для оптимизации bundle size
 *
 * Эти компоненты загружаются по требованию, а не в initial bundle.
 * Используйте их вместо прямых импортов для улучшения производительности.
 */

import dynamic from 'next/dynamic';
import {
  SkeletonCanvas,
  SkeletonGaps,
  SkeletonAnalysisResults,
} from '@/components/ui/Skeleton';

// ===========================================
// Loading Fallbacks
// ===========================================

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="loading-spinner" />
  </div>
);

const LoadingCard = () => (
  <div className="card p-6">
    <div className="skeleton h-6 w-1/3 mb-4" />
    <div className="skeleton h-4 w-full mb-2" />
    <div className="skeleton h-4 w-2/3" />
  </div>
);

// ===========================================
// Heavy Result Components
// ===========================================

/**
 * Business Canvas View - отображение 9 блоков BMC
 * ~15KB gzipped (включает форматирование и стили)
 */
export const LazyCanvasView = dynamic(
  () => import('@/components/results/CanvasView').then((mod) => mod.CanvasView),
  {
    loading: () => <SkeletonCanvas />,
    ssr: false,
  }
);

/**
 * Google Trends Chart - графики с SVG
 * ~20KB gzipped (SVG рендеринг)
 */
export const LazyTrendsChart = dynamic(
  () => import('@/components/results/TrendsChart').then((mod) => mod.TrendsChart),
  {
    loading: () => <LoadingCard />,
    ssr: false,
  }
);

/**
 * Gaps View - отображение разрывов с чеклистами
 * ~25KB gzipped (много UI логики)
 */
export const LazyGapsView = dynamic(
  () => import('@/components/results/GapsView').then((mod) => mod.GapsView),
  {
    loading: () => <SkeletonGaps />,
    ssr: false,
  }
);

/**
 * Competitor Comparison View - таблица сравнения
 * ~15KB gzipped
 */
export const LazyCompetitorComparisonView = dynamic(
  () =>
    import('@/components/results/CompetitorComparisonView').then(
      (mod) => mod.CompetitorComparisonView
    ),
  {
    loading: () => <SkeletonAnalysisResults />,
    ssr: false,
  }
);

/**
 * Multi-Metric Score - 4 метрики с визуализацией
 * ~10KB gzipped
 */
export const LazyMultiMetricScore = dynamic(
  () =>
    import('@/components/results/MultiMetricScore').then((mod) => mod.MultiMetricScore),
  {
    loading: () => (
      <div className="card p-6">
        <div className="skeleton h-8 w-1/2 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

// ===========================================
// Heavy Form Components
// ===========================================

/**
 * Analysis Wizard - пошаговая форма
 * ~20KB gzipped (логика wizard + валидация)
 */
export const LazyAnalysisWizard = dynamic(
  () =>
    import('@/components/forms/AnalysisWizard').then((mod) => mod.AnalysisWizard),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

/**
 * Competitor Input Form - форма ввода конкурентов
 * ~10KB gzipped
 */
export const LazyCompetitorInputForm = dynamic(
  () =>
    import('@/components/forms/CompetitorInputForm').then(
      (mod) => mod.CompetitorInputForm
    ),
  {
    loading: () => <LoadingCard />,
    ssr: false,
  }
);

// ===========================================
// Heavy UI Components
// ===========================================

/**
 * Chat Section - чат с streaming
 * ~30KB gzipped (включает MarkdownRenderer)
 */
export const LazyChatSection = dynamic(
  () => import('@/components/ChatSection').then((mod) => mod.ChatSection),
  {
    loading: () => (
      <div className="card p-6">
        <div className="skeleton h-6 w-1/4 mb-4" />
        <div className="skeleton h-32 mb-4" />
        <div className="skeleton h-10" />
      </div>
    ),
    ssr: false,
  }
);

/**
 * FAQ List - аккордеон FAQ
 * ~8KB gzipped
 */
export const LazyFAQList = dynamic(
  () => import('@/components/ui/FAQ').then((mod) => mod.FAQList),
  {
    loading: () => <LoadingCard />,
    ssr: false,
  }
);

/**
 * QuickStart Onboarding - модал для новых пользователей
 * ~10KB gzipped
 */
export const LazyQuickStart = dynamic(
  () => import('@/components/onboarding/QuickStart').then((mod) => mod.QuickStart),
  {
    loading: () => null, // Модал не должен показывать loading
    ssr: false,
  }
);

/**
 * Demo Scenario Selector - модал выбора демо
 * ~8KB gzipped
 */
export const LazyDemoScenarioSelector = dynamic(
  () => import('@/components/demo').then((mod) => mod.DemoScenarioSelector),
  {
    loading: () => null,
    ssr: false,
  }
);

/**
 * GitHub Export Button - экспорт в GitHub Issues
 * ~12KB gzipped (Octokit интеграция)
 */
export const LazyGitHubExportButton = dynamic(
  () =>
    import('@/components/export/GitHubExportButton').then(
      (mod) => mod.GitHubExportButton
    ),
  {
    loading: () => (
      <button className="btn btn-secondary" disabled>
        Loading...
      </button>
    ),
    ssr: false,
  }
);

// ===========================================
// Export Types (для совместимости)
// ===========================================

// Re-export типов для использования с lazy компонентами
export type { AnalysisWizardData } from '@/components/forms/AnalysisWizard';
