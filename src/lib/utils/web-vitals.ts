/**
 * Web Vitals Reporting
 *
 * Отслеживание Core Web Vitals:
 * - LCP (Largest Contentful Paint) - должен быть < 2.5s
 * - FID (First Input Delay) - должен быть < 100ms
 * - CLS (Cumulative Layout Shift) - должен быть < 0.1
 * - TTFB (Time to First Byte) - должен быть < 600ms
 * - INP (Interaction to Next Paint) - должен быть < 200ms
 */

import type { NextWebVitalsMetric } from 'next/app';

// ===========================================
// Types
// ===========================================

export interface VitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

export interface VitalsThresholds {
  LCP: { good: number; poor: number };
  FID: { good: number; poor: number };
  CLS: { good: number; poor: number };
  TTFB: { good: number; poor: number };
  INP: { good: number; poor: number };
  FCP: { good: number; poor: number };
}

// ===========================================
// Thresholds (Google Core Web Vitals)
// ===========================================

export const VITALS_THRESHOLDS: VitalsThresholds = {
  LCP: { good: 2500, poor: 4000 }, // ms
  FID: { good: 100, poor: 300 }, // ms
  CLS: { good: 0.1, poor: 0.25 }, // score
  TTFB: { good: 600, poor: 1500 }, // ms (не official, но рекомендуется)
  INP: { good: 200, poor: 500 }, // ms
  FCP: { good: 1800, poor: 3000 }, // ms
};

// ===========================================
// Rating Function
// ===========================================

/**
 * Определение рейтинга метрики
 */
export function getRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[name as keyof VitalsThresholds];

  if (!thresholds) {
    return 'good'; // Unknown metric
  }

  if (value <= thresholds.good) {
    return 'good';
  }

  if (value <= thresholds.poor) {
    return 'needs-improvement';
  }

  return 'poor';
}

// ===========================================
// Reporting
// ===========================================

/**
 * Логирование метрики в консоль (development)
 */
function logMetric(metric: VitalsMetric): void {
  const colors = {
    good: '\x1b[32m', // green
    'needs-improvement': '\x1b[33m', // yellow
    poor: '\x1b[31m', // red
  };

  const reset = '\x1b[0m';
  const color = colors[metric.rating];

  console.log(
    `${color}[Web Vitals]${reset} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`
  );
}

/**
 * Отправка метрики в аналитику
 */
async function sendToAnalytics(metric: VitalsMetric): Promise<void> {
  // Можно отправить в:
  // - Google Analytics
  // - Custom endpoint
  // - Sentry
  // - Vercel Analytics (встроено)

  // Пример отправки в custom endpoint:
  if (process.env.NEXT_PUBLIC_VITALS_ENDPOINT) {
    try {
      await fetch(process.env.NEXT_PUBLIC_VITALS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
        keepalive: true, // Важно для отправки при закрытии страницы
      });
    } catch (error) {
      // Молча игнорируем ошибки аналитики
    }
  }
}

// ===========================================
// Main Export
// ===========================================

/**
 * Обработчик Web Vitals для Next.js
 *
 * Использование в _app.tsx или layout.tsx:
 * ```
 * export function reportWebVitals(metric: NextWebVitalsMetric) {
 *   onWebVitals(metric);
 * }
 * ```
 */
export function onWebVitals(metric: NextWebVitalsMetric): void {
  const vitalsMetric: VitalsMetric = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.value, // В Next.js delta = value для первого измерения
    navigationType: 'navigate',
  };

  // Development: логируем в консоль
  if (process.env.NODE_ENV === 'development') {
    logMetric(vitalsMetric);
  }

  // Production: отправляем в аналитику
  if (process.env.NODE_ENV === 'production') {
    sendToAnalytics(vitalsMetric);
  }
}

// ===========================================
// Manual Measurement Utilities
// ===========================================

/**
 * Измерение времени операции
 */
export function measureTime<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    });
  }

  const duration = performance.now() - start;
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

  return result;
}

/**
 * Performance Mark для ручного измерения
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined') {
    performance.mark(name);
  }
}

/**
 * Performance Measure между двумя marks
 */
export function measure(name: string, startMark: string, endMark: string): number {
  if (typeof performance !== 'undefined') {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name);
      const lastEntry = entries[entries.length - 1];
      return lastEntry?.duration || 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

// ===========================================
// Resource Timing
// ===========================================

/**
 * Получение метрик загрузки ресурсов
 */
export function getResourceTimings(): PerformanceResourceTiming[] {
  if (typeof performance !== 'undefined') {
    return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  }
  return [];
}

/**
 * Получение медленных ресурсов (> threshold ms)
 */
export function getSlowResources(thresholdMs = 1000): PerformanceResourceTiming[] {
  return getResourceTimings().filter((r) => r.duration > thresholdMs);
}

// ===========================================
// Export for Next.js
// ===========================================

export { onWebVitals as reportWebVitals };
