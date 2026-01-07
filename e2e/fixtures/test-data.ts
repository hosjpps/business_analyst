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

// Селекторы (CSS classes и структура)
export const SELECTORS = {
  // Главная страница - режимы
  modeSelector: '.mode-selector, .mode-selected',
  modeCode: '.mode-card:has-text("Проверка кода"), button:has-text("Проверка кода")',
  modeBusiness: '.mode-card:has-text("Разбор бизнеса"), button:has-text("Разбор бизнеса")',
  modeFull: '.mode-card:has-text("Полный анализ"), button:has-text("Полный анализ")',
  modeCompetitor: '.mode-card:has-text("Анализ конкурентов"), button:has-text("Анализ конкурентов")',

  // Форма
  businessDescription: 'textarea[placeholder*="Опишите"], textarea[name="description"], .business-textarea',
  githubUrl: 'input[placeholder*="github.com"], input[name="repoUrl"], input[type="url"]',
  fileUpload: 'input[type="file"]',
  submitButton: 'button[type="submit"], button:has-text("Анализировать"), button:has-text("Запустить")',

  // Результаты
  progressIndicator: '.progress-indicator, .analysis-progress, [class*="progress"]',
  businessCanvas: '.business-canvas, .canvas-view, [class*="canvas"]',
  codeAnalysis: '.code-analysis, .analysis-view, [class*="analysis"]',
  gapDetection: '.gaps-view, .gap-detection, [class*="gaps"]',
  alignmentScore: '.alignment-score, .score-circle, [class*="score"]',
  tasksList: '.tasks-list, .task-item, [class*="tasks"]',

  // Clarification
  clarificationSection: '.clarification-section, .clarification-questions',
  clarificationQuestions: '.clarification-questions, .question-item',
  clarificationInput: '.clarification-input textarea, textarea[placeholder*="Ответ"]',
  clarificationSubmit: 'button:has-text("Отправить ответ"), button:has-text("Продолжить")',

  // Chat
  chatSection: '.chat-section, [class*="chat"]',
  chatInput: '.chat-input textarea, textarea[placeholder*="Спросите"], textarea[placeholder*="вопрос"]',
  chatSubmit: '.chat-submit, button:has-text("Отправить")',
  chatMessages: '.chat-messages, .message-list',

  // Export
  exportJson: 'button:has-text("JSON"), button:has-text("📥")',
  exportMarkdown: 'button:has-text("Markdown"), button:has-text("📄")',
  exportGithubIssues: 'button:has-text("GitHub"), button:has-text("Issues")',

  // Demo
  demoButton: '.demo-button, button:has-text("Демо"), button:has-text("Demo")',
  demoScenarioSelector: '.demo-modal, .demo-scenario-selector, [class*="demo-modal"]',
  demoScenarioCard: '.demo-scenario-card, .scenario-card',

  // Auth
  loginForm: 'form[action*="login"], .login-form, form:has(input[type="email"])',
  signupForm: 'form[action*="signup"], .signup-form',
  emailInput: 'input[type="email"], input[name="email"]',
  passwordInput: 'input[type="password"], input[name="password"]',
  authSubmit: 'button[type="submit"]',
  logoutButton: 'button:has-text("Выйти"), button:has-text("Logout")',

  // Dashboard
  projectsList: '.projects-list, .project-grid, [class*="projects"]',
  projectCard: '.project-card, [class*="project-item"]',
  createProjectButton: 'button:has-text("Создать"), button:has-text("Новый проект")',
  deleteProjectButton: 'button:has-text("Удалить")',

  // Navigation
  topNav: '.top-nav, header, nav',
  navHome: 'a[href="/"], a:has-text("Анализ")',
  navDashboard: 'a[href="/dashboard"], a:has-text("Проекты")',
  userMenu: '.user-nav, .user-menu, [class*="user"]',
};
