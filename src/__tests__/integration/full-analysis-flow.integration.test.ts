/**
 * Integration tests for Full Analysis Flow - Clarification Handling
 *
 * Critical scenarios tested:
 * - Clarification needed response structure
 * - Question format validation
 * - Partial analysis when clarification needed
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock LLM client with all exports
vi.mock('@/lib/llm/client', () => ({
  sendToLLM: vi.fn().mockResolvedValue({
    content: '{}',
    model: 'claude-sonnet-4',
    tokens_used: 1000,
  }),
  parseAndValidateAnalysisResponse: vi.fn(),
  parseJSONResponse: vi.fn((content: string) => JSON.parse(content)),
  getModelConfig: vi.fn(() => ({ model: 'claude-sonnet-4', maxTokens: 8000, temperature: 0.5 })),
  MODEL_CONFIG: {},
  LLMAnalysisResponseSchema: { safeParse: vi.fn(() => ({ success: true, data: {} })) },
}));

// Mock GitHub fetcher
vi.mock('@/lib/github/fetcher', () => ({
  fetchRepoFiles: vi.fn(),
  getLatestCommitSha: vi.fn(),
}));

// Mock rate limiter
vi.mock('@/lib/utils/rate-limiter', () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 5, resetIn: 60 }),
  getClientIP: () => '127.0.0.1',
  RATE_LIMIT_CONFIG: { maxRequests: 5, windowMs: 60000 },
}));

// Mock cache
vi.mock('@/lib/utils/cache', () => ({
  analysisCache: {
    get: vi.fn(() => null),
    set: vi.fn(),
    delete: vi.fn(),
  },
  AnalysisCache: {
    generateKey: vi.fn(() => 'test-cache-key'),
  },
}));

// Import after mocks
import { POST as analyzeCode } from '@/app/api/analyze/route';
import { parseAndValidateAnalysisResponse, sendToLLM } from '@/lib/llm/client';

// ===========================================
// Test Fixtures
// ===========================================

const fitnessAppFiles = [
  {
    path: 'package.json',
    content: JSON.stringify({
      name: 'fitness-tracker',
      version: '1.0.0',
      dependencies: {
        react: '^18.0.0',
        'react-native': '^0.72.0',
        firebase: '^10.0.0',
      },
    }),
  },
  {
    path: 'src/App.tsx',
    content: `
import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View>
      <Text>Fitness Tracker</Text>
    </View>
  );
}
    `,
  },
];

const mockCodeAnalysisClarification = {
  needs_clarification: true,
  questions: [
    { id: 'q1', question: 'Это фитнес-приложение или что-то другое?', why: 'Код содержит компоненты для тренировок' },
    { id: 'q2', question: 'Какие функции планируется добавить?', why: 'Текущий код минимальный' },
  ],
  partial_analysis: {
    project_summary: 'React Native fitness application',
    tech_stack: ['React Native', 'Firebase'],
    detected_stage: 'mvp',
  },
};

const mockCodeAnalysisComplete = {
  needs_clarification: false,
  analysis: {
    project_summary: 'A React Native fitness tracking app',
    detected_stage: 'mvp',
    tech_stack: ['React Native', 'Firebase', 'TypeScript'],
    strengths: [
      { area: 'Tech Stack', detail: 'Modern mobile framework' },
    ],
    issues: [
      { severity: 'medium', area: 'Features', detail: 'Workout logic not implemented', file_path: 'src/App.tsx' },
    ],
    tasks: [
      {
        title: 'Implement workout tracking',
        description: 'Add workout logic',
        priority: 'high',
        category: 'technical',
        estimated_minutes: 240,
        depends_on: null,
      },
    ],
    next_milestone: 'Complete core workout features',
  },
};

// ===========================================
// Helper Functions
// ===========================================

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/analyze', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ===========================================
// Test Suite: Clarification Required (P1-CRIT-01)
// ===========================================

describe('Full Analysis Flow - Clarification Required', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for sendToLLM
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockCodeAnalysisComplete),
      model: 'claude-sonnet-4',
      tokens_used: 1000,
    });
  });

  it('should return clarification questions when code analysis needs more info', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockCodeAnalysisClarification),
      model: 'claude-sonnet-4',
      tokens_used: 500,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>)
      .mockReturnValue(mockCodeAnalysisClarification);

    const codeReq = createRequest({
      files: fitnessAppFiles,
      project_description: 'Делаем приложение', // Vague description
    });

    const codeRes = await analyzeCode(codeReq);
    const codeData = await codeRes.json();

    expect(codeRes.status).toBe(200);
    expect(codeData.success).toBe(true);

    // CRITICAL: This is what P1-CRIT-01 tests
    expect(codeData.needs_clarification).toBe(true);
    expect(codeData.questions).toBeDefined();
    expect(codeData.questions.length).toBeGreaterThan(0);
    expect(codeData.partial_analysis).toBeDefined();

    // Verify question structure
    const firstQuestion = codeData.questions[0];
    expect(firstQuestion).toHaveProperty('id');
    expect(firstQuestion).toHaveProperty('question');
    expect(firstQuestion).toHaveProperty('why');
  });

  it('should include partial analysis when clarification needed', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockCodeAnalysisClarification),
      model: 'claude-sonnet-4',
      tokens_used: 500,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>)
      .mockReturnValue(mockCodeAnalysisClarification);

    const codeReq = createRequest({
      files: fitnessAppFiles,
      project_description: 'Приложение',
    });

    const codeRes = await analyzeCode(codeReq);
    const codeData = await codeRes.json();

    expect(codeData.needs_clarification).toBe(true);
    expect(codeData.partial_analysis).toBeDefined();
    expect(codeData.partial_analysis.tech_stack).toBeDefined();
    expect(codeData.partial_analysis.detected_stage).toBeDefined();

    // Full analysis should NOT be present
    expect(codeData.analysis).toBeUndefined();
  });

  it('should return full analysis when clarification not needed', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockCodeAnalysisComplete),
      model: 'claude-sonnet-4',
      tokens_used: 1000,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>)
      .mockReturnValue(mockCodeAnalysisComplete);

    const codeReq = createRequest({
      files: fitnessAppFiles,
      project_description: 'Фитнес-приложение для домашних тренировок с персональными программами и отслеживанием прогресса',
    });

    const codeRes = await analyzeCode(codeReq);
    const codeData = await codeRes.json();

    expect(codeRes.status).toBe(200);
    expect(codeData.success).toBe(true);
    expect(codeData.needs_clarification).toBe(false);
    expect(codeData.analysis).toBeDefined();
    expect(codeData.analysis.project_summary).toBeDefined();
    expect(codeData.analysis.tech_stack).toBeDefined();
    expect(codeData.analysis.tasks).toBeDefined();
  });
});

// ===========================================
// Test Suite: Data Validation
// ===========================================

describe('Full Analysis Flow - Data Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate all required fields in clarification response', () => {
    const clarificationResponse = mockCodeAnalysisClarification;

    expect(clarificationResponse.needs_clarification).toBe(true);
    expect(clarificationResponse.questions).toBeDefined();
    expect(Array.isArray(clarificationResponse.questions)).toBe(true);

    for (const q of clarificationResponse.questions) {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('question');
      expect(q).toHaveProperty('why');
      expect(typeof q.question).toBe('string');
      expect(typeof q.why).toBe('string');
    }

    expect(clarificationResponse.partial_analysis).toBeDefined();
    expect(clarificationResponse.partial_analysis).toHaveProperty('tech_stack');
    expect(clarificationResponse.partial_analysis).toHaveProperty('detected_stage');
  });

  it('should validate complete analysis response structure', () => {
    const completeResponse = mockCodeAnalysisComplete;

    expect(completeResponse.needs_clarification).toBe(false);
    expect(completeResponse.analysis).toBeDefined();

    const analysis = completeResponse.analysis;
    expect(analysis).toHaveProperty('project_summary');
    expect(analysis).toHaveProperty('detected_stage');
    expect(analysis).toHaveProperty('tech_stack');
    expect(analysis).toHaveProperty('strengths');
    expect(analysis).toHaveProperty('issues');
    expect(analysis).toHaveProperty('tasks');
    expect(analysis).toHaveProperty('next_milestone');

    // Validate arrays
    expect(Array.isArray(analysis.tech_stack)).toBe(true);
    expect(Array.isArray(analysis.strengths)).toBe(true);
    expect(Array.isArray(analysis.issues)).toBe(true);
    expect(Array.isArray(analysis.tasks)).toBe(true);
  });

  it('should validate task structure in complete analysis', () => {
    const analysis = mockCodeAnalysisComplete.analysis;

    for (const task of analysis.tasks) {
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('description');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('category');
      expect(task).toHaveProperty('estimated_minutes');
      expect(task).toHaveProperty('depends_on');

      expect(['high', 'medium', 'low']).toContain(task.priority);
      expect(['documentation', 'technical', 'product', 'marketing', 'business']).toContain(task.category);
      expect(typeof task.estimated_minutes).toBe('number');
    }
  });
});

// ===========================================
// Test Suite: Edge Cases
// ===========================================

describe('Full Analysis Flow - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for sendToLLM
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockCodeAnalysisComplete),
      model: 'claude-sonnet-4',
      tokens_used: 1000,
    });
  });

  it('should handle empty questions array with needs_clarification true', async () => {
    const responseWithEmptyQuestions = {
      needs_clarification: true,
      questions: [],
      partial_analysis: {
        project_summary: 'Unknown project',
        tech_stack: [],
        detected_stage: 'unknown',
      },
    };

    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(responseWithEmptyQuestions),
      model: 'claude-sonnet-4',
      tokens_used: 300,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>)
      .mockReturnValue(responseWithEmptyQuestions);

    const codeReq = createRequest({
      files: fitnessAppFiles,
      project_description: 'Приложение',
    });

    const codeRes = await analyzeCode(codeReq);
    const codeData = await codeRes.json();

    expect(codeRes.status).toBe(200);
    expect(codeData.needs_clarification).toBe(true);
    expect(codeData.questions).toEqual([]);
  });

  it('should handle minimal valid project description', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockCodeAnalysisComplete),
      model: 'claude-sonnet-4',
      tokens_used: 1000,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>)
      .mockReturnValue(mockCodeAnalysisComplete);

    const codeReq = createRequest({
      files: fitnessAppFiles,
      project_description: 'A', // Minimal but valid (just needs to be non-empty based on schema)
    });

    const codeRes = await analyzeCode(codeReq);

    // Should not fail due to project description
    expect(codeRes.status).toBe(200);
  });

  it('should handle project with detected stage unknown', () => {
    const unknownStageResponse = {
      needs_clarification: false,
      analysis: {
        ...mockCodeAnalysisComplete.analysis,
        detected_stage: 'unknown',
      },
    };

    expect(unknownStageResponse.analysis.detected_stage).toBe('unknown');
    expect(['documentation', 'mvp', 'launched', 'growing', 'unknown']).toContain(unknownStageResponse.analysis.detected_stage);
  });
});
