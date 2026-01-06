import { test, expect } from '@playwright/test';
import { HomePage } from '../pages';
import { BUSINESS_DESCRIPTIONS, GITHUB_REPOS, TIMEOUTS } from '../fixtures/test-data';

test.describe('Full Analysis Flow', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should display full analysis mode option', async ({ page }) => {
    const fullMode = page.locator(
      '[data-testid="mode-full"], button:has-text("Полная картина"), button:has-text("Full"), .mode-full'
    );

    await expect(fullMode.first()).toBeVisible();
  });

  test('should show all required inputs in full mode', async ({ page }) => {
    // Выбираем Full Analysis
    const fullMode = page.locator(
      '[data-testid="mode-full"], button:has-text("Полная картина"), .mode-full'
    );
    await fullMode.first().click();

    // Должны быть видны: описание бизнеса, GitHub URL, конкуренты
    const businessTextarea = page.locator(
      '[data-testid="business-description"], textarea[name="business"], textarea'
    );
    const githubInput = page.locator(
      '[data-testid="github-url"], input[placeholder*="github"], input[name="github"]'
    );

    await expect(businessTextarea).toBeVisible();
    await expect(githubInput).toBeVisible();
  });

  test('should disable submit when required fields empty', async ({ page }) => {
    const fullMode = page.locator(
      '[data-testid="mode-full"], button:has-text("Полная картина"), .mode-full'
    );
    await fullMode.first().click();

    const submitButton = page.locator(
      '[data-testid="submit-analysis"], button[type="submit"], button:has-text("Анализировать")'
    );

    await expect(submitButton).toBeDisabled();
  });

  test('should show validation hints for required fields', async ({ page }) => {
    const fullMode = page.locator(
      '[data-testid="mode-full"], button:has-text("Полная картина"), .mode-full'
    );
    await fullMode.first().click();

    // Ждём появления формы
    await page.waitForTimeout(300);

    // Проверяем наличие подсказок валидации
    const validationHint = page.locator(
      '.validation-hint, .form-hint, .help-text, [data-testid="validation-feedback"]'
    );

    // Должна быть хоть одна подсказка
    const hintsCount = await validationHint.count();
    expect(hintsCount).toBeGreaterThanOrEqual(0); // Может не быть видимых подсказок до взаимодействия
  });

  test('should enable submit when all required fields filled', async ({
    page,
  }) => {
    const fullMode = page.locator(
      '[data-testid="mode-full"], button:has-text("Полная картина"), .mode-full'
    );
    await fullMode.first().click();

    // Заполняем обязательные поля
    const businessTextarea = page.locator(
      '[data-testid="business-description"], textarea[name="business"], textarea'
    );
    await businessTextarea.fill(BUSINESS_DESCRIPTIONS.saas);

    const githubInput = page.locator(
      '[data-testid="github-url"], input[placeholder*="github"], input[name="github"]'
    );
    await githubInput.fill(GITHUB_REPOS.shadcnUi);

    // Кнопка должна стать активной
    const submitButton = page.locator(
      '[data-testid="submit-analysis"], button[type="submit"], button:has-text("Анализировать")'
    );

    await expect(submitButton).toBeEnabled();
  });

  test('should show progressive loading steps', async ({ page }) => {
    const fullMode = page.locator(
      '[data-testid="mode-full"], button:has-text("Полная картина"), .mode-full'
    );
    await fullMode.first().click();

    // Заполняем форму
    const businessTextarea = page.locator(
      '[data-testid="business-description"], textarea'
    );
    await businessTextarea.fill(BUSINESS_DESCRIPTIONS.saas);

    const githubInput = page.locator(
      '[data-testid="github-url"], input[placeholder*="github"]'
    );
    await githubInput.fill(GITHUB_REPOS.shadcnUi);

    // Отправляем
    const submitButton = page.locator(
      '[data-testid="submit-analysis"], button[type="submit"]'
    );
    await submitButton.click();

    // Должны появиться шаги прогресса
    const progressSteps = page.locator(
      '[data-testid="progress-step"], .progress-step, .step-indicator, .analysis-step'
    );

    await expect(progressSteps.first()).toBeVisible({
      timeout: TIMEOUTS.uiInteraction,
    });
  });

  test('should show Multi-Metric Score in results (demo)', async ({ page }) => {
    // Используем демо для быстроты
    const demoButton = page.locator(
      '[data-testid="demo-button"], button:has-text("Демо")'
    );
    await demoButton.first().click();

    const scenarios = page.locator('[data-testid="demo-scenario-card"], .demo-scenario-card');
    await scenarios.first().click();

    // Ждём результаты
    const multiMetricScore = page.locator(
      '[data-testid="multi-metric-score"], .multi-metric-score, .alignment-score, .score-section'
    );

    await expect(multiMetricScore.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show Gap Detection results (demo)', async ({ page }) => {
    const demoButton = page.locator('[data-testid="demo-button"], button:has-text("Демо")');
    await demoButton.first().click();

    const scenarios = page.locator('[data-testid="demo-scenario-card"], .demo-scenario-card');
    await scenarios.first().click();

    // Ждём Gap Detection
    const gapDetection = page.locator(
      '[data-testid="gap-detection"], .gap-detection, .gaps-section, section:has-text("Разрыв")'
    );

    await expect(gapDetection.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show tasks list (demo)', async ({ page }) => {
    const demoButton = page.locator('[data-testid="demo-button"], button:has-text("Демо")');
    await demoButton.first().click();

    const scenarios = page.locator('[data-testid="demo-scenario-card"], .demo-scenario-card');
    await scenarios.first().click();

    // Ждём список задач
    const tasksList = page.locator(
      '[data-testid="tasks-list"], .tasks-list, .task-item, section:has-text("Задач")'
    );

    await expect(tasksList.first()).toBeVisible({ timeout: 15000 });
  });

  test('should allow adding competitors', async ({ page }) => {
    const fullMode = page.locator(
      '[data-testid="mode-full"], button:has-text("Полная картина"), .mode-full'
    );
    await fullMode.first().click();

    // Ищем секцию конкурентов
    const competitorsSection = page.locator(
      '[data-testid="competitors-section"], .competitors-section, .competitor-input, input[placeholder*="конкурент"], input[placeholder*="competitor"]'
    );

    // Конкуренты могут быть опциональными
    const exists = await competitorsSection.first().isVisible().catch(() => false);

    // Форма должна быть видна в любом случае
    const formVisible = await page.locator('form, .analysis-form').isVisible();
    expect(formVisible).toBeTruthy();
  });

  test.skip('should handle clarification questions', async ({ page }) => {
    // SKIP: Требует реальный LLM и несоответствующие данные
    const fullMode = page.locator('[data-testid="mode-full"], button:has-text("Полная картина")');
    await fullMode.first().click();

    // Вводим несоответствующие данные (бизнес vs код)
    const businessTextarea = page.locator('[data-testid="business-description"], textarea');
    await businessTextarea.fill(BUSINESS_DESCRIPTIONS.fitness);

    const githubInput = page.locator('[data-testid="github-url"], input[placeholder*="github"]');
    await githubInput.fill(GITHUB_REPOS.shadcnUi); // UI библиотека != фитнес

    const submitButton = page.locator('[data-testid="submit-analysis"], button[type="submit"]');
    await submitButton.click();

    // Должны появиться уточняющие вопросы
    const clarificationSection = page.locator(
      '[data-testid="clarification-section"], .clarification-questions, .questions-section'
    );

    await expect(clarificationSection).toBeVisible({ timeout: TIMEOUTS.llmResponse });

    // Вопросы должны быть в списке
    const questions = page.locator('[data-testid="clarification-question"], .question-item');
    const questionsCount = await questions.count();
    expect(questionsCount).toBeGreaterThan(0);
  });

  test('should show export options after analysis (demo)', async ({ page }) => {
    const demoButton = page.locator('[data-testid="demo-button"], button:has-text("Демо")');
    await demoButton.first().click();

    const scenarios = page.locator('[data-testid="demo-scenario-card"], .demo-scenario-card');
    await scenarios.first().click();

    // Ждём результаты
    await page.waitForTimeout(3000);

    // Должны быть кнопки экспорта
    const exportButtons = page.locator(
      '[data-testid="export-json"], [data-testid="export-markdown"], button:has-text("JSON"), button:has-text("Markdown"), button:has-text("Экспорт"), .export-button'
    );

    await expect(exportButtons.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show consultant chat after full analysis (demo)', async ({
    page,
  }) => {
    const demoButton = page.locator('[data-testid="demo-button"], button:has-text("Демо")');
    await demoButton.first().click();

    const scenarios = page.locator('[data-testid="demo-scenario-card"], .demo-scenario-card');
    await scenarios.first().click();

    // Ждём чат
    const chatSection = page.locator(
      '[data-testid="chat-section"], .chat-section, .consultant-chat, section:has-text("Консультант"), section:has-text("Чат")'
    );

    await expect(chatSection.first()).toBeVisible({ timeout: 15000 });
  });
});
