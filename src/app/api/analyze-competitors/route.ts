import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { BusinessCanvas } from '@/types/business';
import { BusinessCanvasSchema } from '@/types/business';
import type { CompetitorInput, CompetitorAnalyzeResponse } from '@/types/competitor';
import { CompetitorInputSchema } from '@/types/competitor';
import { analyzeCompetitors, analyzeCompetitorsQuick } from '@/lib/competitor/analyzer';
import { parseMultipleWebsites } from '@/lib/competitor/website-parser';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIG } from '@/lib/utils/rate-limiter';
import { logger } from '@/lib/utils/logger';

// ===========================================
// Request Schema
// ===========================================

const RequestSchema = z.object({
  competitors: z.array(CompetitorInputSchema).min(1).max(10),
  canvas: BusinessCanvasSchema.nullish(),
  product_description: z.string().max(5000).optional(),
  quick_mode: z.boolean().optional().default(false),
});

// ===========================================
// POST Handler
// ===========================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Rate limiting
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Превышен лимит запросов. Попробуйте через ${rateLimit.resetIn} секунд.`,
        metadata: {
          competitors_analyzed: 0,
          websites_parsed: 0,
          tokens_used: 0,
          analysis_duration_ms: Date.now() - startTime,
        },
      } as CompetitorAnalyzeResponse,
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetIn.toString(),
        },
      }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Ошибка валидации: ${parseResult.error.errors[0].message}`,
          metadata: {
            competitors_analyzed: 0,
            websites_parsed: 0,
            tokens_used: 0,
            analysis_duration_ms: Date.now() - startTime,
          },
        } as CompetitorAnalyzeResponse,
        { status: 400 }
      );
    }

    const { competitors, canvas, product_description, quick_mode } = parseResult.data;

    // Parse competitor websites
    const urls = competitors
      .map((c) => c.url)
      .filter((url): url is string => !!url);

    const parsedWebsites = urls.length > 0 ? await parseMultipleWebsites(urls) : [];
    const websitesParsedSuccessfully = parsedWebsites.filter((p) => !p.error).length;

    // Quick mode - no LLM call
    if (quick_mode) {
      const quickResult = analyzeCompetitorsQuick(competitors, parsedWebsites);

      return NextResponse.json(
        {
          success: true,
          ...quickResult,
          metadata: {
            competitors_analyzed: competitors.length,
            websites_parsed: websitesParsedSuccessfully,
            tokens_used: 0,
            analysis_duration_ms: Date.now() - startTime,
          },
        } as CompetitorAnalyzeResponse,
        {
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          },
        }
      );
    }

    // Full analysis with LLM
    const result = await analyzeCompetitors(
      canvas || null,
      product_description || '',
      competitors
    );

    return NextResponse.json(
      {
        success: true,
        competitors: result.competitors,
        comparison_matrix: result.comparison_matrix,
        your_advantages: result.your_advantages,
        your_gaps: result.your_gaps,
        recommendations: result.recommendations,
        market_position: result.market_position,
        market_position_explanation: result.market_position_explanation,
        metadata: {
          competitors_analyzed: competitors.length,
          websites_parsed: websitesParsedSuccessfully,
          tokens_used: 0, // TODO: track actual tokens
          analysis_duration_ms: Date.now() - startTime,
        },
      } as CompetitorAnalyzeResponse,
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    logger.error('Competitor analysis error', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: `Ошибка анализа конкурентов: ${errorMessage}`,
        metadata: {
          competitors_analyzed: 0,
          websites_parsed: 0,
          tokens_used: 0,
          analysis_duration_ms: Date.now() - startTime,
        },
      } as CompetitorAnalyzeResponse,
      { status: 500 }
    );
  }
}
