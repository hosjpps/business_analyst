// ===========================================
// Retry Utility with Exponential Backoff
// ===========================================

import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: (error: Error) => {
    // Retry on network errors, rate limits, and server errors
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('econnreset') ||
      message.includes('econnrefused')
    );
  }
};

/**
 * Execute an async function with retries and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelayMs;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if this is the last attempt
      if (attempt === opts.maxRetries) {
        logger.error(`All ${opts.maxRetries + 1} attempts failed`, lastError);
        throw lastError;
      }

      // Check if error is retryable
      if (!opts.retryableErrors(lastError)) {
        logger.error('Non-retryable error', lastError);
        throw lastError;
      }

      // Log retry attempt
      logger.debug(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, { error: lastError.message });

      // Wait before retry
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrapper for LLM API calls with sensible defaults
 */
export async function withLLMRetry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, {
    maxRetries: 2,
    initialDelayMs: 2000,
    maxDelayMs: 8000,
    retryableErrors: (error: Error) => {
      const message = error.message.toLowerCase();
      // More specific retryable errors for LLM APIs
      return (
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('overloaded') ||
        message.includes('capacity') ||
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504')
      );
    }
  });
}

/**
 * Wrapper for GitHub API calls with sensible defaults
 */
export async function withGitHubRetry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    retryableErrors: (error: Error) => {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate limit') ||
        message.includes('403') ||
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503')
      );
    }
  });
}
