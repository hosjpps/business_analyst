import type { AnalysisSnapshot, ComparisonResult } from '@/types/ux';
import type { Gap, GapSeverity, GapCategory } from '@/types/gaps';

// ===========================================
// Types
// ===========================================

export interface AnalysisRecord {
  id: string;
  type: string;
  result: Record<string, unknown>;
  created_at: string;
}

export interface MetricsHistory {
  dates: string[];
  market: number[];
  alignment: number[];
  technical: number[];
  security: number[];
}

// ===========================================
// Category Mappings for Multi-Metric Scores
// ===========================================

const MARKET_CATEGORIES: GapCategory[] = ['monetization', 'marketing', 'growth'];
const TECHNICAL_CATEGORIES: GapCategory[] = ['testing', 'documentation', 'infrastructure', 'scalability'];
const SECURITY_CATEGORIES: GapCategory[] = ['security'];

// Penalty per gap severity
const SEVERITY_PENALTY: Record<GapSeverity, number> = {
  critical: 25,
  warning: 10,
  info: 3,
};

// ===========================================
// Extract Metrics from Single Analysis
// ===========================================

export function extractMetricsFromAnalysis(analysis: AnalysisRecord): AnalysisSnapshot | null {
  const result = analysis.result;

  // Try to get gaps and alignment_score from different possible locations
  const gaps = (result?.gaps as Gap[]) ||
               (result?.analysis as { gaps?: Gap[] })?.gaps ||
               [];

  const alignmentScore =
    (result?.alignment_score as number) ??
    (result?.analysis as { alignment_score?: number })?.alignment_score ??
    null;

  // If no score available, can't create snapshot
  if (alignmentScore === null) {
    return null;
  }

  // Count gaps by severity
  const gapsCount = { critical: 0, warning: 0, info: 0 };
  gaps.forEach((gap: Gap) => {
    if (gap.type in gapsCount) {
      gapsCount[gap.type as GapSeverity]++;
    }
  });

  // Get tasks info
  const tasks = (result?.tasks as { status?: string }[]) || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  return {
    id: analysis.id,
    date: analysis.created_at,
    score: alignmentScore,
    gapsCount,
    totalTasks,
    completedTasks,
  };
}

// ===========================================
// Calculate Individual Metric Scores
// ===========================================

function calculateMetricScore(gaps: Gap[], categories: GapCategory[]): number {
  let score = 100;

  gaps.forEach((gap) => {
    if (categories.includes(gap.category)) {
      score -= SEVERITY_PENALTY[gap.type] || 0;
    }
  });

  return Math.max(0, Math.min(100, score));
}

export function extractDetailedMetrics(analysis: AnalysisRecord): {
  market: number;
  alignment: number;
  technical: number;
  security: number;
} | null {
  const result = analysis.result;

  const gaps = (result?.gaps as Gap[]) ||
               (result?.analysis as { gaps?: Gap[] })?.gaps ||
               [];

  const alignmentScore =
    (result?.alignment_score as number) ??
    (result?.analysis as { alignment_score?: number })?.alignment_score ??
    null;

  if (alignmentScore === null) {
    return null;
  }

  return {
    market: calculateMetricScore(gaps, MARKET_CATEGORIES),
    alignment: alignmentScore,
    technical: calculateMetricScore(gaps, TECHNICAL_CATEGORIES),
    security: calculateMetricScore(gaps, SECURITY_CATEGORIES),
  };
}

// ===========================================
// Build Timeline from Multiple Analyses
// ===========================================

export function buildProgressTimeline(analyses: AnalysisRecord[]): AnalysisSnapshot[] {
  // Filter to only analyses that have gaps/alignment data (full or gap analyses)
  const relevantAnalyses = analyses.filter((a) =>
    a.type === 'full' || a.type === 'gaps'
  );

  // Sort by date ascending (oldest first)
  const sorted = [...relevantAnalyses].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Extract snapshots
  const snapshots: AnalysisSnapshot[] = [];

  for (const analysis of sorted) {
    const snapshot = extractMetricsFromAnalysis(analysis);
    if (snapshot) {
      snapshots.push(snapshot);
    }
  }

  return snapshots;
}

// ===========================================
// Calculate Metrics History for Charting
// ===========================================

export function calculateMetricsHistory(analyses: AnalysisRecord[]): MetricsHistory {
  const relevantAnalyses = analyses.filter((a) =>
    a.type === 'full' || a.type === 'gaps'
  );

  const sorted = [...relevantAnalyses].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const history: MetricsHistory = {
    dates: [],
    market: [],
    alignment: [],
    technical: [],
    security: [],
  };

  for (const analysis of sorted) {
    const metrics = extractDetailedMetrics(analysis);
    if (metrics) {
      // Format date nicely
      const date = new Date(analysis.created_at);
      const formattedDate = date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });

      history.dates.push(formattedDate);
      history.market.push(metrics.market);
      history.alignment.push(metrics.alignment);
      history.technical.push(metrics.technical);
      history.security.push(metrics.security);
    }
  }

  return history;
}

// ===========================================
// Create Comparison Between Two Snapshots
// ===========================================

export function createComparison(
  previous: AnalysisSnapshot,
  current: AnalysisSnapshot
): ComparisonResult {
  const scoreChange = current.score - previous.score;

  const prevTotalGaps = previous.gapsCount.critical + previous.gapsCount.warning + previous.gapsCount.info;
  const currTotalGaps = current.gapsCount.critical + current.gapsCount.warning + current.gapsCount.info;

  const gapsResolved = Math.max(0, prevTotalGaps - currTotalGaps);
  const newGaps = Math.max(0, currTotalGaps - prevTotalGaps);

  const tasksCompleted = current.completedTasks - previous.completedTasks;

  let trend: 'improving' | 'stable' | 'declining';
  if (scoreChange > 5) {
    trend = 'improving';
  } else if (scoreChange < -5) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  return {
    previous,
    current,
    scoreChange,
    gapsResolved,
    newGaps,
    tasksCompleted,
    trend,
  };
}

// ===========================================
// Get Latest Comparison
// ===========================================

export function getLatestComparison(analyses: AnalysisRecord[]): ComparisonResult | null {
  const timeline = buildProgressTimeline(analyses);

  if (timeline.length < 2) {
    return null;
  }

  const previous = timeline[timeline.length - 2];
  const current = timeline[timeline.length - 1];

  return createComparison(previous, current);
}
