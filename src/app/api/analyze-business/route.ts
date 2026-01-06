import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  BusinessInputSchema,
  type BusinessAnalyzeResponse,
  type BusinessMetadata,
} from '@/types/business';
import { buildCanvas } from '@/lib/business/canvas-builder';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIG } from '@/lib/utils/rate-limiter';
import { validateEnv, getMissingEnvVars } from '@/lib/utils/env';
import { logger } from '@/lib/utils/logger';

// ===========================================
// Request Validation (extends BusinessInputSchema)
// ===========================================

const AnalyzeBusinessRequestSchema = BusinessInputSchema;

// ===========================================
// POST /api/analyze-business
// ===========================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Helper to create error response
  const errorResponse = (
    message: string,
    status: number,
    headers?: Record<string, string>
  ): NextResponse<BusinessAnalyzeResponse> => {
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
  } catch (error) {
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
    const validation = AnalyzeBusinessRequestSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      return errorResponse(errors, 400);
    }

    const input = validation.data;

    // Build Canvas
    const result = await buildCanvas(input);

    // Build metadata
    const metadata: BusinessMetadata = {
      documents_parsed: result.documents_parsed,
      total_text_length: result.total_text_length,
      model_used: result.model_used,
      tokens_used: result.tokens_used,
      analysis_duration_ms: result.analysis_duration_ms,
    };

    // Build response
    const response: BusinessAnalyzeResponse = {
      success: result.success,
      needs_clarification: result.needs_clarification,
      questions: result.questions,
      canvas: result.canvas,
      business_stage: result.business_stage,
      gaps_in_model: result.gaps_in_model,
      recommendations: result.recommendations,
      metadata,
    };

    // Add rate limit headers
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    };

    // Add parse errors to response if any
    if (result.parse_errors && result.parse_errors.length > 0) {
      logger.warn('Document parse errors', { errors: result.parse_errors });
    }

    return NextResponse.json(response, { headers });

  } catch (error) {
    logger.error('Analyze business error', error instanceof Error ? error : undefined);

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
