import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '@/components/layout/TopNav';

export const metadata: Metadata = {
  title: 'Business Analyst - Анализ бизнеса и кода',
  description: 'Анализ GitHub репозиториев, бизнес-модели и генерация персонализированных задач',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {/* Skip link for keyboard users */}
        <a href="#main-content" className="skip-link">
          Перейти к основному содержимому
        </a>
        <TopNav />
        <main id="main-content" role="main" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
