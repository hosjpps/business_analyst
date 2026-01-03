import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  SkeletonCard,
  SkeletonScore,
  SkeletonCanvas,
  SkeletonGaps,
  SkeletonAnalysisResults,
  SkeletonBusinessAnalysis,
} from '@/components/ui/Skeleton';

// ===========================================
// Base Skeleton Tests
// ===========================================

describe('Skeleton', () => {
  describe('variants', () => {
    it('should render with default text variant', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('skeleton-text');
    });

    it('should render with circle variant', () => {
      const { container } = render(<Skeleton variant="circle" />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveClass('skeleton-circle');
    });

    it('should render with rect variant', () => {
      const { container } = render(<Skeleton variant="rect" />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveClass('skeleton-rect');
    });

    it('should render with card variant', () => {
      const { container } = render(<Skeleton variant="card" />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveClass('skeleton-card');
    });
  });

  describe('animations', () => {
    it('should render with default shimmer animation', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveClass('skeleton-shimmer');
    });

    it('should render with pulse animation', () => {
      const { container } = render(<Skeleton animation="pulse" />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveClass('skeleton-pulse');
    });
  });

  describe('dimensions', () => {
    it('should apply width as number (px)', () => {
      const { container } = render(<Skeleton width={100} />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveStyle({ width: '100px' });
    });

    it('should apply width as string', () => {
      const { container } = render(<Skeleton width="50%" />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveStyle({ width: '50%' });
    });

    it('should apply height as number (px)', () => {
      const { container } = render(<Skeleton height={50} />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveStyle({ height: '50px' });
    });

    it('should apply height as string', () => {
      const { container } = render(<Skeleton height="100%" />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveStyle({ height: '100%' });
    });

    it('should apply both width and height', () => {
      const { container } = render(<Skeleton width={200} height={100} />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
    });
  });

  describe('className', () => {
    it('should apply custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveClass('custom-class');
    });

    it('should combine className with variant and animation classes', () => {
      const { container } = render(
        <Skeleton variant="rect" animation="pulse" className="custom" />
      );
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveClass('skeleton');
      expect(skeleton).toHaveClass('skeleton-rect');
      expect(skeleton).toHaveClass('skeleton-pulse');
      expect(skeleton).toHaveClass('custom');
    });
  });

  describe('accessibility', () => {
    it('should have aria-hidden attribute', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector('.skeleton');

      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });
  });
});

// ===========================================
// SkeletonCard Tests
// ===========================================

describe('SkeletonCard', () => {
  it('should render card wrapper', () => {
    const { container } = render(<SkeletonCard />);
    const wrapper = container.querySelector('.skeleton-card-wrapper');

    expect(wrapper).toBeInTheDocument();
  });

  it('should render multiple skeleton elements', () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll('.skeleton');

    expect(skeletons.length).toBeGreaterThan(1);
  });

  it('should render header skeleton with rect variant', () => {
    const { container } = render(<SkeletonCard />);
    const rectSkeleton = container.querySelector('.skeleton-rect');

    expect(rectSkeleton).toBeInTheDocument();
  });

  it('should render text skeletons in body', () => {
    const { container } = render(<SkeletonCard />);
    const textSkeletons = container.querySelectorAll('.skeleton-text');

    expect(textSkeletons.length).toBeGreaterThanOrEqual(3);
  });
});

// ===========================================
// SkeletonScore Tests
// ===========================================

describe('SkeletonScore', () => {
  it('should render score wrapper', () => {
    const { container } = render(<SkeletonScore />);
    const wrapper = container.querySelector('.skeleton-score-wrapper');

    expect(wrapper).toBeInTheDocument();
  });

  it('should render header with circle and text skeleton', () => {
    const { container } = render(<SkeletonScore />);
    const header = container.querySelector('.skeleton-score-header');
    const circleSkeleton = header?.querySelector('.skeleton-circle');

    expect(header).toBeInTheDocument();
    expect(circleSkeleton).toBeInTheDocument();
  });

  it('should render 4 metric skeletons (for 4 metrics)', () => {
    const { container } = render(<SkeletonScore />);
    const metrics = container.querySelectorAll('.skeleton-metric');

    expect(metrics.length).toBe(4);
  });

  it('should render overall skeleton at bottom', () => {
    const { container } = render(<SkeletonScore />);
    const overall = container.querySelector('.skeleton-overall');

    expect(overall).toBeInTheDocument();
  });
});

// ===========================================
// SkeletonCanvas Tests
// ===========================================

describe('SkeletonCanvas', () => {
  it('should render canvas wrapper', () => {
    const { container } = render(<SkeletonCanvas />);
    const wrapper = container.querySelector('.skeleton-canvas-wrapper');

    expect(wrapper).toBeInTheDocument();
  });

  it('should render header with circle and text skeleton', () => {
    const { container } = render(<SkeletonCanvas />);
    const header = container.querySelector('.skeleton-canvas-header');
    const circleSkeleton = header?.querySelector('.skeleton-circle');

    expect(header).toBeInTheDocument();
    expect(circleSkeleton).toBeInTheDocument();
  });

  it('should render grid with 6 blocks', () => {
    const { container } = render(<SkeletonCanvas />);
    const blocks = container.querySelectorAll('.skeleton-canvas-block');

    expect(blocks.length).toBe(6);
  });

  it('should render text skeletons in each block', () => {
    const { container } = render(<SkeletonCanvas />);
    const blocks = container.querySelectorAll('.skeleton-canvas-block');

    blocks.forEach((block) => {
      const textSkeletons = block.querySelectorAll('.skeleton-text');
      expect(textSkeletons.length).toBeGreaterThanOrEqual(3);
    });
  });
});

// ===========================================
// SkeletonGaps Tests
// ===========================================

describe('SkeletonGaps', () => {
  it('should render gaps wrapper', () => {
    const { container } = render(<SkeletonGaps />);
    const wrapper = container.querySelector('.skeleton-gaps-wrapper');

    expect(wrapper).toBeInTheDocument();
  });

  it('should render header skeleton', () => {
    const { container } = render(<SkeletonGaps />);
    const header = container.querySelector('.skeleton-gaps-header');

    expect(header).toBeInTheDocument();
  });

  it('should render 3 gap cards', () => {
    const { container } = render(<SkeletonGaps />);
    const cards = container.querySelectorAll('.skeleton-gap-card');

    expect(cards.length).toBe(3);
  });

  it('should render badges in gap header', () => {
    const { container } = render(<SkeletonGaps />);
    const firstCard = container.querySelector('.skeleton-gap-card');
    const header = firstCard?.querySelector('.skeleton-gap-header');
    const rectSkeletons = header?.querySelectorAll('.skeleton-rect');

    expect(rectSkeletons?.length).toBeGreaterThanOrEqual(2);
  });

  it('should render footer button skeleton', () => {
    const { container } = render(<SkeletonGaps />);
    const footer = container.querySelector('.skeleton-gap-footer');

    expect(footer).toBeInTheDocument();
  });
});

// ===========================================
// SkeletonAnalysisResults Tests
// ===========================================

describe('SkeletonAnalysisResults', () => {
  it('should render results wrapper', () => {
    const { container } = render(<SkeletonAnalysisResults />);
    const wrapper = container.querySelector('.skeleton-results-wrapper');

    expect(wrapper).toBeInTheDocument();
  });

  it('should include SkeletonScore', () => {
    const { container } = render(<SkeletonAnalysisResults />);
    const scoreWrapper = container.querySelector('.skeleton-score-wrapper');

    expect(scoreWrapper).toBeInTheDocument();
  });

  it('should include SkeletonGaps', () => {
    const { container } = render(<SkeletonAnalysisResults />);
    const gapsWrapper = container.querySelector('.skeleton-gaps-wrapper');

    expect(gapsWrapper).toBeInTheDocument();
  });
});

// ===========================================
// SkeletonBusinessAnalysis Tests
// ===========================================

describe('SkeletonBusinessAnalysis', () => {
  it('should render business wrapper', () => {
    const { container } = render(<SkeletonBusinessAnalysis />);
    const wrapper = container.querySelector('.skeleton-business-wrapper');

    expect(wrapper).toBeInTheDocument();
  });

  it('should include SkeletonCanvas', () => {
    const { container } = render(<SkeletonBusinessAnalysis />);
    const canvasWrapper = container.querySelector('.skeleton-canvas-wrapper');

    expect(canvasWrapper).toBeInTheDocument();
  });
});

// ===========================================
// Snapshot Tests
// ===========================================

describe('Skeleton snapshots', () => {
  it('Skeleton should match snapshot', () => {
    const { container } = render(<Skeleton variant="rect" width={200} height={50} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('SkeletonCard should match snapshot', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('SkeletonScore should match snapshot', () => {
    const { container } = render(<SkeletonScore />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('SkeletonCanvas should match snapshot', () => {
    const { container } = render(<SkeletonCanvas />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('SkeletonGaps should match snapshot', () => {
    const { container } = render(<SkeletonGaps />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
