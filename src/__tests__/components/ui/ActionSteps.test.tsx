import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ActionSteps,
  ActionPlanCard,
  WhyImportant,
  QuickWinBadge,
  NumberedList,
  TipBox,
} from '@/components/ui/ActionSteps';
import type { ActionStep, ActionPlan } from '@/types/ux';

describe('ActionSteps', () => {
  const createSteps = (): ActionStep[] => [
    {
      number: 1,
      title: 'Зарегистрируйтесь в Stripe',
      description: 'Создайте аккаунт разработчика и получите API ключи',
      difficulty: 'easy',
      estimatedTime: '15 минут',
      tools: ['Stripe Dashboard'],
    },
    {
      number: 2,
      title: 'Установите SDK',
      description: 'Добавьте Stripe SDK в ваш проект',
      difficulty: 'easy',
      estimatedTime: '5 минут',
      tools: ['npm', 'Terminal'],
    },
    {
      number: 3,
      title: 'Создайте Checkout Session',
      description: 'Реализуйте серверную логику для создания платёжной сессии',
      difficulty: 'medium',
      estimatedTime: '1-2 часа',
      tools: ['VS Code', 'Node.js'],
    },
    {
      number: 4,
      title: 'Настройте вебхуки',
      description: 'Обрабатывайте события платежей для обновления статуса заказов',
      difficulty: 'hard',
      estimatedTime: '2-3 часа',
      tools: ['ngrok', 'Stripe CLI'],
    },
  ];

  describe('Basic Rendering', () => {
    it('renders all steps', () => {
      render(<ActionSteps steps={createSteps()} />);

      expect(screen.getByText('Зарегистрируйтесь в Stripe')).toBeInTheDocument();
      expect(screen.getByText('Установите SDK')).toBeInTheDocument();
      expect(screen.getByText('Создайте Checkout Session')).toBeInTheDocument();
      expect(screen.getByText('Настройте вебхуки')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<ActionSteps steps={createSteps()} title="Интеграция Stripe" />);

      expect(screen.getByText('Интеграция Stripe')).toBeInTheDocument();
    });

    it('renders step numbers', () => {
      render(<ActionSteps steps={createSteps()} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('renders step descriptions', () => {
      render(<ActionSteps steps={createSteps()} />);

      expect(screen.getByText('Создайте аккаунт разработчика и получите API ключи')).toBeInTheDocument();
      expect(screen.getByText('Добавьте Stripe SDK в ваш проект')).toBeInTheDocument();
    });
  });

  describe('Difficulty Display', () => {
    it('shows easy difficulty in Russian', () => {
      render(<ActionSteps steps={createSteps()} />);

      expect(screen.getAllByText('Легко')).toHaveLength(2);
    });

    it('shows medium difficulty in Russian', () => {
      render(<ActionSteps steps={createSteps()} />);

      expect(screen.getByText('Средне')).toBeInTheDocument();
    });

    it('shows hard difficulty in Russian', () => {
      render(<ActionSteps steps={createSteps()} />);

      expect(screen.getByText('Сложно')).toBeInTheDocument();
    });
  });

  describe('Time Estimates', () => {
    it('renders estimated time for each step', () => {
      render(<ActionSteps steps={createSteps()} />);

      expect(screen.getByText('15 минут')).toBeInTheDocument();
      expect(screen.getByText('5 минут')).toBeInTheDocument();
      expect(screen.getByText('1-2 часа')).toBeInTheDocument();
      expect(screen.getByText('2-3 часа')).toBeInTheDocument();
    });
  });

  describe('Tools', () => {
    it('renders tools list', () => {
      render(<ActionSteps steps={createSteps()} />);

      expect(screen.getByText('Stripe Dashboard')).toBeInTheDocument();
      expect(screen.getByText('npm')).toBeInTheDocument();
      expect(screen.getByText('Terminal')).toBeInTheDocument();
      expect(screen.getByText('ngrok')).toBeInTheDocument();
    });

    it('shows tools label', () => {
      render(<ActionSteps steps={createSteps()} />);

      expect(screen.getAllByText('Инструменты:')).toHaveLength(4);
    });
  });
});

describe('ActionPlanCard', () => {
  const createPlan = (): ActionPlan => ({
    title: 'Интеграция платежей',
    whyImportant: 'Без возможности принимать оплату вы не сможете монетизировать продукт',
    steps: [
      {
        number: 1,
        title: 'Выберите платёжный провайдер',
        description: 'Сравните Stripe, PayPal и локальные решения',
        difficulty: 'easy',
        estimatedTime: '30 минут',
      },
      {
        number: 2,
        title: 'Интегрируйте SDK',
        description: 'Добавьте библиотеку в проект',
        difficulty: 'medium',
        estimatedTime: '2 часа',
      },
    ],
    expectedResult: 'Пользователи смогут оплачивать подписку напрямую в приложении',
  });

  describe('Collapsed State', () => {
    it('renders title', () => {
      render(<ActionPlanCard plan={createPlan()} />);

      expect(screen.getByText('Интеграция платежей')).toBeInTheDocument();
    });

    it('shows steps count', () => {
      render(<ActionPlanCard plan={createPlan()} />);

      expect(screen.getByText('2 шагов')).toBeInTheDocument();
    });

    it('does not show content when collapsed', () => {
      render(<ActionPlanCard plan={createPlan()} expanded={false} />);

      expect(screen.queryByText('Без возможности принимать оплату вы не сможете монетизировать продукт')).not.toBeInTheDocument();
    });
  });

  describe('Expanded State', () => {
    it('shows why important when expanded', () => {
      render(<ActionPlanCard plan={createPlan()} expanded={true} />);

      expect(screen.getByText('Без возможности принимать оплату вы не сможете монетизировать продукт')).toBeInTheDocument();
    });

    it('shows all steps when expanded', () => {
      render(<ActionPlanCard plan={createPlan()} expanded={true} />);

      expect(screen.getByText('Выберите платёжный провайдер')).toBeInTheDocument();
      expect(screen.getByText('Интегрируйте SDK')).toBeInTheDocument();
    });

    it('shows expected result when expanded', () => {
      render(<ActionPlanCard plan={createPlan()} expanded={true} />);

      expect(screen.getByText('Пользователи смогут оплачивать подписку напрямую в приложении')).toBeInTheDocument();
      expect(screen.getByText('Результат:')).toBeInTheDocument();
    });
  });

  describe('Toggle Functionality', () => {
    it('calls onToggle when header is clicked', () => {
      const mockOnToggle = vi.fn();
      render(<ActionPlanCard plan={createPlan()} onToggle={mockOnToggle} />);

      fireEvent.click(screen.getByText('Интеграция платежей'));

      expect(mockOnToggle).toHaveBeenCalled();
    });

    it('shows toggle button when onToggle is provided', () => {
      const mockOnToggle = vi.fn();
      render(<ActionPlanCard plan={createPlan()} onToggle={mockOnToggle} />);

      const toggleButton = document.querySelector('.action-plan-toggle');
      expect(toggleButton).toBeInTheDocument();
    });

    it('does not show toggle button when onToggle is not provided', () => {
      render(<ActionPlanCard plan={createPlan()} />);

      const toggleButton = document.querySelector('.action-plan-toggle');
      expect(toggleButton).not.toBeInTheDocument();
    });
  });
});

describe('WhyImportant', () => {
  it('renders with default title', () => {
    render(<WhyImportant text="This is important because..." />);

    expect(screen.getByText('Почему это важно?')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<WhyImportant text="This is important" title="Custom Title" />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders the text content', () => {
    render(<WhyImportant text="Без этого бизнес не будет расти" />);

    expect(screen.getByText('Без этого бизнес не будет расти')).toBeInTheDocument();
  });

  it('has the correct CSS class', () => {
    const { container } = render(<WhyImportant text="Test" />);

    expect(container.querySelector('.why-important')).toBeInTheDocument();
  });
});

describe('QuickWinBadge', () => {
  it('renders with estimated time', () => {
    render(<QuickWinBadge estimatedTime="15 минут" />);

    expect(screen.getByText('Quick Win: 15 минут')).toBeInTheDocument();
  });

  it('has the correct CSS class', () => {
    const { container } = render(<QuickWinBadge estimatedTime="30 минут" />);

    expect(container.querySelector('.quick-win-badge')).toBeInTheDocument();
  });
});

describe('NumberedList', () => {
  it('renders all items', () => {
    const items = ['First item', 'Second item', 'Third item'];
    render(<NumberedList items={items} />);

    expect(screen.getByText('First item')).toBeInTheDocument();
    expect(screen.getByText('Second item')).toBeInTheDocument();
    expect(screen.getByText('Third item')).toBeInTheDocument();
  });

  it('starts from 1 by default', () => {
    const items = ['First', 'Second'];
    render(<NumberedList items={items} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('respects startFrom prop', () => {
    const items = ['Fifth', 'Sixth'];
    render(<NumberedList items={items} startFrom={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('sets correct start attribute on ol', () => {
    const items = ['Item'];
    const { container } = render(<NumberedList items={items} startFrom={10} />);

    const ol = container.querySelector('ol');
    expect(ol).toHaveAttribute('start', '10');
  });
});

describe('TipBox', () => {
  describe('Types', () => {
    it('renders tip type with default title', () => {
      render(<TipBox type="tip">Tip content</TipBox>);

      expect(screen.getByText('Совет')).toBeInTheDocument();
      expect(screen.getByText('Tip content')).toBeInTheDocument();
    });

    it('renders warning type', () => {
      render(<TipBox type="warning">Warning content</TipBox>);

      expect(screen.getByText('Внимание')).toBeInTheDocument();
    });

    it('renders info type', () => {
      render(<TipBox type="info">Info content</TipBox>);

      expect(screen.getByText('Информация')).toBeInTheDocument();
    });

    it('renders success type', () => {
      render(<TipBox type="success">Success content</TipBox>);

      expect(screen.getByText('Готово')).toBeInTheDocument();
    });
  });

  describe('Custom Title', () => {
    it('uses custom title when provided', () => {
      render(<TipBox type="tip" title="Полезный совет">Content</TipBox>);

      expect(screen.getByText('Полезный совет')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('applies correct class for tip type', () => {
      const { container } = render(<TipBox type="tip">Content</TipBox>);

      expect(container.querySelector('.tip-box-tip')).toBeInTheDocument();
    });

    it('applies correct class for warning type', () => {
      const { container } = render(<TipBox type="warning">Content</TipBox>);

      expect(container.querySelector('.tip-box-warning')).toBeInTheDocument();
    });

    it('applies correct class for info type', () => {
      const { container } = render(<TipBox type="info">Content</TipBox>);

      expect(container.querySelector('.tip-box-info')).toBeInTheDocument();
    });

    it('applies correct class for success type', () => {
      const { container } = render(<TipBox type="success">Content</TipBox>);

      expect(container.querySelector('.tip-box-success')).toBeInTheDocument();
    });
  });

  describe('Children', () => {
    it('renders complex children', () => {
      render(
        <TipBox type="tip">
          <p>Paragraph one</p>
          <ul>
            <li>List item</li>
          </ul>
        </TipBox>
      );

      expect(screen.getByText('Paragraph one')).toBeInTheDocument();
      expect(screen.getByText('List item')).toBeInTheDocument();
    });
  });

  describe('Default Type', () => {
    it('uses tip as default type', () => {
      const { container } = render(<TipBox>Default content</TipBox>);

      expect(container.querySelector('.tip-box-tip')).toBeInTheDocument();
      expect(screen.getByText('Совет')).toBeInTheDocument();
    });
  });
});
