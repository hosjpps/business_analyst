import { z } from 'zod';
import type { Task } from './index';

// ===========================================
// Gap Severity & Category
// ===========================================

export type GapSeverity = 'critical' | 'warning' | 'info';

export const GapSeveritySchema = z.enum(['critical', 'warning', 'info']);

export type GapCategory =
  | 'monetization'
  | 'growth'
  | 'security'
  | 'ux'
  | 'infrastructure'
  | 'marketing'
  | 'scalability'
  | 'documentation'
  | 'testing';

export const GapCategorySchema = z.enum([
  'monetization',
  'growth',
  'security',
  'ux',
  'infrastructure',
  'marketing',
  'scalability',
  'documentation',
  'testing',
]);

// Labels for UI
export const GAP_CATEGORY_LABELS: Record<GapCategory, string> = {
  monetization: 'Monetization',
  growth: 'Growth',
  security: 'Security',
  ux: 'User Experience',
  infrastructure: 'Infrastructure',
  marketing: 'Marketing',
  scalability: 'Scalability',
  documentation: 'Documentation',
  testing: 'Testing',
};

export const GAP_SEVERITY_LABELS: Record<GapSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

// ===========================================
// Effort & Impact Levels
// ===========================================

export type EffortLevel = 'low' | 'medium' | 'high';
export type ImpactLevel = 'low' | 'medium' | 'high';

export const EffortLevelSchema = z.enum(['low', 'medium', 'high']);
export const ImpactLevelSchema = z.enum(['low', 'medium', 'high']);

// ===========================================
// Gap
// ===========================================

export interface Gap {
  id: string;
  type: GapSeverity;
  category: GapCategory;
  business_goal: string;
  current_state: string;
  recommendation: string;
  effort: EffortLevel;
  impact: ImpactLevel;
  resources?: string[];
}

export const GapSchema = z.object({
  id: z.string(),
  type: GapSeveritySchema,
  category: GapCategorySchema,
  business_goal: z.string().min(10),
  current_state: z.string().min(10),
  recommendation: z.string().min(10),
  effort: EffortLevelSchema,
  impact: ImpactLevelSchema,
  resources: z.array(z.string()).optional(),
});

// ===========================================
// Verdict
// ===========================================

export type Verdict = 'on_track' | 'iterate' | 'pivot';

export const VerdictSchema = z.enum(['on_track', 'iterate', 'pivot']);

export const VERDICT_LABELS: Record<Verdict, string> = {
  on_track: 'On Track',
  iterate: 'Iterate',
  pivot: 'Pivot',
};

export const VERDICT_DESCRIPTIONS: Record<Verdict, string> = {
  on_track: 'Good alignment between business goals and product',
  iterate: 'Significant work needed to align product with goals',
  pivot: 'Major strategy rethink recommended',
};

// ===========================================
// Gap Analysis Result
// ===========================================

export interface GapAnalysisResult {
  gaps: Gap[];
  alignment_score: number; // 0-100
  verdict: Verdict;
  verdict_explanation: string;
}

export const GapAnalysisResultSchema = z.object({
  gaps: z.array(GapSchema),
  alignment_score: z.number().min(0).max(100),
  verdict: VerdictSchema,
  verdict_explanation: z.string().min(20),
});

// ===========================================
// Bonuses for Score Calculation
// ===========================================

export interface ScoreBonuses {
  has_deployment: boolean;
  has_analytics: boolean;
  has_tests: boolean;
  has_documentation: boolean;
}

// ===========================================
// Task with Gap Reference
// ===========================================

export interface GapTask extends Task {
  addresses_gap?: string; // Gap category
  resources?: string[];
}

export const GapTaskSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.enum(['documentation', 'technical', 'product', 'marketing', 'business']),
  estimated_minutes: z.number().min(15).max(480), // 15 min to 8 hours
  depends_on: z.string().nullable(),
  addresses_gap: z.string().optional(),
  resources: z.array(z.string()).optional(),
});

// ===========================================
// API Request/Response
// ===========================================

export interface GapAnalyzeRequest {
  canvas: import('./business').BusinessCanvas;
  code_analysis: import('./index').Analysis;
  competitors?: CompetitorInput[];
  user_context?: import('./index').UserContext;
}

export interface CompetitorInput {
  name: string;
  url?: string;
  github?: string;
  socials?: Record<string, string>;
  notes?: string;
}

export const CompetitorInputSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional(),
  github: z.string().url().optional(),
  socials: z.record(z.string()).optional(),
  notes: z.string().optional(),
});

export interface GapAnalyzeResponse {
  success: boolean;
  gaps?: Gap[];
  alignment_score?: number;
  verdict?: Verdict;
  verdict_explanation?: string;
  tasks?: GapTask[];
  next_milestone?: string;
  metadata?: GapMetadata;
  error?: string;
}

export interface GapMetadata {
  gaps_detected: number;
  tasks_generated: number;
  model_used: string;
  tokens_used: number;
  analysis_duration_ms: number;
}

// ===========================================
// LLM Response Schema (for parsing)
// ===========================================

export const LLMGapDetectionResponseSchema = z.object({
  gaps: z.array(GapSchema),
  alignment_score: z.number().min(0).max(100),
  verdict: VerdictSchema,
  verdict_explanation: z.string(),
});

export const LLMTaskGenerationResponseSchema = z.object({
  tasks: z.array(GapTaskSchema),
  next_milestone: z.string(),
});
