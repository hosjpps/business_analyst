import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIG } from '@/lib/utils/rate-limiter';
import { logger } from '@/lib/utils/logger';

// Dynamic import for google-trends-api (CommonJS module)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require('google-trends-api');

// ===========================================
// Request Validation
// ===========================================

const TrendsRequestSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1).max(5),
  geo: z.string().optional().default(''),
  timeRange: z.enum(['past_hour', 'past_day', 'past_week', 'past_month', 'past_year', 'past_5_years']).optional().default('past_year'),
});

// ===========================================
// Types
// ===========================================

interface TrendDataPoint {
  date: string;
  value: number;
  formattedDate: string;
}

interface RelatedQuery {
  query: string;
  value: number | string;
  type: 'top' | 'rising';
}

interface TrendResult {
  keyword: string;
  data: TrendDataPoint[];
  relatedQueries: RelatedQuery[];
  averageInterest: number;
  peakInterest: number;
  trend: 'rising' | 'falling' | 'stable';
}

interface TrendsResponse {
  success: boolean;
  results?: TrendResult[];
  error?: string;
  metadata?: {
    geo: string;
    timeRange: string;
    fetchedAt: string;
  };
}

// ===========================================
// Helper Functions
// ===========================================

function getTimeRange(range: string): { startTime: Date; endTime: Date } {
  const endTime = new Date();
  let startTime = new Date();

  switch (range) {
    case 'past_hour':
      startTime.setHours(startTime.getHours() - 1);
      break;
    case 'past_day':
      startTime.setDate(startTime.getDate() - 1);
      break;
    case 'past_week':
      startTime.setDate(startTime.getDate() - 7);
      break;
    case 'past_month':
      startTime.setMonth(startTime.getMonth() - 1);
      break;
    case 'past_year':
      startTime.setFullYear(startTime.getFullYear() - 1);
      break;
    case 'past_5_years':
      startTime.setFullYear(startTime.getFullYear() - 5);
      break;
    default:
      startTime.setFullYear(startTime.getFullYear() - 1);
  }

  return { startTime, endTime };
}

function calculateTrend(data: TrendDataPoint[]): 'rising' | 'falling' | 'stable' {
  if (data.length < 2) return 'stable';

  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));

  const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / (firstAvg || 1)) * 100;

  if (change > 10) return 'rising';
  if (change < -10) return 'falling';
  return 'stable';
}

/**
 * Safely parse JSON response from Google Trends API
 * Google sometimes returns HTML (error pages, captcha) instead of JSON
 */
function safeParseJSON(response: string, context: string): unknown {
  if (!response || typeof response !== 'string') {
    throw new Error(`Empty response from Google Trends for ${context}`);
  }

  // Check if response looks like HTML instead of JSON
  const trimmed = response.trim();
  if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')) {
    throw new Error(`Google Trends returned HTML instead of JSON for ${context}. This may be due to rate limiting or regional restrictions.`);
  }

  try {
    return JSON.parse(response);
  } catch (parseError) {
    // Include first 100 chars of response in error for debugging
    const preview = response.substring(0, 100);
    throw new Error(`Failed to parse Google Trends response for ${context}: ${preview}...`);
  }
}

// ===========================================
// POST /api/trends
// ===========================================

export async function POST(request: NextRequest): Promise<NextResponse<TrendsResponse>> {
  // Rate limiting
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Превышен лимит запросов. Попробуйте через ${rateLimit.resetIn} секунд.`,
      },
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
    const body = await request.json();
    const validation = TrendsRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    const { keywords, geo, timeRange } = validation.data;
    const { startTime, endTime } = getTimeRange(timeRange);

    const results: TrendResult[] = [];

    for (const keyword of keywords) {
      try {
        // Fetch interest over time
        const interestResponse = await googleTrends.interestOverTime({
          keyword,
          startTime,
          endTime,
          geo: geo || undefined,
        });

        const interestData = safeParseJSON(interestResponse, keyword) as { default?: { timelineData?: Array<{ time: string; formattedTime: string; value: number[] }> } };
        const timelineData = interestData?.default?.timelineData || [];

        const data: TrendDataPoint[] = timelineData.map((item) => ({
          date: new Date(parseInt(item.time) * 1000).toISOString(),
          value: item.value?.[0] || 0,
          formattedDate: item.formattedTime || '',
        }));

        // Fetch related queries
        let relatedQueries: RelatedQuery[] = [];
        try {
          const relatedResponse = await googleTrends.relatedQueries({
            keyword,
            startTime,
            endTime,
            geo: geo || undefined,
          });

          interface RankedKeyword { query: string; value: number | string }
          const relatedData = safeParseJSON(relatedResponse, `${keyword} related`) as { default?: { rankedList?: Array<{ rankedKeyword?: RankedKeyword[] }> } };
          const topQueries = relatedData?.default?.rankedList?.[0]?.rankedKeyword || [];
          const risingQueries = relatedData?.default?.rankedList?.[1]?.rankedKeyword || [];

          relatedQueries = [
            ...topQueries.slice(0, 5).map((q) => ({
              query: q.query,
              value: q.value,
              type: 'top' as const,
            })),
            ...risingQueries.slice(0, 5).map((q) => ({
              query: q.query,
              value: q.value,
              type: 'rising' as const,
            })),
          ];
        } catch {
          // Related queries might fail, continue without them
          logger.warn(`Failed to fetch related queries for "${keyword}"`);
        }

        // Calculate statistics
        const values = data.map((d) => d.value);
        const averageInterest = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
        const peakInterest = values.length > 0 ? Math.max(...values) : 0;

        results.push({
          keyword,
          data,
          relatedQueries,
          averageInterest,
          peakInterest,
          trend: calculateTrend(data),
        });
      } catch (error) {
        logger.error(`Failed to fetch trends for "${keyword}"`, error);
        // Add empty result for failed keyword
        results.push({
          keyword,
          data: [],
          relatedQueries: [],
          averageInterest: 0,
          peakInterest: 0,
          trend: 'stable',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      metadata: {
        geo: geo || 'worldwide',
        timeRange,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Trends API error', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch trends data',
      },
      { status: 500 }
    );
  }
}
