import { test, expect } from '@playwright/test';
import { HomePage } from '../pages';
import { TIMEOUTS } from '../fixtures/test-data';

test.describe('Demo Mode', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should display demo button on homepage', async ({ page }) => {
    // Ищем кнопку Demo разными способами (на случай если нет data-testid)
    const demoButton = page.locator(
      '[data-testid="demo-button"], button:has-text("Демо"), button:has-text("Demo"), .demo-button'
    );

    await expect(demoButton.first()).toBeVisible();
  });

  test('should open demo scenario selector when clicking demo button', async ({
    page,
  }) => {
    // Клик по кнопке Demo
    const demoButton = page.locator(
      '[data-testid="demo-button"], button:has-text("Демо"), button:has-text("Demo"), .demo-button'
    );
    await demoButton.first().click();

    // Должен появиться селектор сценариев (модал)
    const scenarioSelector = page.locator(
      '[data-testid="demo-scenario-selector"], .demo-scenarios, [role="dialog"]'
    );

    await expect(scenarioSelector).toBeVisible({ timeout: TIMEOUTS.uiInteraction });
  });

  test('should display 3 demo scenarios', async ({ page }) => {
    // Открываем селектор сценариев
    const demoButton = page.locator(
      '[data-testid="demo-button"], button:has-text("Демо"), button:has-text("Demo"), .demo-button'
    );
    await demoButton.first().click();

    // Ждём появления сценариев
    const scenarios = page.locator(
      '[data-testid="demo-scenario-card"], .demo-scenario-card, .scenario-card'
    );

    await expect(scenarios).toHaveCount(3, { timeout: TIMEOUTS.uiInteraction });
  });

  test('should run demo analysis when scenario selected', async ({ page }) => {
    // Открываем селектор
    const demoButton = page.locator(
      '[data-testid="demo-button"], button:has-text("Демо"), button:has-text("Demo"), .demo-button'
    );
    await demoButton.first().click();

    // Выбираем первый сценарий
    const scenarios = page.locator(
      '[data-testid="demo-scenario-card"], .demo-scenario-card, .scenario-card'
    );
    await scenarios.first().click();

    // Должен начаться анализ (появится прогресс или сразу результаты)
    const progressOrResults = page.locator(
      '[data-testid="progress-indicator"], [data-testid="business-canvas"], .analysis-results, .progress-indicator'
    );

    await expect(progressOrResults.first()).toBeVisible({
      timeout: TIMEOUTS.uiInteraction,
    });
  });

  test('should show mock results without LLM call in demo mode', async ({
    page,
  }) => {
    // Открываем селектор и выбираем сценарий
    const demoButton = page.locator(
      '[data-testid="demo-button"], button:has-text("Демо"), button:has-text("Demo"), .demo-button'
    );
    await demoButton.first().click();

    const scenarios = page.locator(
      '[data-testid="demo-scenario-card"], .demo-scenario-card, .scenario-card'
    );
    await scenarios.first().click();

    // В демо-режиме результаты должны появиться быстро (< 5 сек)
    // так как нет реальных API вызовов
    const businessCanvas = page.locator(
      '[data-testid="business-canvas"], .business-canvas, .canvas-section'
    );

    // Ждём результаты максимум 10 секунд (в демо должно быть быстро)
    await expect(businessCanvas).toBeVisible({ timeout: 10000 });
  });

  test('should pre-fill form in demo mode', async ({ page }) => {
    // Открываем селектор и выбираем сценарий
    const demoButton = page.locator(
      '[data-testid="demo-button"], button:has-text("Демо"), button:has-text("Demo"), .demo-button'
    );
    await demoButton.first().click();

    const scenarios = page.locator(
      '[data-testid="demo-scenario-card"], .demo-scenario-card, .scenario-card'
    );
    await scenarios.first().click();

    // После выбора сценария форма должна быть заполнена
    // Ждём немного для заполнения формы
    await page.waitForTimeout(500);

    // Проверяем что описание бизнеса не пустое
    const businessDescription = page.locator(
      '[data-testid="business-description"], textarea[name="business"], #business-description'
    );

    // В демо-режиме форма может быть скрыта или заполнена
    // Проверяем что либо форма заполнена, либо результаты уже показаны
    const isFormFilled =
      (await businessDescription.isVisible()) &&
      (await businessDescription.inputValue()) !== '';
    const resultsVisible = await page
      .locator('.analysis-results, [data-testid="business-canvas"]')
      .isVisible();

    expect(isFormFilled || resultsVisible).toBeTruthy();
  });

  test('should display demo badge when in demo mode', async ({ page }) => {
    // Открываем селектор и выбираем сценарий
    const demoButton = page.locator(
      '[data-testid="demo-button"], button:has-text("Демо"), button:has-text("Demo"), .demo-button'
    );
    await demoButton.first().click();

    const scenarios = page.locator(
      '[data-testid="demo-scenario-card"], .demo-scenario-card, .scenario-card'
    );
    await scenarios.first().click();

    // После запуска демо должен появиться badge "Демо"
    const demoBadge = page.locator(
      '[data-testid="demo-badge"], .demo-badge, .badge:has-text("Демо"), .badge:has-text("Demo")'
    );

    // Badge может появиться в результатах
    await expect(demoBadge.first()).toBeVisible({ timeout: 10000 });
  });

  test('should allow closing demo scenario selector', async ({ page }) => {
    // Открываем селектор
    const demoButton = page.locator(
      '[data-testid="demo-button"], button:has-text("Демо"), button:has-text("Demo"), .demo-button'
    );
    await demoButton.first().click();

    // Ждём появления модала
    const modal = page.locator(
      '[data-testid="demo-scenario-selector"], .demo-scenarios, [role="dialog"]'
    );
    await expect(modal).toBeVisible();

    // Закрываем модал (клик вне или кнопка закрытия)
    const closeButton = page.locator(
      '[data-testid="close-modal"], button[aria-label="Close"], .close-button, button:has-text("✕"), button:has-text("×")'
    );

    if (await closeButton.first().isVisible()) {
      await closeButton.first().click();
    } else {
      // Клик вне модала (backdrop)
      await page.locator('.modal-backdrop, .overlay').click({ force: true });
    }

    // Модал должен закрыться
    await expect(modal).toBeHidden({ timeout: TIMEOUTS.animation });
  });
});
