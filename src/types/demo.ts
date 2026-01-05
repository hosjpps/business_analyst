import { z } from 'zod';
import type { BusinessAnalyzeResponse } from './business';
import type { AnalyzeResponse } from './index';
import type { GapAnalyzeResponse } from './gaps';
import type { CompetitorAnalyzeResponse } from './competitor';

// ===========================================
// Demo Scenario Types
// ===========================================

export type DemoScenarioId = 'saas' | 'ecommerce' | 'mobile';

export interface DemoScenarioInfo {
  id: DemoScenarioId;
  name: string;
  description: string;
  icon: string;
  tags: string[];
}

export interface DemoScenario extends DemoScenarioInfo {
  businessResult: BusinessAnalyzeResponse;
  codeResult: AnalyzeResponse;
  gapResult: GapAnalyzeResponse;
  competitorResult: CompetitorAnalyzeResponse;
}

// ===========================================
// Demo Usage Tracking
// ===========================================

export interface DemoUsage {
  count: number;
  firstUsed: number;
  lastUsed: number;
  scenariosViewed: DemoScenarioId[];
}

export interface DemoLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
  total: number;
}

// ===========================================
// Demo API Types
// ===========================================

export interface DemoScenariosResponse {
  success: boolean;
  scenarios: DemoScenarioInfo[];
}

export interface DemoAnalyzeRequest {
  scenarioId: DemoScenarioId;
}

export const DemoAnalyzeRequestSchema = z.object({
  scenarioId: z.enum(['saas', 'ecommerce', 'mobile']),
});

export interface DemoAnalyzeResponse {
  success: boolean;
  isDemo: true;
  scenarioId: DemoScenarioId;
  scenarioName: string;
  businessResult: BusinessAnalyzeResponse;
  codeResult: AnalyzeResponse;
  gapResult: GapAnalyzeResponse;
  competitorResult: CompetitorAnalyzeResponse;
  demoLimit: DemoLimitResult;
  error?: string;
}

// ===========================================
// Demo Constants
// ===========================================

export const DEMO_LIMITS = {
  maxDemos: 3,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export const DEMO_STORAGE_KEY = 'ba_demo_usage';
