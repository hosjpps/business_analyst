/**
 * Demo Scenarios
 *
 * Pre-built mock data for 3 demo scenarios.
 * These are shown to users who want to try the product without API keys.
 */

import type { DemoScenario, DemoScenarioInfo } from '@/types/demo';

// ===========================================
// Scenario Info (for selector)
// ===========================================

export const DEMO_SCENARIO_INFO: DemoScenarioInfo[] = [
  {
    id: 'saas',
    name: 'SaaS Стартап',
    description: 'B2B платформа для автоматизации маркетинга с подписной моделью',
    icon: '🚀',
    tags: ['B2B', 'Подписка', 'Next.js'],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Онлайн-магазин одежды с доставкой по России',
    icon: '🛒',
    tags: ['B2C', 'Retail', 'React'],
  },
  {
    id: 'mobile',
    name: 'Mobile App',
    description: 'Фитнес-приложение с персональными тренировками',
    icon: '📱',
    tags: ['B2C', 'Health', 'React Native'],
  },
];

// ===========================================
// Full Demo Scenarios with Mock Data
// ===========================================

export const DEMO_SCENARIOS: DemoScenario[] = [
  // ===========================================
  // 1. SaaS Startup
  // ===========================================
  {
    id: 'saas',
    name: 'SaaS Стартап',
    description: 'B2B платформа для автоматизации маркетинга с подписной моделью',
    icon: '🚀',
    tags: ['B2B', 'Подписка', 'Next.js'],

    businessResult: {
      success: true,
      needs_clarification: false,
      canvas: {
        customer_segments: [
          'Малый и средний бизнес (10-200 сотрудников)',
          'Маркетинговые агентства',
          'SaaS-компании с командой маркетинга',
        ],
        value_proposition:
          'Автоматизация email-рассылок и социальных сетей в одном интерфейсе. Экономия 10+ часов в неделю на рутинных задачах.',
        channels: [
          'Органический поиск (SEO)',
          'Контент-маркетинг (блог)',
          'LinkedIn outreach',
          'Партнёрские интеграции',
        ],
        customer_relationships:
          'Self-service с онбордингом + email-поддержка для платных планов',
        revenue_streams: [
          'Подписка Starter: $29/мес (до 1000 контактов)',
          'Подписка Pro: $99/мес (до 10000 контактов)',
          'Подписка Enterprise: $299/мес (безлимит)',
        ],
        key_resources: [
          'Команда разработки (3 человека)',
          'Облачная инфраструктура (Vercel + AWS)',
          'Интеграции с email-провайдерами',
        ],
        key_activities: [
          'Разработка новых функций',
          'Поддержка клиентов',
          'Создание контента для блога',
          'Партнёрские интеграции',
        ],
        key_partners: [
          'Sendgrid (email)',
          'Stripe (платежи)',
          'Zapier (интеграции)',
        ],
        cost_structure: [
          'Зарплаты команды (~70%)',
          'Облачная инфраструктура (~15%)',
          'Маркетинг (~10%)',
          'Инструменты (~5%)',
        ],
      },
      business_stage: 'building',
      gaps_in_model: [
        'Нет чёткой стратегии привлечения первых клиентов',
        'Не определён ICP (Ideal Customer Profile)',
        'Отсутствует referral-программа',
      ],
      recommendations: [
        {
          area: 'Acquisition',
          recommendation: 'Запустить бета-программу с 50 ранними пользователями',
          priority: 'high',
        },
        {
          area: 'Retention',
          recommendation: 'Добавить in-app onboarding с прогресс-баром',
          priority: 'medium',
        },
        {
          area: 'Monetization',
          recommendation: 'Протестировать годовую подписку со скидкой 20%',
          priority: 'medium',
        },
      ],
      metadata: {
        documents_parsed: 0,
        total_text_length: 847,
        model_used: 'demo',
        tokens_used: 0,
        analysis_duration_ms: 0,
      },
    },

    codeResult: {
      success: true,
      analysis: {
        project_summary:
          'Next.js 14 SaaS-приложение с App Router, TypeScript, Tailwind CSS. Реализована базовая аутентификация через NextAuth, есть интеграция с Stripe для подписок. Dashboard с графиками использования.',
        detected_stage: 'mvp',
        tech_stack: [
          'Next.js 14',
          'TypeScript',
          'Tailwind CSS',
          'Prisma',
          'PostgreSQL',
          'NextAuth',
          'Stripe',
          'Vercel',
        ],
        strengths: [
          {
            area: 'Архитектура',
            detail: 'Хорошая структура проекта с разделением на features',
          },
          {
            area: 'TypeScript',
            detail: 'Строгая типизация, нет any',
          },
          {
            area: 'Аутентификация',
            detail: 'NextAuth правильно настроен с JWT и refresh tokens',
          },
        ],
        issues: [
          {
            severity: 'high',
            area: 'Тестирование',
            detail: 'Нет unit-тестов и e2e-тестов',
            file_path: null,
          },
          {
            severity: 'medium',
            area: 'Error Handling',
            detail: 'Нет глобального error boundary',
            file_path: 'src/app/layout.tsx',
          },
          {
            severity: 'medium',
            area: 'Мониторинг',
            detail: 'Не настроен Sentry или аналог',
            file_path: null,
          },
        ],
        tasks: [
          {
            title: 'Добавить Sentry для мониторинга ошибок',
            description:
              'Настроить @sentry/nextjs для отслеживания ошибок в production. Добавить source maps.',
            priority: 'high',
            category: 'technical',
            estimated_minutes: 60,
            depends_on: null,
          },
          {
            title: 'Написать тесты для API routes',
            description:
              'Покрыть критические API endpoints unit-тестами с Vitest. Начать с auth и billing.',
            priority: 'high',
            category: 'technical',
            estimated_minutes: 180,
            depends_on: null,
          },
          {
            title: 'Добавить rate limiting',
            description:
              'Защитить API от злоупотреблений с помощью upstash/ratelimit или аналога.',
            priority: 'medium',
            category: 'technical',
            estimated_minutes: 45,
            depends_on: null,
          },
        ],
        next_milestone: 'Запуск бета-версии с 10 пользователями',
      },
      metadata: {
        files_analyzed: 47,
        total_lines: 3420,
        model_used: 'demo',
        tokens_used: 0,
        analysis_duration_ms: 0,
      },
    },

    gapResult: {
      success: true,
      alignment_score: 67,
      verdict: 'iterate',
      verdict_explanation:
        'Продукт технически готов к MVP, но есть существенные пробелы в инфраструктуре качества (тесты, мониторинг) и стратегии привлечения клиентов.',
      gaps: [
        {
          id: 'gap-1',
          type: 'critical',
          category: 'growth',
          business_goal: 'Привлечение первых 50 платящих клиентов',
          current_state: 'Нет аналитики, нет воронки, нет tracking конверсий',
          recommendation: 'Интегрировать Mixpanel или PostHog для product analytics',
          effort: 'medium',
          impact: 'high',
          hook: 'Без аналитики вы не знаете, почему пользователи уходят',
          time_to_fix: '2-3 часа',
          action_steps: [
            'Зарегистрироваться в PostHog (бесплатно до 1M events)',
            'Установить posthog-js и настроить в _app.tsx',
            'Добавить события: signup, onboarding_step, feature_used, upgrade',
            'Создать dashboard с воронкой конверсии',
          ],
          why_matters:
            'Без данных о поведении пользователей невозможно оптимизировать продукт и маркетинг',
        },
        {
          id: 'gap-2',
          type: 'critical',
          category: 'monetization',
          business_goal: 'MRR $5000 через 3 месяца',
          current_state: 'Stripe интегрирован, но нет trial периода',
          recommendation: 'Добавить 14-дневный trial без карты',
          effort: 'low',
          impact: 'high',
          hook: 'Trial без карты увеличивает конверсию в 3-5 раз',
          time_to_fix: '1-2 часа',
          action_steps: [
            'Создать триальную подписку в Stripe Dashboard',
            'Обновить signup flow: не требовать карту',
            'Добавить email-напоминания на 7 и 12 день trial',
            'Показывать countdown до окончания trial в UI',
          ],
          why_matters:
            'Пользователи не готовы платить за продукт, который не попробовали',
        },
        {
          id: 'gap-3',
          type: 'warning',
          category: 'security',
          business_goal: 'Безопасность данных клиентов',
          current_state: 'Нет мониторинга ошибок, нет логирования',
          recommendation: 'Настроить Sentry + structured logging',
          effort: 'medium',
          impact: 'medium',
          hook: 'Вы узнаете о багах раньше клиентов',
          time_to_fix: '2-3 часа',
          action_steps: [
            'npm install @sentry/nextjs',
            'Запустить npx @sentry/wizard@latest -i nextjs',
            'Настроить source maps для читаемых stack traces',
            'Добавить Slack-уведомления о критических ошибках',
          ],
          why_matters:
            'B2B клиенты ожидают надёжности и быстрого реагирования на проблемы',
        },
        {
          id: 'gap-4',
          type: 'warning',
          category: 'testing',
          business_goal: 'Стабильный продукт без регрессий',
          current_state: 'Нет автоматических тестов',
          recommendation: 'Добавить unit-тесты для критических функций',
          effort: 'high',
          impact: 'medium',
          hook: 'Каждый деплой — это риск сломать что-то важное',
          time_to_fix: '4-8 часов',
          action_steps: [
            'Установить Vitest и @testing-library/react',
            'Написать тесты для auth flow (signup, login, logout)',
            'Написать тесты для billing (subscription, upgrade, cancel)',
            'Настроить CI/CD с запуском тестов перед деплоем',
          ],
          why_matters: 'Тесты позволяют уверенно вносить изменения и быстрее релизить',
        },
      ],
      tasks: [
        {
          title: 'Интегрировать PostHog для аналитики',
          description:
            'Добавить product analytics для отслеживания поведения пользователей и воронки конверсии.',
          priority: 'high',
          category: 'technical',
          estimated_minutes: 120,
          depends_on: null,
        },
        {
          title: 'Добавить 14-дневный trial период',
          description:
            'Настроить триальную подписку в Stripe без требования карты. Добавить email-напоминания.',
          priority: 'high',
          category: 'product',
          estimated_minutes: 90,
          depends_on: null,
        },
        {
          title: 'Настроить Sentry',
          description:
            'Установить @sentry/nextjs, настроить source maps и Slack-уведомления.',
          priority: 'medium',
          category: 'technical',
          estimated_minutes: 60,
          depends_on: null,
        },
      ],
      next_milestone: 'Запуск бета-версии с аналитикой и trial',
      metadata: {
        gaps_detected: 4,
        tasks_generated: 3,
        model_used: 'demo',
        tokens_used: 0,
        analysis_duration_ms: 0,
      },
    },

    competitorResult: {
      success: true,
      competitors: [
        {
          name: 'Mailchimp',
          url: 'https://mailchimp.com',
          description: 'Платформа email-маркетинга для малого бизнеса',
          value_proposition: 'Простой в использовании email-маркетинг с автоматизацией',
          target_audience: 'SMB, маркетологи, предприниматели',
          key_features: [
            'Email-кампании',
            'Автоматизация',
            'Landing pages',
            'CRM',
            'Аналитика',
          ],
          pricing_model: 'Freemium + подписка от $13/мес',
          strengths: ['Узнаваемый бренд', 'Большая база интеграций', 'Простой UI'],
          weaknesses: ['Дорого при росте', 'Ограниченная автоматизация на бесплатном плане'],
          differentiators: ['Бренд', 'Масштаб', 'Интеграции'],
        },
        {
          name: 'ConvertKit',
          url: 'https://convertkit.com',
          description: 'Email-маркетинг для creators',
          value_proposition: 'Email-маркетинг, созданный для creators и авторов',
          target_audience: 'Блогеры, YouTube-авторы, creators',
          key_features: [
            'Visual automation builder',
            'Landing pages',
            'Продажа digital-продуктов',
          ],
          pricing_model: 'Бесплатно до 1000 подписчиков, затем от $25/мес',
          strengths: ['Фокус на creators', 'Хорошая автоматизация', 'Commerce функции'],
          weaknesses: ['Меньше интеграций', 'Не для e-commerce'],
          differentiators: ['Нишевой фокус', 'Creator economy'],
        },
      ],
      comparison_matrix: [
        {
          aspect: 'Цена за 5000 контактов',
          category: 'pricing',
          your_product: '$99/мес',
          competitors: { Mailchimp: '$75/мес', ConvertKit: '$79/мес' },
          winner: 'Mailchimp',
        },
        {
          aspect: 'Визуальный редактор автоматизаций',
          category: 'features',
          your_product: 'Есть (базовый)',
          competitors: { Mailchimp: 'Есть', ConvertKit: 'Есть (продвинутый)' },
          winner: 'ConvertKit',
        },
        {
          aspect: 'Интеграция с соцсетями',
          category: 'features',
          your_product: 'Есть (Instagram, LinkedIn)',
          competitors: { Mailchimp: 'Ограничено', ConvertKit: 'Нет' },
          winner: 'you',
        },
      ],
      your_advantages: [
        'Единый интерфейс для email и соцсетей',
        'Более простая ценовая модель',
        'Свежий современный UI',
      ],
      your_gaps: [
        'Меньше интеграций с CRM',
        'Нет мобильного приложения',
        'Отсутствие бренда и доверия',
      ],
      recommendations: [
        'Сфокусироваться на нише "маркетинг для SaaS-стартапов"',
        'Добавить интеграции с популярными CRM (HubSpot, Pipedrive)',
        'Создать кейсы с ранними клиентами для social proof',
      ],
      market_position: 'niche',
      market_position_explanation:
        'Вы занимаете уникальную нишу — объединение email и social media в одном инструменте. Это позволяет избежать прямой конкуренции с гигантами вроде Mailchimp.',
      metadata: {
        competitors_analyzed: 2,
        websites_parsed: 2,
        tokens_used: 0,
        analysis_duration_ms: 0,
      },
    },
  },

  // ===========================================
  // 2. E-commerce
  // ===========================================
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Онлайн-магазин одежды с доставкой по России',
    icon: '🛒',
    tags: ['B2C', 'Retail', 'React'],

    businessResult: {
      success: true,
      needs_clarification: false,
      canvas: {
        customer_segments: [
          'Женщины 25-40 лет со средним доходом',
          'Жители городов-миллионников',
          'Активные пользователи Instagram',
        ],
        value_proposition:
          'Стильная базовая одежда российского производства по доступным ценам. Бесплатная доставка от 3000 руб.',
        channels: ['Instagram', 'Яндекс.Маркет', 'Google Shopping', 'Собственный сайт'],
        customer_relationships: 'Личные консультации в WhatsApp + программа лояльности',
        revenue_streams: [
          'Продажа одежды (средний чек 4500 руб)',
          'Аксессуары (маржа 60%)',
        ],
        key_resources: [
          'Швейное производство (аутсорс)',
          'Склад и логистика',
          'База клиентов (12000+ email)',
        ],
        key_activities: [
          'Закупка и контроль качества',
          'Фотосъёмка и контент',
          'Обработка заказов',
          'Работа с возвратами',
        ],
        key_partners: [
          'СДЭК (доставка)',
          'Boxberry (пункты выдачи)',
          'Швейная фабрика',
        ],
        cost_structure: [
          'Закупка товара (~45%)',
          'Логистика (~15%)',
          'Маркетинг (~20%)',
          'Операционка (~20%)',
        ],
      },
      business_stage: 'early_traction',
      gaps_in_model: [
        'Высокая зависимость от Instagram',
        'Нет автоматизации складского учёта',
        'Отсутствует CRM-система',
      ],
      recommendations: [
        {
          area: 'Diversification',
          recommendation: 'Запустить канал в Telegram и email-рассылки',
          priority: 'high',
        },
        {
          area: 'Operations',
          recommendation: 'Внедрить МойСклад или аналог',
          priority: 'medium',
        },
      ],
      metadata: {
        documents_parsed: 0,
        total_text_length: 623,
        model_used: 'demo',
        tokens_used: 0,
        analysis_duration_ms: 0,
      },
    },

    codeResult: {
      success: true,
      analysis: {
        project_summary:
          'React SPA для онлайн-магазина одежды. Использует Redux для состояния, React Router для навигации. Интеграция с платёжными системами (ЮKassa, СБП). Админ-панель на отдельном поддомене.',
        detected_stage: 'launched',
        tech_stack: [
          'React 18',
          'Redux Toolkit',
          'React Router',
          'Styled Components',
          'ЮKassa API',
          'Node.js (backend)',
          'PostgreSQL',
        ],
        strengths: [
          {
            area: 'UI/UX',
            detail: 'Красивый дизайн, хорошая мобильная адаптация',
          },
          {
            area: 'Checkout',
            detail: 'Простой и понятный процесс оформления заказа',
          },
          {
            area: 'SEO',
            detail: 'Настроен SSR для product pages',
          },
        ],
        issues: [
          {
            severity: 'high',
            area: 'Производительность',
            detail: 'Большой bundle size (2.3MB), нет code splitting',
            file_path: 'src/App.tsx',
          },
          {
            severity: 'high',
            area: 'SEO',
            detail: 'Нет structured data (JSON-LD) для товаров',
            file_path: 'src/pages/ProductPage.tsx',
          },
          {
            severity: 'medium',
            area: 'Аналитика',
            detail: 'Только Яндекс.Метрика, нет enhanced ecommerce',
            file_path: null,
          },
        ],
        tasks: [
          {
            title: 'Настроить code splitting',
            description:
              'Разбить bundle с помощью React.lazy и Suspense. Ожидаемое уменьшение initial load на 40%.',
            priority: 'high',
            category: 'technical',
            estimated_minutes: 120,
            depends_on: null,
          },
          {
            title: 'Добавить JSON-LD structured data',
            description:
              'Добавить schema.org разметку для Product, Offer, Review. Улучшит SEO и CTR в поиске.',
            priority: 'high',
            category: 'product',
            estimated_minutes: 90,
            depends_on: null,
          },
          {
            title: 'Настроить Enhanced Ecommerce в GA4',
            description:
              'Отслеживать view_item, add_to_cart, purchase события для анализа воронки.',
            priority: 'medium',
            category: 'marketing',
            estimated_minutes: 120,
            depends_on: null,
          },
        ],
        next_milestone: 'Увеличение органического трафика на 30%',
      },
      metadata: {
        files_analyzed: 89,
        total_lines: 12450,
        model_used: 'demo',
        tokens_used: 0,
        analysis_duration_ms: 0,
      },
    },

    gapResult: {
      success: true,
      alignment_score: 58,
      verdict: 'iterate',
      verdict_explanation:
        'Магазин работает и приносит продажи, но есть серьёзные технические проблемы (производительность) и пробелы в маркетинге (SEO, аналитика).',
      gaps: [
        {
          id: 'gap-1',
          type: 'critical',
          category: 'growth',
          business_goal: 'Увеличение органического трафика',
          current_state: 'Нет structured data, медленная загрузка влияет на SEO',
          recommendation: 'Добавить JSON-LD и оптимизировать Core Web Vitals',
          effort: 'medium',
          impact: 'high',
          hook: 'Google понижает сайты с плохой производительностью',
          time_to_fix: '4-6 часов',
          action_steps: [
            'Измерить текущие Core Web Vitals через PageSpeed Insights',
            'Добавить React.lazy для всех route components',
            'Оптимизировать изображения (WebP, lazy loading)',
            'Добавить JSON-LD schema для всех товаров',
          ],
          why_matters:
            'Органический трафик — самый дешёвый источник клиентов в долгосрочной перспективе',
        },
        {
          id: 'gap-2',
          type: 'critical',
          category: 'marketing',
          business_goal: 'Диверсификация каналов продаж',
          current_state: '80% продаж через Instagram',
          recommendation: 'Развить email-маркетинг и Telegram-канал',
          effort: 'medium',
          impact: 'high',
          hook: 'Instagram может заблокировать аккаунт в любой момент',
          time_to_fix: '1 неделя',
          action_steps: [
            'Настроить автоматический сбор email при checkout',
            'Запустить welcome-серию из 3 писем',
            'Создать Telegram-канал с эксклюзивными скидками',
            'Настроить retargeting через email (брошенные корзины)',
          ],
          why_matters: 'Владение базой клиентов защищает от зависимости от платформ',
        },
        {
          id: 'gap-3',
          type: 'warning',
          category: 'ux',
          business_goal: 'Увеличение конверсии на сайте',
          current_state: 'Долгая загрузка (LCP > 4s), нет lazy loading',
          recommendation: 'Оптимизировать производительность сайта',
          effort: 'high',
          impact: 'high',
          hook: 'Каждая секунда задержки = -7% конверсии',
          time_to_fix: '8-12 часов',
          action_steps: [
            'Настроить code splitting и tree shaking',
            'Конвертировать изображения в WebP',
            'Добавить CDN для статики',
            'Настроить preload для критических ресурсов',
          ],
          why_matters: 'Быстрый сайт = больше покупок и лучше SEO',
        },
      ],
      tasks: [
        {
          title: 'Оптимизировать производительность сайта',
          description: 'Code splitting, оптимизация изображений, CDN. Цель: LCP < 2.5s.',
          priority: 'high',
          category: 'technical',
          estimated_minutes: 360,
          depends_on: null,
        },
        {
          title: 'Настроить email-маркетинг',
          description: 'Интегрировать Unisender, настроить welcome-серию и брошенные корзины.',
          priority: 'high',
          category: 'marketing',
          estimated_minutes: 240,
          depends_on: null,
        },
        {
          title: 'Добавить structured data',
          description: 'JSON-LD разметка для товаров, хлебных крошек, организации.',
          priority: 'medium',
          category: 'product',
          estimated_minutes: 90,
          depends_on: null,
        },
      ],
      next_milestone: 'Достижение LCP < 2.5s и запуск email-рассылок',
      metadata: {
        gaps_detected: 3,
        tasks_generated: 3,
        model_used: 'demo',
        tokens_used: 0,
        analysis_duration_ms: 0,
      },
    },

    competitorResult: {
      success: true,
      competitors: [
        {
          name: 'Lamoda',
          url: 'https://lamoda.ru',
          description: 'Крупнейший fashion-маркетплейс России',
          value_proposition: 'Огромный выбор брендов с примеркой перед покупкой',
          target_audience: 'Широкая аудитория 18-45 лет',
          key_features: ['Примерка', 'Быстрая доставка', 'Рассрочка', 'Программа лояльности'],
          pricing_model: 'Комиссия с продавцов + прямые продажи',
          strengths: ['Масштаб', 'Логистика', 'Бренды'],
          weaknesses: ['Нет уникальности', 'Высокая конкуренция внутри'],
          differentiators: ['Масштаб', 'Инфраструктура'],
        },
        {
          name: '12Storeez',
          url: 'https://12storeez.com',
          description: 'Российский бренд базовой одежды премиум-сегмента',
          value_proposition: 'Качественная базовая одежда с продуманными деталями',
          target_audience: 'Женщины 25-45 с доходом выше среднего',
          key_features: ['Собственное производство', 'Капсульные коллекции', 'Timeless стиль'],
          pricing_model: 'Прямые продажи, средний чек 8000-15000 руб',
          strengths: ['Бренд', 'Качество', 'Стиль'],
          weaknesses: ['Высокие цены', 'Ограниченный размерный ряд'],
          differentiators: ['Premium позиционирование'],
        },
      ],
      comparison_matrix: [
        {
          aspect: 'Средний чек',
          category: 'pricing',
          your_product: '4500 руб',
          competitors: { Lamoda: '5000 руб', '12Storeez': '10000 руб' },
          winner: 'you',
          notes: 'Ваш средний чек ниже, что привлекает mass market',
        },
        {
          aspect: 'Производство',
          category: 'features',
          your_product: 'Россия (аутсорс)',
          competitors: { Lamoda: 'Разные страны', '12Storeez': 'Собственное в России' },
          winner: '12Storeez',
        },
      ],
      your_advantages: [
        'Доступные цены при российском производстве',
        'Личный подход в WhatsApp',
        'Гибкость и скорость обновления ассортимента',
      ],
      your_gaps: [
        'Меньше трафика и узнаваемости',
        'Нет примерки перед покупкой',
        'Ограниченная логистика',
      ],
      recommendations: [
        'Позиционироваться как "12Storeez для среднего класса"',
        'Развивать UGC-контент в Instagram',
        'Добавить виртуальную примерку или подробные size guides',
      ],
      market_position: 'challenger',
      market_position_explanation:
        'Вы конкурируете с premium-брендами за счёт более доступных цен при сохранении качества. Есть потенциал занять нишу "доступная качественная база".',
      metadata: {
        competitors_analyzed: 2,
        websites_parsed: 2,
        tokens_used: 0,
        analysis_duration_ms: 0,
      },
    },
  },

  // ===========================================
  // 3. Mobile App
  // ===========================================
  {
    id: 'mobile',
    name: 'Mobile App',
    description: 'Фитнес-приложение с персональными тренировками',
    icon: '📱',
    tags: ['B2C', 'Health', 'React Native'],

    businessResult: {
      success: true,
      needs_clarification: false,
      canvas: {
        customer_segments: [
          'Новички в фитнесе 25-40 лет',
          'Люди без времени на спортзал',
          'Те, кто хочет заниматься дома',
        ],
        value_proposition:
          'Персонализированные тренировки дома за 20 минут в день. AI-тренер адаптирует программу под твой уровень.',
        channels: [
          'App Store / Google Play',
          'Instagram Reels',
          'TikTok',
          'YouTube Shorts',
        ],
        customer_relationships:
          'In-app чат с тренером (premium), push-уведомления, gamification',
        revenue_streams: [
          'Подписка Premium: 299 руб/мес или 1990 руб/год',
          'Разовые программы: 990-2990 руб',
        ],
        key_resources: [
          'Мобильное приложение (React Native)',
          'Видео-контент (500+ тренировок)',
          'AI-алгоритм адаптации',
        ],
        key_activities: [
          'Создание контента (видео тренировок)',
          'Улучшение алгоритма рекомендаций',
          'Маркетинг в соцсетях',
          'Поддержка пользователей',
        ],
        key_partners: [
          'Фитнес-блогеры (промо)',
          'Диетологи (контент)',
          'RevenueCat (платежи)',
        ],
        cost_structure: [
          'Контент-продакшн (~30%)',
          'Разработка (~25%)',
          'Маркетинг (~30%)',
          'Инфраструктура (~15%)',
        ],
      },
      business_stage: 'early_traction',
      gaps_in_model: [
        'Низкий retention после 7 дня',
        'Нет социальных функций',
        'Слабая монетизация (конверсия в платных 2%)',
      ],
      recommendations: [
        {
          area: 'Retention',
          recommendation: 'Добавить streak-систему и достижения',
          priority: 'high',
        },
        {
          area: 'Social',
          recommendation: 'Добавить leaderboards и challenges с друзьями',
          priority: 'medium',
        },
        {
          area: 'Monetization',
          recommendation: 'Внедрить paywall после 3 бесплатных тренировок',
          priority: 'high',
        },
      ],
      metadata: {
        documents_parsed: 0,
        total_text_length: 712,
        model_used: 'demo',
        tokens_used: 0,
        analysis_duration_ms: 0,
      },
    },

    codeResult: {
      success: true,
      analysis: {
        project_summary:
          'React Native (Expo) фитнес-приложение. Использует Firebase для auth и Firestore для данных. RevenueCat для подписок. Видео стримится с Mux. Есть базовый AI-recommendation engine.',
        detected_stage: 'launched',
        tech_stack: [
          'React Native (Expo)',
          'TypeScript',
          'Firebase Auth',
          'Firestore',
          'RevenueCat',
          'Mux (video)',
          'Python (ML backend)',
          'FastAPI',
        ],
        strengths: [
          {
            area: 'Кроссплатформенность',
            detail: 'Один код для iOS и Android благодаря React Native',
          },
          {
            area: 'Video',
            detail: 'Оптимизированный стриминг через Mux с adaptive bitrate',
          },
          {
            area: 'Платежи',
            detail: 'RevenueCat правильно настроен для A/B тестов pricing',
          },
        ],
        issues: [
          {
            severity: 'high',
            area: 'Performance',
            detail: 'Медленный cold start (5+ секунд на старых устройствах)',
            file_path: 'App.tsx',
          },
          {
            severity: 'high',
            area: 'Offline',
            detail: 'Приложение не работает без интернета',
            file_path: null,
          },
          {
            severity: 'medium',
            area: 'Push',
            detail: 'Нет умных push-уведомлений (только scheduled)',
            file_path: null,
          },
        ],
        tasks: [
          {
            title: 'Оптимизировать cold start',
            description:
              'Lazy load screens, оптимизировать Firebase init, использовать Hermes engine.',
            priority: 'high',
            category: 'technical',
            estimated_minutes: 240,
            depends_on: null,
          },
          {
            title: 'Добавить offline-режим',
            description:
              'Кэшировать видео и прогресс локально. Синхронизировать при появлении сети.',
            priority: 'high',
            category: 'product',
            estimated_minutes: 360,
            depends_on: null,
          },
          {
            title: 'Настроить smart push-уведомления',
            description:
              'Отправлять push на основе поведения: напоминания о тренировках, streak alerts.',
            priority: 'medium',
            category: 'product',
            estimated_minutes: 180,
            depends_on: null,
          },
        ],
        next_milestone: 'Увеличение D7 retention с 20% до 35%',
      },
      metadata: {
        files_analyzed: 156,
        total_lines: 18900,
        model_used: 'demo',
        tokens_used: 0,
        analysis_duration_ms: 0,
      },
    },

    gapResult: {
      success: true,
      alignment_score: 52,
      verdict: 'iterate',
      verdict_explanation:
        'Приложение работает и имеет пользователей, но retention и монетизация значительно ниже бенчмарков индустрии. Нужны существенные доработки.',
      gaps: [
        {
          id: 'gap-1',
          type: 'critical',
          category: 'growth',
          business_goal: 'D7 retention > 30%',
          current_state: 'D7 retention = 20%, пользователи бросают после 3-4 тренировок',
          recommendation: 'Внедрить gamification: streaks, badges, levels',
          effort: 'high',
          impact: 'high',
          hook: 'Duolingo вырос до $7B благодаря streak-механике',
          time_to_fix: '2-3 недели',
          action_steps: [
            'Добавить streak counter на главный экран',
            'Создать систему достижений (10 badges)',
            'Добавить weekly challenges',
            'Настроить push-уведомления для сохранения streak',
          ],
          why_matters: 'Retention — главная метрика для subscription apps. +10% retention = +40% LTV',
        },
        {
          id: 'gap-2',
          type: 'critical',
          category: 'monetization',
          business_goal: 'Конверсия в платных > 5%',
          current_state: 'Конверсия 2%, пользователи не видят ценности Premium',
          recommendation: 'Переосмыслить paywall и ценностное предложение Premium',
          effort: 'medium',
          impact: 'high',
          hook: 'Лучшие fitness apps конвертируют 8-12% в платных',
          time_to_fix: '1 неделя',
          action_steps: [
            'A/B тест: paywall после 3 vs 5 бесплатных тренировок',
            'Показывать "Premium" фичи с blur/lock',
            'Добавить 7-дневный trial вместо сразу оплаты',
            'Тестировать цены: 199/299/399 руб/мес',
          ],
          why_matters: 'Конверсия напрямую влияет на unit economics и возможность роста',
        },
        {
          id: 'gap-3',
          type: 'warning',
          category: 'ux',
          business_goal: 'Удобство использования в любых условиях',
          current_state: 'Приложение не работает без интернета',
          recommendation: 'Добавить offline-режим для скачанных тренировок',
          effort: 'high',
          impact: 'medium',
          hook: 'Пользователи часто тренируются там, где нет Wi-Fi',
          time_to_fix: '2 недели',
          action_steps: [
            'Добавить кнопку "Скачать" для тренировок',
            'Реализовать локальное хранилище с expo-file-system',
            'Синхронизировать прогресс при появлении сети',
            'Показывать badge "Доступно офлайн"',
          ],
          why_matters: 'Offline-доступ убирает барьер для регулярных тренировок',
        },
        {
          id: 'gap-4',
          type: 'warning',
          category: 'infrastructure',
          business_goal: 'Быстрый и отзывчивый UX',
          current_state: 'Cold start > 5 секунд на старых устройствах',
          recommendation: 'Оптимизировать startup performance',
          effort: 'medium',
          impact: 'medium',
          hook: 'Пользователи удаляют медленные приложения',
          time_to_fix: '1 неделя',
          action_steps: [
            'Включить Hermes engine в Expo config',
            'Lazy load всех экранов кроме Home',
            'Defer Firebase и analytics init',
            'Оптимизировать splash screen transition',
          ],
          why_matters: 'Быстрый старт = лучшее первое впечатление = выше retention',
        },
      ],
      tasks: [
        {
          title: 'Внедрить streak-систему',
          description:
            'Добавить streak counter, push-напоминания, визуальные награды за непрерывные тренировки.',
          priority: 'high',
          category: 'product',
          estimated_minutes: 480,
          depends_on: null,
        },
        {
          title: 'Оптимизировать paywall',
          description:
            'A/B тест timing paywall, добавить 7-дневный trial, показывать ценность Premium.',
          priority: 'high',
          category: 'product',
          estimated_minutes: 240,
          depends_on: null,
        },
        {
          title: 'Добавить offline-режим',
          description: 'Возможность скачивать тренировки и заниматься без интернета.',
          priority: 'medium',
          category: 'technical',
          estimated_minutes: 600,
          depends_on: null,
        },
      ],
      next_milestone: 'D7 retention 30% и конверсия 4%',
      metadata: {
        gaps_detected: 4,
        tasks_generated: 3,
        model_used: 'demo',
        tokens_used: 0,
        analysis_duration_ms: 0,
      },
    },

    competitorResult: {
      success: true,
      competitors: [
        {
          name: 'Nike Training Club',
          url: 'https://apps.apple.com/app/nike-training-club',
          description: 'Бесплатное фитнес-приложение от Nike',
          value_proposition: 'Бесплатные профессиональные тренировки от мировых атлетов',
          target_audience: 'Широкая аудитория, лояльная Nike',
          key_features: ['200+ тренировок', 'Программы', 'Интеграция с Nike Run'],
          pricing_model: 'Полностью бесплатно (маркетинг бренда)',
          strengths: ['Бренд Nike', 'Качество контента', 'Бесплатно'],
          weaknesses: ['Нет персонализации', 'Нет live-тренеров'],
          differentiators: ['Бренд', 'Бесплатность'],
        },
        {
          name: 'FitOn',
          url: 'https://fitonapp.com',
          description: 'Бесплатное фитнес-приложение с celebrity-тренерами',
          value_proposition: 'Бесплатные тренировки со знаменитыми тренерами',
          target_audience: 'Женщины 25-45, новички',
          key_features: ['Celebrity тренеры', 'Meal plans (Pro)', 'Challenges'],
          pricing_model: 'Freemium: бесплатные тренировки, Pro $29.99/год',
          strengths: ['Знаменитые тренеры', 'Низкая цена Pro', 'Хороший UX'],
          weaknesses: ['Меньше персонализации', 'Ограниченный русский контент'],
          differentiators: ['Celebrity factor', 'Агрессивный freemium'],
        },
      ],
      comparison_matrix: [
        {
          aspect: 'Персонализация',
          category: 'features',
          your_product: 'AI-адаптация программы',
          competitors: { 'Nike Training Club': 'Базовые рекомендации', FitOn: 'По целям' },
          winner: 'you',
        },
        {
          aspect: 'Цена годовой подписки',
          category: 'pricing',
          your_product: '1990 руб',
          competitors: { 'Nike Training Club': 'Бесплатно', FitOn: '$29.99 (~2700 руб)' },
          winner: 'Nike Training Club',
        },
        {
          aspect: 'Контент на русском',
          category: 'features',
          your_product: '100% на русском',
          competitors: { 'Nike Training Club': '~30%', FitOn: '~10%' },
          winner: 'you',
        },
      ],
      your_advantages: [
        'Полная русификация и локальный контент',
        'AI-персонализация тренировок',
        'Конкурентная цена для РФ рынка',
      ],
      your_gaps: [
        'Нет известных тренеров/инфлюенсеров',
        'Меньше контента (500 vs 1000+ тренировок)',
        'Нет интеграции с wearables',
      ],
      recommendations: [
        'Партнёрство с российскими фитнес-блогерами',
        'Добавить интеграцию с Apple Health и Google Fit',
        'Создать viral-механику: challenges с друзьями',
      ],
      market_position: 'niche',
      market_position_explanation:
        'Вы занимаете нишу русскоязычного фитнес-приложения с AI-персонализацией. Это защищает от прямой конкуренции с глобальными игроками.',
      metadata: {
        competitors_analyzed: 2,
        websites_parsed: 2,
        tokens_used: 0,
        analysis_duration_ms: 0,
      },
    },
  },
];

// ===========================================
// Helper Functions
// ===========================================

export function getScenarioById(id: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find((s) => s.id === id);
}

export function getScenarioInfo(): DemoScenarioInfo[] {
  return DEMO_SCENARIO_INFO;
}
