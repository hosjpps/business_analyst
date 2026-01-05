import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisWizard } from '@/components/forms/AnalysisWizard';
import type { AnalysisWizardData } from '@/components/forms/AnalysisWizard';

// ===========================================
// Mocks
// ===========================================

vi.mock('@/components/forms/BusinessInputForm', () => ({
  BusinessInputForm: ({ value, onChange }: { value: { description: string }; onChange: (v: { description: string }) => void }) => (
    <div data-testid="business-input-form">
      <textarea
        data-testid="business-description"
        value={value.description}
        onChange={(e) => onChange({ ...value, description: e.target.value })}
      />
    </div>
  ),
}));

vi.mock('@/components/forms/CompetitorInputForm', () => ({
  CompetitorInputForm: ({ competitors, onChange }: { competitors: unknown[]; onChange: (v: unknown[]) => void }) => (
    <div data-testid="competitor-input-form">
      <button
        data-testid="add-competitor"
        onClick={() => onChange([...competitors, { url: 'https://example.com', notes: '' }])}
      >
        Add Competitor
      </button>
    </div>
  ),
}));

vi.mock('@/components/UploadForm', () => ({
  UploadForm: ({ files, onFilesChange }: { files: unknown[]; onFilesChange: (f: unknown[]) => void }) => (
    <div data-testid="upload-form">
      <button
        data-testid="add-file"
        onClick={() => onFilesChange([...files, { name: 'test.ts', content: 'test' }])}
      >
        Upload
      </button>
    </div>
  ),
}));

// ===========================================
// Test Helpers
// ===========================================

const defaultOnComplete = vi.fn();

const renderWizard = (props = {}) => {
  return render(
    <AnalysisWizard
      onComplete={defaultOnComplete}
      {...props}
    />
  );
};

// ===========================================
// Step Progress Tests
// ===========================================

