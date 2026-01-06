import { describe, it, expect } from 'vitest';

// ===========================================
// AnalysisTimeline Helper Functions Tests
// ===========================================

// Helper functions extracted for testing
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'full':
      return 'Полный анализ';
    case 'code':
      return 'Анализ кода';
    case 'business':
      return 'Бизнес-анализ';
    case 'competitor':
      return 'Конкуренты';
    default:
      return type;
  }
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'full':
      return '🎯';
    case 'code':
      return '💻';
    case 'business':
      return '💼';
    case 'competitor':
      return '📊';
    default:
      return '📋';
  }
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'var(--text-tertiary)';
  if (score >= 70) return 'var(--accent-green)';
  if (score >= 40) return 'var(--accent-yellow)';
  return 'var(--accent-red)';
}

describe('AnalysisTimeline Helpers', () => {
  describe('formatDate', () => {
    it('should format date in Russian locale', () => {
      const date = '2024-01-15T14:30:00Z';
      const formatted = formatDate(date);

      // Check that it contains expected parts (day, month abbreviation)
      expect(formatted).toMatch(/\d+/); // Has numbers
      expect(formatted).toMatch(/[а-яА-Я]/); // Has Russian characters
    });

    it('should handle ISO date strings', () => {
      const date = '2024-12-25T10:00:00.000Z';
      const formatted = formatDate(date);
      expect(formatted).toBeTruthy();
    });
  });

  describe('getTypeLabel', () => {
    it('should return correct label for full', () => {
      expect(getTypeLabel('full')).toBe('Полный анализ');
    });

    it('should return correct label for code', () => {
      expect(getTypeLabel('code')).toBe('Анализ кода');
    });

    it('should return correct label for business', () => {
      expect(getTypeLabel('business')).toBe('Бизнес-анализ');
    });

    it('should return correct label for competitor', () => {
      expect(getTypeLabel('competitor')).toBe('Конкуренты');
    });

    it('should return type as-is for unknown types', () => {
      expect(getTypeLabel('unknown')).toBe('unknown');
    });
  });

  describe('getTypeIcon', () => {
    it('should return 🎯 for full', () => {
      expect(getTypeIcon('full')).toBe('🎯');
    });

    it('should return 💻 for code', () => {
      expect(getTypeIcon('code')).toBe('💻');
    });

    it('should return 💼 for business', () => {
      expect(getTypeIcon('business')).toBe('💼');
    });

    it('should return 📊 for competitor', () => {
      expect(getTypeIcon('competitor')).toBe('📊');
    });

    it('should return 📋 for unknown types', () => {
      expect(getTypeIcon('unknown')).toBe('📋');
    });
  });

  describe('getScoreColor', () => {
    it('should return tertiary color for null score', () => {
      expect(getScoreColor(null)).toBe('var(--text-tertiary)');
    });

    it('should return green for score >= 70', () => {
      expect(getScoreColor(70)).toBe('var(--accent-green)');
      expect(getScoreColor(85)).toBe('var(--accent-green)');
      expect(getScoreColor(100)).toBe('var(--accent-green)');
    });

    it('should return yellow for score >= 40 and < 70', () => {
      expect(getScoreColor(40)).toBe('var(--accent-yellow)');
      expect(getScoreColor(55)).toBe('var(--accent-yellow)');
      expect(getScoreColor(69)).toBe('var(--accent-yellow)');
    });

    it('should return red for score < 40', () => {
      expect(getScoreColor(0)).toBe('var(--accent-red)');
      expect(getScoreColor(20)).toBe('var(--accent-red)');
      expect(getScoreColor(39)).toBe('var(--accent-red)');
    });
  });
});

// ===========================================
// Version Selection Logic Tests
// ===========================================

describe('Version Selection Logic', () => {
  // Simulate the selection logic from the component
  function handleSelect(
    version: number | null,
    current: [number | null, number | null]
  ): [number | null, number | null] {
    if (version === null) return current;

    const [v1, v2] = current;

    // If clicking the same version, deselect it
    if (v1 === version) return [null, v2];
    if (v2 === version) return [v1, null];

    // If no selections, set as first
    if (v1 === null) return [version, v2];

    // If first selected, set as second
    if (v2 === null) return [v1, version];

    // If both selected, replace first with new
    return [version, v2];
  }

  it('should select first version when none selected', () => {
    const result = handleSelect(1, [null, null]);
    expect(result).toEqual([1, null]);
  });

  it('should select second version when first is selected', () => {
    const result = handleSelect(2, [1, null]);
    expect(result).toEqual([1, 2]);
  });

  it('should deselect first version when clicked again', () => {
    const result = handleSelect(1, [1, 2]);
    expect(result).toEqual([null, 2]);
  });

  it('should deselect second version when clicked again', () => {
    const result = handleSelect(2, [1, 2]);
    expect(result).toEqual([1, null]);
  });

  it('should replace first version when both are selected', () => {
    const result = handleSelect(3, [1, 2]);
    expect(result).toEqual([3, 2]);
  });

  it('should ignore null version', () => {
    const result = handleSelect(null, [1, 2]);
    expect(result).toEqual([1, 2]);
  });
});

