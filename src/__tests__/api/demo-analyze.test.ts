import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Import real modules
import { GET, POST } from '@/app/api/demo/analyze/route';
import { clearDemoStore } from '@/lib/demo/demo-limiter';

describe('Demo Analyze API', () => {
  beforeEach(() => {
    // Clear demo store between tests
    clearDemoStore();
    // Disable CI bypass for testing actual limiter logic
    vi.stubEnv('CI', '');
    vi.stubEnv('BYPASS_DEMO_LIMIT', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('GET /api/demo/analyze', () => {
    it('should return list of scenarios', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.scenarios)).toBe(true);
      expect(data.scenarios).toHaveLength(3);
    });

    it('should have scenario info fields', async () => {
      const response = await GET();
      const data = await response.json();

      data.scenarios.forEach((scenario: { id: string; name: string; description: string; icon: string; tags: string[] }) => {
        expect(scenario.id).toBeDefined();
        expect(scenario.name).toBeDefined();
        expect(scenario.description).toBeDefined();
        expect(scenario.icon).toBeDefined();
        expect(scenario.tags).toBeDefined();
      });
    });
  });

  describe('POST /api/demo/analyze', () => {
    it('should return demo results for saas scenario', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo/analyze', {
        method: 'POST',
        body: JSON.stringify({ scenarioId: 'saas' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isDemo).toBe(true);
      expect(data.scenarioId).toBe('saas');
      expect(data.scenarioName).toBeDefined();
    });

    it('should return demo results for ecommerce scenario', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo/analyze', {
        method: 'POST',
        body: JSON.stringify({ scenarioId: 'ecommerce' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.scenarioId).toBe('ecommerce');
    });

    it('should return demo results for mobile scenario', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo/analyze', {
        method: 'POST',
        body: JSON.stringify({ scenarioId: 'mobile' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.scenarioId).toBe('mobile');
    });

    it('should return 400 for missing scenarioId', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo/analyze', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('scenarioId');
    });

    it('should return 400 for invalid scenarioId value', async () => {
      // Invalid scenarioId is rejected by schema validation (only 'saas', 'ecommerce', 'mobile' are valid)
      const request = new NextRequest('http://localhost:3000/api/demo/analyze', {
        method: 'POST',
        body: JSON.stringify({ scenarioId: 'nonexistent' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });

    it('should include all result types in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo/analyze', {
        method: 'POST',
        body: JSON.stringify({ scenarioId: 'saas' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.businessResult).toBeDefined();
      expect(data.businessResult.success).toBe(true);
      expect(data.codeResult).toBeDefined();
      expect(data.codeResult.success).toBe(true);
      expect(data.gapResult).toBeDefined();
      expect(data.gapResult.success).toBe(true);
      expect(data.competitorResult).toBeDefined();
      expect(data.competitorResult.success).toBe(true);
    });

    it('should include demo limit info in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo/analyze', {
        method: 'POST',
        body: JSON.stringify({ scenarioId: 'saas' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.demoLimit).toBeDefined();
      expect(typeof data.demoLimit.remaining).toBe('number');
    });

    it('should track demo usage across requests', async () => {
      // First request
      const request1 = new NextRequest('http://localhost:3000/api/demo/analyze', {
        method: 'POST',
        body: JSON.stringify({ scenarioId: 'saas' }),
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.100' },
      });
      const response1 = await POST(request1);
      const data1 = await response1.json();
      expect(data1.demoLimit.remaining).toBe(2);

      // Second request
      const request2 = new NextRequest('http://localhost:3000/api/demo/analyze', {
        method: 'POST',
        body: JSON.stringify({ scenarioId: 'ecommerce' }),
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.100' },
      });
      const response2 = await POST(request2);
      const data2 = await response2.json();
      expect(data2.demoLimit.remaining).toBe(1);
    });
  });
});
