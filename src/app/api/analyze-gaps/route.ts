import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { BusinessCanvasSchema } from '@/types/business';
import { AnalysisSchema } from '@/types';
import {
  CompetitorInputSchema,
  type GapAnalyzeResponse,
  type GapMetadata,
} from '@/types/gaps';
import { detectGaps } from '@/lib/gaps/detector';
import { generateTasks, deriveNextMilestone } from '@/lib/gaps/task-generator';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIG } from '@/lib/utils/rate-limiter';
import { validateEnv, getMissingEnvVars } from '@/lib/utils/env';

// ===========================================
// Request Validation
// ===========================================

const GapAnalyzeRequestSchema = z.object({
  canvas: BusinessCanvasSchema,
  code_analysis: AnalysisSchema,
  competitors: z.array(CompetitorInputSchema).optional(),
  user_context: z
    .object({
      current_week: z.number().optional(),
      previous_tasks_completed: z.array(z.string()).optional(),
      user_goal: z.string().optional(),
    })
    .optional(),
});

// ===========================================
// POST /api/analyze-gaps
// ===========================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Helper to create error response
  const errorResponse = (
    message: string,
    status: number,
    headers?: Record<string, string>
  ): NextResponse<GapAnalyzeResponse> => {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status, headers }
    );
  };

  // Validate environment variables
  try {
    validateEnv();
  } catch {
    const missing = getMissingEnvVars();
    return errorResponse(
      `Server configuration error: Missing required environment variables: ${missing.join(', ')}`,
      500
    );
  }

  // Rate limiting
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP);

  if (!rateLimit.allowed) {
    return errorResponse(
      `Превышен лимит запросов. Попробуйте через ${rateLimit.resetIn} секунд. Лимит: ${RATE_LIMIT_CONFIG.maxRequests} запросов в минуту.`,
      429,
      {
        'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimit.resetIn.toString(),
      }
    );
  }

  try {
    // Parse request body
    const body = await request.json();

    // Validate request
    const validation = GapAnalyzeRequestSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message).join(', ');
      return errorResponse(errors, 400);
    }

    const { canvas, code_analysis, competitors } = validation.data;

    let totalTokensUsed = 0;

    // 1. Detect gaps
    const gapResult = await detectGaps(canvas, code_analysis, competitors);

    if (!gapResult.success || !gapResult.data) {
      return errorResponse(gapResult.error || 'Failed to detect gaps', 500);
    }

    totalTokensUsed += gapResult.tokens_used || 0;

    const { gaps, alignment_score, verdict, verdict_explanation } = gapResult.data;

    // 2. Generate tasks from gaps
    const taskResult = await generateTasks(gaps, canvas, code_analysis);

    if (!taskResult.success) {
      // Tasks are optional, continue without them
      console.warn('Task generation failed:', taskResult.error);
    }

    totalTokensUsed += taskResult.tokens_used || 0;

    const tasks = taskResult.tasks || [];
    const next_milestone = taskResult.next_milestone || deriveNextMilestone(tasks, gaps);

    // Build metadata
    const metadata: GapMetadata = {
      gaps_detected: gaps.length,
      tasks_generated: tasks.length,
      model_used: 'anthropic/claude-sonnet-4',
      tokens_used: totalTokensUsed,
      analysis_duration_ms: Date.now() - startTime,
    };

    // Build response
    const response: GapAnalyzeResponse = {
      success: true,
      gaps,
      alignment_score,
      verdict,
      verdict_explanation,
      tasks,
      next_milestone,
      metadata,
    };

    // Add rate limit headers
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    };

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error('Analyze gaps error:', error);

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
