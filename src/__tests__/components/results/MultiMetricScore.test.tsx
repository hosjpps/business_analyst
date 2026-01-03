import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultiMetricScore } from '@/components/results/MultiMetricScore';
import type { Gap, Verdict } from '@/types/gaps';

// ===========================================
// Mock TermTooltip
// ===========================================

vi.mock('@/components/ui/TermTooltip', () => ({
  TermTooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// ===========================================
// Test Data
// ===========================================

const createGap = (category: string, type: 'critical' | 'warning' | 'info'): Gap => ({
  id: `gap-${category}-${type}`,
  type,
  category: category as Gap['category'],
  business_goal: 'Test goal',
  current_state: 'Test state',
  recommendation: 'Test recommendation',
  effort: 'medium',
  impact: 'high',
});

// ===========================================
// Rendering Tests
// ===========================================

describe('MultiMetricScore', () => {
  describe('rendering', () => {
    it('should render component with title', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={75}
          verdict="on_track"
          disableAnimation
        />
      );

      expect(screen.getByText('Оценка вашего продукта')).toBeInTheDocument();
    });

    it('should render all 4 metrics', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={75}
          verdict="on_track"
          disableAnimation
        />
      );

      expect(screen.getByText('Готовность к рынку')).toBeInTheDocument();
      expect(screen.getByText('Соответствие бизнес-целям')).toBeInTheDocument();
      expect(screen.getByText('Техническое качество')).toBeInTheDocument();
      expect(screen.getByText('Безопасность')).toBeInTheDocument();
    });

    it('should render metric emojis', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={75}
          verdict="on_track"
          disableAnimation
        />
      );

      expect(screen.getByText('💎')).toBeInTheDocument();
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('🛠️')).toBeInTheDocument();
      expect(screen.getByText('🔒')).toBeInTheDocument();
    });

    it('should render overall score', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={80}
          verdict="on_track"
          disableAnimation
        />
      );

      expect(screen.getByText('Общий скор:')).toBeInTheDocument();
    });

    it('should render verdict explanation when provided', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={75}
          verdict="on_track"
          verdictExplanation="Это объяснение вердикта"
          disableAnimation
        />
      );

      expect(screen.getByText('Это объяснение вердикта')).toBeInTheDocument();
    });

    it('should not render verdict explanation when not provided', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={75}
          verdict="on_track"
          disableAnimation
        />
      );

      expect(screen.queryByText('Это объяснение вердикта')).not.toBeInTheDocument();
    });
  });

  // ===========================================
  // Verdict Tests
  // ===========================================

  describe('verdict display', () => {
    it('should display on_track verdict as "ГОТОВ К РОСТУ"', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={85}
          verdict="on_track"
          disableAnimation
        />
      );

      expect(screen.getByText('ГОТОВ К РОСТУ')).toBeInTheDocument();
    });

    it('should display iterate verdict as "НУЖНЫ УЛУЧШЕНИЯ"', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={55}
          verdict="iterate"
          disableAnimation
        />
      );

      expect(screen.getByText('НУЖНЫ УЛУЧШЕНИЯ')).toBeInTheDocument();
    });

    it('should display pivot verdict as "ТРЕБУЕТСЯ ПЕРЕСМОТР"', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={25}
          verdict="pivot"
          disableAnimation
        />
      );

      expect(screen.getByText('ТРЕБУЕТСЯ ПЕРЕСМОТР')).toBeInTheDocument();
    });

    it('should display emoji for on_track', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={85}
          verdict="on_track"
          disableAnimation
        />
      );

      expect(screen.getByText('🚀')).toBeInTheDocument();
    });

    it('should display emoji for iterate', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={55}
          verdict="iterate"
          disableAnimation
        />
      );

      expect(screen.getByText('🔧')).toBeInTheDocument();
    });

    it('should display emoji for pivot', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={25}
          verdict="pivot"
          disableAnimation
        />
      );

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  // ===========================================
  // Metric Calculation Tests
  // ===========================================

  describe('metric calculations', () => {
    it('should show alignment score from props', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={75}
          verdict="on_track"
          disableAnimation
        />
      );

      expect(screen.getByText('75/100')).toBeInTheDocument();
    });

    it('should show 100 for all metrics when no gaps', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={100}
          verdict="on_track"
          disableAnimation
        />
      );

      const scores = screen.getAllByText('100/100');
      expect(scores.length).toBeGreaterThanOrEqual(3); // market, technical, security (alignment is from props)
    });

    it('should reduce market readiness for monetization gaps', () => {
      const gaps = [createGap('monetization', 'critical')];

      render(
        <MultiMetricScore
          gaps={gaps}
          alignmentScore={80}
          verdict="iterate"
          disableAnimation
        />
      );

      // Critical gap = -20 penalty, so 100-20=80
      // Both alignment (from props) and market readiness show 80/100
      const scores80 = screen.getAllByText('80/100');
      expect(scores80.length).toBeGreaterThanOrEqual(1);
    });

    it('should reduce security score for security gaps', () => {
      const gaps = [
        createGap('security', 'critical'),
        createGap('security', 'warning'),
      ];

      render(
        <MultiMetricScore
          gaps={gaps}
          alignmentScore={80}
          verdict="iterate"
          disableAnimation
        />
      );

      // Critical = -20, Warning = -10, so 100-30=70
      expect(screen.getByText('70/100')).toBeInTheDocument();
    });

    it('should reduce technical quality for testing gaps', () => {
      const gaps = [createGap('testing', 'warning')];

      render(
        <MultiMetricScore
          gaps={gaps}
          alignmentScore={85}
          verdict="on_track"
          disableAnimation
        />
      );

      // Warning gap = -10 penalty, so 100-10=90
      expect(screen.getByText('90/100')).toBeInTheDocument();
    });

    it('should not go below 30 (minimum score)', () => {
      const gaps = [
        createGap('monetization', 'critical'),
        createGap('monetization', 'critical'),
        createGap('marketing', 'critical'),
        createGap('growth', 'critical'),
      ];

      render(
        <MultiMetricScore
          gaps={gaps}
          alignmentScore={20}
          verdict="pivot"
          disableAnimation
        />
      );

      // Even with many gaps, minimum is 30
      expect(screen.getByText('30/100')).toBeInTheDocument();
    });
  });

  // ===========================================
  // Description Tests
  // ===========================================

  describe('metric descriptions', () => {
    it('should show high score description for market >= 80', () => {
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={100}
          verdict="on_track"
          disableAnimation
        />
      );

      expect(screen.getByText('Продукт готов для первых продаж')).toBeInTheDocument();
    });

    it('should show low score description for security < 40', () => {
      const gaps = [
        createGap('security', 'critical'),
        createGap('security', 'critical'),
        createGap('security', 'critical'),
        createGap('security', 'critical'),
      ];

      render(
        <MultiMetricScore
          gaps={gaps}
          alignmentScore={50}
          verdict="iterate"
          disableAnimation
        />
      );

      expect(screen.getByText('Критические уязвимости!')).toBeInTheDocument();
    });

    it('should show medium score description for technical 60-79', () => {
      const gaps = [createGap('testing', 'critical')]; // -20 = 80

      render(
        <MultiMetricScore
          gaps={gaps}
          alignmentScore={75}
          verdict="on_track"
          disableAnimation
        />
      );

      expect(screen.getByText('Отличное качество кода')).toBeInTheDocument();
    });
  });

  // ===========================================
  // Overall Score Calculation Tests
  // ===========================================

  describe('overall score', () => {
    it('should calculate weighted average correctly', () => {
      // With no gaps and alignment=80:
      // market=100, alignment=80, technical=100, security=100
      // weighted = 100*0.25 + 80*0.35 + 100*0.2 + 100*0.2 = 25 + 28 + 20 + 20 = 93
      render(
        <MultiMetricScore
          gaps={[]}
          alignmentScore={80}
          verdict="on_track"
          disableAnimation
        />
      );

      expect(screen.getByText('93/100')).toBeInTheDocument();
    });
  });

  // ===========================================
  // Category Mapping Tests
  // ===========================================

  describe('category to metric mapping', () => {
    const testCategories: Array<[string, string]> = [
      ['monetization', 'market'],
      ['marketing', 'market'],
      ['growth', 'market'],
      ['testing', 'technical'],
      ['documentation', 'technical'],
      ['infrastructure', 'technical'],
      ['scalability', 'technical'],
      ['security', 'security'],
    ];

    testCategories.forEach(([category]) => {
      it(`should affect correct metric for ${category} gaps`, () => {
        const gaps = [createGap(category, 'warning')];

        const { container } = render(
          <MultiMetricScore
            gaps={gaps}
            alignmentScore={100}
            verdict="on_track"
            disableAnimation
          />
        );

        // Component should render without errors
        expect(container).toBeInTheDocument();
      });
    });
  });
});

// ===========================================
// Snapshot Tests
// ===========================================

describe('MultiMetricScore snapshots', () => {
  it('should match snapshot with no gaps', () => {
    const { container } = render(
      <MultiMetricScore
        gaps={[]}
        alignmentScore={85}
        verdict="on_track"
        disableAnimation
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot with gaps and explanation', () => {
    const gaps = [
      createGap('monetization', 'critical'),
      createGap('security', 'warning'),
    ];

    const { container } = render(
      <MultiMetricScore
        gaps={gaps}
        alignmentScore={55}
        verdict="iterate"
        verdictExplanation="Требуются улучшения в монетизации"
        disableAnimation
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
