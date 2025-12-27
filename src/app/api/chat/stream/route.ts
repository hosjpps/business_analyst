import { NextRequest } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';

import { buildChatPrompt } from '@/lib/llm/prompts';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIG } from '@/lib/utils/rate-limiter';

// ===========================================
// Request Validation
// ===========================================

const ChatStreamRequestSchema = z.object({
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
// OpenRouter Client for Streaming
// ===========================================

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    _client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'GitHub Repository Analyzer'
      }
    });
  }
  return _client;
}

// ===========================================
// POST /api/chat/stream
// ===========================================

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: `Превышен лимит запросов. Попробуйте через ${rateLimit.resetIn} секунд.`
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetIn.toString()
        }
      }
    );
  }

  try {
    // Parse and validate request
    const body = await request.json();
    const validation = ChatStreamRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error.errors[0].message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { message, previous_analysis } = validation.data;

    // Build prompt
    const prompt = buildChatPrompt(message, previous_analysis);

    // Create streaming response
    const client = getClient();
    const model = process.env.LLM_MODEL || 'anthropic/claude-sonnet-4';
    const maxTokens = parseInt(process.env.LLM_MAX_TOKENS || '4000', 10);

    const stream = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: 'user', content: prompt }]
    });

    // Create a TransformStream for SSE
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              // Send as SSE format
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Chat stream error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
