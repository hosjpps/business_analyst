'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  DESCRIPTION: 'analyzer_description',
  REPO_URL: 'analyzer_repo_url',
  RESULT: 'analyzer_result',
  CHAT_HISTORY: 'analyzer_chat_history',
} as const;

// Client-side logging for localStorage errors (expected in private browsing, etc.)
const logStorageError = (action: string, key: string, error: unknown) => {
  // Use debug level since these are often expected errors (private browsing, quota exceeded)
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[localStorage] ${action} failed for key "${key}":`, error);
  }
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize state with value from localStorage or initial value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      logStorageError('read', key, error);
    }
    setIsHydrated(true);
  }, [key]);

  // Save to localStorage whenever value changes (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      logStorageError('write', key, error);
    }
  }, [key, storedValue, isHydrated]);

  // Setter function
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  // Clear function
  const clearValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      logStorageError('clear', key, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, clearValue];
}

// Convenience hooks for specific data
export function usePersistedDescription() {
  return useLocalStorage(STORAGE_KEYS.DESCRIPTION, '');
}

export function usePersistedRepoUrl() {
  return useLocalStorage(STORAGE_KEYS.REPO_URL, '');
}

export function usePersistedResult() {
  return useLocalStorage<null | object>(STORAGE_KEYS.RESULT, null);
}

export function usePersistedChatHistory() {
  return useLocalStorage<Array<{ question: string; answer: string }>>(
    STORAGE_KEYS.CHAT_HISTORY,
    []
  );
}

// Clear all analyzer data
export function clearAllAnalyzerData() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    logStorageError('clearAll', 'all', error);
  }
}
