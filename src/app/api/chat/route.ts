import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { ChatRequest, ChatResponse } from '@/types';
import { buildChatPrompt } from '@/lib/llm/prompts';
import { sendToLLM } from '@/lib/llm/client';

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

    // Send to LLM
    const llmResponse = await sendToLLM(prompt);

    // Return response
    const response: ChatResponse = {
      success: true,
      answer: llmResponse.content
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat error:', error);

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
