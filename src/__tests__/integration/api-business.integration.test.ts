/**
 * Integration tests for /api/analyze-business (Business Canvas)
 *
 * These tests verify the full API flow:
 * - Request validation
 * - Business canvas generation
 * - Response structure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock LLM client before importing route
vi.mock('@/lib/llm/client', () => ({
  sendToLLM: vi.fn(),
  parseJSONResponse: vi.fn((content: string) => JSON.parse(content)),
  getModelConfig: vi.fn(() => ({ model: 'claude-opus-4.5', maxTokens: 8000, temperature: 0.4 })),
  MODEL_CONFIG: {},
}));

// Mock rate limiter to always allow in tests
vi.mock('@/lib/utils/rate-limiter', () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 5, resetIn: 60 }),
  getClientIP: () => '127.0.0.1',
  RATE_LIMIT_CONFIG: { maxRequests: 5, windowMs: 60000 },
}));

// Import after mocks
import { POST } from '@/app/api/analyze-business/route';
import { sendToLLM } from '@/lib/llm/client';

// ===========================================
// Test Fixtures
// ===========================================

const validBusinessInput = {
  description: 'Мы создаём SaaS платформу для автоматизации бизнес-процессов. Наша целевая аудитория - малый и средний бизнес. Зарабатываем на подписках от $29 до $199 в месяц. Основные конкуренты - Zapier и Make.',
};

const mockBusinessCanvasResponse = {
  needs_clarification: false,
  canvas: {
    customer_segments: ['SMB owners', 'Operations managers'],
    value_proposition: 'AI-powered workflow automation that saves time and reduces manual errors',
    channels: ['Website', 'Social media', 'Partnerships'],
    customer_relationships: 'Self-service with email support',
    revenue_streams: ['Monthly subscriptions $29-$199/mo'],
    key_resources: ['Development team', 'Cloud infrastructure', 'AI models'],
    key_activities: ['Platform development', 'Customer support', 'Integration building'],
    key_partners: ['Cloud providers', 'API providers'],
    cost_structure: ['Cloud hosting', 'Salaries', 'Marketing'],
  },
  business_stage: 'building',
  gaps_in_model: ['No clear acquisition channel', 'Missing partnerships strategy'],
  recommendations: [
    { area: 'Marketing', recommendation: 'Define primary acquisition channel', priority: 'high' },
    { area: 'Partnerships', recommendation: 'Identify integration partners', priority: 'medium' },
  ],
};

const mockClarificationResponse = {
  needs_clarification: true,
  questions: [
    { id: 'q1', question: 'Какой размер целевой аудитории вы рассматриваете?', why: 'Для определения масштаба бизнеса' },
    { id: 'q2', question: 'Какие основные проблемы клиентов вы решаете?', why: 'Для формулирования ценностного предложения' },
  ],
};

// ===========================================
// Helper Functions
// ===========================================

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/analyze-business', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// ===========================================
// Test Suite: Request Validation
// ===========================================

describe('API /api/analyze-business - Request Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject request without description', async () => {
    const request = createRequest({
      social_links: { website: 'https://example.com' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should reject request with too short description', async () => {
    const request = createRequest({
      description: 'Короткое описание',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should accept valid request with full input', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockBusinessCanvasResponse),
      model: 'claude-opus-4.5',
      tokens_used: 1500,
    });

    const request = createRequest(validBusinessInput);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

// ===========================================
// Test Suite: Business Canvas Generation
// ===========================================

describe('API /api/analyze-business - Canvas Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return complete business canvas', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockBusinessCanvasResponse),
      model: 'claude-opus-4.5',
      tokens_used: 1500,
    });

    const request = createRequest(validBusinessInput);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.canvas).toBeDefined();

    // Verify all 9 BMC blocks
    expect(data.canvas.customer_segments).toBeDefined();
    expect(data.canvas.value_proposition).toBeDefined();
    expect(data.canvas.channels).toBeDefined();
    expect(data.canvas.customer_relationships).toBeDefined();
    expect(data.canvas.revenue_streams).toBeDefined();
    expect(data.canvas.key_resources).toBeDefined();
    expect(data.canvas.key_activities).toBeDefined();
    expect(data.canvas.key_partners).toBeDefined();
    expect(data.canvas.cost_structure).toBeDefined();
  });

  it('should include business stage', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockBusinessCanvasResponse),
      model: 'claude-opus-4.5',
      tokens_used: 1500,
    });

    const request = createRequest(validBusinessInput);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.business_stage).toBeDefined();
    expect(['idea', 'building', 'early_traction', 'growing', 'scaling']).toContain(data.business_stage);
  });

  it('should return clarification questions when input is vague', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockClarificationResponse),
      model: 'claude-opus-4.5',
      tokens_used: 800,
    });

    const request = createRequest({
      description: 'Хочу сделать стартап. Будем что-то продавать онлайн, наверное подписки или разовые покупки. Может быть мобильное приложение.',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.needs_clarification).toBe(true);
    expect(data.questions).toBeDefined();
    expect(data.questions.length).toBeGreaterThan(0);
  });

  it('should include gaps and recommendations', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockBusinessCanvasResponse),
      model: 'claude-opus-4.5',
      tokens_used: 1500,
    });

    const request = createRequest(validBusinessInput);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.gaps_in_model) {
      expect(Array.isArray(data.gaps_in_model)).toBe(true);
    }

    if (data.recommendations) {
      expect(Array.isArray(data.recommendations)).toBe(true);
      if (data.recommendations.length > 0) {
        expect(data.recommendations[0]).toHaveProperty('area');
        expect(data.recommendations[0]).toHaveProperty('recommendation');
        expect(data.recommendations[0]).toHaveProperty('priority');
      }
    }
  });

  it('should include proper metadata', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockBusinessCanvasResponse),
      model: 'claude-opus-4.5',
      tokens_used: 1500,
    });

    const request = createRequest(validBusinessInput);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metadata).toBeDefined();
    expect(data.metadata.model_used).toBeDefined();
    expect(data.metadata.tokens_used).toBeGreaterThan(0);
    // In tests, duration might be 0 due to mocking - just check it's defined
    expect(data.metadata.analysis_duration_ms).toBeGreaterThanOrEqual(0);
  });
});

// ===========================================
// Test Suite: Error Handling
// ===========================================

describe('API /api/analyze-business - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle LLM errors gracefully', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('LLM service unavailable'));

    const request = createRequest(validBusinessInput);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should handle invalid LLM response', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: 'not a valid json response',
      model: 'claude-opus-4.5',
      tokens_used: 100,
    });

    const request = createRequest(validBusinessInput);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

// ===========================================
// Test Suite: Social Links
// ===========================================

describe('API /api/analyze-business - Social Links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockBusinessCanvasResponse),
      model: 'claude-opus-4.5',
      tokens_used: 1500,
    });
  });

  it('should accept request with social links', async () => {
    const request = createRequest({
      description: validBusinessInput.description,
      social_links: {
        website: 'https://example.com',
        instagram: 'https://instagram.com/example',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should work without social links', async () => {
    const request = createRequest({
      description: validBusinessInput.description,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
