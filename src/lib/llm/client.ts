import OpenAI from 'openai';

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
}

// ===========================================
// Parse JSON Response
// ===========================================

export function parseJSONResponse<T>(content: string): T {
  // Убираем возможные markdown блоки
  let cleaned = content.trim();

  // Удаляем ```json и ``` если есть
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.error('Content:', cleaned.slice(0, 500));
    throw new Error('Failed to parse LLM response as JSON');
  }
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
