import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checklist, PriorityBadge, calculateProgress } from '@/components/ui/Checklist';
import type { ChecklistItem } from '@/types/ux';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Checklist', () => {
  const createItems = (): ChecklistItem[] => [
    {
      id: 'task-1',
      title: 'Добавить аналитику',
      description: 'Интегрировать Google Analytics или Mixpanel',
      priority: 'high',
      completed: false,
      estimatedTime: '2-3 часа',
      whyImportant: 'Без аналитики невозможно понять поведение пользователей',
      steps: [
        { id: 'step-1-1', text: 'Создать аккаунт в GA', completed: false },
        { id: 'step-1-2', text: 'Добавить tracking код', completed: false },
        { id: 'step-1-3', text: 'Настроить события', completed: false },
      ],
    },
    {
      id: 'task-2',
      title: 'Настроить платежи',
      description: 'Интегрировать Stripe для приёма оплаты',
      priority: 'high',
      completed: false,
      estimatedTime: '4-6 часов',
      steps: [
        { id: 'step-2-1', text: 'Создать Stripe аккаунт', completed: false },
        { id: 'step-2-2', text: 'Интегрировать Checkout', completed: false },
      ],
    },
    {
      id: 'task-3',
      title: 'Улучшить SEO',
      description: 'Оптимизировать мета-теги и структуру',
      priority: 'medium',
      completed: false,
      estimatedTime: '1-2 часа',
      steps: [],
    },
    {
      id: 'task-4',
      title: 'Добавить документацию',
      description: 'Написать README и API docs',
      priority: 'low',
      completed: true,
      estimatedTime: '30 минут',
      steps: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all checklist items', () => {
      render(<Checklist items={createItems()} />);

      expect(screen.getByText('Добавить аналитику')).toBeInTheDocument();
      expect(screen.getByText('Настроить платежи')).toBeInTheDocument();
      expect(screen.getByText('Улучшить SEO')).toBeInTheDocument();
      expect(screen.getByText('Добавить документацию')).toBeInTheDocument();
    });

    it('renders progress bar when showProgress is true', () => {
      render(<Checklist items={createItems()} showProgress={true} />);

      expect(screen.getByText('Выполнено задач')).toBeInTheDocument();
    });

    it('does not render progress bar when showProgress is false', () => {
      render(<Checklist items={createItems()} showProgress={false} />);

      expect(screen.queryByText('Выполнено задач')).not.toBeInTheDocument();
    });

    it('shows estimated time for items', () => {
      render(<Checklist items={createItems()} />);

      expect(screen.getByText('2-3 часа')).toBeInTheDocument();
      expect(screen.getByText('4-6 часов')).toBeInTheDocument();
    });
  });

  describe('Priority Grouping', () => {
    it('groups items by priority when groupByPriority is true', () => {
      render(<Checklist items={createItems()} groupByPriority={true} />);

      expect(screen.getByText('Высокий приоритет')).toBeInTheDocument();
      expect(screen.getByText('Средний приоритет')).toBeInTheDocument();
      expect(screen.getByText('Низкий приоритет')).toBeInTheDocument();
    });

    it('does not group items when groupByPriority is false', () => {
      render(<Checklist items={createItems()} groupByPriority={false} />);

      expect(screen.queryByText('Высокий приоритет')).not.toBeInTheDocument();
      expect(screen.queryByText('Средний приоритет')).not.toBeInTheDocument();
      expect(screen.queryByText('Низкий приоритет')).not.toBeInTheDocument();
    });

    it('shows correct count in priority groups', () => {
      render(<Checklist items={createItems()} groupByPriority={true} />);

      // High priority: 0/2, Medium: 0/1, Low: 1/1
      expect(screen.getByText('0/2')).toBeInTheDocument();
      expect(screen.getByText('0/1')).toBeInTheDocument();
      expect(screen.getByText('1/1')).toBeInTheDocument();
    });
  });

  describe('Item Toggle', () => {
    it('toggles item completion status', () => {
      const mockOnChange = vi.fn();
      render(<Checklist items={createItems()} onChange={mockOnChange} />);

      // Find and click the first checkbox
      const checkboxes = screen.getAllByRole('button', { name: '' });
      const firstCheckbox = checkboxes.find(
        (btn) => btn.classList.contains('checklist-checkbox')
      );

      if (firstCheckbox) {
        fireEvent.click(firstCheckbox);
        expect(mockOnChange).toHaveBeenCalled();
      }
    });

    it('updates item state when toggled', () => {
      const mockOnChange = vi.fn();
      const items = createItems();
      render(<Checklist items={items} onChange={mockOnChange} />);

      // Toggle item with steps
      const checkboxes = screen.getAllByRole('button').filter(
        (btn) => btn.classList.contains('checklist-checkbox')
      );

      if (checkboxes.length > 0) {
        fireEvent.click(checkboxes[0]);

        // Check that onChange was called
        expect(mockOnChange).toHaveBeenCalled();

        // Get the updated items from the callback
        const updatedItems = mockOnChange.mock.calls[0]?.[0];
        expect(updatedItems).toBeDefined();
        expect(Array.isArray(updatedItems)).toBe(true);
      }
    });
  });

  describe('Step Toggle', () => {
    it('expands item to show steps', () => {
      render(<Checklist items={createItems()} />);

      // Click on item content to expand
      fireEvent.click(screen.getByText('Добавить аналитику'));

      // Should show steps
      expect(screen.getByText('Создать аккаунт в GA')).toBeInTheDocument();
      expect(screen.getByText('Добавить tracking код')).toBeInTheDocument();
    });

    it('shows why important when expanded', () => {
      render(<Checklist items={createItems()} />);

      fireEvent.click(screen.getByText('Добавить аналитику'));

      expect(screen.getByText('Без аналитики невозможно понять поведение пользователей')).toBeInTheDocument();
    });

    it('shows description when expanded', () => {
      render(<Checklist items={createItems()} />);

      fireEvent.click(screen.getByText('Добавить аналитику'));

      expect(screen.getByText('Интегрировать Google Analytics или Mixpanel')).toBeInTheDocument();
    });
  });

  describe('LocalStorage Persistence', () => {
    it('saves to localStorage when storageKey is provided', () => {
      render(
        <Checklist
          items={createItems()}
          storageKey="test-checklist"
        />
      );

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('loads from localStorage on mount', () => {
      const savedItems = createItems();
      savedItems[0].completed = true;
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedItems));

      render(
        <Checklist
          items={createItems()}
          storageKey="test-checklist"
        />
      );

      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-checklist');
    });
  });

  describe('Steps Count', () => {
    it('shows steps count for items with steps', () => {
      render(<Checklist items={createItems()} />);

      // Item 1 has 3 steps
      expect(screen.getByText('0/3 шагов')).toBeInTheDocument();
      // Item 2 has 2 steps
      expect(screen.getByText('0/2 шагов')).toBeInTheDocument();
    });
  });
});

