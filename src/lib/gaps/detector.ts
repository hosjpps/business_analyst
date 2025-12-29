import type { BusinessCanvas } from '@/types/business';
import type { Analysis } from '@/types';
import type { Gap, GapAnalysisResult, CompetitorInput } from '@/types/gaps';
import { LLMGapDetectionResponseSchema } from '@/types/gaps';
import { sendToLLM, parseJSONResponse } from '@/lib/llm/client';
import { withLLMRetry } from '@/lib/utils/retry';
import { buildFullGapAnalysisPrompt } from './prompts';

// ===========================================
// Gap Detection Result
// ===========================================

export interface DetectGapsResult {
  success: boolean;
  data?: GapAnalysisResult;
  error?: string;
  tokens_used?: number;
}

// ===========================================
// Build Full Prompt for LLM
// ===========================================

function buildPrompt(system: string, user: string): string {
  return `${system}\n\n---\n\n${user}`;
}

// ===========================================
// Detect Gaps
// ===========================================

export async function detectGaps(
  canvas: BusinessCanvas,
  codeAnalysis: Analysis,
  competitors?: CompetitorInput[]
): Promise<DetectGapsResult> {
  try {
    // Build prompt
    const { system, user } = buildFullGapAnalysisPrompt(canvas, codeAnalysis, competitors);
    const fullPrompt = buildPrompt(system, user);

    // Send to LLM with retry (retry is already handled inside sendToLLM)
    const response = await withLLMRetry(async () => {
      return sendToLLM(fullPrompt);
    });

    // Parse JSON from response
    const parsed = parseJSONResponse<unknown>(response.content);

    // Validate with Zod
    const validation = LLMGapDetectionResponseSchema.safeParse(parsed);

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      console.error('Gap detection response validation failed:', errors);
      return {
        success: false,
        error: `Response validation failed: ${errors}`,
      };
    }

    // Enrich gap IDs
    const gaps = validation.data.gaps.map((gap, index) => ({
      ...gap,
      id: gap.id || `gap-${index + 1}`,
    }));

    return {
      success: true,
      data: {
        gaps,
        alignment_score: validation.data.alignment_score,
        verdict: validation.data.verdict,
        verdict_explanation: validation.data.verdict_explanation,
      },
      tokens_used: response.tokens_used,
    };
  } catch (error) {
    console.error('Gap detection error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during gap detection',
    };
  }
}

// ===========================================
// Quick Gap Analysis (without LLM)
// ===========================================

export function analyzeGapsQuick(
  canvas: BusinessCanvas,
  codeAnalysis: Analysis
): Gap[] {
  const gaps: Gap[] = [];
  let gapIndex = 0;

  const createGap = (
    type: Gap['type'],
    category: Gap['category'],
    business_goal: string,
    current_state: string,
    recommendation: string,
    effort: Gap['effort'],
    impact: Gap['impact']
  ): Gap => ({
    id: `gap-${++gapIndex}`,
    type,
    category,
    business_goal,
    current_state,
    recommendation,
    effort,
    impact,
  });

  // Check monetization
  const hasRevenueStreams = canvas.revenue_streams.length > 0;
  const hasPaymentCode = codeAnalysis.tech_stack.some(
    (t) => t.toLowerCase().includes('stripe') || t.toLowerCase().includes('payment')
  );

  if (hasRevenueStreams && !hasPaymentCode) {
    gaps.push(
      createGap(
        'critical',
        'monetization',
        'Capture revenue from ' + canvas.revenue_streams[0],
        'No payment processing detected in codebase',
        'Integrate Stripe or similar payment processor to enable revenue capture',
        'medium',
        'high'
      )
    );
  }

  // Check analytics/growth
  const hasAnalytics = codeAnalysis.tech_stack.some(
    (t) =>
      t.toLowerCase().includes('analytics') ||
      t.toLowerCase().includes('mixpanel') ||
      t.toLowerCase().includes('posthog')
  );

  if (!hasAnalytics) {
    gaps.push(
      createGap(
        'warning',
        'growth',
        'Track user behavior and conversion',
        'No analytics tools detected',
        'Add analytics (PostHog, Mixpanel, or Google Analytics) to track user behavior',
        'low',
        'medium'
      )
    );
  }

  // Check testing
  const hasTests = codeAnalysis.tech_stack.some(
    (t) =>
      t.toLowerCase().includes('jest') ||
      t.toLowerCase().includes('vitest') ||
      t.toLowerCase().includes('cypress')
  );

  if (!hasTests) {
    gaps.push(
      createGap(
        'warning',
        'testing',
        'Ensure product quality and prevent regressions',
        'No testing framework detected',
        'Add unit tests with Jest or Vitest to prevent bugs',
        'medium',
        'medium'
      )
    );
  }

  // Check deployment/infrastructure
  const hasDeployment = codeAnalysis.tech_stack.some(
    (t) =>
      t.toLowerCase().includes('vercel') ||
      t.toLowerCase().includes('docker') ||
      t.toLowerCase().includes('aws')
  );

  if (!hasDeployment && codeAnalysis.detected_stage !== 'documentation') {
    gaps.push(
      createGap(
        'warning',
        'infrastructure',
        'Deploy product for customer access',
        'No deployment configuration detected',
        'Set up CI/CD with Vercel, Railway, or similar platform',
        'low',
        'high'
      )
    );
  }

  // Check documentation
  const hasGoodDocs = codeAnalysis.strengths.some(
    (s) => s.area.toLowerCase().includes('documentation')
  );
  const hasDocIssue = codeAnalysis.issues.some(
    (i) => i.area.toLowerCase().includes('documentation')
  );

  if (hasDocIssue || !hasGoodDocs) {
    gaps.push(
      createGap(
        'info',
        'documentation',
        'Enable developer onboarding and maintenance',
        'Documentation could be improved',
        'Add API documentation and developer guide',
        'low',
        'low'
      )
    );
  }

  return gaps;
}
