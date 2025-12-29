/**
 * Tests for Icon Components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon, SeverityBadge, CategoryBadge, StatusIndicator } from '@/components/ui/Icon';

// ===========================================
// Test Suite: Icon
// ===========================================

describe('Icon', () => {
  it('should render icon with default props', () => {
    const { container } = render(<Icon name="check" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('icon', 'icon-check');
  });

  it('should apply size correctly', () => {
    const { container: smContainer } = render(<Icon name="check" size="sm" />);
    const { container: mdContainer } = render(<Icon name="check" size="md" />);
    const { container: lgContainer } = render(<Icon name="check" size="lg" />);

    expect(smContainer.querySelector('svg')).toHaveAttribute('width', '14');
    expect(mdContainer.querySelector('svg')).toHaveAttribute('width', '18');
    expect(lgContainer.querySelector('svg')).toHaveAttribute('width', '24');
  });

  it('should apply semantic colors', () => {
    const { container: successContainer } = render(<Icon name="check" color="success" />);
    const { container: errorContainer } = render(<Icon name="error" color="error" />);

    expect(successContainer.querySelector('svg')).toHaveAttribute('fill', 'var(--accent-green)');
    expect(errorContainer.querySelector('svg')).toHaveAttribute('fill', 'var(--accent-red)');
  });

  it('should apply custom color string', () => {
    const { container } = render(<Icon name="star" color="#ff0000" />);

    expect(container.querySelector('svg')).toHaveAttribute('fill', '#ff0000');
  });

  it('should apply custom className', () => {
    const { container } = render(<Icon name="check" className="custom-class" />);

    expect(container.querySelector('svg')).toHaveClass('custom-class');
  });

  it('should render all icon types', () => {
    const icons = [
      'check', 'warning', 'error', 'info', 'money', 'users',
      'growth', 'security', 'code', 'chart', 'target', 'clock',
      'star', 'lightning', 'question', 'arrow-right', 'arrow-up', 'arrow-down'
    ] as const;

    icons.forEach(iconName => {
      const { container } = render(<Icon name={iconName} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.querySelector('path')).toBeInTheDocument();
    });
  });

  it('should have aria-hidden for accessibility', () => {
    const { container } = render(<Icon name="check" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

// ===========================================
// Test Suite: SeverityBadge
// ===========================================

describe('SeverityBadge', () => {
  it('should render with severity text', () => {
    render(<SeverityBadge severity="critical" />);

    expect(screen.getByText('critical')).toBeInTheDocument();
  });

  it('should render custom children', () => {
    render(<SeverityBadge severity="high">High Priority</SeverityBadge>);

    expect(screen.getByText('High Priority')).toBeInTheDocument();
  });

  it('should show icon by default', () => {
    const { container } = render(<SeverityBadge severity="warning" />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    const { container } = render(<SeverityBadge severity="warning" showIcon={false} />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('should apply correct classes for each severity', () => {
    const severities = ['critical', 'high', 'medium', 'low', 'info'] as const;

    severities.forEach(severity => {
      const { container } = render(<SeverityBadge severity={severity} />);
      expect(container.querySelector(`.severity-${severity}`)).toBeInTheDocument();
    });
  });
});

// ===========================================
// Test Suite: CategoryBadge
// ===========================================

describe('CategoryBadge', () => {
  it('should render with category text', () => {
    render(<CategoryBadge category="monetization" />);

    expect(screen.getByText('monetization')).toBeInTheDocument();
  });

  it('should render custom children', () => {
    render(<CategoryBadge category="security">Security Issues</CategoryBadge>);

    expect(screen.getByText('Security Issues')).toBeInTheDocument();
  });

  it('should show icon for known categories', () => {
    const { container } = render(<CategoryBadge category="monetization" />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should not show icon for unknown categories', () => {
    const { container } = render(<CategoryBadge category="unknown" />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('should apply category class', () => {
    const { container } = render(<CategoryBadge category="growth" />);

    expect(container.querySelector('.category-growth')).toBeInTheDocument();
  });

  it('should apply CSS custom property for color', () => {
    const { container } = render(<CategoryBadge category="monetization" />);
    const badge = container.querySelector('.category-badge-v2');

    expect(badge).toHaveStyle({ '--badge-color': 'var(--accent-green)' });
  });
});

// ===========================================
// Test Suite: StatusIndicator
// ===========================================

describe('StatusIndicator', () => {
  it('should render status dot', () => {
    const { container } = render(<StatusIndicator status="online" />);

    expect(container.querySelector('.status-dot')).toBeInTheDocument();
  });

  it('should render label when provided', () => {
    render(<StatusIndicator status="online" label="Connected" />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should not render label when not provided', () => {
    const { container } = render(<StatusIndicator status="offline" />);

    expect(container.querySelector('.status-label')).not.toBeInTheDocument();
  });

  it('should apply status class', () => {
    const statuses = ['online', 'offline', 'pending', 'error'] as const;

    statuses.forEach(status => {
      const { container } = render(<StatusIndicator status={status} />);
      expect(container.querySelector(`.status-${status}`)).toBeInTheDocument();
    });
  });

  it('should have correct dot color for online status', () => {
    const { container } = render(<StatusIndicator status="online" />);
    const dot = container.querySelector('.status-dot');

    expect(dot).toHaveStyle({ backgroundColor: 'var(--accent-green)' });
  });

  it('should have correct dot color for error status', () => {
    const { container } = render(<StatusIndicator status="error" />);
    const dot = container.querySelector('.status-dot');

    expect(dot).toHaveStyle({ backgroundColor: 'var(--accent-red)' });
  });
});
