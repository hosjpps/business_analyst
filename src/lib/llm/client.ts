import OpenAI from 'openai';
import { z } from 'zod';
import { withLLMRetry } from '@/lib/utils/retry';

// ===========================================
// OpenRouter Client (Compatible with OpenAI SDK)
// Lazy initialization to avoid build-time errors
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

function getDefaultModel(): string {
  return process.env.LLM_MODEL || 'anthropic/claude-sonnet-4';
}

function getMaxTokens(): number {
  return parseInt(process.env.LLM_MAX_TOKENS || '4000', 10);
}

// ===========================================
// Send Message to LLM
// ===========================================

export interface LLMResponse {
  content: string;
  model: string;
  tokens_used: number;
}

export async function sendToLLM(
  prompt: string,
  model?: string
): Promise<LLMResponse> {
  const startTime = Date.now();
  const client = getClient();
  const modelToUse = model || getDefaultModel();

  return withLLMRetry(async () => {
    try {
      const response = await client.chat.completions.create({
        model: modelToUse,
        max_tokens: getMaxTokens(),
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;

      console.log(`LLM response in ${Date.now() - startTime}ms, tokens: ${tokensUsed}`);

      return {
        content,
        model: response.model || modelToUse,
        tokens_used: tokensUsed
      };
    } catch (error) {
      console.error('LLM Error:', error);
      throw new Error(
        error instanceof Error
          ? `LLM Error: ${error.message}`
          : 'Unknown LLM error'
      );
    }
  });
}

// ===========================================
// Zod Schemas for LLM Response Validation
// ===========================================

const StrengthSchema = z.object({
  area: z.string(),
  detail: z.string()
});

const IssueSchema = z.object({
  severity: z.enum(['high', 'medium', 'low']),
  area: z.string(),
  detail: z.string(),
  file_path: z.string().nullable()
});

const TaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.enum(['documentation', 'technical', 'product', 'marketing', 'business']),
  estimated_minutes: z.number(),
  depends_on: z.string().nullable()
});

const QuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  why: z.string()
});

const AnalysisSchema = z.object({
  project_summary: z.string(),
  detected_stage: z.enum(['documentation', 'mvp', 'launched', 'growing', 'unknown']),
  tech_stack: z.array(z.string()),
  strengths: z.array(StrengthSchema),
  issues: z.array(IssueSchema),
  tasks: z.array(TaskSchema),
  next_milestone: z.string()
});

const PartialAnalysisSchema = z.object({
  project_summary: z.string(),
  detected_stage: z.enum(['documentation', 'mvp', 'launched', 'growing', 'unknown']),
  tech_stack: z.array(z.string())
});

export const LLMAnalysisResponseSchema = z.object({
  needs_clarification: z.boolean(),
  questions: z.array(QuestionSchema).optional(),
  partial_analysis: PartialAnalysisSchema.optional(),
  analysis: AnalysisSchema.optional()
});

export type LLMAnalysisResponse = z.infer<typeof LLMAnalysisResponseSchema>;

// ===========================================
// Parse JSON Response
// ===========================================

export function parseJSONResponse<T>(content: string): T {
  let cleaned = content.trim();

  // Удаляем markdown блоки кода
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/m, '');

  // Удаляем markdown заголовки (# заголовки)
  cleaned = cleaned.replace(/^#+\s+.*$/gm, '');
  
  // Находим первый { - это начало JSON
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) {
    throw new Error('No JSON object found in response');
  }
  
  // Удаляем все до первой {
  cleaned = cleaned.substring(firstBrace);

  // Находим последнюю закрывающую скобку корневого объекта, проверяя баланс скобок
  let braceCount = 0;
  let lastBrace = -1;
  
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '{') {
      braceCount++;
    } else if (cleaned[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        lastBrace = i;
        break; // Нашли закрывающую скобку для корневого объекта
      }
    }
  }

  if (lastBrace !== -1) {
    // Удаляем все после закрывающей скобки корневого объекта
    cleaned = cleaned.substring(0, lastBrace + 1);
  } else {
    // Fallback: используем последнюю }
    const fallbackLastBrace = cleaned.lastIndexOf('}');
    if (fallbackLastBrace !== -1) {
      cleaned = cleaned.substring(0, fallbackLastBrace + 1);
    } else {
      throw new Error('No closing brace found in JSON');
    }
  }

  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // Последняя попытка: ищем все JSON объекты в тексте и берем самый большой
    const jsonMatches = cleaned.match(/\{[\s\S]*?\}/g);
    if (jsonMatches && jsonMatches.length > 0) {
      // Сортируем по размеру и пробуем парсить от большего к меньшему
      const sortedMatches = jsonMatches.sort((a, b) => b.length - a.length);
      for (const match of sortedMatches) {
        try {
          return JSON.parse(match);
        } catch (e) {
          // Пробуем следующий
        }
      }
    }

    console.error('JSON Parse Error:', error);
    console.error('Content length:', content.length);
    console.error('Cleaned length:', cleaned.length);
    console.error('Content preview (first 1000 chars):', content.slice(0, 1000));
    console.error('Content preview (last 500 chars):', content.slice(-500));
    console.error('Cleaned preview:', cleaned.slice(0, 1000));
    
    throw new Error(`Failed to parse LLM response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse and validate LLM analysis response with Zod schema
 * Returns validated response or throws with detailed error
 */
export function parseAndValidateAnalysisResponse(content: string): LLMAnalysisResponse {
  // First, parse JSON
  const parsed = parseJSONResponse<unknown>(content);

  // Then validate with Zod
  const validation = LLMAnalysisResponseSchema.safeParse(parsed);

  if (!validation.success) {
    const errors = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    console.error('LLM Response validation failed:', errors);
    console.error('Parsed response:', JSON.stringify(parsed, null, 2).slice(0, 2000));

    // Try to salvage partial data
    throw new Error(`LLM response validation failed: ${errors}`);
  }

  return validation.data;
}

// ===========================================
// Chat Messages
// ===========================================

export async function sendChatMessage(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  model?: string
): Promise<LLMResponse> {
  const client = getClient();
  const modelToUse = model || getDefaultModel();

  try {
    const response = await client.chat.completions.create({
      model: modelToUse,
      max_tokens: getMaxTokens(),
      messages
    });

    return {
      content: response.choices[0]?.message?.content || '',
      model: response.model || modelToUse,
      tokens_used: response.usage?.total_tokens || 0
    };
  } catch (error) {
    console.error('Chat Error:', error);
    throw new Error(
      error instanceof Error
        ? `Chat Error: ${error.message}`
        : 'Unknown chat error'
    );
  }
}
