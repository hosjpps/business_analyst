'use client';

/**
 * SWR hooks для API запросов с кэшированием
 *
 * SWR обеспечивает:
 * - Автоматическое кэширование на клиенте
 * - Stale-while-revalidate паттерн
 * - Дедупликация запросов
 * - Автоматическая ревалидация при фокусе
 */

import useSWR, { SWRConfiguration } from 'swr';
import useSWRMutation from 'swr/mutation';

// ===========================================
// Fetcher
// ===========================================

/**
 * Базовый fetcher для SWR
 */
const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('API request failed') as Error & { info?: unknown; status?: number };
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }

  return res.json();
};

/**
 * POST fetcher для mutations
 */
const postFetcher = async <T>(
  url: string,
  { arg }: { arg: unknown }
): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const error = new Error('API request failed') as Error & { info?: unknown; status?: number };
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }

  return res.json();
};

// ===========================================
// Default Config
// ===========================================

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false, // Не ревалидировать при фокусе (анализ дорогой)
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // Дедупликация 1 минута
  errorRetryCount: 2,
};

// ===========================================
// Project Hooks
// ===========================================

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectsResponse {
  projects: Project[];
}

/**
 * Хук для получения списка проектов
 */
export function useProjects() {
  return useSWR<ProjectsResponse>(
    '/api/projects',
    fetcher,
    {
      ...defaultConfig,
      revalidateOnFocus: true, // Проекты можно ревалидировать
      dedupingInterval: 30000, // 30 секунд
    }
  );
}

/**
 * Хук для получения одного проекта
 */
export function useProject(projectId: string | null) {
  return useSWR<Project>(
    projectId ? `/api/projects/${projectId}` : null,
    fetcher,
    defaultConfig
  );
}

// ===========================================
// Analysis Hooks
// ===========================================

interface AnalysisRequest {
  repo_url?: string;
  files?: Array<{ name: string; content: string }>;
  description?: string;
}

/**
 * Хук для выполнения анализа кода (mutation)
 */
export function useCodeAnalysis() {
  return useSWRMutation(
    '/api/analyze',
    postFetcher,
  );
}

/**
 * Хук для выполнения бизнес-анализа (mutation)
 */
export function useBusinessAnalysis() {
  return useSWRMutation(
    '/api/analyze-business',
    postFetcher,
  );
}

/**
 * Хук для выполнения gap-анализа (mutation)
 */
export function useGapAnalysis() {
  return useSWRMutation(
    '/api/analyze-gaps',
    postFetcher,
  );
}

/**
 * Хук для анализа конкурентов (mutation)
 */
export function useCompetitorAnalysis() {
  return useSWRMutation(
    '/api/analyze-competitors',
    postFetcher,
  );
}

// ===========================================
// Trends Hooks
// ===========================================

interface TrendsRequest {
  keywords: string[];
  geo?: string;
  timeRange?: string;
}

/**
 * Хук для получения Google Trends (mutation из-за POST)
 */
export function useTrends() {
  return useSWRMutation(
    '/api/trends',
    postFetcher,
  );
}

// ===========================================
// History Hooks
// ===========================================

interface AnalysisVersion {
  id: string;
  version: number;
  alignment_score: number | null;
  summary: string | null;
  label: string | null;
  created_at: string;
}

/**
 * Хук для получения истории анализов проекта
 */
export function useProjectHistory(projectId: string | null) {
  return useSWR<{ versions: AnalysisVersion[] }>(
    projectId ? `/api/projects/${projectId}/history` : null,
    fetcher,
    {
      ...defaultConfig,
      revalidateOnFocus: true,
    }
  );
}

// ===========================================
// Utility Hooks
// ===========================================

/**
 * Хук для предзагрузки данных
 */
export function usePrefetch() {
  const { mutate } = useSWR('/api/projects', fetcher, { revalidateOnMount: false });

  return {
    prefetchProjects: () => mutate(),
  };
}

// ===========================================
// SWR Config Provider
// ===========================================

export { SWRConfig } from 'swr';

/**
 * Глобальная конфигурация SWR
 */
export const swrGlobalConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 60000,
};
