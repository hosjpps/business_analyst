import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator, type AnalysisStep } from '@/components/ProgressIndicator';

describe('ProgressIndicator', () => {
  it('should not render when idle', () => {
    const { container } = render(<ProgressIndicator currentStep="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when complete', () => {
    const { container } = render(<ProgressIndicator currentStep="complete" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render all steps when active (detailed variant)', () => {
    render(<ProgressIndicator currentStep="analyzing" />);

    // Detailed variant uses short labels
    expect(screen.getByText('Загрузка')).toBeInTheDocument();
    expect(screen.getByText('Получение')).toBeInTheDocument();
    expect(screen.getByText('Анализ')).toBeInTheDocument();
    expect(screen.getByText('Генерация')).toBeInTheDocument();
  });

  it('should render all steps when active (minimal variant)', () => {
    render(<ProgressIndicator currentStep="analyzing" variant="minimal" />);

    // Minimal variant also uses short labels
    expect(screen.getByText('Загрузка')).toBeInTheDocument();
    expect(screen.getByText('Получение')).toBeInTheDocument();
    expect(screen.getByText('Анализ')).toBeInTheDocument();
    expect(screen.getByText('Генерация')).toBeInTheDocument();
  });

  it('should show spinner for active step', () => {
    const { container } = render(<ProgressIndicator currentStep="analyzing" />);
    const spinners = container.querySelectorAll('.spinner-small');
    expect(spinners.length).toBe(1);
  });

  it('should show completed checkmarks (minimal variant)', () => {
    const { container } = render(<ProgressIndicator currentStep="generating" variant="minimal" />);
    const checkmarks = container.querySelectorAll('.checkmark');
    // uploading, fetching, analyzing should be done
    expect(checkmarks.length).toBe(3);
  });

  it('should show completed checkmarks (detailed variant)', () => {
    const { container } = render(<ProgressIndicator currentStep="generating" />);
    // Detailed variant shows SVG checkmark icon for completed steps
    const checkmarkIcons = container.querySelectorAll('.checkmark-icon');
    // uploading, fetching, analyzing should be done
    expect(checkmarkIcons.length).toBe(3);
  });

  it('should handle error state', () => {
    render(<ProgressIndicator currentStep="error" />);
    // Should still render steps
    expect(screen.getByText('Загрузка')).toBeInTheDocument();
  });

  it('should show timer in detailed variant', () => {
    render(<ProgressIndicator currentStep="analyzing" showTimer={true} />);
    // Timer shows "0с" initially
    expect(screen.getByText('0с')).toBeInTheDocument();
  });

  it('should show progress bar in detailed variant', () => {
    const { container } = render(<ProgressIndicator currentStep="analyzing" />);
    const progressBar = container.querySelector('.progress-bar-fill');
    expect(progressBar).toBeInTheDocument();
  });
});