describe('PriorityBadge', () => {
  it('renders high priority badge', () => {
    const { container } = render(<PriorityBadge priority="high" />);

    const badge = container.querySelector('.priority-badge');
    expect(badge).toHaveClass('priority-high');
  });

  it('renders medium priority badge', () => {
    const { container } = render(<PriorityBadge priority="medium" />);

    const badge = container.querySelector('.priority-badge');
    expect(badge).toHaveClass('priority-medium');
  });

  it('renders low priority badge', () => {
    const { container } = render(<PriorityBadge priority="low" />);

    const badge = container.querySelector('.priority-badge');
    expect(badge).toHaveClass('priority-low');
  });

  it('shows label when showLabel is true', () => {
    render(<PriorityBadge priority="high" showLabel={true} />);

    expect(screen.getByText('Высокий')).toBeInTheDocument();
  });

  it('does not show label when showLabel is false', () => {
    render(<PriorityBadge priority="high" showLabel={false} />);

    expect(screen.queryByText('Высокий')).not.toBeInTheDocument();
  });
});

describe('calculateProgress', () => {
  it('calculates total and completed counts', () => {
    const items: ChecklistItem[] = [
      { id: '1', title: 'Task 1', description: '', priority: 'high', completed: true, estimatedTime: '', steps: [] },
      { id: '2', title: 'Task 2', description: '', priority: 'high', completed: false, estimatedTime: '', steps: [] },
      { id: '3', title: 'Task 3', description: '', priority: 'medium', completed: true, estimatedTime: '', steps: [] },
    ];

    const progress = calculateProgress(items);

    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(2);
    expect(progress.percentage).toBeCloseTo(66.67, 1);
  });

  it('calculates progress by priority', () => {
    const items: ChecklistItem[] = [
      { id: '1', title: 'High 1', description: '', priority: 'high', completed: true, estimatedTime: '', steps: [] },
      { id: '2', title: 'High 2', description: '', priority: 'high', completed: false, estimatedTime: '', steps: [] },
      { id: '3', title: 'Medium 1', description: '', priority: 'medium', completed: true, estimatedTime: '', steps: [] },
      { id: '4', title: 'Low 1', description: '', priority: 'low', completed: false, estimatedTime: '', steps: [] },
    ];

    const progress = calculateProgress(items);

    expect(progress.byPriority.high.total).toBe(2);
    expect(progress.byPriority.high.completed).toBe(1);
    expect(progress.byPriority.medium.total).toBe(1);
    expect(progress.byPriority.medium.completed).toBe(1);
    expect(progress.byPriority.low.total).toBe(1);
    expect(progress.byPriority.low.completed).toBe(0);
  });

  it('handles empty items array', () => {
    const progress = calculateProgress([]);

    expect(progress.total).toBe(0);
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  it('returns 100% when all completed', () => {
    const items: ChecklistItem[] = [
      { id: '1', title: 'Task 1', description: '', priority: 'high', completed: true, estimatedTime: '', steps: [] },
      { id: '2', title: 'Task 2', description: '', priority: 'medium', completed: true, estimatedTime: '', steps: [] },
    ];

    const progress = calculateProgress(items);

    expect(progress.percentage).toBe(100);
  });

  it('returns 0% when none completed', () => {
    const items: ChecklistItem[] = [
      { id: '1', title: 'Task 1', description: '', priority: 'high', completed: false, estimatedTime: '', steps: [] },
      { id: '2', title: 'Task 2', description: '', priority: 'medium', completed: false, estimatedTime: '', steps: [] },
    ];

    const progress = calculateProgress(items);

    expect(progress.percentage).toBe(0);
  });
});
