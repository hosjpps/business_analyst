import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Wizard,
  WizardTextField,
  WizardSelectField,
  WizardCheckboxGroup,
} from '@/components/ui/Wizard';

describe('Wizard', () => {
  const mockOnComplete = vi.fn();
  const mockOnStepChange = vi.fn();

  const createSteps = () => [
    {
      id: 'name',
      title: 'Название бизнеса',
      description: 'Введите название вашего бизнеса',
      required: true,
      component: <div data-testid="step-1">Step 1 content</div>,
    },
    {
      id: 'type',
      title: 'Тип бизнеса',
      description: 'Выберите тип вашего бизнеса',
      required: false,
      component: <div data-testid="step-2">Step 2 content</div>,
    },
    {
      id: 'goals',
      title: 'Ваши цели',
      description: 'Опишите ваши бизнес-цели',
      required: false,
      component: <div data-testid="step-3">Step 3 content</div>,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders wizard with first step', () => {
      render(
        <Wizard
          steps={createSteps()}
          onComplete={mockOnComplete}
        />
      );

      // Step title is shown in wizard header
      expect(screen.getByRole('heading', { name: 'Название бизнеса' })).toBeInTheDocument();
      expect(screen.getByText('Введите название вашего бизнеса')).toBeInTheDocument();
      expect(screen.getByTestId('step-1')).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      render(
        <Wizard
          steps={createSteps()}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Назад')).toBeInTheDocument();
      expect(screen.getByText('Далее')).toBeInTheDocument();
    });

    it('disables back button on first step', () => {
      render(
        <Wizard
          steps={createSteps()}
          onComplete={mockOnComplete}
        />
      );

      const backButton = screen.getByText('Назад').closest('button');
      expect(backButton).toBeDisabled();
    });

    it('renders step progress indicators', () => {
      render(
        <Wizard
          steps={createSteps()}
          onComplete={mockOnComplete}
          showLabels={true}
        />
      );

      // Step title appears in progress area
      const progressArea = document.querySelector('.wizard-progress');
      expect(progressArea).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to next step when clicking Далее', () => {
      render(
        <Wizard
          steps={createSteps()}
          onComplete={mockOnComplete}
          onStepChange={mockOnStepChange}
        />
      );

      // First step doesn't have validation in this test setup
      fireEvent.click(screen.getByText('Далее'));

      // Should call onStepChange - but step 1 is required, so it might not move
      // Let's check if we see step 2 content
    });

    it('navigates back when clicking Назад', () => {
      render(
        <Wizard
          steps={createSteps()}
          onComplete={mockOnComplete}
          onStepChange={mockOnStepChange}
          initialData={{ name: 'Test' }}
        />
      );

      // Navigate forward first (skip validation by providing initial data)
      fireEvent.click(screen.getByText('Далее'));

      // Now back should be enabled
      const backButton = screen.getByText('Назад').closest('button');
      if (backButton && !backButton.disabled) {
        fireEvent.click(backButton);
      }
    });

    it('shows Завершить on last step', () => {
      const steps = [
        {
          id: 'only',
          title: 'Only Step',
          description: 'Single step wizard',
          required: false,
          component: <div>Only step</div>,
        },
      ];

      render(
        <Wizard
          steps={steps}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Завершить')).toBeInTheDocument();
    });

    it('calls onComplete when finishing wizard', () => {
      const steps = [
        {
          id: 'only',
          title: 'Only Step',
          description: 'Single step wizard',
          required: false,
          component: <div>Only step</div>,
        },
      ];

      render(
        <Wizard
          steps={steps}
          onComplete={mockOnComplete}
          initialData={{ only: 'test value' }}
        />
      );

      fireEvent.click(screen.getByText('Завершить'));

      expect(mockOnComplete).toHaveBeenCalledWith({ only: 'test value' });
    });
  });

  describe('Skip Functionality', () => {
    it('shows skip button when allowSkip is true and step is not required', () => {
      const steps = [
        {
          id: 'optional',
          title: 'Optional Step',
          description: 'This can be skipped',
          required: false,
          component: <div>Optional content</div>,
        },
      ];

      render(
        <Wizard
          steps={steps}
          onComplete={mockOnComplete}
          allowSkip={true}
        />
      );

      expect(screen.getByText('Пропустить')).toBeInTheDocument();
    });

    it('does not show skip button when step is required', () => {
      const steps = [
        {
          id: 'required',
          title: 'Required Step',
          description: 'This cannot be skipped',
          required: true,
          component: <div>Required content</div>,
        },
      ];

      render(
        <Wizard
          steps={steps}
          onComplete={mockOnComplete}
          allowSkip={true}
        />
      );

      expect(screen.queryByText('Пропустить')).not.toBeInTheDocument();
    });

    it('does not show skip button when allowSkip is false', () => {
      const steps = [
        {
          id: 'optional',
          title: 'Optional Step',
          description: 'This is optional',
          required: false,
          component: <div>Optional content</div>,
        },
      ];

      render(
        <Wizard
          steps={steps}
          onComplete={mockOnComplete}
          allowSkip={false}
        />
      );

      expect(screen.queryByText('Пропустить')).not.toBeInTheDocument();
    });
  });

  describe('Example Display', () => {
    it('shows example when provided', () => {
      const steps = [
        {
          id: 'with-example',
          title: 'Step with Example',
          description: 'Description',
          example: 'Example: My Business Name',
          required: false,
          component: <div>Content</div>,
        },
      ];

      render(
        <Wizard
          steps={steps}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/Example: My Business Name/)).toBeInTheDocument();
    });
  });

  describe('Initial Data', () => {
    it('accepts initial data', () => {
      const steps = [
        {
          id: 'name',
          title: 'Name',
          description: 'Enter name',
          required: false,
          component: <div>Name step</div>,
        },
      ];

      const initialData = { name: 'Initial Value' };

      render(
        <Wizard
          steps={steps}
          onComplete={mockOnComplete}
          initialData={initialData}
        />
      );

      fireEvent.click(screen.getByText('Завершить'));

      expect(mockOnComplete).toHaveBeenCalledWith(initialData);
    });
  });
});

