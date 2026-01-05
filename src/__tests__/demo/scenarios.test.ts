import { describe, it, expect } from 'vitest';
import {
  DEMO_SCENARIOS,
  DEMO_SCENARIO_INFO,
  getScenarioById,
  getScenarioInfo,
} from '@/lib/demo/scenarios';
import type { DemoScenarioId } from '@/types/demo';

describe('Demo Scenarios', () => {
  describe('DEMO_SCENARIO_INFO', () => {
    it('should have 3 scenarios defined', () => {
      expect(DEMO_SCENARIO_INFO).toHaveLength(3);
    });

    it('should have saas, ecommerce, and mobile scenarios', () => {
      const ids = DEMO_SCENARIO_INFO.map((s) => s.id);
      expect(ids).toContain('saas');
      expect(ids).toContain('ecommerce');
      expect(ids).toContain('mobile');
    });

    it('each scenario info should have required fields', () => {
      DEMO_SCENARIO_INFO.forEach((info) => {
        expect(info.id).toBeTruthy();
        expect(info.name).toBeTruthy();
        expect(info.description).toBeTruthy();
        expect(info.icon).toBeTruthy();
        expect(Array.isArray(info.tags)).toBe(true);
        expect(info.tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DEMO_SCENARIOS', () => {
    it('should have 3 full scenarios', () => {
      expect(DEMO_SCENARIOS).toHaveLength(3);
    });

    describe('each scenario', () => {
      DEMO_SCENARIOS.forEach((scenario) => {
        describe(`${scenario.id} scenario`, () => {
          it('should have required info fields', () => {
            expect(scenario.id).toBeTruthy();
            expect(scenario.name).toBeTruthy();
            expect(scenario.description).toBeTruthy();
            expect(scenario.icon).toBeTruthy();
            expect(Array.isArray(scenario.tags)).toBe(true);
            expect(scenario.tags.length).toBeGreaterThan(0);
          });

          it('should have valid businessResult', () => {
            expect(scenario.businessResult).toBeDefined();
            expect(scenario.businessResult.success).toBe(true);
            expect(scenario.businessResult.canvas).toBeDefined();
            expect(scenario.businessResult.business_stage).toBeDefined();
          });

          it('should have valid codeResult', () => {
            expect(scenario.codeResult).toBeDefined();
            expect(scenario.codeResult.success).toBe(true);
            expect(scenario.codeResult.analysis).toBeDefined();
            expect(scenario.codeResult.metadata).toBeDefined();
          });

          it('should have valid gapResult', () => {
            expect(scenario.gapResult).toBeDefined();
            expect(scenario.gapResult.success).toBe(true);
            expect(scenario.gapResult.alignment_score).toBeDefined();
            expect(scenario.gapResult.verdict).toBeDefined();
            expect(Array.isArray(scenario.gapResult.gaps)).toBe(true);
          });

          it('should have valid competitorResult', () => {
            expect(scenario.competitorResult).toBeDefined();
            expect(scenario.competitorResult.success).toBe(true);
            expect(Array.isArray(scenario.competitorResult.competitors)).toBe(true);
            expect(scenario.competitorResult.competitors.length).toBeGreaterThan(0);
          });

          it('should have business canvas with all required fields', () => {
            const canvas = scenario.businessResult.canvas;
            expect(canvas.value_proposition).toBeTruthy();
            expect(Array.isArray(canvas.customer_segments)).toBe(true);
            expect(Array.isArray(canvas.channels)).toBe(true);
            expect(Array.isArray(canvas.revenue_streams)).toBe(true);
            expect(Array.isArray(canvas.key_resources)).toBe(true);
            expect(Array.isArray(canvas.key_activities)).toBe(true);
            expect(Array.isArray(canvas.key_partners)).toBe(true);
            expect(Array.isArray(canvas.cost_structure)).toBe(true);
          });

          it('should have code analysis with tech stack', () => {
            const analysis = scenario.codeResult.analysis;
            expect(analysis.project_summary).toBeTruthy();
            expect(analysis.detected_stage).toBeTruthy();
            expect(Array.isArray(analysis.tech_stack)).toBe(true);
            expect(analysis.tech_stack.length).toBeGreaterThan(0);
          });

          it('should have gap analysis with valid score', () => {
            const gap = scenario.gapResult;
            expect(gap.alignment_score).toBeGreaterThanOrEqual(0);
            expect(gap.alignment_score).toBeLessThanOrEqual(100);
            // Verdict can be lowercase or uppercase
            expect(['ON_TRACK', 'ITERATE', 'PIVOT', 'on_track', 'iterate', 'pivot']).toContain(gap.verdict);
            expect(Array.isArray(gap.tasks)).toBe(true);
          });
        });
      });
    });
  });

  describe('getScenarioById', () => {
    it('should return saas scenario', () => {
      const scenario = getScenarioById('saas');
      expect(scenario).toBeDefined();
      expect(scenario?.id).toBe('saas');
      expect(scenario?.name).toContain('SaaS');
    });

    it('should return ecommerce scenario', () => {
      const scenario = getScenarioById('ecommerce');
      expect(scenario).toBeDefined();
      expect(scenario?.id).toBe('ecommerce');
    });

    it('should return mobile scenario', () => {
      const scenario = getScenarioById('mobile');
      expect(scenario).toBeDefined();
      expect(scenario?.id).toBe('mobile');
    });

    it('should return undefined for invalid scenario id', () => {
      const scenario = getScenarioById('invalid' as DemoScenarioId);
      expect(scenario).toBeUndefined();
    });
  });

  describe('getScenarioInfo', () => {
    it('should return all scenario info without results', () => {
      const infos = getScenarioInfo();
      expect(infos).toHaveLength(3);

      infos.forEach((info) => {
        expect(info.id).toBeDefined();
        expect(info.name).toBeDefined();
        expect(info.description).toBeDefined();
        expect(info.icon).toBeDefined();
        expect(info.tags).toBeDefined();
        // Should not have result fields
        expect((info as { businessResult?: unknown }).businessResult).toBeUndefined();
        expect((info as { codeResult?: unknown }).codeResult).toBeUndefined();
      });
    });

    it('should have unique ids', () => {
      const infos = getScenarioInfo();
      const ids = infos.map((i) => i.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(ids.length);
    });
  });
});
