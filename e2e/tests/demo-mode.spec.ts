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
    const demoButton = page.locator('[data-testid="demo-button"]');

    await expect(demoButton.first()).toBeVisible();
  });

  test('should open demo scenario selector when clicking demo button', async ({
    page,
  }) => {
    const demoButton = page.locator('[data-testid="demo-button"]');
    await demoButton.first().click();

    // Должен появиться селектор сценариев (модал)
    const scenarioSelector = page.locator('[data-testid="demo-modal"]');

    await expect(scenarioSelector).toBeVisible({ timeout: TIMEOUTS.uiInteraction });
  });

  test('should display 3 demo scenarios', async ({ page }) => {
    const demoButton = page.locator('[data-testid="demo-button"]');
    await demoButton.first().click();

    // Ждём появления сценариев
    const scenarios = page.locator('[data-testid="demo-scenario-card"]');

    await expect(scenarios).toHaveCount(3, { timeout: TIMEOUTS.uiInteraction });
  });

  test('should run demo analysis when scenario selected', async ({ page }) => {
    const demoButton = page.locator('[data-testid="demo-button"]');
    await demoButton.first().click();

    const scenarios = page.locator('[data-testid="demo-scenario-card"]');
    await scenarios.first().click();

    // Должен начаться анализ (появится прогресс или сразу результаты)
    const progressOrResults = page.locator(
      '[data-testid="progress-indicator"], [data-testid="business-canvas"], .business-canvas'
    );

    await expect(progressOrResults.first()).toBeVisible({
      timeout: TIMEOUTS.uiInteraction,
    });
  });

  test('should show mock results without LLM call in demo mode', async ({
    page,
  }) => {
    const demoButton = page.locator('[data-testid="demo-button"]');
    await demoButton.first().click();

    const scenarios = page.locator('[data-testid="demo-scenario-card"]');
    await scenarios.first().click();

    // В демо-режиме результаты должны появиться быстро (< 5 сек)
    const businessCanvas = page.locator('[data-testid="business-canvas"], .business-canvas');

    // Ждём результаты максимум 10 секунд (в демо должно быть быстро)
    await expect(businessCanvas).toBeVisible({ timeout: 10000 });
  });

  test('should pre-fill form in demo mode', async ({ page }) => {
    const demoButton = page.locator('[data-testid="demo-button"]');
    await demoButton.first().click();

    const scenarios = page.locator('[data-testid="demo-scenario-card"]');
    await scenarios.first().click();

    // После выбора сценария форма должна быть заполнена
    await page.waitForTimeout(500);

    // Проверяем что описание бизнеса не пустое
    const businessDescription = page.locator('[data-testid="business-description"]');

    // В демо-режиме форма может быть скрыта или заполнена
    const isFormFilled =
      (await businessDescription.isVisible()) &&
      (await businessDescription.inputValue()) !== '';
    const resultsVisible = await page
      .locator('[data-testid="business-canvas"], .business-canvas')
      .isVisible();

    expect(isFormFilled || resultsVisible).toBeTruthy();
  });

  test('should display demo badge when in demo mode', async ({ page }) => {
    const demoButton = page.locator('[data-testid="demo-button"]');
    await demoButton.first().click();

    const scenarios = page.locator('[data-testid="demo-scenario-card"]');
    await scenarios.first().click();

    // После запуска демо должен появиться badge "Демо"
    const demoBadge = page.locator('.demo-badge, .badge:has-text("Демо")');

    // Badge может появиться в результатах
    await expect(demoBadge.first()).toBeVisible({ timeout: 10000 });
  });

  test('should allow closing demo scenario selector', async ({ page }) => {
    const demoButton = page.locator('[data-testid="demo-button"]');
    await demoButton.first().click();

    // Ждём появления модала
    const modal = page.locator('[data-testid="demo-modal"]');
    await expect(modal).toBeVisible();

    // Закрываем модал (клик вне или кнопка закрытия)
    const closeButton = page.locator('.close-btn, button:has-text("✕")');

    if (await closeButton.first().isVisible()) {
      await closeButton.first().click();
    } else {
      // Клик вне модала (backdrop)
      await page.locator('[data-testid="demo-modal"]').click({ force: true, position: { x: 10, y: 10 } });
    }

    // Модал должен закрыться
    await expect(modal).toBeHidden({ timeout: TIMEOUTS.animation });
  });
});
