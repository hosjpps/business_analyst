import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FAQList, FAQSection, ContextualFAQ, InlineHelp } from '@/components/ui/FAQ';
import type { FAQItem, FAQSection as FAQSectionType } from '@/types/ux';

describe('FAQList', () => {
  const createItems = (): FAQItem[] => [
    {
      id: 'faq-1',
      question: 'Что такое MRR?',
      answer: 'MRR — это Monthly Recurring Revenue, ежемесячный регулярный доход от подписок.',
      example: 'Если у вас 100 пользователей платят $10/мес, то MRR = $1000',
    },
    {
      id: 'faq-2',
      question: 'Как работает анализ кода?',
      answer: 'Система проверяет структуру проекта, используемые технологии и качество кода.',
    },
    {
      id: 'faq-3',
      question: 'Можно ли анализировать приватные репозитории?',
      answer: 'Да, для этого нужен GitHub токен с правами на чтение.',
      learnMoreUrl: 'https://docs.github.com/tokens',
    },
  ];

  describe('Basic Rendering', () => {
    it('renders all FAQ items', () => {
      render(<FAQList items={createItems()} />);

      expect(screen.getByText('Что такое MRR?')).toBeInTheDocument();
      expect(screen.getByText('Как работает анализ кода?')).toBeInTheDocument();
      expect(screen.getByText('Можно ли анализировать приватные репозитории?')).toBeInTheDocument();
    });

    it('does not show answers by default', () => {
      render(<FAQList items={createItems()} />);

      expect(
        screen.queryByText('MRR — это Monthly Recurring Revenue, ежемесячный регулярный доход от подписок.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Expand/Collapse', () => {
    it('expands item when clicked', () => {
      render(<FAQList items={createItems()} />);

      fireEvent.click(screen.getByText('Что такое MRR?'));

      expect(
        screen.getByText('MRR — это Monthly Recurring Revenue, ежемесячный регулярный доход от подписок.')
      ).toBeInTheDocument();
    });

    it('shows example when expanded', () => {
      render(<FAQList items={createItems()} />);

      fireEvent.click(screen.getByText('Что такое MRR?'));

      expect(
        screen.getByText(/Если у вас 100 пользователей платят \$10\/мес/)
      ).toBeInTheDocument();
    });

    it('shows learn more link when provided', () => {
      render(<FAQList items={createItems()} />);

      fireEvent.click(screen.getByText('Можно ли анализировать приватные репозитории?'));

      const learnMoreLink = screen.getByText('Узнать больше');
      expect(learnMoreLink).toBeInTheDocument();
      expect(learnMoreLink).toHaveAttribute('href', 'https://docs.github.com/tokens');
    });

    it('collapses item when clicked again', () => {
      render(<FAQList items={createItems()} />);

      // Expand
      fireEvent.click(screen.getByText('Что такое MRR?'));
      expect(
        screen.getByText('MRR — это Monthly Recurring Revenue, ежемесячный регулярный доход от подписок.')
      ).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText('Что такое MRR?'));
      expect(
        screen.queryByText('MRR — это Monthly Recurring Revenue, ежемесячный регулярный доход от подписок.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Single vs Multiple Mode', () => {
    it('closes other items when allowMultiple is false (default)', () => {
      render(<FAQList items={createItems()} allowMultiple={false} />);

      // Expand first item
      fireEvent.click(screen.getByText('Что такое MRR?'));
      expect(
        screen.getByText('MRR — это Monthly Recurring Revenue, ежемесячный регулярный доход от подписок.')
      ).toBeInTheDocument();

      // Expand second item - first should close
      fireEvent.click(screen.getByText('Как работает анализ кода?'));
      expect(
        screen.queryByText('MRR — это Monthly Recurring Revenue, ежемесячный регулярный доход от подписок.')
      ).not.toBeInTheDocument();
      expect(
        screen.getByText('Система проверяет структуру проекта, используемые технологии и качество кода.')
      ).toBeInTheDocument();
    });

    it('keeps other items open when allowMultiple is true', () => {
      render(<FAQList items={createItems()} allowMultiple={true} />);

      // Expand first item
      fireEvent.click(screen.getByText('Что такое MRR?'));
      // Expand second item
      fireEvent.click(screen.getByText('Как работает анализ кода?'));

      // Both should be visible
      expect(
        screen.getByText('MRR — это Monthly Recurring Revenue, ежемесячный регулярный доход от подписок.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Система проверяет структуру проекта, используемые технологии и качество кода.')
      ).toBeInTheDocument();
    });
  });

  describe('Default Expanded', () => {
    it('expands item specified in defaultExpanded', () => {
      render(<FAQList items={createItems()} defaultExpanded="faq-1" />);

      expect(
        screen.getByText('MRR — это Monthly Recurring Revenue, ежемесячный регулярный доход от подписок.')
      ).toBeInTheDocument();
    });

    it('expands multiple items when defaultExpanded is array', () => {
      render(<FAQList items={createItems()} defaultExpanded={['faq-1', 'faq-2']} />);

      expect(
        screen.getByText('MRR — это Monthly Recurring Revenue, ежемесячный регулярный доход от подписок.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Система проверяет структуру проекта, используемые технологии и качество кода.')
      ).toBeInTheDocument();
    });
  });
});

describe('FAQSection', () => {
  const createSection = (): FAQSectionType => ({
    title: 'Часто задаваемые вопросы',
    description: 'Ответы на популярные вопросы о платформе',
    items: [
      {
        id: 'faq-1',
        question: 'Вопрос 1',
        answer: 'Ответ 1',
      },
      {
        id: 'faq-2',
        question: 'Вопрос 2',
        answer: 'Ответ 2',
      },
    ],
  });

  it('renders section title', () => {
    render(<FAQSection section={createSection()} />);

    expect(screen.getByText('Часто задаваемые вопросы')).toBeInTheDocument();
  });

  it('renders section description', () => {
    render(<FAQSection section={createSection()} />);

    expect(screen.getByText('Ответы на популярные вопросы о платформе')).toBeInTheDocument();
  });

  it('renders FAQ items', () => {
    render(<FAQSection section={createSection()} />);

    expect(screen.getByText('Вопрос 1')).toBeInTheDocument();
    expect(screen.getByText('Вопрос 2')).toBeInTheDocument();
  });

  describe('Collapsible', () => {
    it('collapses when header is clicked', () => {
      render(<FAQSection section={createSection()} collapsible={true} />);

      // Click header to collapse
      fireEvent.click(screen.getByText('Часто задаваемые вопросы'));

      // Items should be hidden
      expect(screen.queryByText('Вопрос 1')).not.toBeInTheDocument();
    });

    it('starts collapsed when defaultCollapsed is true', () => {
      render(<FAQSection section={createSection()} defaultCollapsed={true} />);

      expect(screen.queryByText('Вопрос 1')).not.toBeInTheDocument();
    });

    it('expands when clicking collapsed header', () => {
      render(<FAQSection section={createSection()} defaultCollapsed={true} />);

      fireEvent.click(screen.getByText('Часто задаваемые вопросы'));

      expect(screen.getByText('Вопрос 1')).toBeInTheDocument();
    });

    it('is not collapsible when collapsible is false', () => {
      render(<FAQSection section={createSection()} collapsible={false} />);

      // Click header - should not collapse
      fireEvent.click(screen.getByText('Часто задаваемые вопросы'));

      // Items should still be visible
      expect(screen.getByText('Вопрос 1')).toBeInTheDocument();
    });
  });
});

describe('ContextualFAQ', () => {
  it('renders analysis context FAQ', () => {
    render(<ContextualFAQ context="analysis" />);

    expect(screen.getByText('Часто задаваемые вопросы об анализе')).toBeInTheDocument();
    expect(screen.getByText('Что анализирует система?')).toBeInTheDocument();
  });

  it('renders business context FAQ', () => {
    render(<ContextualFAQ context="business" />);

    expect(screen.getByText('Вопросы о бизнес-модели')).toBeInTheDocument();
    expect(screen.getByText('Что такое Business Model Canvas?')).toBeInTheDocument();
  });

  it('renders gaps context FAQ', () => {
    render(<ContextualFAQ context="gaps" />);

    expect(screen.getByText('Вопросы о разрывах и рекомендациях')).toBeInTheDocument();
    expect(screen.getByText('Что такое "разрывы" (gaps)?')).toBeInTheDocument();
  });

  it('renders tasks context FAQ', () => {
    render(<ContextualFAQ context="tasks" />);

    expect(screen.getByText('Вопросы о задачах')).toBeInTheDocument();
    expect(screen.getByText('Как генерируются задачи?')).toBeInTheDocument();
  });

  it('renders general context FAQ', () => {
    render(<ContextualFAQ context="general" />);

    expect(screen.getByText('Частые вопросы')).toBeInTheDocument();
    expect(screen.getByText('Как защищены мои данные?')).toBeInTheDocument();
  });

  it('limits items when maxItems is provided', () => {
    render(<ContextualFAQ context="analysis" maxItems={1} />);

    // Should only show first item
    expect(screen.getByText('Что анализирует система?')).toBeInTheDocument();
    expect(screen.queryByText('Сколько времени занимает анализ?')).not.toBeInTheDocument();
  });

  it('hides header when showHeader is false', () => {
    render(<ContextualFAQ context="analysis" showHeader={false} />);

    expect(screen.queryByText('Часто задаваемые вопросы об анализе')).not.toBeInTheDocument();
    // But items should still render
    expect(screen.getByText('Что анализирует система?')).toBeInTheDocument();
  });
});

describe('InlineHelp', () => {
  it('renders trigger button', () => {
    render(
      <InlineHelp
        question="Что такое SaaS?"
        answer="SaaS — это Software as a Service, модель продажи ПО по подписке."
      />
    );

    expect(screen.getByText('Что такое SaaS?')).toBeInTheDocument();
  });

  it('does not show content by default', () => {
    render(
      <InlineHelp
        question="Что такое SaaS?"
        answer="SaaS — это Software as a Service, модель продажи ПО по подписке."
      />
    );

    expect(
      screen.queryByText('SaaS — это Software as a Service, модель продажи ПО по подписке.')
    ).not.toBeInTheDocument();
  });

  it('shows content when clicked', () => {
    render(
      <InlineHelp
        question="Что такое SaaS?"
        answer="SaaS — это Software as a Service, модель продажи ПО по подписке."
      />
    );

    fireEvent.click(screen.getByText('Что такое SaaS?'));

    expect(
      screen.getByText('SaaS — это Software as a Service, модель продажи ПО по подписке.')
    ).toBeInTheDocument();
  });

  it('shows example when provided', () => {
    render(
      <InlineHelp
        question="Что такое SaaS?"
        answer="SaaS — это Software as a Service."
        example="Dropbox, Slack, Notion"
      />
    );

    fireEvent.click(screen.getByText('Что такое SaaS?'));

    expect(screen.getByText(/Dropbox, Slack, Notion/)).toBeInTheDocument();
  });

  it('collapses when clicked again', () => {
    render(
      <InlineHelp
        question="Что такое SaaS?"
        answer="SaaS — это Software as a Service."
      />
    );

    // Expand
    fireEvent.click(screen.getByText('Что такое SaaS?'));
    expect(screen.getByText('SaaS — это Software as a Service.')).toBeInTheDocument();

    // Collapse
    fireEvent.click(screen.getByText('Что такое SaaS?'));
    expect(screen.queryByText('SaaS — это Software as a Service.')).not.toBeInTheDocument();
  });

  it('applies expanded class when open', () => {
    const { container } = render(
      <InlineHelp
        question="Question"
        answer="Answer"
      />
    );

    fireEvent.click(screen.getByText('Question'));

    expect(container.querySelector('.inline-help')).toHaveClass('expanded');
  });
});
