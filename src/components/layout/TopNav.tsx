'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// ===========================================
// Types
// ===========================================

interface NavItem {
  href: string;
  label: string;
  icon: string;
  requiresAuth?: boolean;
}

interface User {
  email?: string;
}

// ===========================================
// Navigation Items
// ===========================================

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Анализ', icon: '◉' },
  { href: '/dashboard', label: 'Проекты', icon: '▤', requiresAuth: true },
];

// ===========================================
// TopNav Component
// ===========================================

export function TopNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        if (supabase) {
          const { data } = await supabase.auth.getUser();
          setUser(data.user);
        }
      } catch (error) {
        // Supabase not configured, ignore
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="top-nav">
      <div className="nav-container">
        {/* Logo */}
        <Link href="/" className="nav-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">Business Analyst</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-links desktop-only">
          {NAV_ITEMS.map((item) => {
            if (item.requiresAuth && !user) return null;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Menu / Auth Buttons */}
        <div className="nav-user desktop-only">
          {isLoading ? (
            <div className="user-skeleton" />
          ) : user ? (
            <Link href="/dashboard" className="user-menu">
              <span className="user-avatar">👤</span>
              <span className="user-email">{user.email?.split('@')[0] || 'Профиль'}</span>
            </Link>
          ) : (
            <div className="auth-buttons">
              <Link href="/login" className="btn-login">
                Войти
              </Link>
              <Link href="/signup" className="btn-signup">
                Регистрация
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn mobile-only"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={isMobileMenuOpen}
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            {NAV_ITEMS.map((item) => {
              if (item.requiresAuth && !user) return null;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mobile-auth">
            {user ? (
              <Link href="/dashboard" className="mobile-user">
                <span className="user-avatar">👤</span>
                <span>{user.email?.split('@')[0] || 'Профиль'}</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="mobile-btn login">
                  Войти
                </Link>
                <Link href="/signup" className="mobile-btn signup">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .top-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-default);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        /* Logo */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--text-primary);
          font-weight: 600;
          font-size: 18px;
          transition: opacity 0.2s ease;
        }

        .nav-logo:hover {
          opacity: 0.8;
        }

        .logo-icon {
          font-size: 22px;
          color: var(--accent-green);
        }

        .logo-text {
          white-space: nowrap;
          letter-spacing: -0.3px;
        }

        /* Desktop Navigation */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: 15px;
          color: var(--text-muted);
          text-decoration: none;
          border-radius: 6px;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: var(--text-primary);
        }

        .nav-link.active {
          color: var(--text-primary);
          font-weight: 500;
        }

        .nav-icon {
          font-size: 14px;
          opacity: 0.7;
        }

        .nav-link.active .nav-icon {
          opacity: 1;
        }

        /* User Menu */
        .nav-user {
          display: flex;
          align-items: center;
        }

        .user-skeleton {
          width: 80px;
          height: 32px;
          background: var(--bg-tertiary);
          border-radius: 6px;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          font-size: 14px;
          color: var(--text-primary);
          text-decoration: none;
          background: var(--bg-secondary);
          border-radius: 20px;
          transition: background 0.2s ease;
        }

        .user-menu:hover {
          background: var(--bg-tertiary);
        }

        .user-avatar {
          font-size: 16px;
        }

        .user-email {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Auth Buttons */
        .auth-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-login {
          padding: 8px 14px;
          font-size: 14px;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: 6px;
          transition: color 0.2s ease;
        }

        .btn-login:hover {
          color: var(--text-primary);
        }

        .btn-signup {
          padding: 8px 16px;
          font-size: 14px;
          color: #ffffff;
          text-decoration: none;
          background: var(--accent-green);
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .btn-signup:hover {
          background: #2ea043;
        }

        /* Mobile Menu Button */
        .mobile-menu-btn {
          display: none;
          padding: 8px;
          background: none;
          border: none;
          cursor: pointer;
        }

        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 24px;
        }

        .hamburger span {
          display: block;
          height: 2px;
          background: var(--text-primary);
          border-radius: 1px;
          transition: all 0.3s ease;
        }

        .hamburger.open span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.open span:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }

        /* Mobile Menu */
        .mobile-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-default);
          padding: 16px 24px;
          animation: mobileMenuSlide 0.3s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        @keyframes mobileMenuSlide {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-muted);
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          font-size: 15px;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease, transform 0.2s ease;
          animation: mobileNavItemSlide 0.3s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
        }

        .mobile-nav-link:nth-child(1) { animation-delay: 0.05s; }
        .mobile-nav-link:nth-child(2) { animation-delay: 0.1s; }
        .mobile-nav-link:nth-child(3) { animation-delay: 0.15s; }
        .mobile-nav-link:nth-child(4) { animation-delay: 0.2s; }

        @keyframes mobileNavItemSlide {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .mobile-nav-link:hover,
        .mobile-nav-link.active {
          color: var(--text-primary);
          background: var(--bg-secondary);
        }

        .mobile-nav-link.active {
          font-weight: 500;
        }

        .mobile-auth {
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: mobileAuthFade 0.3s ease 0.2s both;
        }

        @keyframes mobileAuthFade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          font-size: 15px;
          color: var(--text-primary);
          text-decoration: none;
          background: var(--bg-secondary);
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .mobile-user:hover {
          background: var(--bg-tertiary);
        }

        .mobile-btn {
          display: block;
          padding: 12px;
          font-size: 15px;
          text-align: center;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease, transform 0.15s ease;
        }

        .mobile-btn:active {
          transform: scale(0.98);
        }

        .mobile-btn.login {
          color: var(--text-primary);
          background: var(--bg-secondary);
        }

        .mobile-btn.login:hover {
          background: var(--bg-tertiary);
        }

        .mobile-btn.signup {
          color: #ffffff;
          background: var(--accent-green);
        }

        .mobile-btn.signup:hover {
          background: #2ea043;
          box-shadow: 0 4px 12px rgba(46, 160, 67, 0.3);
        }

        /* Responsive */
        .desktop-only {
          display: flex;
        }

        .mobile-only {
          display: none;
        }

        @media (max-width: 768px) {
          .desktop-only {
            display: none;
          }

          .mobile-only {
            display: block;
          }

          .mobile-menu {
            display: block;
          }

          .logo-text {
            font-size: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mobile-menu,
          .mobile-nav-link,
          .mobile-auth,
          .nav-link::after {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </header>
  );
}
