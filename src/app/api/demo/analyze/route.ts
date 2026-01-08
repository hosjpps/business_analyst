/**
 * Demo Analysis API
 *
 * GET  - Returns list of available demo scenarios
 * POST - Returns mock results for a specific scenario
 *
 * No API calls are made - all data is pre-built mock data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScenarioById, getScenarioInfo } from '@/lib/demo/scenarios';
import { checkDemoLimit, recordDemoUsage } from '@/lib/demo/demo-limiter';
import { getClientIP } from '@/lib/utils/rate-limiter';
import { DemoAnalyzeRequestSchema } from '@/types/demo';
import type { DemoScenariosResponse, DemoAnalyzeResponse } from '@/types/demo';
import { logger } from '@/lib/utils/logger';

// ===========================================
// GET: List available scenarios
// ===========================================

export async function GET(): Promise<NextResponse<DemoScenariosResponse>> {
  const scenarios = getScenarioInfo();

  return NextResponse.json({
    success: true,
    scenarios,
  });
}

// ===========================================
// POST: Get demo results for a scenario
// ===========================================

export async function POST(request: NextRequest): Promise<NextResponse<DemoAnalyzeResponse | { success: false; error: string }>> {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check demo limit
    const limitCheck = checkDemoLimit(clientIP);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Лимит демо исчерпан. Попробуйте снова через ${formatTime(limitCheck.resetIn)}.`,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const parsed = DemoAnalyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Неверный формат запроса. Укажите scenarioId: saas, ecommerce или mobile.',
        },
        { status: 400 }
      );
    }

    const { scenarioId } = parsed.data;

    // Get scenario
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return NextResponse.json(
        {
          success: false,
          error: `Сценарий "${scenarioId}" не найден.`,
        },
        { status: 404 }
      );
    }

    // Record usage
    const demoLimit = recordDemoUsage(clientIP, scenarioId);

    // Return demo results
    return NextResponse.json({
      success: true,
      isDemo: true,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      inputExample: scenario.inputExample,
      trendsResults: scenario.trendsResults,
      businessResult: scenario.businessResult,
      codeResult: scenario.codeResult,
      gapResult: scenario.gapResult,
      competitorResult: scenario.competitorResult,
      demoLimit,
    });
  } catch (error) {
    logger.error('Demo API error', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Внутренняя ошибка сервера.',
      },
      { status: 500 }
    );
  }
}

// ===========================================
// Helper
// ===========================================

function formatTime(seconds: number): string {
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
