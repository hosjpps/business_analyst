import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { ChatRequest, ChatResponse } from '@/types';
import { buildChatPrompt } from '@/lib/llm/prompts';
import { sendToLLM } from '@/lib/llm/client';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIG } from '@/lib/utils/rate-limiter';
import { logger } from '@/lib/utils/logger';

// ===========================================
// Request Validation
// ===========================================

const ChatRequestSchema = z.object({
  session_id: z.string().min(1),
  message: z.string().min(1, 'Message is required'),
  previous_analysis: z.object({
    project_summary: z.string(),
    detected_stage: z.string(),
    tech_stack: z.array(z.string()),
    strengths: z.array(z.any()),
    issues: z.array(z.any()),
    tasks: z.array(z.any()),
    next_milestone: z.string()
  })
});

// ===========================================
// POST /api/chat
// ===========================================

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        answer: '',
        error: `Превышен лимит запросов. Попробуйте через ${rateLimit.resetIn} секунд. Лимит: ${RATE_LIMIT_CONFIG.maxRequests} запросов в минуту.`
      } satisfies ChatResponse,
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetIn.toString()
        }
      }
    );
  }

  try {
    // Parse request body
    const body = await request.json() as ChatRequest;

    // Validate request
    const validation = ChatRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          answer: '',
          error: validation.error.errors[0].message
        } satisfies ChatResponse,
        { status: 400 }
      );
    }

    const { message, previous_analysis } = validation.data;

    // Build chat prompt
    const prompt = buildChatPrompt(message, previous_analysis);

    // Send to LLM (use Sonnet for faster chat responses)
    const llmResponse = await sendToLLM(prompt, { taskType: 'chat' });

    // Return response
    const response: ChatResponse = {
      success: true,
      answer: llmResponse.content
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Chat error', error instanceof Error ? error : undefined);

    return NextResponse.json(
      {
        success: false,
        answer: '',
        error: error instanceof Error ? error.message : 'Internal server error'
      } satisfies ChatResponse,
      { status: 500 }
    );
  }
}