describe('AnalysisWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('step progress', () => {
    it('should render all 3 steps in progress bar', () => {
      const { container } = renderWizard();

      const progressSteps = container.querySelectorAll('.progress-step');
      expect(progressSteps.length).toBe(3);
      expect(progressSteps[0]).toHaveTextContent('О бизнесе');
      expect(progressSteps[1]).toHaveTextContent('Код');
      expect(progressSteps[2]).toHaveTextContent('Конкуренты');
    });

    it('should mark first step as active', () => {
      const { container } = renderWizard();

      const steps = container.querySelectorAll('.progress-step');
      expect(steps[0]).toHaveClass('active');
      expect(steps[1]).not.toHaveClass('active');
      expect(steps[2]).not.toHaveClass('active');
    });

    it('should show step numbers', () => {
      renderWizard();

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  // ===========================================
  // Step Header Tests
  // ===========================================

  describe('step header', () => {
    it('should show business step header on step 1', () => {
      renderWizard();

      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('Расскажите о своём бизнесе')).toBeInTheDocument();
    });

    it('should show optional badge for competitors step', async () => {
      renderWizard({
        initialData: {
          businessInput: { description: 'a'.repeat(100), social_links: {} },
          repoUrl: 'https://github.com/user/repo',
          description: 'Test project description',
        },
      });

      // Navigate to step 2
      fireEvent.click(screen.getByText('Далее →'));

      // Navigate to step 3
      fireEvent.click(screen.getByText('Далее →'));

      // Should see optional badge
      expect(screen.getAllByText('опционально').length).toBeGreaterThan(0);
    });
  });

  // ===========================================
  // Navigation Tests
  // ===========================================

  describe('navigation', () => {
    it('should disable back button on first step', () => {
      renderWizard();

      const backButton = screen.getByText('← Назад');
      expect(backButton).toBeDisabled();
    });

    it('should enable back button on second step', () => {
      renderWizard({
        initialData: {
          businessInput: { description: 'a'.repeat(100), social_links: {} },
        },
      });

      fireEvent.click(screen.getByText('Далее →'));

      const backButton = screen.getByText('← Назад');
      expect(backButton).not.toBeDisabled();
    });

    it('should go back to previous step on back click', () => {
      renderWizard({
        initialData: {
          businessInput: { description: 'a'.repeat(100), social_links: {} },
        },
      });

      // Go to step 2
      fireEvent.click(screen.getByText('Далее →'));
      expect(screen.getByText('💻')).toBeInTheDocument();

      // Go back to step 1
      fireEvent.click(screen.getByText('← Назад'));
      expect(screen.getByText('📊')).toBeInTheDocument();
    });

    it('should call onStepChange when navigating', () => {
      const onStepChange = vi.fn();

      renderWizard({
        onStepChange,
        initialData: {
          businessInput: { description: 'a'.repeat(100), social_links: {} },
        },
      });

      fireEvent.click(screen.getByText('Далее →'));

      expect(onStepChange).toHaveBeenCalledWith(1);
    });

    it('should show optional badge on optional step', () => {
      renderWizard({
        initialData: {
          businessInput: { description: 'a'.repeat(100), social_links: {} },
          repoUrl: 'https://github.com/user/repo',
          description: 'Test description',
        },
      });

      // Navigate to step 2
      fireEvent.click(screen.getByText('Далее →'));

      // Navigate to step 3 (competitors - optional)
      fireEvent.click(screen.getByText('Далее →'));

      // Step 3 is optional but it's the last step, so skip button won't show
      // Instead, the submit button "🚀 Запустить анализ" appears and user can just submit
      expect(screen.getByText('🚀 Запустить анализ')).toBeInTheDocument();
      // Optional badge should still appear
      expect(screen.getAllByText('опционально').length).toBeGreaterThan(0);
    });

    it('should allow clicking on completed steps', () => {
      renderWizard({
        initialData: {
          businessInput: { description: 'a'.repeat(100), social_links: {} },
        },
      });

      // Go to step 2
      fireEvent.click(screen.getByText('Далее →'));

      // Click on step 1 indicator
      const { container } = render(<div />);
      const steps = document.querySelectorAll('.progress-step');
      if (steps[0]) {
        fireEvent.click(steps[0]);
      }
    });
  });

  // ===========================================
  // Validation Tests
  // ===========================================

  describe('validation', () => {
    it('should show error for short business description', () => {
      renderWizard({
        initialData: {
          businessInput: { description: 'short', social_links: {} },
        },
      });

      fireEvent.click(screen.getByText('Далее →'));

      expect(screen.getByText(/Опишите бизнес подробнее/)).toBeInTheDocument();
    });

    it('should not navigate if validation fails', () => {
      renderWizard({
        initialData: {
          businessInput: { description: 'short', social_links: {} },
        },
      });

      fireEvent.click(screen.getByText('Далее →'));

      // Should still be on step 1
      expect(screen.getByText('📊')).toBeInTheDocument();
    });

    it('should require GitHub URL or files on code step', () => {
      renderWizard({
        initialData: {
          businessInput: { description: 'a'.repeat(100), social_links: {} },
          repoUrl: '',
          uploadedFiles: [],
        },
      });

      // Go to step 2
      fireEvent.click(screen.getByText('Далее →'));

      // Try to proceed without URL/files
      fireEvent.click(screen.getByText('Далее →'));

      expect(screen.getByText('Укажите GitHub URL или загрузите файлы')).toBeInTheDocument();
    });

    it('should not require validation on optional step', () => {
      renderWizard({
        initialData: {
          businessInput: { description: 'a'.repeat(100), social_links: {} },
          repoUrl: 'https://github.com/user/repo',
          description: 'Test description',
          competitors: [],
        },
      });

      // Navigate to step 2
      fireEvent.click(screen.getByText('Далее →'));

      // Navigate to step 3
      fireEvent.click(screen.getByText('Далее →'));

      // Click complete without competitors
      fireEvent.click(screen.getByText('🚀 Запустить анализ'));

      expect(defaultOnComplete).toHaveBeenCalled();
    });
  });

  // ===========================================
  // Completion Tests
  // ===========================================

  describe('completion', () => {
    it('should show submit button on last step', () => {
      renderWizard({
        initialData: {
          businessInput: { description: 'a'.repeat(100), social_links: {} },
          repoUrl: 'https://github.com/user/repo',
          description: 'Test description',
        },
      });

      // Navigate to step 2
      fireEvent.click(screen.getByText('Далее →'));

      // Navigate to step 3
      fireEvent.click(screen.getByText('Далее →'));

      expect(screen.getByText('🚀 Запустить анализ')).toBeInTheDocument();
    });

    it('should call onComplete with all data', () => {
      const onComplete = vi.fn();

      render(
        <AnalysisWizard
          onComplete={onComplete}
          initialData={{
            businessInput: { description: 'a'.repeat(100), social_links: {} },
            repoUrl: 'https://github.com/user/repo',
            uploadedFiles: [],
            description: 'Test description',
            competitors: [{ name: 'Competitor', url: 'https://competitor.com', notes: 'Test' }],
          }}
        />
      );

      // Navigate through all steps
      fireEvent.click(screen.getByText('Далее →'));
      fireEvent.click(screen.getByText('Далее →'));
      fireEvent.click(screen.getByText('🚀 Запустить анализ'));

      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          businessInput: expect.objectContaining({ description: 'a'.repeat(100) }),
          repoUrl: 'https://github.com/user/repo',
          description: 'Test description',
          competitors: expect.arrayContaining([
            expect.objectContaining({ url: 'https://competitor.com' }),
          ]),
        })
      );
    });
  });

  // ===========================================
  // Disabled State Tests
  // ===========================================

  describe('disabled state', () => {
    it('should disable all buttons when disabled prop is true', () => {
      renderWizard({
        disabled: true,
        initialData: {
          businessInput: { description: 'a'.repeat(100), social_links: {} },
        },
      });

      expect(screen.getByText('← Назад')).toBeDisabled();
      expect(screen.getByText('Далее →')).toBeDisabled();
    });
  });

  // ===========================================
  // Initial Data Tests
  // ===========================================

  describe('initial data', () => {
    it('should populate form with initial data', () => {
      const initialData: Partial<AnalysisWizardData> = {
        businessInput: { description: 'Initial business description', social_links: {} },
        repoUrl: 'https://github.com/initial/repo',
        description: 'Initial project description',
      };

      renderWizard({ initialData });

      // Check business input is pre-filled
      expect(screen.getByTestId('business-description')).toHaveValue('Initial business description');
    });
  });
});

