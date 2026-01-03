import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TopNav } from '@/components/layout/TopNav';

// ===========================================
// Mocks
// ===========================================

const mockPathname = vi.fn().mockReturnValue('/');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUser = vi.fn().mockReturnValue(null) as any;

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: mockUser() } }),
    },
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// ===========================================
// Tests
// ===========================================

describe('TopNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/');
    mockUser.mockReturnValue(null);
  });

  // ===========================================
  // Logo Tests
  // ===========================================

  describe('logo', () => {
    it('should render logo with icon', async () => {
      const { container } = render(<TopNav />);

      await waitFor(() => {
        const logoIcon = container.querySelector('.logo-icon');
        expect(logoIcon).toBeInTheDocument();
        expect(logoIcon).toHaveTextContent('◈');
      });
    });

    it('should render logo text', async () => {
      render(<TopNav />);

      await waitFor(() => {
        expect(screen.getByText('Business Analyst')).toBeInTheDocument();
      });
    });

    it('should link logo to home page', async () => {
      render(<TopNav />);

      await waitFor(() => {
        const logoLink = screen.getByText('Business Analyst').closest('a');
        expect(logoLink).toHaveAttribute('href', '/');
      });
    });
  });

  // ===========================================
  // Navigation Links Tests
  // ===========================================

  describe('navigation links', () => {
    it('should render analysis link', async () => {
      render(<TopNav />);

      await waitFor(() => {
        expect(screen.getByText('Анализ')).toBeInTheDocument();
      });
    });

    it('should not show projects link when not authenticated', async () => {
      mockUser.mockReturnValue(null);

      render(<TopNav />);

      await waitFor(() => {
        // Projects requires auth, should not be visible
        const projectsLinks = screen.queryAllByText('Проекты');
        // May appear in mobile menu too, so check desktop nav
        expect(projectsLinks.length).toBe(0);
      });
    });

    it('should show projects link when authenticated', async () => {
      mockUser.mockReturnValue({ email: 'test@example.com' });

      render(<TopNav />);

      await waitFor(() => {
        expect(screen.getByText('Проекты')).toBeInTheDocument();
      });
    });

    it('should mark current page as active', async () => {
      mockPathname.mockReturnValue('/');

      render(<TopNav />);

      await waitFor(() => {
        const analysisLink = screen.getByText('Анализ').closest('a');
        expect(analysisLink).toHaveClass('active');
      });
    });
  });

  // ===========================================
  // Auth Buttons Tests
  // ===========================================

  describe('auth buttons', () => {
    it('should show login and signup buttons when not authenticated', async () => {
      mockUser.mockReturnValue(null);

      render(<TopNav />);

      await waitFor(() => {
        expect(screen.getByText('Войти')).toBeInTheDocument();
        expect(screen.getByText('Регистрация')).toBeInTheDocument();
      });
    });

    it('should show user menu when authenticated', async () => {
      mockUser.mockReturnValue({ email: 'john@example.com' });

      render(<TopNav />);

      await waitFor(() => {
        expect(screen.getByText('john')).toBeInTheDocument();
        expect(screen.getByText('👤')).toBeInTheDocument();
      });
    });

    it('should show loading skeleton initially', () => {
      render(<TopNav />);

      const { container } = render(<TopNav />);
      const skeleton = container.querySelector('.user-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should link login button to login page', async () => {
      mockUser.mockReturnValue(null);

      render(<TopNav />);

      await waitFor(() => {
        const loginLink = screen.getByText('Войти');
        expect(loginLink).toHaveAttribute('href', '/login');
      });
    });

    it('should link signup button to signup page', async () => {
      mockUser.mockReturnValue(null);

      render(<TopNav />);

      await waitFor(() => {
        const signupLink = screen.getByText('Регистрация');
        expect(signupLink).toHaveAttribute('href', '/signup');
      });
    });
  });

  // ===========================================
  // Mobile Menu Tests
  // ===========================================

  describe('mobile menu', () => {
    it('should render mobile menu button', async () => {
      render(<TopNav />);

      await waitFor(() => {
        const menuButton = screen.getByLabelText('Открыть меню');
        expect(menuButton).toBeInTheDocument();
      });
    });

    it('should toggle mobile menu on button click', async () => {
      const { container } = render(<TopNav />);

      await waitFor(() => {
        expect(screen.getByLabelText('Открыть меню')).toBeInTheDocument();
      });

      // Open menu
      fireEvent.click(screen.getByLabelText('Открыть меню'));

      await waitFor(() => {
        expect(screen.getByLabelText('Закрыть меню')).toBeInTheDocument();
      });

      // Check mobile menu is visible
      const mobileMenu = container.querySelector('.mobile-menu');
      expect(mobileMenu).toBeInTheDocument();
    });

    it('should show hamburger animation when menu is open', async () => {
      const { container } = render(<TopNav />);

      await waitFor(() => {
        expect(screen.getByLabelText('Открыть меню')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Открыть меню'));

      await waitFor(() => {
        const hamburger = container.querySelector('.hamburger');
        expect(hamburger).toHaveClass('open');
      });
    });

    it('should show auth buttons in mobile menu when not authenticated', async () => {
      mockUser.mockReturnValue(null);

      render(<TopNav />);

      await waitFor(() => {
        expect(screen.getByLabelText('Открыть меню')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Открыть меню'));

      await waitFor(() => {
        // Mobile menu shows Войти and Регистрация buttons
        const loginButtons = screen.getAllByText('Войти');
        expect(loginButtons.length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================
  // User Email Display Tests
  // ===========================================

  describe('user email display', () => {
    it('should show username (before @) when authenticated', async () => {
      mockUser.mockReturnValue({ email: 'johndoe@example.com' });

      render(<TopNav />);

      await waitFor(() => {
        expect(screen.getByText('johndoe')).toBeInTheDocument();
      });
    });

    it('should show "Профиль" when email is not available', async () => {
      mockUser.mockReturnValue({ email: undefined });

      render(<TopNav />);

      await waitFor(() => {
        expect(screen.getByText('Профиль')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // Accessibility Tests
  // ===========================================

  describe('accessibility', () => {
    it('should have accessible mobile menu button with aria-expanded', async () => {
      render(<TopNav />);

      await waitFor(() => {
        const menuButton = screen.getByLabelText('Открыть меню');
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      });

      fireEvent.click(screen.getByLabelText('Открыть меню'));

      await waitFor(() => {
        const menuButton = screen.getByLabelText('Закрыть меню');
        expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should be a header element', () => {
      render(<TopNav />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have nav element', async () => {
      render(<TopNav />);

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
    });
  });
});
