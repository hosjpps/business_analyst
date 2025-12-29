'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type User = {
  id: string;
  email?: string;
};

export function UserNav() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEnabled, setAuthEnabled] = useState(false);

  useEffect(() => {
    // Skip if supabase is not available
    if (!supabase) {
      setLoading(false);
      setAuthEnabled(false);
      return;
    }

    setAuthEnabled(true);

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: unknown, session: { user: User } | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.refresh();
  };

  if (loading) {
    return <div className="user-nav-loading"></div>;
  }

  // If auth is not enabled (no Supabase env vars), don't show anything
  if (!authEnabled) {
    return null;
  }

  return (
    <nav className="user-nav">
      {user ? (
        <>
          <span className="user-email">{user.email}</span>
          <button
            className="nav-btn nav-btn-primary"
            onClick={() => router.push('/dashboard')}
          >
            Dashboard
          </button>
          <button
            className="nav-btn nav-btn-secondary"
            onClick={handleLogout}
          >
            Выйти
          </button>
        </>
      ) : (
        <>
          <button
            className="nav-btn nav-btn-secondary"
            onClick={() => router.push('/login')}
          >
            Войти
          </button>
          <button
            className="nav-btn nav-btn-primary"
            onClick={() => router.push('/signup')}
          >
            Регистрация
          </button>
        </>
      )}

      <style jsx>{`
        .user-nav {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-nav-loading {
          width: 150px;
          height: 32px;
          background: #21262d;
          border-radius: 6px;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }

        .user-email {
          color: #8b949e;
          font-size: 0.875rem;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nav-btn {
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .nav-btn-primary {
          background: #238636;
          color: #fff;
        }

        .nav-btn-primary:hover {
          background: #2ea043;
        }

        .nav-btn-secondary {
          background: #21262d;
          color: #c9d1d9;
          border: 1px solid #30363d;
        }

        .nav-btn-secondary:hover {
          background: #30363d;
        }

        @media (max-width: 640px) {
          .user-email {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
