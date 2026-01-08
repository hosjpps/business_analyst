import { test, expect } from '@playwright/test';
import { HomePage } from '../pages';
import { BUSINESS_DESCRIPTIONS, GITHUB_REPOS, TIMEOUTS } from '../fixtures/test-data';

test.describe('Code Analysis Flow', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should display code analysis mode option', async ({ page }) => {
    const codeMode = page.locator('[data-testid="mode-code"]');

    await expect(codeMode.first()).toBeVisible();
  });

  test('should show GitHub URL input when code mode selected', async ({
    page,
  }) => {
    const codeMode = page.locator('[data-testid="mode-code"]');
    await codeMode.first().click();

    // Должно появиться поле для GitHub URL
    const githubInput = page.locator('[data-testid="github-url"]');

    await expect(githubInput).toBeVisible();
  });

  test('should disable submit button when no input provided', async ({
    page,
  }) => {
    const codeMode = page.locator('[data-testid="mode-code"]');
    await codeMode.first().click();

    // Кнопка submit должна быть заблокирована
    const submitButton = page.locator('button[type="submit"]:has-text("Анализировать")');

    await expect(submitButton).toBeDisabled();
  });

  test('should show validation error for invalid GitHub URL', async ({
    page,
  }) => {
    const codeMode = page.locator('[data-testid="mode-code"]');
    await codeMode.first().click();

    // Вводим невалидный URL
    const githubInput = page.locator('[data-testid="github-url"]');
    await githubInput.fill(GITHUB_REPOS.malformed);

    // Пытаемся отправить или проверяем валидацию
    const submitButton = page.locator('button[type="submit"]:has-text("Анализировать")');

    // Кнопка должна быть заблокирована или показана ошибка
    const isDisabled = await submitButton.isDisabled();
    const errorVisible = await page
      .locator('.validation-error, .error-message, [role="alert"]')
      .isVisible();

    expect(isDisabled || errorVisible).toBeTruthy();
  });

  test('should enable submit button with valid GitHub URL', async ({ page }) => {
    const codeMode = page.locator('[data-testid="mode-code"]');
    await codeMode.first().click();

    // Вводим валидный URL
    const githubInput = page.locator('[data-testid="github-url"]');
    await githubInput.fill(GITHUB_REPOS.shadcnUi);

    // Также нужно заполнить описание проекта (обязательное поле)
    const descriptionInput = page.locator('textarea[placeholder*="проект"], textarea[id="description"]');
    await descriptionInput.fill('UI библиотека компонентов для React');

    // Кнопка submit должна быть активна
    const submitButton = page.locator('[data-testid="submit-analysis"], button[type="submit"]:has-text("Анализировать")');

    await expect(submitButton.first()).toBeEnabled();
  });

  test('should show progress indicator when analysis starts', async ({
    page,
  }) => {
    const codeMode = page.locator('[data-testid="mode-code"]');
    await codeMode.first().click();

    // Вводим URL
    const githubInput = page.locator('[data-testid="github-url"]');
    await githubInput.fill(GITHUB_REPOS.shadcnUi);

    // Заполняем описание (обязательное поле)
    const descriptionInput = page.locator('textarea[placeholder*="проект"], textarea[id="description"]');
    await descriptionInput.fill('UI библиотека компонентов для React');

    // Отправляем
    const submitButton = page.locator('[data-testid="submit-analysis"], button[type="submit"]:has-text("Анализировать")');
    await submitButton.first().click();

    // Должен появиться индикатор прогресса
    const progressIndicator = page.locator('[data-testid="progress-indicator"]');

    await expect(progressIndicator.first()).toBeVisible({
      timeout: TIMEOUTS.uiInteraction,
    });
  });

  test.skip('should complete code analysis and show results', async ({
    page,
  }) => {
    // SKIP: Требует реальный API вызов - долго
    const codeMode = page.locator('[data-testid="mode-code"]');
    await codeMode.first().click();

    const githubInput = page.locator('[data-testid="github-url"]');
    await githubInput.fill(GITHUB_REPOS.shadcnUi);

    const submitButton = page.locator('button[type="submit"]:has-text("Анализировать")');
    await submitButton.click();

    // Ждём результаты (может занять до 90 сек с LLM)
    const results = page.locator('.code-analysis-results, .analysis-results');

    await expect(results).toBeVisible({ timeout: TIMEOUTS.llmResponse });

    // Проверяем наличие ключевых секций
    const stage = page.locator('.project-stage, .detected-stage');
    const tasks = page.locator('.tasks-list, .task-item');

    await expect(stage).toBeVisible();
    await expect(tasks.first()).toBeVisible();
  });

  test('should show file upload option', async ({ page }) => {
    const codeMode = page.locator('[data-testid="mode-code"]');
    await codeMode.first().click();

    // Должна быть опция загрузки файлов
    const fileUpload = page.locator('[data-testid="file-upload-zone"], [data-testid="file-upload"]');

    await expect(fileUpload.first()).toBeVisible();
  });

  test('should show chat section after analysis', async ({ page }) => {
    // Этот тест использует демо-режим для быстроты
    const demoButton = page.locator('[data-testid="demo-button"]');
    await demoButton.first().click();

    const scenarios = page.locator('[data-testid="demo-scenario-card"]');
    await scenarios.first().click();

    // После анализа должна появиться секция чата
    const chatSection = page.locator('[data-testid="chat-section"]');

    await expect(chatSection).toBeVisible({ timeout: 15000 });
  });
});
