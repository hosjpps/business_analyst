import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Для запуска:
 * - npm run test:e2e          - все тесты
 * - npm run test:e2e:ui       - с UI
 * - npm run test:e2e:debug    - debug режим
 */

export default defineConfig({
  // Директория с тестами
  testDir: './e2e/tests',

  // Паттерн файлов тестов
  testMatch: '**/*.spec.ts',

  // Полностью параллельно
  fullyParallel: true,

  // Не повторять упавшие тесты в CI
  forbidOnly: !!process.env.CI,

  // Повторы при падении
  retries: process.env.CI ? 2 : 0,

  // Параллельные workers
  workers: process.env.CI ? 1 : undefined,

  // Репортеры
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  // Глобальные настройки для всех тестов
  use: {
    // Base URL для тестов
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Скриншоты только при падении
    screenshot: 'only-on-failure',

    // Видео только при падении
    video: 'retain-on-failure',

    // Trace для дебага
    trace: 'retain-on-failure',

    // Таймаут действий
    actionTimeout: 15000,

    // Таймаут навигации
    navigationTimeout: 30000,
  },

  // Таймаут теста (LLM может быть медленным)
  timeout: 120000,

  // Ожидание результатов
  expect: {
    timeout: 10000,
  },

  // Проекты (браузеры)
  projects: [
    // Desktop Chrome - основной
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Desktop Safari
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    // Mobile Safari
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Запуск dev сервера перед тестами
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      BYPASS_DEMO_LIMIT: 'true',
    },
  },

  // Директория для артефактов
  outputDir: 'e2e/test-results',
});
