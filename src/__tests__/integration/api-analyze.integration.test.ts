/**
 * Integration tests for /api/analyze (Code Analysis)
 *
 * These tests verify the full API flow:
 * - Request validation
 * - File processing
 * - LLM integration (mocked)
 * - Response structure
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the entire LLM client module with all exports
vi.mock('@/lib/llm/client', () => ({
  sendToLLM: vi.fn(),
  parseAndValidateAnalysisResponse: vi.fn(),
  parseJSONResponse: vi.fn(),
  getModelConfig: vi.fn(() => ({ model: 'claude-sonnet-4', maxTokens: 8000, temperature: 0.5 })),
  MODEL_CONFIG: {},
  LLMAnalysisResponseSchema: { safeParse: vi.fn(() => ({ success: true, data: {} })) },
}));

// Mock GitHub fetcher
vi.mock('@/lib/github/fetcher', () => ({
  fetchRepoFiles: vi.fn(),
  getLatestCommitSha: vi.fn(),
}));

// Mock rate limiter to always allow in tests
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
import { POST } from '@/app/api/analyze/route';
import { sendToLLM, parseAndValidateAnalysisResponse } from '@/lib/llm/client';
import { fetchRepoFiles, getLatestCommitSha } from '@/lib/github/fetcher';

// ===========================================
// Test Fixtures
// ===========================================

const validFilesInput = [
  {
    path: 'package.json',
    content: JSON.stringify({
      name: 'test-app',
      version: '1.0.0',
      dependencies: { express: '^4.18.0' },
    }),
  },
  {
    path: 'index.js',
    content: `
const express = require('express');
const app = express();
app.get('/', (req, res) => res.json({ message: 'Hello' }));
app.listen(3000);
    `,
  },
];

const mockLLMAnalysisResponse = {
  needs_clarification: false,
  analysis: {
    project_summary: 'A simple Express.js API server',
    detected_stage: 'mvp',
    tech_stack: ['Express.js', 'Node.js'],
    strengths: [
      { area: 'Simplicity', detail: 'Clean and minimal codebase' },
    ],
    issues: [
      { severity: 'medium', area: 'Security', detail: 'No rate limiting', file_path: null },
    ],
    tasks: [
      {
        title: 'Add rate limiting',
        description: 'Implement rate limiting to prevent abuse',
        priority: 'high',
        category: 'technical',
        estimated_minutes: 60,
        depends_on: null,
      },
    ],
    next_milestone: 'Launch MVP with basic API protection',
  },
};

const mockLLMClarificationResponse = {
  needs_clarification: true,
  questions: [
    { id: 'q1', question: 'What is your target audience?', why: 'To provide relevant recommendations' },
    { id: 'q2', question: 'What is your monetization strategy?', why: 'To identify business gaps' },
  ],
  partial_analysis: {
    project_summary: 'Express.js application',
    tech_stack: ['Express.js', 'Node.js'],
    detected_stage: 'mvp',
  },
};

// ===========================================
// Helper Functions
// ===========================================

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/analyze', {
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

describe('API /api/analyze - Request Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockLLMAnalysisResponse),
      model: 'claude-sonnet-4',
      tokens_used: 1000,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockLLMAnalysisResponse);
  });

  it('should reject request without files or repo_url', async () => {
    const request = createRequest({
      project_description: 'Test project description for the API server',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Either files or repo_url must be provided');
  });

  it('should reject request without project_description', async () => {
    const request = createRequest({
      files: validFilesInput,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    // Error message can be "Required" or more specific
    expect(data.error).toBeDefined();
  });

  it('should reject request with invalid repo_url', async () => {
    const request = createRequest({
      repo_url: 'not-a-valid-url',
      project_description: 'Test project',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should accept valid request with files', async () => {
    const request = createRequest({
      files: validFilesInput,
      project_description: 'A simple Express.js API server for handling HTTP requests',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

// ===========================================
// Test Suite: Analysis Flow
// ===========================================

describe('API /api/analyze - Analysis Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return full analysis when no clarification needed', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockLLMAnalysisResponse),
      model: 'claude-sonnet-4',
      tokens_used: 1000,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockLLMAnalysisResponse);

    const request = createRequest({
      files: validFilesInput,
      project_description: 'A simple Express.js API server for handling HTTP requests',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.needs_clarification).toBe(false);
    expect(data.analysis).toBeDefined();
    expect(data.analysis.project_summary).toBe('A simple Express.js API server');
    expect(data.analysis.tech_stack).toContain('Express.js');
  });

  it('should return clarification questions when needed', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockLLMClarificationResponse),
      model: 'claude-sonnet-4',
      tokens_used: 500,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockLLMClarificationResponse);

    const request = createRequest({
      files: validFilesInput,
      project_description: 'A simple app', // Vague description
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.needs_clarification).toBe(true);
    expect(data.questions).toBeDefined();
    expect(data.questions.length).toBeGreaterThan(0);
    expect(data.partial_analysis).toBeDefined();
    expect(data.partial_analysis.tech_stack).toContain('Express.js');
  });

  it('should include security analysis', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockLLMAnalysisResponse),
      model: 'claude-sonnet-4',
      tokens_used: 1000,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockLLMAnalysisResponse);

    const request = createRequest({
      files: validFilesInput,
      project_description: 'A simple Express.js API server',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.security_analysis).toBeDefined();
    // Security analysis has 'stats' and 'findings' properties
    expect(data.security_analysis).toHaveProperty('findings');
  });

  it('should include proper metadata', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockLLMAnalysisResponse),
      model: 'claude-sonnet-4',
      tokens_used: 1000,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockLLMAnalysisResponse);

    const request = createRequest({
      files: validFilesInput,
      project_description: 'A simple Express.js API server',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metadata).toBeDefined();
    expect(data.metadata.files_analyzed).toBe(2);
    expect(data.metadata.model_used).toBe('claude-sonnet-4');
    expect(data.metadata.tokens_used).toBe(1000);
    expect(data.metadata.analysis_duration_ms).toBeGreaterThan(0);
  });
});

// ===========================================
// Test Suite: GitHub Integration
// ===========================================

describe('API /api/analyze - GitHub Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockLLMAnalysisResponse),
      model: 'claude-sonnet-4',
      tokens_used: 1000,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockLLMAnalysisResponse);
  });

  it('should fetch files from GitHub repo', async () => {
    (fetchRepoFiles as ReturnType<typeof vi.fn>).mockResolvedValue(validFilesInput);
    (getLatestCommitSha as ReturnType<typeof vi.fn>).mockResolvedValue('abc123');

    const request = createRequest({
      repo_url: 'https://github.com/test/repo',
      project_description: 'A test repository',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(fetchRepoFiles).toHaveBeenCalledWith('https://github.com/test/repo', undefined);
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should handle GitHub fetch errors', async () => {
    (fetchRepoFiles as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Repository not found'));
    (getLatestCommitSha as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = createRequest({
      repo_url: 'https://github.com/nonexistent/repo',
      project_description: 'A test repository',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Repository not found');
  });

  it('should pass access token for private repos', async () => {
    (fetchRepoFiles as ReturnType<typeof vi.fn>).mockResolvedValue(validFilesInput);
    (getLatestCommitSha as ReturnType<typeof vi.fn>).mockResolvedValue('abc123');

    const request = createRequest({
      repo_url: 'https://github.com/private/repo',
      access_token: 'ghp_test123',
      project_description: 'A private repository',
    });

    await POST(request);

    expect(fetchRepoFiles).toHaveBeenCalledWith('https://github.com/private/repo', 'ghp_test123');
  });
});

// ===========================================
// Test Suite: Error Handling
// ===========================================

describe('API /api/analyze - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle LLM errors gracefully', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('LLM service unavailable'));

    const request = createRequest({
      files: validFilesInput,
      project_description: 'A simple Express.js API server',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('LLM service unavailable');
  });

  it('should handle LLM parse errors', async () => {
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: 'invalid json',
      model: 'claude-sonnet-4',
      tokens_used: 100,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Invalid JSON response');
    });

    const request = createRequest({
      files: validFilesInput,
      project_description: 'A simple Express.js API server',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Failed to parse LLM response');
  });

  it('should handle empty files array', async () => {
    const request = createRequest({
      files: [],
      project_description: 'An empty project',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('No files found to analyze');
  });
});

// ===========================================
// Test Suite: User Context
// ===========================================

describe('API /api/analyze - User Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sendToLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify(mockLLMAnalysisResponse),
      model: 'claude-sonnet-4',
      tokens_used: 1000,
    });
    (parseAndValidateAnalysisResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockLLMAnalysisResponse);
  });

  it('should accept user context in request', async () => {
    const request = createRequest({
      files: validFilesInput,
      project_description: 'A simple Express.js API server',
      user_context: {
        current_week: 2,
        previous_tasks_completed: ['Setup project', 'Add basic routes'],
        user_goal: 'Launch MVP by end of month',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(sendToLLM).toHaveBeenCalled();
  });

  it('should work without user context', async () => {
    const request = createRequest({
      files: validFilesInput,
      project_description: 'A simple Express.js API server',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
