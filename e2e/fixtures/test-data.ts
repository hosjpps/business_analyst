/**
 * Тестовые данные для E2E тестов
 */

// Валидные бизнес-описания
export const BUSINESS_DESCRIPTIONS = {
  saas: `SaaS платформа для управления проектами с AI-ассистентом.
    Целевая аудитория: малый и средний бизнес, команды 5-50 человек.
    Монетизация: подписка $29/месяц за пользователя.
    Конкуренты: Asana, Monday, ClickUp.`,

  fitness: `Мобильное приложение для домашних тренировок с персональными программами.
    ЦА: люди 25-45 лет, которые хотят заниматься дома.
    Монетизация: freemium + подписка $9.99/месяц.
    Уникальность: AI тренер, адаптивные программы.`,

  ecommerce: `Маркетплейс для продажи handmade товаров.
    ЦА: мастера и покупатели уникальных вещей.
    Монетизация: комиссия 10% с продаж.
    Конкуренты: Etsy, Ярмарка Мастеров.`,

  short: 'Приложение', // Слишком короткое для валидации
};

// GitHub репозитории для тестов
export const GITHUB_REPOS = {
  // Реальные публичные репозитории
  nextjs: 'https://github.com/vercel/next.js',
  react: 'https://github.com/facebook/react',
  shadcnUi: 'https://github.com/shadcn/ui',

  // Невалидные
  invalid: 'https://github.com/nonexistent/repo-that-does-not-exist-12345',
  notGithub: 'https://gitlab.com/some/repo',
  malformed: 'not-a-url',
};

// Данные конкурентов
export const COMPETITORS = {
  valid: [
    {
      url: 'https://asana.com',
      description: 'Управление проектами для команд',
    },
    {
      url: 'https://monday.com',
      description: 'Work OS для бизнеса',
    },
  ],
  empty: [],
};

// Тестовый пользователь
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
};

// Таймауты
export const TIMEOUTS = {
  // LLM может быть медленным
  llmResponse: 90000,
  // Быстрые операции
  uiInteraction: 5000,
  // Загрузка страницы
  pageLoad: 15000,
  // Анимации
  animation: 1000,
};

// Селекторы (data-testid + CSS fallbacks)
export const SELECTORS = {
  // Главная страница - режимы
  modeSelector: '[data-testid="mode-selector"], [data-testid="mode-selected"]',
  modeCode: '[data-testid="mode-code"]',
  modeBusiness: '[data-testid="mode-business"]',
  modeFull: '[data-testid="mode-full"]',
  modeCompetitor: '[data-testid="mode-competitor"]',

  // Форма
  businessDescription: '[data-testid="business-description"]',
  githubUrl: '[data-testid="github-url"], [data-testid="github-url-full"]',
  fileUpload: '[data-testid="file-upload"]',
  fileUploadZone: '[data-testid="file-upload-zone"]',
  documentUpload: '[data-testid="document-upload"]',
  submitButton: '[data-testid="submit-analysis"], button[type="submit"]:has-text("Анализировать")',

  // Результаты
  progressIndicator: '[data-testid="progress-indicator"]',
  businessCanvas: '[data-testid="business-canvas"], .business-canvas',
  codeAnalysis: '.code-analysis, .analysis-view',
  gapDetection: '.gaps-view, .gap-detection',
  alignmentScore: '.alignment-score, .score-circle',
  tasksList: '.tasks-list, .task-item',

  // Clarification
  clarificationSection: '.clarification-section, .clarification-questions',
  clarificationQuestions: '.clarification-questions, .question-item',
  clarificationInput: '.clarification-input textarea, textarea[placeholder*="Ответ"]',
  clarificationSubmit: 'button:has-text("Отправить ответ"), button:has-text("Продолжить")',

  // Chat
  chatSection: '[data-testid="chat-section"]',
  chatInput: '[data-testid="chat-input"]',
  chatSubmit: '[data-testid="chat-send"]',
  chatMessages: '.chat-messages, .chat-history',

  // Export
  exportJson: 'button:has-text("JSON"), button:has-text("📥")',
  exportMarkdown: 'button:has-text("Markdown"), button:has-text("📄")',
  exportGithubIssues: 'button:has-text("GitHub"), button:has-text("Issues")',

  // Demo
  demoButton: '[data-testid="demo-button"]',
  demoScenarioSelector: '[data-testid="demo-modal"]',
  demoScenarioCard: '[data-testid="demo-scenario-card"]',

  // Auth
  loginForm: '[data-testid="auth-form"]',
  signupForm: '[data-testid="auth-form"]',
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]',
  authSubmit: '[data-testid="submit-button"]',
  authError: '[data-testid="auth-error"]',
  logoutButton: 'button:has-text("Выйти"), button:has-text("Logout")',

  // Dashboard
  projectsList: '.projects-list, .project-grid',
  projectCard: '.project-card',
  createProjectButton: 'button:has-text("Создать"), button:has-text("Новый проект")',
  deleteProjectButton: 'button:has-text("Удалить")',

  // Navigation
  topNav: '.top-nav, header, nav',
  navHome: 'a[href="/"], a:has-text("Анализ")',
  navDashboard: 'a[href="/dashboard"], a:has-text("Проекты")',
  userMenu: '.user-nav, .user-menu',
};
