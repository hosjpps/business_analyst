import { describe, it, expect } from 'vitest';

// ===========================================
// VersionDiff Helper Functions Tests
// ===========================================

function getScoreColor(score: number | null): string {
  if (score === null) return 'var(--text-tertiary)';
  if (score >= 70) return 'var(--accent-green)';
  if (score >= 40) return 'var(--accent-yellow)';
  return 'var(--accent-red)';
}

function getScoreDelta(
  oldScore: number | null,
  newScore: number | null
): { delta: number; color: string; icon: string } {
  if (oldScore === null || newScore === null) {
    return { delta: 0, color: 'var(--text-tertiary)', icon: '—' };
  }
  const delta = newScore - oldScore;
  if (delta > 0) return { delta, color: 'var(--accent-green)', icon: '▲' };
  if (delta < 0) return { delta, color: 'var(--accent-red)', icon: '▼' };
  return { delta: 0, color: 'var(--text-tertiary)', icon: '=' };
}

describe('VersionDiff Helpers', () => {
  describe('getScoreColor', () => {
    it('should return tertiary for null', () => {
      expect(getScoreColor(null)).toBe('var(--text-tertiary)');
    });

    it('should return green for high scores', () => {
      expect(getScoreColor(70)).toBe('var(--accent-green)');
      expect(getScoreColor(100)).toBe('var(--accent-green)');
    });

    it('should return yellow for medium scores', () => {
      expect(getScoreColor(40)).toBe('var(--accent-yellow)');
      expect(getScoreColor(69)).toBe('var(--accent-yellow)');
    });

    it('should return red for low scores', () => {
      expect(getScoreColor(0)).toBe('var(--accent-red)');
      expect(getScoreColor(39)).toBe('var(--accent-red)');
    });
  });

  describe('getScoreDelta', () => {
    it('should return positive delta with green', () => {
      const result = getScoreDelta(50, 75);
      expect(result.delta).toBe(25);
      expect(result.color).toBe('var(--accent-green)');
      expect(result.icon).toBe('▲');
    });

    it('should return negative delta with red', () => {
      const result = getScoreDelta(75, 50);
      expect(result.delta).toBe(-25);
      expect(result.color).toBe('var(--accent-red)');
      expect(result.icon).toBe('▼');
    });

    it('should return zero delta with tertiary', () => {
      const result = getScoreDelta(60, 60);
      expect(result.delta).toBe(0);
      expect(result.color).toBe('var(--text-tertiary)');
      expect(result.icon).toBe('=');
    });

    it('should handle null old score', () => {
      const result = getScoreDelta(null, 75);
      expect(result.delta).toBe(0);
      expect(result.icon).toBe('—');
    });

    it('should handle null new score', () => {
      const result = getScoreDelta(50, null);
      expect(result.delta).toBe(0);
      expect(result.icon).toBe('—');
    });

    it('should handle both null', () => {
      const result = getScoreDelta(null, null);
      expect(result.delta).toBe(0);
      expect(result.icon).toBe('—');
    });
  });
});

// ===========================================
// Key Field Extraction Tests
// ===========================================

describe('Key Field Extraction', () => {
  function extractKeyFields(result: Record<string, unknown>): Record<string, unknown> {
    const fields: Record<string, unknown> = {};

    // Gap analysis fields
    if ('alignment_score' in result) fields.alignment_score = result.alignment_score;
    if ('verdict' in result) fields.verdict = result.verdict;
    if ('verdict_explanation' in result) fields.verdict_explanation = result.verdict_explanation;
    if ('gaps' in result && Array.isArray(result.gaps)) {
      fields.gaps_count = result.gaps.length;
      fields.critical_gaps = result.gaps.filter(
        (g: Record<string, unknown>) => g.type === 'critical'
      ).length;
      fields.warning_gaps = result.gaps.filter(
        (g: Record<string, unknown>) => g.type === 'warning'
      ).length;
    }
    if ('tasks' in result && Array.isArray(result.tasks)) {
      fields.tasks_count = result.tasks.length;
    }
    if ('strengths' in result && Array.isArray(result.strengths)) {
      fields.strengths = result.strengths;
    }

    // Business canvas fields
    if ('canvas' in result) {
      const canvas = result.canvas as Record<string, unknown>;
      fields.value_proposition = canvas.value_proposition;
    }
    if ('business_stage' in result) fields.business_stage = result.business_stage;

    return fields;
  }

  it('should extract alignment_score', () => {
    const result = { alignment_score: 72 };
    const fields = extractKeyFields(result);
    expect(fields.alignment_score).toBe(72);
  });

  it('should extract verdict', () => {
    const result = { verdict: 'ON_TRACK' };
    const fields = extractKeyFields(result);
    expect(fields.verdict).toBe('ON_TRACK');
  });

  it('should count gaps', () => {
    const result = {
      gaps: [
        { type: 'critical', title: 'Gap 1' },
        { type: 'warning', title: 'Gap 2' },
        { type: 'critical', title: 'Gap 3' },
        { type: 'info', title: 'Gap 4' },
      ],
    };
    const fields = extractKeyFields(result);
    expect(fields.gaps_count).toBe(4);
    expect(fields.critical_gaps).toBe(2);
    expect(fields.warning_gaps).toBe(1);
  });

  it('should count tasks', () => {
    const result = {
      tasks: [{ title: 'Task 1' }, { title: 'Task 2' }, { title: 'Task 3' }],
    };
    const fields = extractKeyFields(result);
    expect(fields.tasks_count).toBe(3);
  });

  it('should extract canvas fields', () => {
    const result = {
      canvas: {
        value_proposition: 'Best product ever',
      },
    };
    const fields = extractKeyFields(result);
    expect(fields.value_proposition).toBe('Best product ever');
  });

  it('should extract business_stage', () => {
    const result = { business_stage: 'growth' };
    const fields = extractKeyFields(result);
    expect(fields.business_stage).toBe('growth');
  });

  it('should handle empty result', () => {
    const result = {};
    const fields = extractKeyFields(result);
    expect(Object.keys(fields)).toHaveLength(0);
  });
});