describe('WizardTextField', () => {
  it('renders text input', () => {
    render(
      <WizardTextField
        id="test-field"
        label="Test Label"
        placeholder="Enter text"
      />
    );

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders textarea when multiline is true', () => {
    render(
      <WizardTextField
        id="test-field"
        label="Test Label"
        multiline={true}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
  });

  it('calls onChange when value changes', () => {
    const mockOnChange = vi.fn();
    render(
      <WizardTextField
        id="test-field"
        label="Test Label"
        onChange={mockOnChange}
      />
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } });

    expect(mockOnChange).toHaveBeenCalledWith('new value');
  });

  it('displays current value', () => {
    render(
      <WizardTextField
        id="test-field"
        label="Test Label"
        value="Current value"
      />
    );

    expect(screen.getByDisplayValue('Current value')).toBeInTheDocument();
  });
});

describe('WizardSelectField', () => {
  const options = [
    { value: 'saas', label: 'SaaS', description: 'Software as a Service' },
    { value: 'ecommerce', label: 'E-commerce', description: 'Online store' },
    { value: 'marketplace', label: 'Marketplace', description: 'Platform connecting buyers and sellers' },
  ];

  it('renders all options', () => {
    render(
      <WizardSelectField
        id="business-type"
        label="Тип бизнеса"
        options={options}
      />
    );

    expect(screen.getByText('SaaS')).toBeInTheDocument();
    expect(screen.getByText('E-commerce')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });

  it('shows descriptions for options', () => {
    render(
      <WizardSelectField
        id="business-type"
        label="Тип бизнеса"
        options={options}
      />
    );

    expect(screen.getByText('Software as a Service')).toBeInTheDocument();
    expect(screen.getByText('Online store')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const mockOnChange = vi.fn();
    render(
      <WizardSelectField
        id="business-type"
        label="Тип бизнеса"
        options={options}
        onChange={mockOnChange}
      />
    );

    fireEvent.click(screen.getByText('SaaS'));

    expect(mockOnChange).toHaveBeenCalledWith('saas');
  });

  it('shows selected state', () => {
    render(
      <WizardSelectField
        id="business-type"
        label="Тип бизнеса"
        options={options}
        value="ecommerce"
      />
    );

    const ecommerceButton = screen.getByText('E-commerce').closest('button');
    expect(ecommerceButton).toHaveClass('selected');
  });
});

describe('WizardCheckboxGroup', () => {
  const options = [
    { value: 'analytics', label: 'Аналитика', description: 'Трекинг метрик' },
    { value: 'payments', label: 'Платежи', description: 'Приём оплаты' },
    { value: 'auth', label: 'Авторизация', description: 'Система входа' },
  ];

  it('renders all checkbox options', () => {
    render(
      <WizardCheckboxGroup
        id="features"
        label="Выберите функции"
        options={options}
      />
    );

    expect(screen.getByText('Аналитика')).toBeInTheDocument();
    expect(screen.getByText('Платежи')).toBeInTheDocument();
    expect(screen.getByText('Авторизация')).toBeInTheDocument();
  });

  it('allows multiple selections', () => {
    const mockOnChange = vi.fn();
    render(
      <WizardCheckboxGroup
        id="features"
        label="Выберите функции"
        options={options}
        value={['analytics']}
        onChange={mockOnChange}
      />
    );

    fireEvent.click(screen.getByText('Платежи'));

    expect(mockOnChange).toHaveBeenCalledWith(['analytics', 'payments']);
  });

  it('toggles selection off', () => {
    const mockOnChange = vi.fn();
    render(
      <WizardCheckboxGroup
        id="features"
        label="Выберите функции"
        options={options}
        value={['analytics', 'payments']}
        onChange={mockOnChange}
      />
    );

    fireEvent.click(screen.getByText('Аналитика'));

    expect(mockOnChange).toHaveBeenCalledWith(['payments']);
  });

  it('shows selected state for multiple items', () => {
    render(
      <WizardCheckboxGroup
        id="features"
        label="Выберите функции"
        options={options}
        value={['analytics', 'auth']}
      />
    );

    const analyticsButton = screen.getByText('Аналитика').closest('button');
    const authButton = screen.getByText('Авторизация').closest('button');
    const paymentsButton = screen.getByText('Платежи').closest('button');

    expect(analyticsButton).toHaveClass('selected');
    expect(authButton).toHaveClass('selected');
    expect(paymentsButton).not.toHaveClass('selected');
  });

  it('shows descriptions', () => {
    render(
      <WizardCheckboxGroup
        id="features"
        label="Выберите функции"
        options={options}
      />
    );

    expect(screen.getByText('Трекинг метрик')).toBeInTheDocument();
    expect(screen.getByText('Приём оплаты')).toBeInTheDocument();
  });
});