// ===========================================
// Selection Index Logic Tests
// ===========================================

describe('Selection Index Logic', () => {
  function getSelectionIndex(
    version: number | null,
    selected: [number | null, number | null]
  ): 1 | 2 | null {
    if (version === null) return null;
    if (selected[0] === version) return 1;
    if (selected[1] === version) return 2;
    return null;
  }

  it('should return 1 for first selected version', () => {
    expect(getSelectionIndex(5, [5, 10])).toBe(1);
  });

  it('should return 2 for second selected version', () => {
    expect(getSelectionIndex(10, [5, 10])).toBe(2);
  });

  it('should return null for non-selected version', () => {
    expect(getSelectionIndex(3, [5, 10])).toBeNull();
  });

  it('should return null for null version', () => {
    expect(getSelectionIndex(null, [5, 10])).toBeNull();
  });

  it('should handle partial selection', () => {
    expect(getSelectionIndex(5, [5, null])).toBe(1);
    expect(getSelectionIndex(10, [null, 10])).toBe(2);
  });
});

// ===========================================
// Compare Ordering Logic Tests
// ===========================================

describe('Compare Ordering Logic', () => {
  function orderVersions(v1: number, v2: number): [number, number] {
    // Always put older version first
    return v1 < v2 ? [v1, v2] : [v2, v1];
  }

  it('should keep order if v1 < v2', () => {
    expect(orderVersions(1, 5)).toEqual([1, 5]);
  });

  it('should swap order if v1 > v2', () => {
    expect(orderVersions(5, 1)).toEqual([1, 5]);
  });

  it('should handle same versions', () => {
    expect(orderVersions(3, 3)).toEqual([3, 3]);
  });
});

// ===========================================
// Entry State Tests
// ===========================================

describe('Entry State', () => {
  interface HistoryEntry {
    id: string;
    version: number | null;
    type: 'code' | 'business' | 'competitor' | 'full';
    created_at: string;
    alignment_score: number | null;
    summary: string | null;
    label: string | null;
  }

  it('should determine if entry is selected', () => {
    const entries: HistoryEntry[] = [
      { id: '1', version: 1, type: 'full', created_at: '', alignment_score: 65, summary: null, label: null },
      { id: '2', version: 2, type: 'full', created_at: '', alignment_score: 72, summary: null, label: null },
      { id: '3', version: 3, type: 'full', created_at: '', alignment_score: 80, summary: null, label: null },
    ];

    const selected: [number | null, number | null] = [1, 3];

    const isSelected = (entry: HistoryEntry) =>
      entry.version !== null && selected.includes(entry.version);

    expect(isSelected(entries[0])).toBe(true);
    expect(isSelected(entries[1])).toBe(false);
    expect(isSelected(entries[2])).toBe(true);
  });

  it('should handle entries with null version', () => {
    const entry: HistoryEntry = {
      id: '1',
      version: null,
      type: 'full',
      created_at: '',
      alignment_score: null,
      summary: null,
      label: null,
    };

    const selected: [number | null, number | null] = [1, 2];
    const isSelected = entry.version !== null && selected.includes(entry.version);

    expect(isSelected).toBe(false);
  });
});

// ===========================================
// Filter Logic Tests
// ===========================================

describe('Filter Logic', () => {
  interface HistoryEntry {
    type: 'code' | 'business' | 'competitor' | 'full';
    version: number;
  }

  const entries: HistoryEntry[] = [
    { type: 'full', version: 1 },
    { type: 'code', version: 2 },
    { type: 'full', version: 3 },
    { type: 'business', version: 4 },
    { type: 'competitor', version: 5 },
  ];

  it('should return all entries when no filter', () => {
    const filter = '';
    const filtered = filter ? entries.filter((e) => e.type === filter) : entries;
    expect(filtered).toHaveLength(5);
  });

  it('should filter by full', () => {
    const filter = 'full';
    const filtered = entries.filter((e) => e.type === filter);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.version)).toEqual([1, 3]);
  });

  it('should filter by code', () => {
    const filter = 'code';
    const filtered = entries.filter((e) => e.type === filter);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].version).toBe(2);
  });

  it('should filter by business', () => {
    const filter = 'business';
    const filtered = entries.filter((e) => e.type === filter);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].version).toBe(4);
  });

  it('should filter by competitor', () => {
    const filter = 'competitor';
    const filtered = entries.filter((e) => e.type === filter);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].version).toBe(5);
  });
});