// ===========================================
// Diff Generation Tests
// ===========================================

describe('Diff Generation', () => {
  interface DiffItem {
    field: string;
    label: string;
    oldValue: string | number | null;
    newValue: string | number | null;
    type: 'added' | 'removed' | 'changed' | 'unchanged';
  }

  function generateDiffItems(
    oldFields: Record<string, unknown>,
    newFields: Record<string, unknown>
  ): DiffItem[] {
    const allKeys = new Set([...Object.keys(oldFields), ...Object.keys(newFields)]);
    const items: DiffItem[] = [];

    const fieldLabels: Record<string, string> = {
      alignment_score: 'Alignment Score',
      verdict: 'Вердикт',
      gaps_count: 'Количество разрывов',
      tasks_count: 'Количество задач',
    };

    for (const key of allKeys) {
      const oldVal = oldFields[key];
      const newVal = newFields[key];

      const formatValue = (val: unknown): string | number | null => {
        if (val === undefined || val === null) return null;
        if (Array.isArray(val)) {
          if (val.length === 0) return null;
          if (typeof val[0] === 'string') return val.join(', ');
          return `${val.length} элементов`;
        }
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      };

      const oldFormatted = formatValue(oldVal);
      const newFormatted = formatValue(newVal);

      let type: DiffItem['type'] = 'unchanged';
      if (oldFormatted === null && newFormatted !== null) type = 'added';
      else if (oldFormatted !== null && newFormatted === null) type = 'removed';
      else if (oldFormatted !== newFormatted) type = 'changed';

      items.push({
        field: key,
        label: fieldLabels[key] || key,
        oldValue: oldFormatted,
        newValue: newFormatted,
        type,
      });
    }

    // Sort by importance
    const typeOrder = { changed: 0, added: 1, removed: 2, unchanged: 3 };
    return items.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
  }

  it('should detect added fields', () => {
    const oldFields = { alignment_score: 65 };
    const newFields = { alignment_score: 65, verdict: 'ON_TRACK' };

    const diff = generateDiffItems(oldFields, newFields);
    const addedItem = diff.find((d) => d.field === 'verdict');

    expect(addedItem).toBeDefined();
    expect(addedItem?.type).toBe('added');
    expect(addedItem?.oldValue).toBeNull();
    expect(addedItem?.newValue).toBe('ON_TRACK');
  });

  it('should detect removed fields', () => {
    const oldFields = { alignment_score: 65, verdict: 'ITERATE' };
    const newFields = { alignment_score: 65 };

    const diff = generateDiffItems(oldFields, newFields);
    const removedItem = diff.find((d) => d.field === 'verdict');

    expect(removedItem).toBeDefined();
    expect(removedItem?.type).toBe('removed');
    expect(removedItem?.oldValue).toBe('ITERATE');
    expect(removedItem?.newValue).toBeNull();
  });

  it('should detect changed fields', () => {
    const oldFields = { alignment_score: 65 };
    const newFields = { alignment_score: 78 };

    const diff = generateDiffItems(oldFields, newFields);
    const changedItem = diff.find((d) => d.field === 'alignment_score');

    expect(changedItem).toBeDefined();
    expect(changedItem?.type).toBe('changed');
    expect(changedItem?.oldValue).toBe('65');
    expect(changedItem?.newValue).toBe('78');
  });

  it('should detect unchanged fields', () => {
    const oldFields = { alignment_score: 65 };
    const newFields = { alignment_score: 65 };

    const diff = generateDiffItems(oldFields, newFields);
    const unchangedItem = diff.find((d) => d.field === 'alignment_score');

    expect(unchangedItem).toBeDefined();
    expect(unchangedItem?.type).toBe('unchanged');
  });

  it('should sort by importance (changed first)', () => {
    const oldFields = {
      unchanged: 'same',
      changed: 'old',
      removed: 'value',
    };
    const newFields = {
      unchanged: 'same',
      changed: 'new',
      added: 'value',
    };

    const diff = generateDiffItems(oldFields, newFields);

    expect(diff[0].type).toBe('changed');
    expect(diff[1].type).toBe('added');
    expect(diff[2].type).toBe('removed');
    expect(diff[3].type).toBe('unchanged');
  });

  it('should format arrays correctly', () => {
    const oldFields = { strengths: ['A', 'B'] };
    const newFields = { strengths: ['A', 'B', 'C'] };

    const diff = generateDiffItems(oldFields, newFields);
    const item = diff.find((d) => d.field === 'strengths');

    expect(item?.oldValue).toBe('A, B');
    expect(item?.newValue).toBe('A, B, C');
    expect(item?.type).toBe('changed');
  });

  it('should handle empty arrays as null', () => {
    const oldFields = { strengths: [] };
    const newFields = { strengths: ['A'] };

    const diff = generateDiffItems(oldFields, newFields);
    const item = diff.find((d) => d.field === 'strengths');

    expect(item?.oldValue).toBeNull();
    expect(item?.newValue).toBe('A');
    expect(item?.type).toBe('added');
  });
});

