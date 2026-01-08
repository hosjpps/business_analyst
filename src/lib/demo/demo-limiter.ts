/**
 * Demo Rate Limiter
 *
 * Limits demo usage to 3 demos per 24 hours per IP address.
 * Uses in-memory store (server-side) + client guidance.
 */

import type { DemoLimitResult, DemoUsage, DemoScenarioId } from '@/types/demo';
import { DEMO_LIMITS } from '@/types/demo';

// ===========================================
// Server-side In-Memory Store
// ===========================================

interface DemoUsageEntry extends DemoUsage {
  identifier: string;
}

const demoUsageStore = new Map<string, DemoUsageEntry>();

// Cleanup expired entries every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of demoUsageStore.entries()) {
      if (now - entry.firstUsed > DEMO_LIMITS.windowMs) {
        demoUsageStore.delete(key);
      }
    }
  }, 60 * 60 * 1000); // 1 hour
}

// ===========================================
// Server-side Functions
// ===========================================

/**
 * Check if demo is allowed for given identifier (IP address)
 */
export function checkDemoLimit(identifier: string): DemoLimitResult {
  // Bypass limit in test/CI environment
  if (process.env.BYPASS_DEMO_LIMIT === 'true' || process.env.CI === 'true') {
    return {
      allowed: true,
      remaining: DEMO_LIMITS.maxDemos,
      resetIn: 0,
      total: DEMO_LIMITS.maxDemos,
    };
  }

  const now = Date.now();
  const entry = demoUsageStore.get(identifier);

  // No existing entry or expired
  if (!entry || now - entry.firstUsed > DEMO_LIMITS.windowMs) {
    return {
      allowed: true,
      remaining: DEMO_LIMITS.maxDemos,
      resetIn: 0,
      total: DEMO_LIMITS.maxDemos,
    };
  }

  // Check if limit reached
  if (entry.count >= DEMO_LIMITS.maxDemos) {
    const resetIn = Math.ceil((entry.firstUsed + DEMO_LIMITS.windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      total: DEMO_LIMITS.maxDemos,
    };
  }

  // Allowed, return remaining
  const resetIn = Math.ceil((entry.firstUsed + DEMO_LIMITS.windowMs - now) / 1000);
  return {
    allowed: true,
    remaining: DEMO_LIMITS.maxDemos - entry.count,
    resetIn,
    total: DEMO_LIMITS.maxDemos,
  };
}

/**
 * Record a demo usage
 */
export function recordDemoUsage(identifier: string, scenarioId: DemoScenarioId): DemoLimitResult {
  // Bypass limit in test/CI environment
  if (process.env.BYPASS_DEMO_LIMIT === 'true' || process.env.CI === 'true') {
    return {
      allowed: true,
      remaining: DEMO_LIMITS.maxDemos,
      resetIn: 0,
      total: DEMO_LIMITS.maxDemos,
    };
  }

  const now = Date.now();
  const entry = demoUsageStore.get(identifier);

  // New entry or expired
  if (!entry || now - entry.firstUsed > DEMO_LIMITS.windowMs) {
    const newEntry: DemoUsageEntry = {
      identifier,
      count: 1,
      firstUsed: now,
      lastUsed: now,
      scenariosViewed: [scenarioId],
    };
    demoUsageStore.set(identifier, newEntry);

    return {
      allowed: true,
      remaining: DEMO_LIMITS.maxDemos - 1,
      resetIn: DEMO_LIMITS.windowMs / 1000,
      total: DEMO_LIMITS.maxDemos,
    };
  }

  // Update existing entry
  entry.count++;
  entry.lastUsed = now;
  if (!entry.scenariosViewed.includes(scenarioId)) {
    entry.scenariosViewed.push(scenarioId);
  }

  const resetIn = Math.ceil((entry.firstUsed + DEMO_LIMITS.windowMs - now) / 1000);

  return {
    allowed: entry.count < DEMO_LIMITS.maxDemos,
    remaining: Math.max(0, DEMO_LIMITS.maxDemos - entry.count),
    resetIn,
    total: DEMO_LIMITS.maxDemos,
  };
}

/**
 * Get demo usage for identifier
 */
export function getDemoUsage(identifier: string): DemoUsage | null {
  const entry = demoUsageStore.get(identifier);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.firstUsed > DEMO_LIMITS.windowMs) {
    demoUsageStore.delete(identifier);
    return null;
  }

  return {
    count: entry.count,
    firstUsed: entry.firstUsed,
    lastUsed: entry.lastUsed,
    scenariosViewed: entry.scenariosViewed,
  };
}

// ===========================================
// Client-side Helpers (for localStorage)
// ===========================================

/**
 * Format reset time for display
 * @param seconds - seconds until reset
 * @returns formatted string like "23 часа 45 минут"
 */
export function formatResetTime(seconds: number): string {
  if (seconds <= 0) return 'сейчас';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours} ч ${minutes} мин`;
  } else if (hours > 0) {
    return `${hours} ч`;
  } else if (minutes > 0) {
    return `${minutes} мин`;
  } else {
    return `${seconds} сек`;
  }
}

// ===========================================
// Stats (for debugging/monitoring)
// ===========================================

export function getDemoStats(): { activeUsers: number; totalDemos: number } {
  const now = Date.now();
  let activeUsers = 0;
  let totalDemos = 0;

  for (const [, entry] of demoUsageStore.entries()) {
    if (now - entry.firstUsed <= DEMO_LIMITS.windowMs) {
      activeUsers++;
      totalDemos += entry.count;
    }
  }

  return { activeUsers, totalDemos };
}

// ===========================================
// Testing utilities
// ===========================================

/**
 * Clear the demo store (for testing only)
 */
export function clearDemoStore(): void {
  demoUsageStore.clear();
}
