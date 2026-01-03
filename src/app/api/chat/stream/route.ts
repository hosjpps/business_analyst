import { NextRequest } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';

import { buildChatPrompt, buildFullAnalysisChatPrompt } from '@/lib/llm/prompts';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIG } from '@/lib/utils/rate-limiter';

// ===========================================
// Request Validation
// ===========================================

// Code analysis schema (for backwards compatibility)
const CodeAnalysisSchema = z.object({
  project_summary: z.string(),
  detected_stage: z.string(),
  tech_stack: z.array(z.string()),
  strengths: z.array(z.any()),
  issues: z.array(z.any()),
  tasks: z.array(z.any()),
  next_milestone: z.string()
});

// Business canvas schema
const BusinessCanvasSchema = z.object({
  value_proposition: z.string(),
  customer_segments: z.array(z.string()),
  channels: z.array(z.string()),
  revenue_streams: z.array(z.string()),
  key_resources: z.array(z.string()),
  key_activities: z.array(z.string()),
  key_partners: z.array(z.string()),
  customer_relationships: z.string().optional(),
  cost_structure: z.array(z.string())
}).optional();

// Gap schema
const GapSchema = z.object({
  gaps: z.array(z.any()).optional(),
  alignment_score: z.number().optional(),
  verdict: z.string().optional(),
  tasks: z.array(z.any()).optional()
}).optional();

// Competitor schema
const CompetitorSchema = z.object({
  your_advantages: z.array(z.string()).optional(),
  your_gaps: z.array(z.string()).optional(),
  market_position: z.string().optional(),
  recommendations: z.array(z.string()).optional()
}).optional();

const ChatStreamRequestSchema = z.object({
  session_id: z.string().min(1),
  message: z.string().min(1, 'Message is required'),
  // Legacy field (for backwards compatibility)
  previous_analysis: CodeAnalysisSchema.optional(),
  // Full analysis context fields
  business_canvas: BusinessCanvasSchema,
  gap_analysis: GapSchema,
  competitor_analysis: CompetitorSchema,
  // Mode indicator
  analysis_mode: z.enum(['code', 'business', 'full', 'competitor']).optional()
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

    const {
      message,
      previous_analysis,
      business_canvas,
      gap_analysis,
      competitor_analysis,
      analysis_mode
    } = validation.data;

    // Build prompt based on analysis mode
    let prompt: string;

    if (analysis_mode === 'full' || (business_canvas && gap_analysis)) {
      // Full analysis mode - use comprehensive prompt
      prompt = buildFullAnalysisChatPrompt(message, {
        codeAnalysis: previous_analysis,
        businessCanvas: business_canvas,
        gapAnalysis: gap_analysis,
        competitorAnalysis: competitor_analysis
      });
    } else if (previous_analysis) {
      // Legacy mode - code analysis only
      prompt = buildChatPrompt(message, previous_analysis);
    } else {
      // Fallback - use whatever context is available
      const context: Record<string, unknown> = {};
      if (business_canvas) context.business_canvas = business_canvas;
      if (gap_analysis) context.gap_analysis = gap_analysis;
      if (competitor_analysis) context.competitor_analysis = competitor_analysis;
      prompt = buildChatPrompt(message, context);
    }

    // Create streaming response
    const client = getClient();
    const model = process.env.LLM_MODEL || 'anthropic/claude-sonnet-4';
    const maxTokens = parseInt(process.env.LLM_MAX_TOKENS || '8000', 10);

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
