/**
 * Tests for Tooltip Components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from '@/components/ui/Tooltip';
import { TermTooltip, AutoTooltipText, InfoTooltip } from '@/components/ui/TermTooltip';

// ===========================================
// Setup
// ===========================================

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

// ===========================================
// Test Suite: Base Tooltip
// ===========================================

describe('Tooltip', () => {
  it('should render children', () => {
    render(
      <Tooltip content="Test content">
        <span>Hover me</span>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('should show tooltip on hover after delay', () => {
    render(
      <Tooltip content="Tooltip content" delay={200}>
        <span>Hover me</span>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);

    // Tooltip should not be visible immediately
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Fast-forward delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Now tooltip should be visible
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Tooltip content')).toBeInTheDocument();
  });

  it('should hide tooltip on mouse leave', () => {
    render(
      <Tooltip content="Tooltip content" delay={0}>
        <span>Hover me</span>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');

    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should cancel tooltip if mouse leaves before delay', () => {
    render(
      <Tooltip content="Tooltip content" delay={500}>
        <span>Hover me</span>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');

    fireEvent.mouseEnter(trigger);

    // Leave before delay completes
    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.mouseLeave(trigger);

    // Complete the remaining time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Tooltip should never appear
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should show tooltip on focus', () => {
    render(
      <Tooltip content="Tooltip content" delay={0}>
        <span tabIndex={0}>Focus me</span>
      </Tooltip>
    );

    const trigger = screen.getByText('Focus me');
    fireEvent.focus(trigger);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('should render complex content', () => {
    render(
      <Tooltip
        content={<div><strong>Title</strong><p>Description</p></div>}
        delay={0}
      >
        <span>Hover me</span>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('should apply custom maxWidth', () => {
    render(
      <Tooltip content="Test" delay={0} maxWidth={500}>
        <span>Hover me</span>
      </Tooltip>
    );

    fireEvent.mouseEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.style.maxWidth).toBe('500px');
  });
});

// ===========================================
// Test Suite: TermTooltip
// ===========================================

describe('TermTooltip', () => {
  it('should render term from dictionary', () => {
    render(<TermTooltip termKey="mrr" />);

    expect(screen.getByText('MRR')).toBeInTheDocument();
  });

  it('should render custom children', () => {
    render(<TermTooltip termKey="mrr">Monthly Revenue</TermTooltip>);

    expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
  });

  it('should show question mark icon by default', () => {
    render(<TermTooltip termKey="mrr" />);

    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    render(<TermTooltip termKey="mrr" showIcon={false} />);

    expect(screen.queryByText('?')).not.toBeInTheDocument();
  });

  it('should render termKey if term not found', () => {
    render(<TermTooltip termKey="unknown_term" />);

    expect(screen.getByText('unknown_term')).toBeInTheDocument();
  });

  it('should show term explanation on hover', () => {
    render(<TermTooltip termKey="mrr" />);

    const trigger = screen.getByText('MRR').closest('.term-tooltip-trigger');
    expect(trigger).toBeInTheDocument();

    fireEvent.mouseEnter(trigger!);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText(/Ежемесячный доход/)).toBeInTheDocument();
  });

  it('should show example in tooltip', () => {
    render(<TermTooltip termKey="mrr" />);

    const trigger = screen.getByText('MRR').closest('.term-tooltip-trigger');
    fireEvent.mouseEnter(trigger!);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText(/100 клиентов/)).toBeInTheDocument();
  });

  it('should show why it matters in tooltip', () => {
    render(<TermTooltip termKey="mrr" />);

    const trigger = screen.getByText('MRR').closest('.term-tooltip-trigger');
    fireEvent.mouseEnter(trigger!);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText(/стабильность бизнеса/)).toBeInTheDocument();
  });

  it('should work with terms without example', () => {
    // 'gap' term might not have example
    render(<TermTooltip termKey="gap" />);

    const trigger = screen.getByText('Разрыв (Gap)').closest('.term-tooltip-trigger');
    fireEvent.mouseEnter(trigger!);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText(/Разница между тем/)).toBeInTheDocument();
  });
});

// ===========================================
// Test Suite: AutoTooltipText
// ===========================================

describe('AutoTooltipText', () => {
  it('should render plain text without known terms', () => {
    render(<AutoTooltipText text="Hello world" />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('should add tooltip for MRR term', () => {
    render(<AutoTooltipText text="Our MRR is growing" />);

    expect(screen.getByText('MRR')).toBeInTheDocument();
    // Check that MRR has tooltip trigger styling
    const mrrElement = screen.getByText('MRR');
    expect(mrrElement.closest('.term-tooltip-trigger')).toBeInTheDocument();
  });

  it('should handle multiple known terms', () => {
    render(<AutoTooltipText text="Check your MRR and ARR metrics" />);

    const mrrElement = screen.getByText('MRR');
    const arrElement = screen.getByText('ARR');

    expect(mrrElement.closest('.term-tooltip-trigger')).toBeInTheDocument();
    expect(arrElement.closest('.term-tooltip-trigger')).toBeInTheDocument();
  });

  it('should preserve surrounding text', () => {
    render(<AutoTooltipText text="Your MRR grew by 50%" />);

    expect(screen.getByText(/Your/)).toBeInTheDocument();
    expect(screen.getByText(/grew by 50%/)).toBeInTheDocument();
  });

  it('should apply className prop', () => {
    render(<AutoTooltipText text="Test text" className="custom-class" />);

    const element = screen.getByText('Test text');
    expect(element).toHaveClass('custom-class');
  });

  it('should detect SaaS term', () => {
    render(<AutoTooltipText text="This is a SaaS business" />);

    const saasElement = screen.getByText('SaaS');
    expect(saasElement.closest('.term-tooltip-trigger')).toBeInTheDocument();
  });

  it('should detect B2B and B2C terms', () => {
    render(<AutoTooltipText text="B2B vs B2C models" />);

    const b2bElement = screen.getByText('B2B');
    const b2cElement = screen.getByText('B2C');

    expect(b2bElement.closest('.term-tooltip-trigger')).toBeInTheDocument();
    expect(b2cElement.closest('.term-tooltip-trigger')).toBeInTheDocument();
  });
});

// ===========================================
// Test Suite: InfoTooltip
// ===========================================

describe('InfoTooltip', () => {
  it('should render info icon', () => {
    render(<InfoTooltip content="Info content" />);

    const icon = screen.getByLabelText('Подробнее');
    expect(icon).toBeInTheDocument();
  });

  it('should show content on hover', () => {
    render(<InfoTooltip content="Detailed information" />);

    const icon = screen.getByLabelText('Подробнее');
    fireEvent.mouseEnter(icon);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText('Detailed information')).toBeInTheDocument();
  });

  it('should accept different positions', () => {
    render(<InfoTooltip content="Info" position="bottom" />);

    const icon = screen.getByLabelText('Подробнее');
    expect(icon).toBeInTheDocument();
  });
});

// ===========================================
// Test Suite: Dictionary Functions
// ===========================================

describe('Dictionary Functions', () => {
  it('getTerm returns term for valid key', async () => {
    const { getTerm } = await import('@/lib/tooltips/dictionary');
    const term = getTerm('mrr');

    expect(term).toBeDefined();
    expect(term?.term).toBe('MRR');
    expect(term?.simple).toContain('Ежемесячный доход');
  });

  it('getTerm returns undefined for invalid key', async () => {
    const { getTerm } = await import('@/lib/tooltips/dictionary');
    const term = getTerm('invalid_key_12345');

    expect(term).toBeUndefined();
  });

  it('hasTerm returns true for existing term', async () => {
    const { hasTerm } = await import('@/lib/tooltips/dictionary');

    expect(hasTerm('mrr')).toBe(true);
    expect(hasTerm('MRR')).toBe(true); // case insensitive
  });

  it('hasTerm returns false for non-existing term', async () => {
    const { hasTerm } = await import('@/lib/tooltips/dictionary');

    expect(hasTerm('nonexistent')).toBe(false);
  });

  it('searchTerms finds matching terms', async () => {
    const { searchTerms } = await import('@/lib/tooltips/dictionary');
    const results = searchTerms('доход');

    expect(results.length).toBeGreaterThan(0);
    expect(results.some(t => t.term === 'MRR')).toBe(true);
  });

  it('getTermsByCategory returns correct category', async () => {
    const { getTermsByCategory } = await import('@/lib/tooltips/dictionary');
    const metrics = getTermsByCategory('metrics');

    expect(metrics.mrr).toBeDefined();
    expect(metrics.arr).toBeDefined();
    expect(metrics.churn).toBeDefined();
  });
});