// ===========================================
// View Mode Tests
// ===========================================

describe('View Mode', () => {
  type ViewMode = 'side-by-side' | 'unified';

  it('should support side-by-side mode', () => {
    const mode: ViewMode = 'side-by-side';
    expect(mode).toBe('side-by-side');
  });

  it('should support unified mode', () => {
    const mode: ViewMode = 'unified';
    expect(mode).toBe('unified');
  });

  it('should toggle between modes', () => {
    let mode: ViewMode = 'side-by-side';
    mode = mode === 'side-by-side' ? 'unified' : 'side-by-side';
    expect(mode).toBe('unified');

    mode = mode === 'side-by-side' ? 'unified' : 'side-by-side';
    expect(mode).toBe('side-by-side');
  });
});

// ===========================================
// Filter Unchanged Tests
// ===========================================

describe('Filter Unchanged', () => {
  interface DiffItem {
    field: string;
    type: 'added' | 'removed' | 'changed' | 'unchanged';
  }

  const items: DiffItem[] = [
    { field: 'score', type: 'changed' },
    { field: 'verdict', type: 'unchanged' },
    { field: 'gaps', type: 'added' },
    { field: 'stage', type: 'unchanged' },
  ];

  it('should filter out unchanged when showUnchanged is false', () => {
    const showUnchanged = false;
    const filtered = showUnchanged ? items : items.filter((i) => i.type !== 'unchanged');

    expect(filtered).toHaveLength(2);
    expect(filtered.map((i) => i.field)).toEqual(['score', 'gaps']);
  });

  it('should show all when showUnchanged is true', () => {
    const showUnchanged = true;
    const filtered = showUnchanged ? items : items.filter((i) => i.type !== 'unchanged');

    expect(filtered).toHaveLength(4);
  });
});

// ===========================================
// Summary Stats Tests
// ===========================================

describe('Summary Stats', () => {
  interface DiffItem {
    type: 'added' | 'removed' | 'changed' | 'unchanged';
  }

  function calculateStats(items: DiffItem[]): {
    changed: number;
    added: number;
    removed: number;
  } {
    return {
      changed: items.filter((i) => i.type === 'changed').length,
      added: items.filter((i) => i.type === 'added').length,
      removed: items.filter((i) => i.type === 'removed').length,
    };
  }

  it('should count changed items', () => {
    const items: DiffItem[] = [
      { type: 'changed' },
      { type: 'changed' },
      { type: 'unchanged' },
    ];
    expect(calculateStats(items).changed).toBe(2);
  });

  it('should count added items', () => {
    const items: DiffItem[] = [
      { type: 'added' },
      { type: 'added' },
      { type: 'added' },
    ];
    expect(calculateStats(items).added).toBe(3);
  });

  it('should count removed items', () => {
    const items: DiffItem[] = [{ type: 'removed' }, { type: 'unchanged' }];
    expect(calculateStats(items).removed).toBe(1);
  });

  it('should handle empty array', () => {
    const stats = calculateStats([]);
    expect(stats.changed).toBe(0);
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(0);
  });

  it('should handle all unchanged', () => {
    const items: DiffItem[] = [
      { type: 'unchanged' },
      { type: 'unchanged' },
    ];
    const stats = calculateStats(items);
    expect(stats.changed).toBe(0);
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(0);
  });
});
