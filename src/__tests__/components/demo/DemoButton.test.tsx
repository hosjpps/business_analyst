import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DemoButton } from '@/components/demo/DemoButton';

describe('DemoButton', () => {
  it('should render with default remaining count', () => {
    const onClick = vi.fn();
    render(<DemoButton onClick={onClick} />);

    expect(screen.getByText('Попробовать бесплатно')).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument(); // Default 3 demos
  });

  it('should render with custom remaining count', () => {
    const onClick = vi.fn();
    render(<DemoButton onClick={onClick} remaining={2} />);

    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('should not show badge when remaining is 0', () => {
    const onClick = vi.fn();
    render(<DemoButton onClick={onClick} remaining={0} />);

    // Badge should not be rendered
    expect(screen.queryByText(/0/)).not.toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<DemoButton onClick={onClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should have sparkle icon', () => {
    const onClick = vi.fn();
    render(<DemoButton onClick={onClick} />);

    expect(screen.getByText('✨')).toBeInTheDocument();
  });

  it('should show correct Russian word form for 1', () => {
    const onClick = vi.fn();
    render(<DemoButton onClick={onClick} remaining={1} />);

    expect(screen.getByText(/1 анализ/)).toBeInTheDocument();
  });

  it('should show correct Russian word form for 2-4', () => {
    const onClick = vi.fn();
    render(<DemoButton onClick={onClick} remaining={2} />);

    expect(screen.getByText(/2 анализа/)).toBeInTheDocument();
  });
});
