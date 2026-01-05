import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DemoBadge, DemoBadgeInline } from '@/components/demo/DemoBadge';

describe('DemoBadge', () => {
  it('should render with ДЕМО label', () => {
    render(<DemoBadge />);
    expect(screen.getByText('ДЕМО')).toBeInTheDocument();
  });

  it('should render with target icon', () => {
    render(<DemoBadge />);
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('should show scenario name when provided', () => {
    render(<DemoBadge scenarioName="SaaS Стартап" />);
    expect(screen.getByText(/SaaS Стартап/)).toBeInTheDocument();
  });

  it('should show CTA by default', () => {
    render(<DemoBadge />);
    expect(screen.getByText(/Это пример результатов/)).toBeInTheDocument();
    expect(screen.getByText(/Анализировать свой проект/)).toBeInTheDocument();
  });

  it('should hide CTA when showCTA is false', () => {
    render(<DemoBadge showCTA={false} />);
    expect(screen.queryByText(/Это пример результатов/)).not.toBeInTheDocument();
  });

  it('should call onCTAClick when CTA button clicked', () => {
    const onCTAClick = vi.fn();
    render(<DemoBadge onCTAClick={onCTAClick} />);

    const ctaButton = screen.getByText(/Анализировать свой проект/);
    fireEvent.click(ctaButton);

    expect(onCTAClick).toHaveBeenCalledTimes(1);
  });
});

describe('DemoBadgeInline', () => {
  it('should render with DEMO label', () => {
    render(<DemoBadgeInline />);
    expect(screen.getByText('DEMO')).toBeInTheDocument();
  });

  it('should render with target icon', () => {
    render(<DemoBadgeInline />);
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('should be a span element', () => {
    const { container } = render(<DemoBadgeInline />);
    const span = container.querySelector('span.demo-badge-inline');
    expect(span).toBeInTheDocument();
  });
});
