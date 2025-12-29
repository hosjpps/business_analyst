/**
 * Tests for Progress Bar Components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ProgressBar,
  ScoreCircle,
  BusinessReadiness,
  StepProgress,
  CompletionProgress,
} from '@/components/ui/ProgressBar';

// ===========================================
// Test Suite: ProgressBar
// ===========================================

describe('ProgressBar', () => {
  it('should render with value', () => {
    const { container } = render(<ProgressBar value={50} />);

    const track = container.querySelector('.progress-bar-track');
    expect(track).toBeInTheDocument();
    expect(track).toHaveAttribute('aria-valuenow', '50');
  });

  it('should show label when showLabel is true', () => {
    render(<ProgressBar value={75} showLabel />);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should show custom label', () => {
    render(<ProgressBar value={50} label="Progress" showLabel />);

    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should apply auto color based on value', () => {
    const { container: high } = render(<ProgressBar value={80} />);
    const { container: mid } = render(<ProgressBar value={50} />);
    const { container: low } = render(<ProgressBar value={20} />);

    expect(high.querySelector('.progress-success')).toBeInTheDocument();
    expect(mid.querySelector('.progress-warning')).toBeInTheDocument();
    expect(low.querySelector('.progress-error')).toBeInTheDocument();
  });

  it('should apply explicit color', () => {
    const { container } = render(<ProgressBar value={50} color="info" />);

    expect(container.querySelector('.progress-info')).toBeInTheDocument();
  });

  it('should apply size correctly', () => {
    const { container: sm } = render(<ProgressBar value={50} size="sm" />);
    const { container: lg } = render(<ProgressBar value={50} size="lg" />);

    expect(sm.querySelector('.progress-bar-track')).toHaveStyle({ height: '4px' });
    expect(lg.querySelector('.progress-bar-track')).toHaveStyle({ height: '12px' });
  });

  it('should clamp value between 0 and 100', () => {
    const { container: over } = render(<ProgressBar value={150} />);
    const { container: under } = render(<ProgressBar value={-10} />);

    expect(over.querySelector('.progress-bar-track')).toHaveAttribute('aria-valuenow', '100');
    expect(under.querySelector('.progress-bar-track')).toHaveAttribute('aria-valuenow', '0');
  });

  it('should support custom max value', () => {
    const { container } = render(<ProgressBar value={25} max={50} showLabel />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});

// ===========================================
// Test Suite: ScoreCircle
// ===========================================

describe('ScoreCircle', () => {
  it('should render score', () => {
    render(<ScoreCircle score={75} />);

    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('should render label', () => {
    render(<ScoreCircle score={50} label="Business Score" />);

    expect(screen.getByText('Business Score')).toBeInTheDocument();
  });

  it('should show positive change', () => {
    const { container } = render(<ScoreCircle score={80} showChange={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(container.querySelector('.score-change.positive')).toBeInTheDocument();
  });

  it('should show negative change', () => {
    const { container } = render(<ScoreCircle score={60} showChange={-3} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(container.querySelector('.score-change.negative')).toBeInTheDocument();
  });

  it('should not show change when 0', () => {
    const { container } = render(<ScoreCircle score={50} showChange={0} />);

    expect(container.querySelector('.score-change')).not.toBeInTheDocument();
  });

  it('should apply different sizes', () => {
    const { container: sm } = render(<ScoreCircle score={50} size="sm" />);
    const { container: lg } = render(<ScoreCircle score={50} size="lg" />);

    expect(sm.querySelector('svg')).toHaveAttribute('width', '60');
    expect(lg.querySelector('svg')).toHaveAttribute('width', '140');
  });
});

// ===========================================
// Test Suite: BusinessReadiness
// ===========================================

describe('BusinessReadiness', () => {
  const mockCategories = [
    { name: 'monetization', label: 'Монетизация', score: 80, icon: 'money' as const, color: 'success' as const },
    { name: 'security', label: 'Безопасность', score: 60, icon: 'security' as const, color: 'warning' as const },
    { name: 'growth', label: 'Рост', score: 40, icon: 'growth' as const, color: 'error' as const },
  ];

  it('should render overall score', () => {
    render(<BusinessReadiness overall={65} categories={mockCategories} />);

    expect(screen.getByText('65')).toBeInTheDocument();
  });

  it('should render categories', () => {
    render(<BusinessReadiness overall={65} categories={mockCategories} />);

    expect(screen.getByText('Монетизация')).toBeInTheDocument();
    expect(screen.getByText('Безопасность')).toBeInTheDocument();
    expect(screen.getByText('Рост')).toBeInTheDocument();
  });

  it('should show category scores', () => {
    render(<BusinessReadiness overall={65} categories={mockCategories} />);

    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('should show top priority when provided', () => {
    render(
      <BusinessReadiness
        overall={65}
        categories={mockCategories}
        topPriority="Добавить оплату"
      />
    );

    expect(screen.getByText(/Добавить оплату/)).toBeInTheDocument();
  });

  it('should show summary when provided', () => {
    render(
      <BusinessReadiness
        overall={65}
        categories={mockCategories}
        summary="Бизнес готов к росту"
      />
    );

    expect(screen.getByText('Бизнес готов к росту')).toBeInTheDocument();
  });

  it('should show correct verdict based on score', () => {
    const { rerender } = render(<BusinessReadiness overall={85} categories={[]} />);
    expect(screen.getByText(/Отлично/)).toBeInTheDocument();

    rerender(<BusinessReadiness overall={65} categories={[]} />);
    expect(screen.getByText(/Хорошо/)).toBeInTheDocument();

    rerender(<BusinessReadiness overall={45} categories={[]} />);
    expect(screen.getByText(/Требуются улучшения/)).toBeInTheDocument();

    rerender(<BusinessReadiness overall={25} categories={[]} />);
    expect(screen.getByText(/Нужны серьёзные доработки/)).toBeInTheDocument();
  });
});

// ===========================================
// Test Suite: StepProgress
// ===========================================

describe('StepProgress', () => {
  it('should render all steps', () => {
    const { container } = render(<StepProgress currentStep={1} totalSteps={4} />);

    expect(container.querySelectorAll('.step-item')).toHaveLength(4);
  });

  it('should show step numbers', () => {
    render(<StepProgress currentStep={0} totalSteps={3} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should mark completed steps', () => {
    const { container } = render(<StepProgress currentStep={2} totalSteps={4} />);

    expect(container.querySelectorAll('.step-item.completed')).toHaveLength(2);
  });

  it('should mark active step', () => {
    const { container } = render(<StepProgress currentStep={1} totalSteps={3} />);

    expect(container.querySelectorAll('.step-item.active')).toHaveLength(1);
  });

  it('should show step labels when provided', () => {
    render(
      <StepProgress
        currentStep={1}
        totalSteps={3}
        labels={['Шаг 1', 'Шаг 2', 'Шаг 3']}
      />
    );

    expect(screen.getByText('Шаг 1')).toBeInTheDocument();
    expect(screen.getByText('Шаг 2')).toBeInTheDocument();
    expect(screen.getByText('Шаг 3')).toBeInTheDocument();
  });

  it('should show progress text', () => {
    render(<StepProgress currentStep={1} totalSteps={4} />);

    expect(screen.getByText('Шаг 2 из 4')).toBeInTheDocument();
  });
});

// ===========================================
// Test Suite: CompletionProgress
// ===========================================

describe('CompletionProgress', () => {
  it('should render fraction', () => {
    render(<CompletionProgress completed={3} total={10} />);

    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('should show default label', () => {
    render(<CompletionProgress completed={5} total={10} />);

    expect(screen.getByText('Выполнено')).toBeInTheDocument();
  });

  it('should show custom label', () => {
    render(<CompletionProgress completed={5} total={10} label="Tasks" />);

    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('should hide fraction when showFraction is false', () => {
    render(<CompletionProgress completed={5} total={10} showFraction={false} />);

    expect(screen.queryByText('5/10')).not.toBeInTheDocument();
  });

  it('should handle zero total', () => {
    const { container } = render(<CompletionProgress completed={0} total={0} />);

    expect(container.querySelector('.progress-bar-track')).toHaveAttribute('aria-valuenow', '0');
  });
});
