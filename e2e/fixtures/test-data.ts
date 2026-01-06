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

// Селекторы (data-testid)
export const SELECTORS = {
  // Главная страница
  modeSelector: '[data-testid="mode-selector"]',
  modeCode: '[data-testid="mode-code"]',
  modeBusiness: '[data-testid="mode-business"]',
  modeFull: '[data-testid="mode-full"]',
  modeCompetitor: '[data-testid="mode-competitor"]',

  // Форма
  businessDescription: '[data-testid="business-description"]',
  githubUrl: '[data-testid="github-url"]',
  fileUpload: '[data-testid="file-upload"]',
  submitButton: '[data-testid="submit-analysis"]',

  // Результаты
  progressIndicator: '[data-testid="progress-indicator"]',
  businessCanvas: '[data-testid="business-canvas"]',
  codeAnalysis: '[data-testid="code-analysis"]',
  gapDetection: '[data-testid="gap-detection"]',
  alignmentScore: '[data-testid="alignment-score"]',
  tasksList: '[data-testid="tasks-list"]',

  // Clarification
  clarificationSection: '[data-testid="clarification-section"]',
  clarificationQuestions: '[data-testid="clarification-questions"]',
  clarificationInput: '[data-testid="clarification-input"]',
  clarificationSubmit: '[data-testid="clarification-submit"]',

  // Chat
  chatSection: '[data-testid="chat-section"]',
  chatInput: '[data-testid="chat-input"]',
  chatSubmit: '[data-testid="chat-submit"]',
  chatMessages: '[data-testid="chat-messages"]',

  // Export
  exportJson: '[data-testid="export-json"]',
  exportMarkdown: '[data-testid="export-markdown"]',
  exportGithubIssues: '[data-testid="export-github-issues"]',

  // Demo
  demoButton: '[data-testid="demo-button"]',
  demoScenarioSelector: '[data-testid="demo-scenario-selector"]',
  demoScenarioCard: '[data-testid="demo-scenario-card"]',

  // Auth
  loginForm: '[data-testid="login-form"]',
  signupForm: '[data-testid="signup-form"]',
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]',
  authSubmit: '[data-testid="auth-submit"]',
  logoutButton: '[data-testid="logout-button"]',

  // Dashboard
  projectsList: '[data-testid="projects-list"]',
  projectCard: '[data-testid="project-card"]',
  createProjectButton: '[data-testid="create-project"]',
  deleteProjectButton: '[data-testid="delete-project"]',

  // Navigation
  topNav: '[data-testid="top-nav"]',
  navHome: '[data-testid="nav-home"]',
  navDashboard: '[data-testid="nav-dashboard"]',
  userMenu: '[data-testid="user-menu"]',
};
