import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickStart, resetQuickStart } from '@/components/onboarding/QuickStart';

// ===========================================
// Mock localStorage
// ===========================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ===========================================
// Tests
// ===========================================

describe('QuickStart', () => {
  const defaultOnStart = vi.fn();
  const defaultOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  // ===========================================
  // Rendering Tests
  // ===========================================

  describe('rendering', () => {
    it('should not render initially (hidden until localStorage check)', async () => {
      render(<QuickStart onStart={defaultOnStart} />);

      // Component starts hidden to prevent flash
      await waitFor(() => {
        expect(screen.queryByText('Добро пожаловать в Business Analyst!')).toBeInTheDocument();
      });
    });

    it('should render after localStorage check if not dismissed', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        expect(screen.getByText('Добро пожаловать в Business Analyst!')).toBeInTheDocument();
      });
    });

    it('should not render if already dismissed', async () => {
      localStorageMock.getItem.mockReturnValue('true');

      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        expect(screen.queryByText('Добро пожаловать в Business Analyst!')).not.toBeInTheDocument();
      });
    });

    it('should render wave emoji', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        expect(screen.getByText('👋')).toBeInTheDocument();
      });
    });

    it('should render subtitle', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        expect(screen.getByText('Мы поможем вам понять, как улучшить ваш продукт')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // Features Tests
  // ===========================================

  describe('features list', () => {
    beforeEach(async () => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('should render "Вот что мы можем:" heading', async () => {
      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        expect(screen.getByText('Вот что мы можем:')).toBeInTheDocument();
      });
    });

    it('should render 4 features', async () => {
      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        expect(screen.getByText('Анализ бизнес-модели')).toBeInTheDocument();
        expect(screen.getByText('Анализ кода')).toBeInTheDocument();
        expect(screen.getByText('Поиск разрывов')).toBeInTheDocument();
        expect(screen.getByText('Генерация задач')).toBeInTheDocument();
      });
    });

    it('should render feature descriptions', async () => {
      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        expect(screen.getByText(/Business Model Canvas/)).toBeInTheDocument();
        expect(screen.getByText(/технологии, качество кода/)).toBeInTheDocument();
        expect(screen.getByText(/не соответствует бизнес-целям/)).toBeInTheDocument();
        expect(screen.getByText(/план действий на неделю/)).toBeInTheDocument();
      });
    });

    it('should render feature emojis', async () => {
      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        expect(screen.getByText('📊')).toBeInTheDocument();
        expect(screen.getByText('💻')).toBeInTheDocument();
        expect(screen.getByText('🎯')).toBeInTheDocument();
        expect(screen.getByText('✅')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // Actions Tests
  // ===========================================

  describe('actions', () => {
    beforeEach(async () => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('should render start button', async () => {
      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        expect(screen.getByText('🚀 Начать анализ')).toBeInTheDocument();
      });
    });

    it('should call onStart and dismiss on button click', async () => {
      const onStart = vi.fn();

      render(<QuickStart onStart={onStart} />);

      await waitFor(() => {
        expect(screen.getByText('🚀 Начать анализ')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('🚀 Начать анализ'));

      expect(onStart).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('quickstart-dismissed', 'true');
    });

    it('should render login link when onLogin provided', async () => {
      render(<QuickStart onStart={defaultOnStart} onLogin={defaultOnLogin} />);

      await waitFor(() => {
        expect(screen.getByText('Уже есть аккаунт?')).toBeInTheDocument();
        expect(screen.getByText('Войти')).toBeInTheDocument();
      });
    });

    it('should not render login link when onLogin not provided', async () => {
      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        expect(screen.getByText('🚀 Начать анализ')).toBeInTheDocument();
      });

      expect(screen.queryByText('Уже есть аккаунт?')).not.toBeInTheDocument();
    });

    it('should call onLogin when login link clicked', async () => {
      const onLogin = vi.fn();

      render(<QuickStart onStart={defaultOnStart} onLogin={onLogin} />);

      await waitFor(() => {
        expect(screen.getByText('Войти')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Войти'));

      expect(onLogin).toHaveBeenCalled();
    });
  });

  // ===========================================
  // Close Button Tests
  // ===========================================

  describe('close button', () => {
    beforeEach(async () => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('should render close button', async () => {
      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Закрыть')).toBeInTheDocument();
      });
    });

    it('should dismiss on close button click', async () => {
      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Закрыть')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Закрыть'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith('quickstart-dismissed', 'true');
    });

    it('should not call onStart when close button clicked', async () => {
      const onStart = vi.fn();

      render(<QuickStart onStart={onStart} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Закрыть')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Закрыть'));

      expect(onStart).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // Storage Key Tests
  // ===========================================

  describe('custom storage key', () => {
    it('should use custom storage key', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<QuickStart onStart={defaultOnStart} storageKey="custom-key" />);

      await waitFor(() => {
        expect(screen.getByText('🚀 Начать анализ')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('🚀 Начать анализ'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith('custom-key', 'true');
    });

    it('should check custom storage key on mount', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'custom-key') return 'true';
        return null;
      });

      render(<QuickStart onStart={defaultOnStart} storageKey="custom-key" />);

      await waitFor(() => {
        expect(screen.queryByText('Добро пожаловать в Business Analyst!')).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // resetQuickStart Tests
  // ===========================================

  describe('resetQuickStart', () => {
    it('should remove default storage key', () => {
      resetQuickStart();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('quickstart-dismissed');
    });

    it('should remove custom storage key', () => {
      resetQuickStart('custom-storage-key');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('custom-storage-key');
    });
  });

  // ===========================================
  // Accessibility Tests
  // ===========================================

  describe('accessibility', () => {
    beforeEach(async () => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('should have accessible close button', async () => {
      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Закрыть');
        expect(closeButton).toBeInTheDocument();
        expect(closeButton.tagName).toBe('BUTTON');
      });
    });

    it('should have semantic heading', async () => {
      render(<QuickStart onStart={defaultOnStart} />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading).toHaveTextContent('Добро пожаловать в Business Analyst!');
      });
    });
  });
});
