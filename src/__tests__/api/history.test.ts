import { describe, it, expect, vi, beforeEach } from 'vitest';

// ===========================================
// History API Types Tests
// ===========================================

describe('History API Types', () => {
  describe('HistoryEntry interface', () => {
    it('should have correct structure', () => {
      const entry = {
        id: 'uuid-123',
        version: 1,
        type: 'full' as const,
        created_at: '2024-01-01T00:00:00Z',
        alignment_score: 75,
        summary: 'Test summary',
        label: 'v1.0 Release',
        metadata: { key: 'value' },
      };

      expect(entry.id).toBe('uuid-123');
      expect(entry.version).toBe(1);
      expect(entry.type).toBe('full');
      expect(entry.alignment_score).toBe(75);
      expect(entry.summary).toBe('Test summary');
      expect(entry.label).toBe('v1.0 Release');
    });

    it('should allow nullable version', () => {
      const entry = {
        id: 'uuid-123',
        version: null,
        type: 'code' as const,
        created_at: '2024-01-01T00:00:00Z',
        alignment_score: null,
        summary: null,
        label: null,
        metadata: null,
      };

      expect(entry.version).toBeNull();
      expect(entry.alignment_score).toBeNull();
      expect(entry.summary).toBeNull();
      expect(entry.label).toBeNull();
    });

    it('should support all analysis types', () => {
      const types = ['code', 'business', 'competitor', 'full'] as const;

      types.forEach((type) => {
        const entry = {
          id: 'test',
          version: 1,
          type,
          created_at: '2024-01-01T00:00:00Z',
          alignment_score: null,
          summary: null,
          label: null,
          metadata: null,
        };
        expect(entry.type).toBe(type);
      });
    });
  });

  describe('HistoryResponse interface', () => {
    it('should have history array and total count', () => {
      const response = {
        history: [
          {
            id: 'uuid-1',
            version: 1,
            type: 'full' as const,
            created_at: '2024-01-01T00:00:00Z',
            alignment_score: 75,
            summary: 'First analysis',
            label: null,
            metadata: null,
          },
          {
            id: 'uuid-2',
            version: 2,
            type: 'full' as const,
            created_at: '2024-01-02T00:00:00Z',
            alignment_score: 82,
            summary: 'Second analysis',
            label: 'After fixes',
            metadata: null,
          },
        ],
        total: 2,
      };

      expect(response.history).toHaveLength(2);
      expect(response.total).toBe(2);
      expect(response.history[0].version).toBe(1);
      expect(response.history[1].version).toBe(2);
    });

    it('should handle empty history', () => {
      const response = {
        history: [],
        total: 0,
      };

      expect(response.history).toHaveLength(0);
      expect(response.total).toBe(0);
    });
  });

  describe('CompareResponse interface', () => {
    it('should have version1 and version2', () => {
      const response = {
        version1: {
          id: 'uuid-1',
          version: 1,
          type: 'full',
          created_at: '2024-01-01T00:00:00Z',
          result: { alignment_score: 65, gaps: [] },
          alignment_score: 65,
          summary: 'Initial',
          label: null,
        },
        version2: {
          id: 'uuid-2',
          version: 2,
          type: 'full',
          created_at: '2024-01-02T00:00:00Z',
          result: { alignment_score: 78, gaps: [] },
          alignment_score: 78,
          summary: 'Improved',
          label: 'After refactor',
        },
      };

      expect(response.version1).not.toBeNull();
      expect(response.version2).not.toBeNull();
      expect(response.version1?.alignment_score).toBe(65);
      expect(response.version2?.alignment_score).toBe(78);
    });

    it('should handle missing versions', () => {
      const response = {
        version1: null,
        version2: {
          id: 'uuid-2',
          version: 2,
          type: 'full',
          created_at: '2024-01-02T00:00:00Z',
          result: {},
          alignment_score: 78,
          summary: null,
          label: null,
        },
      };

      expect(response.version1).toBeNull();
      expect(response.version2).not.toBeNull();
    });
  });
});

// ===========================================
// History Query Params Tests
// ===========================================

describe('History Query Params', () => {
  describe('type filter', () => {
    it('should accept valid type values', () => {
      const validTypes = ['code', 'business', 'competitor', 'full'];

      validTypes.forEach((type) => {
        const params = new URLSearchParams();
        params.set('type', type);
        expect(params.get('type')).toBe(type);
      });
    });

    it('should be optional', () => {
      const params = new URLSearchParams();
      expect(params.get('type')).toBeNull();
    });
  });

  describe('pagination', () => {
    it('should accept limit and offset', () => {
      const params = new URLSearchParams();
      params.set('limit', '10');
      params.set('offset', '20');

      expect(params.get('limit')).toBe('10');
      expect(params.get('offset')).toBe('20');
    });

    it('should have defaults', () => {
      const params = new URLSearchParams();
      const limit = parseInt(params.get('limit') || '20', 10);
      const offset = parseInt(params.get('offset') || '0', 10);

      expect(limit).toBe(20);
      expect(offset).toBe(0);
    });
  });

  describe('compare', () => {
    it('should accept version pairs', () => {
      const params = new URLSearchParams();
      params.set('compare', '1,2');

      const compare = params.get('compare');
      expect(compare).toBe('1,2');

      const versions = compare?.split(',').map((v) => parseInt(v, 10));
      expect(versions).toEqual([1, 2]);
    });

    it('should parse multiple digit versions', () => {
      const params = new URLSearchParams();
      params.set('compare', '10,25');

      const versions = params.get('compare')?.split(',').map((v) => parseInt(v, 10));
      expect(versions).toEqual([10, 25]);
    });
  });
});

