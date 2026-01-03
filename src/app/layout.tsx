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
        <TopNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
