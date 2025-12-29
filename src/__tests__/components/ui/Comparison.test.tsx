import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ComparisonCard,
  BeforeAfter,
  ImprovementSummary,
  HistoryTimeline,
  MiniComparison,
  createComparison,
} from '@/components/ui/Comparison';
import type { AnalysisSnapshot, ComparisonResult } from '@/types/ux';

const createSnapshot = (overrides: Partial<AnalysisSnapshot> = {}): AnalysisSnapshot => ({
  id: 'snapshot-1',
  date: '2024-01-15',
  score: 65,
  gapsCount: { critical: 2, warning: 5, info: 8 },
  completedTasks: 3,
  totalTasks: 10,
  ...overrides,
});

const createComparisionResult = (overrides: Partial<ComparisonResult> = {}): ComparisonResult => ({
  previous: createSnapshot({ id: 'prev', date: '2024-01-01', score: 55 }),
  current: createSnapshot({ id: 'current', date: '2024-01-15', score: 75 }),
  scoreChange: 20,
  gapsResolved: 3,
  newGaps: 1,
  tasksCompleted: 5,
  trend: 'improving',
  ...overrides,
});

describe('ComparisonCard', () => {
  describe('Basic Rendering', () => {
    it('renders comparison title', () => {
      render(<ComparisonCard comparison={createComparisionResult()} />);

      expect(screen.getByText('Сравнение с предыдущим анализом')).toBeInTheDocument();
    });

    it('renders trend badge', () => {
      render(<ComparisonCard comparison={createComparisionResult({ trend: 'improving' })} />);

      expect(screen.getByText('Улучшается')).toBeInTheDocument();
    });

    it('renders before and after scores', () => {
      render(<ComparisonCard comparison={createComparisionResult()} />);

      expect(screen.getByText('Было')).toBeInTheDocument();
      expect(screen.getByText('Стало')).toBeInTheDocument();
    });

    it('renders score change', () => {
      render(<ComparisonCard comparison={createComparisionResult({ scoreChange: 20 })} />);

      expect(screen.getByText('+20')).toBeInTheDocument();
    });
  });

  describe('Trend Display', () => {
    it('shows improving trend correctly', () => {
      render(<ComparisonCard comparison={createComparisionResult({ trend: 'improving' })} />);

      expect(screen.getByText('Улучшается')).toBeInTheDocument();
    });

    it('shows stable trend correctly', () => {
      render(<ComparisonCard comparison={createComparisionResult({ trend: 'stable' })} />);

      expect(screen.getByText('Стабильно')).toBeInTheDocument();
    });

    it('shows declining trend correctly', () => {
      render(<ComparisonCard comparison={createComparisionResult({ trend: 'declining' })} />);

      expect(screen.getByText('Снижается')).toBeInTheDocument();
    });
  });

  describe('Details Section', () => {
    it('shows tasks completed', () => {
      render(<ComparisonCard comparison={createComparisionResult({ tasksCompleted: 5 })} showDetails={true} />);

      expect(screen.getByText('Задач выполнено')).toBeInTheDocument();
    });

    it('shows gaps resolved', () => {
      render(<ComparisonCard comparison={createComparisionResult({ gapsResolved: 3 })} showDetails={true} />);

      expect(screen.getByText('Разрывов закрыто')).toBeInTheDocument();
    });

    it('shows new gaps', () => {
      render(<ComparisonCard comparison={createComparisionResult({ newGaps: 1 })} showDetails={true} />);

      expect(screen.getByText('Новых разрывов')).toBeInTheDocument();
    });

    it('hides details when showDetails is false', () => {
      render(<ComparisonCard comparison={createComparisionResult()} showDetails={false} />);

      expect(screen.queryByText('Задач выполнено')).not.toBeInTheDocument();
    });

    it('shows gaps breakdown by severity', () => {
      render(<ComparisonCard comparison={createComparisionResult()} showDetails={true} />);

      expect(screen.getByText('Критические')).toBeInTheDocument();
      expect(screen.getByText('Предупреждения')).toBeInTheDocument();
      expect(screen.getByText('Рекомендации')).toBeInTheDocument();
    });
  });
});