// ===========================================
// Version Increment Logic Tests
// ===========================================

describe('Version Increment Logic', () => {
  it('should increment version per project', () => {
    const projectAnalyses = [
      { project_id: 'p1', version: 1 },
      { project_id: 'p1', version: 2 },
      { project_id: 'p2', version: 1 },
      { project_id: 'p1', version: 3 },
    ];

    const p1Versions = projectAnalyses.filter((a) => a.project_id === 'p1').map((a) => a.version);
    const p2Versions = projectAnalyses.filter((a) => a.project_id === 'p2').map((a) => a.version);

    expect(p1Versions).toEqual([1, 2, 3]);
    expect(p2Versions).toEqual([1]);
  });

  it('should calculate next version correctly', () => {
    const existingVersions = [1, 2, 3];
    const maxVersion = Math.max(...existingVersions, 0);
    const nextVersion = maxVersion + 1;

    expect(nextVersion).toBe(4);
  });

  it('should handle empty versions', () => {
    const existingVersions: number[] = [];
    const maxVersion = Math.max(...existingVersions, 0);
    const nextVersion = maxVersion + 1;

    expect(nextVersion).toBe(1);
  });
});

// ===========================================
// Score Extraction Tests
// ===========================================

describe('Score Extraction', () => {
  it('should extract alignment_score from gap result', () => {
    const result = {
      alignment_score: 72,
      gaps: [],
      verdict: 'ON_TRACK',
    };

    const extractedScore = result.alignment_score;
    expect(extractedScore).toBe(72);
  });

  it('should handle missing alignment_score', () => {
    const result = {
      gaps: [],
      verdict: 'ITERATE',
    };

    const extractedScore = (result as { alignment_score?: number }).alignment_score ?? null;
    expect(extractedScore).toBeNull();
  });

  it('should extract summary from result', () => {
    const result = {
      summary: 'Good progress on monetization',
      alignment_score: 65,
    };

    const summary = result.summary;
    expect(summary).toBe('Good progress on monetization');
  });

  it('should fallback to verdict_explanation', () => {
    const result = {
      verdict_explanation: 'Project needs improvement in security',
      alignment_score: 45,
    };

    const summary = (result as { summary?: string }).summary || result.verdict_explanation;
    expect(summary).toBe('Project needs improvement in security');
  });
});

// ===========================================
// Label Update Tests
// ===========================================

describe('Label Update', () => {
  it('should accept valid label', () => {
    const update = {
      analysis_id: 'uuid-123',
      label: 'v1.0 Release',
    };

    expect(update.analysis_id).toBe('uuid-123');
    expect(update.label).toBe('v1.0 Release');
  });

  it('should accept empty label to clear', () => {
    const update = {
      analysis_id: 'uuid-123',
      label: '',
    };

    expect(update.label).toBe('');
  });

  it('should accept null label', () => {
    const update = {
      analysis_id: 'uuid-123',
      label: null as string | null,
    };

    expect(update.label).toBeNull();
  });

  it('should require analysis_id', () => {
    const isValid = (update: { analysis_id?: string; label: string }) => {
      return !!update.analysis_id;
    };

    expect(isValid({ label: 'test' })).toBe(false);
    expect(isValid({ analysis_id: 'uuid', label: 'test' })).toBe(true);
  });
});

// ===========================================
// History Sorting Tests
// ===========================================

describe('History Sorting', () => {
  it('should sort by created_at descending (newest first)', () => {
    const history = [
      { created_at: '2024-01-03T00:00:00Z', version: 3 },
      { created_at: '2024-01-01T00:00:00Z', version: 1 },
      { created_at: '2024-01-02T00:00:00Z', version: 2 },
    ];

    const sorted = [...history].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    expect(sorted[0].version).toBe(3);
    expect(sorted[1].version).toBe(2);
    expect(sorted[2].version).toBe(1);
  });

  it('should filter by type', () => {
    const history = [
      { type: 'full', version: 1 },
      { type: 'code', version: 2 },
      { type: 'full', version: 3 },
      { type: 'business', version: 4 },
    ];

    const fullOnly = history.filter((h) => h.type === 'full');
    expect(fullOnly).toHaveLength(2);
    expect(fullOnly.map((h) => h.version)).toEqual([1, 3]);
  });
});
