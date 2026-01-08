/**
 * GitHub Issues Export API
 *
 * POST - Export tasks to GitHub Issues
 * GET  - Verify access to repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createGitHubIssuesService } from '@/lib/github/issues-service';
import { ExportIssuesRequestSchema } from '@/types/github-issues';
import type { ExportIssuesResponse, ExportTask } from '@/types/github-issues';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIG } from '@/lib/utils/rate-limiter';
import { logger } from '@/lib/utils/logger';

// ===========================================
// Verify Access Schema
// ===========================================

const VerifyAccessSchema = z.object({
  repoUrl: z.string().url().refine(
    (url) => url.includes('github.com'),
    { message: 'Must be a GitHub repository URL' }
  ),
  accessToken: z.string().min(1, 'Access token is required'),
});

// ===========================================
// POST: Export tasks to GitHub Issues
// ===========================================

export async function POST(request: NextRequest) {
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
    // Parse and validate request
    const body = await request.json();
    const parsed = ExportIssuesRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const {
      repoUrl,
      accessToken,
      tasks,
      addPriorityLabels,
      addCategoryLabels,
      titlePrefix,
    } = parsed.data;

    // Validate tasks
    if (tasks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tasks to export',
        },
        { status: 400 }
      );
    }

    // Limit number of issues per request
    if (tasks.length > 20) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum 20 issues can be created per request',
        },
        { status: 400 }
      );
    }

    // Create service
    const service = createGitHubIssuesService(repoUrl, accessToken);

    // Verify access first
    const accessCheck = await service.verifyAccess();
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: accessCheck.message,
        },
        { status: 403 }
      );
    }

    // Convert to ExportTask format
    const exportTasks: ExportTask[] = tasks.map((task) => ({
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      actionSteps: task.actionSteps,
      effort: task.effort,
    }));

    // Create issues
    const result = await service.createIssuesFromTasks(exportTasks, {
      addPriorityLabels,
      addCategoryLabels,
      titlePrefix,
    });

    const response: ExportIssuesResponse = {
      success: result.created.length > 0,
      created: result.created,
      failed: result.failed,
      summary: {
        total: tasks.length,
        created: result.created.length,
        failed: result.failed.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Export to GitHub Issues error', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ===========================================
// GET: Verify repository access
// ===========================================

export async function GET(request: NextRequest) {
  // Rate limiting
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Превышен лимит запросов.`,
      },
      { status: 429 }
    );
  }

  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const repoUrl = searchParams.get('repoUrl');
    const accessToken = searchParams.get('accessToken');

    const parsed = VerifyAccessSchema.safeParse({ repoUrl, accessToken });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    // Create service and verify
    const service = createGitHubIssuesService(parsed.data.repoUrl, parsed.data.accessToken);
    const result = await service.verifyAccess();

    return NextResponse.json({
      success: result.hasAccess,
      message: result.message,
    });
  } catch (error) {
    logger.error('Verify GitHub access error', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
