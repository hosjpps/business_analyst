'use client';

import { useCallback } from 'react';
import type { AnalyzeResponse } from '@/types';

const CACHE_KEY_PREFIX = 'analysis_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedAnalysis {
  response: AnalyzeResponse;
  commit_sha: string;
  cached_at: number;
}

function normalizeRepoUrl(url: string): string {
  return url.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '');
}

function getCacheKey(repoUrl: string): string {
  return CACHE_KEY_PREFIX + normalizeRepoUrl(repoUrl);
}

export function useAnalysisCache() {
  // Get cached analysis for a repo
  const getCached = useCallback((repoUrl: string): CachedAnalysis | null => {
    if (typeof window === 'undefined') return null;

    try {
      const key = getCacheKey(repoUrl);
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const parsed: CachedAnalysis = JSON.parse(cached);

      // Check TTL
      if (Date.now() - parsed.cached_at > CACHE_TTL_MS) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }, []);

  // Save analysis to cache
  const setCache = useCallback((repoUrl: string, response: AnalyzeResponse, commitSha: string) => {
    if (typeof window === 'undefined') return;

    try {
      const key = getCacheKey(repoUrl);
      const cached: CachedAnalysis = {
        response,
        commit_sha: commitSha,
        cached_at: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cached));
    } catch (e) {
      // localStorage might be full or disabled
      console.warn('Failed to cache analysis:', e);
    }
  }, []);

  // Check if cached version is still valid (same commit SHA)
  const isCacheValid = useCallback(async (repoUrl: string): Promise<{ valid: boolean; currentSha: string | null }> => {
    const cached = getCached(repoUrl);
    if (!cached) return { valid: false, currentSha: null };

    try {
      // Fetch current commit SHA
      const res = await fetch(`/api/commit-sha?repo_url=${encodeURIComponent(repoUrl)}`);
      if (!res.ok) return { valid: false, currentSha: null };

      const data = await res.json();
      const currentSha = data.sha;

      return {
        valid: cached.commit_sha === currentSha,
        currentSha
      };
    } catch {
      return { valid: false, currentSha: null };
    }
  }, [getCached]);

  // Clear cache for a specific repo
  const clearCache = useCallback((repoUrl: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(getCacheKey(repoUrl));
  }, []);

  // Clear all analysis caches
  const clearAllCaches = useCallback(() => {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

  return {
    getCached,
    setCache,
    isCacheValid,
    clearCache,
    clearAllCaches
  };
}