// ===========================================
// Content Tests
// ===========================================

describe('AnalysisWizard step content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render BusinessInputForm on step 1', () => {
    renderWizard();

    expect(screen.getByTestId('business-input-form')).toBeInTheDocument();
  });

  it('should render UploadForm on step 2', () => {
    renderWizard({
      initialData: {
        businessInput: { description: 'a'.repeat(100), social_links: {} },
      },
    });

    fireEvent.click(screen.getByText('Далее →'));

    expect(screen.getByTestId('upload-form')).toBeInTheDocument();
  });

  it('should render CompetitorInputForm on step 3', () => {
    renderWizard({
      initialData: {
        businessInput: { description: 'a'.repeat(100), social_links: {} },
        repoUrl: 'https://github.com/user/repo',
        description: 'Test description',
      },
    });

    fireEvent.click(screen.getByText('Далее →'));
    fireEvent.click(screen.getByText('Далее →'));

    expect(screen.getByTestId('competitor-input-form')).toBeInTheDocument();
  });

  it('should show GitHub URL input on step 2', () => {
    renderWizard({
      initialData: {
        businessInput: { description: 'a'.repeat(100), social_links: {} },
      },
    });

    fireEvent.click(screen.getByText('Далее →'));

    expect(screen.getByLabelText('GitHub URL')).toBeInTheDocument();
  });

});
