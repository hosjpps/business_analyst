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
  | 'testing'
  | 'fundamental_mismatch';

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
  'fundamental_mismatch',
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
  fundamental_mismatch: 'Несоответствие',
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

  // NEW: From skills analysis (competitive-ads-extractor, developer-growth-analysis)
  hook?: string; // Why this matters - one compelling sentence
  time_to_fix?: string; // Estimated time (e.g., "2-4 часа", "1 день")
  action_steps?: string[]; // Concrete steps to fix (from content-research-writer)
  why_matters?: string; // Business impact explanation
  competitor_approach?: string; // How competitors solve this (from competitive-ads-extractor)
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

  // NEW: From skills analysis
  hook: z.string().optional(),
  time_to_fix: z.string().optional(),
  action_steps: z.array(z.string()).optional(),
  why_matters: z.string().optional(),
  competitor_approach: z.string().optional(),
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

  // NEW: From skills analysis (developer-growth-analysis, lead-research-assistant)
  summary?: string; // Overview of the analysis
  strengths?: string[]; // What's already working well
  market_insights?: {
    icp?: string; // Ideal Customer Profile
    go_to_market?: string[]; // Go-to-market strategies
    fit_score?: number; // 1-10, how well product fits market
  };
}

export const GapAnalysisResultSchema = z.object({
  gaps: z.array(GapSchema),
  alignment_score: z.number().min(0).max(100),
  verdict: VerdictSchema,
  verdict_explanation: z.string().min(20),

  // NEW: From skills analysis
  summary: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  market_insights: z
    .object({
      icp: z.string().optional(),
      go_to_market: z.array(z.string()).optional(),
      fit_score: z.number().min(1).max(10).optional(),
    })
    .optional(),
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
  category: z.enum(['documentation', 'technical', 'product', 'marketing', 'business', 'monetization', 'growth', 'security']),
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
  url: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  socials: z.record(z.string()).optional(),
  notes: z.string().optional(),
  // Support additional fields from competitor.ts format
  social_links: z.object({
    instagram: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    facebook: z.string().url().optional().or(z.literal('')),
    youtube: z.string().url().optional().or(z.literal('')),
  }).optional(),
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

  // NEW: From skills analysis
  summary?: string;
  strengths?: string[];
  market_insights?: {
    icp?: string;
    go_to_market?: string[];
    fit_score?: number;
  };
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

  // NEW: From skills analysis
  summary: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  market_insights: z
    .object({
      icp: z.string().optional(),
      go_to_market: z.array(z.string()).optional(),
      fit_score: z.number().min(1).max(10).optional(),
    })
    .optional(),
});

export const LLMTaskGenerationResponseSchema = z.object({
  tasks: z.array(GapTaskSchema),
  next_milestone: z.string(),
});