describe('BeforeAfter', () => {
  it('renders before and after content', () => {
    render(
      <BeforeAfter
        before={<span>Old content</span>}
        after={<span>New content</span>}
      />
    );

    expect(screen.getByText('Old content')).toBeInTheDocument();
    expect(screen.getByText('New content')).toBeInTheDocument();
  });

  it('renders default labels', () => {
    render(
      <BeforeAfter
        before="Before"
        after="After"
      />
    );

    expect(screen.getByText('Было')).toBeInTheDocument();
    expect(screen.getByText('Стало')).toBeInTheDocument();
  });

  it('renders custom labels', () => {
    render(
      <BeforeAfter
        before="Old"
        after="New"
        beforeLabel="Previous"
        afterLabel="Current"
      />
    );

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('hides arrow when showArrow is false', () => {
    const { container } = render(
      <BeforeAfter
        before="Old"
        after="New"
        showArrow={false}
      />
    );

    expect(container.querySelector('.before-after-arrow')).not.toBeInTheDocument();
  });
});

describe('ImprovementSummary', () => {
  it('shows positive message for improving trend', () => {
    render(<ImprovementSummary comparison={createComparisionResult({ trend: 'improving', scoreChange: 25 })} />);

    expect(screen.getByText(/Отличный прогресс/)).toBeInTheDocument();
  });

  it('shows stable message for stable trend', () => {
    render(<ImprovementSummary comparison={createComparisionResult({ trend: 'stable' })} />);

    expect(screen.getByText(/Стабильное состояние/)).toBeInTheDocument();
  });

  it('shows warning message for declining trend', () => {
    render(<ImprovementSummary comparison={createComparisionResult({ trend: 'declining' })} />);

    expect(screen.getByText(/Появились новые проблемы/)).toBeInTheDocument();
  });

  it('lists gaps resolved', () => {
    render(<ImprovementSummary comparison={createComparisionResult({ gapsResolved: 5 })} />);

    expect(screen.getByText(/Закрыто 5 разрывов/)).toBeInTheDocument();
  });

  it('lists tasks completed', () => {
    render(<ImprovementSummary comparison={createComparisionResult({ tasksCompleted: 8 })} />);

    expect(screen.getByText(/Выполнено 8 задач/)).toBeInTheDocument();
  });

  it('lists score increase', () => {
    render(<ImprovementSummary comparison={createComparisionResult({ scoreChange: 15 })} />);

    expect(screen.getByText(/Скор вырос на 15 пунктов/)).toBeInTheDocument();
  });
});

describe('HistoryTimeline', () => {
  const createSnapshots = (): AnalysisSnapshot[] => [
    createSnapshot({ id: '1', date: '2024-01-15', score: 75 }),
    createSnapshot({ id: '2', date: '2024-01-01', score: 65 }),
    createSnapshot({ id: '3', date: '2023-12-15', score: 55 }),
  ];

  it('renders empty state when no snapshots', () => {
    render(<HistoryTimeline snapshots={[]} />);

    expect(screen.getByText('История анализов пуста')).toBeInTheDocument();
  });

  it('renders all snapshots', () => {
    render(<HistoryTimeline snapshots={createSnapshots()} />);

    // Should show dates
    expect(screen.getByText(/15 янв/i)).toBeInTheDocument();
    expect(screen.getByText(/1 янв/i)).toBeInTheDocument();
  });

  it('shows gap stats for each snapshot', () => {
    render(<HistoryTimeline snapshots={createSnapshots()} />);

    // Each snapshot shows critical, warning stats
    const criticalStats = screen.getAllByText(/крит\./);
    expect(criticalStats).toHaveLength(3);
  });

  it('calls onSelect when item is clicked', () => {
    const onSelect = vi.fn();
    const snapshots = createSnapshots();
    render(<HistoryTimeline snapshots={snapshots} onSelect={onSelect} />);

    // Click first item
    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onSelect).toHaveBeenCalledWith(snapshots[0]);
  });

  it('marks selected item', () => {
    const snapshots = createSnapshots();
    const { container } = render(
      <HistoryTimeline snapshots={snapshots} selectedId="2" />
    );

    const selectedItem = container.querySelector('.history-timeline-item.selected');
    expect(selectedItem).toBeInTheDocument();
  });
});

describe('MiniComparison', () => {
  it('renders current value', () => {
    render(<MiniComparison current={75} previous={65} />);

    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('shows positive change with arrow up', () => {
    const { container } = render(<MiniComparison current={75} previous={65} />);

    expect(screen.getByText('10')).toBeInTheDocument();
    const arrowUp = container.querySelector('.icon-arrow-up');
    expect(arrowUp).toBeInTheDocument();
  });

  it('shows negative change with arrow down', () => {
    const { container } = render(<MiniComparison current={55} previous={65} />);

    expect(screen.getByText('10')).toBeInTheDocument();
    const arrowDown = container.querySelector('.icon-arrow-down');
    expect(arrowDown).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<MiniComparison current={75} previous={65} label="Score" />);

    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('renders suffix', () => {
    render(<MiniComparison current={75} previous={65} suffix="%" />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('respects higherIsBetter=false', () => {
    // When lower is better (like bugs count), decrease is positive
    const { container } = render(
      <MiniComparison current={5} previous={10} higherIsBetter={false} />
    );

    const changeSpan = container.querySelector('.mini-comparison-change');
    expect(changeSpan).toHaveClass('positive');
  });

  it('does not show change when values are equal', () => {
    const { container } = render(<MiniComparison current={50} previous={50} />);

    expect(container.querySelector('.mini-comparison-change')).not.toBeInTheDocument();
  });
});

describe('createComparison', () => {
  it('calculates score change correctly', () => {
    const previous = createSnapshot({ score: 50 });
    const current = createSnapshot({ score: 75 });

    const result = createComparison(previous, current);

    expect(result.scoreChange).toBe(25);
  });

  it('calculates gaps resolved', () => {
    const previous = createSnapshot({ gapsCount: { critical: 5, warning: 10, info: 15 } });
    const current = createSnapshot({ gapsCount: { critical: 2, warning: 5, info: 10 } });

    const result = createComparison(previous, current);

    // 30 total before, 17 total after = 13 resolved
    expect(result.gapsResolved).toBe(13);
  });

  it('calculates new gaps', () => {
    const previous = createSnapshot({ gapsCount: { critical: 2, warning: 5, info: 10 } });
    const current = createSnapshot({ gapsCount: { critical: 5, warning: 8, info: 12 } });

    const result = createComparison(previous, current);

    // 17 total before, 25 total after = 8 new
    expect(result.newGaps).toBe(8);
  });

  it('calculates tasks completed', () => {
    const previous = createSnapshot({ completedTasks: 3 });
    const current = createSnapshot({ completedTasks: 8 });

    const result = createComparison(previous, current);

    expect(result.tasksCompleted).toBe(5);
  });

  it('determines improving trend when score increases significantly', () => {
    const previous = createSnapshot({ score: 50 });
    const current = createSnapshot({ score: 60 });

    const result = createComparison(previous, current);

    expect(result.trend).toBe('improving');
  });

  it('determines declining trend when score decreases significantly', () => {
    const previous = createSnapshot({ score: 70 });
    const current = createSnapshot({ score: 60 });

    const result = createComparison(previous, current);

    expect(result.trend).toBe('declining');
  });

  it('determines stable trend when score is similar', () => {
    const previous = createSnapshot({
      score: 70,
      gapsCount: { critical: 2, warning: 5, info: 8 },
    });
    const current = createSnapshot({
      score: 72,
      gapsCount: { critical: 2, warning: 5, info: 8 },
    });

    const result = createComparison(previous, current);

    expect(result.trend).toBe('stable');
  });
});
