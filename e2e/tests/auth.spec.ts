import { test, expect } from '@playwright/test';
import { AuthPage, DashboardPage } from '../pages';
import { TEST_USER, TIMEOUTS } from '../fixtures/test-data';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();

    // Должна быть форма входа
    const loginForm = page.locator('[data-testid="auth-form"]');

    await expect(loginForm).toBeVisible();
  });

  test('should display signup page', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoSignup();

    // Должна быть форма регистрации
    const signupForm = page.locator('[data-testid="auth-form"]');

    await expect(signupForm).toBeVisible();
  });

  test('should show email and password inputs on login', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();

    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should disable submit with empty credentials', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();

    const submitButton = page.locator('[data-testid="submit-button"]');

    // Кнопка может быть disabled или показать ошибку при клике
    const isDisabled = await submitButton.isDisabled().catch(() => false);

    // Если не disabled, пробуем кликнуть и проверить ошибку
    if (!isDisabled) {
      await submitButton.click();
      const errorMessage = page.locator('[data-testid="auth-error"], [role="alert"], .error-message');
      const hasError = await errorMessage.isVisible().catch(() => false);
      // Либо disabled, либо показывает ошибку
      expect(isDisabled || hasError).toBeTruthy();
    } else {
      expect(isDisabled).toBeTruthy();
    }
  });

  test('should show error for invalid email format', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();

    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.fill('invalid-email');

    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.fill('somepassword');

    const submitButton = page.locator('[data-testid="submit-button"]');

    // Пытаемся отправить
    if (!(await submitButton.isDisabled())) {
      await submitButton.click();

      // Должна появиться ошибка
      const errorMessage = page.locator('[data-testid="auth-error"], [role="alert"], .error-message');
      await expect(errorMessage).toBeVisible({ timeout: TIMEOUTS.uiInteraction });
    }
  });

  test('should have link to signup from login page', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();

    const signupLink = page.locator(
      'a[href="/signup"], a:has-text("Регистрация"), a:has-text("Sign up"), a:has-text("Создать аккаунт")'
    );

    await expect(signupLink.first()).toBeVisible();
  });

  test('should have link to login from signup page', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoSignup();

    const loginLink = page.locator(
      'a[href="/login"], a:has-text("Войти"), a:has-text("Log in"), a:has-text("Вход")'
    );

    await expect(loginLink.first()).toBeVisible();
  });

  test('should redirect to login when accessing dashboard without auth', async ({
    page,
  }) => {
    const dashboardPage = new DashboardPage(page);

    // Пытаемся зайти на dashboard без авторизации
    await page.goto('/dashboard');

    // Должен редиректить на login
    await expect(page).toHaveURL(/\/(login|auth)/, {
      timeout: TIMEOUTS.pageLoad,
    });
  });

  test('should redirect to login when accessing project without auth', async ({
    page,
  }) => {
    // Пытаемся зайти на страницу проекта без авторизации
    await page.goto('/projects/some-id');

    // Должен редиректить на login
    await expect(page).toHaveURL(/\/(login|auth)/, {
      timeout: TIMEOUTS.pageLoad,
    });
  });

  test.skip('should login successfully with valid credentials', async ({
    page,
  }) => {
    // SKIP: Требует реальный тестовый аккаунт в Supabase
    const authPage = new AuthPage(page);

    await authPage.login(TEST_USER.email, TEST_USER.password);

    // После успешного входа - редирект на dashboard или главную
    await expect(page).toHaveURL(/\/(dashboard)?$/, {
      timeout: TIMEOUTS.pageLoad,
    });

    // Должен быть виден элемент для авторизованного пользователя
    const userMenu = page.locator(
      '[data-testid="user-menu"], .user-menu, [data-testid="logout-button"]'
    );
    await expect(userMenu.first()).toBeVisible();
  });

  test.skip('should logout successfully', async ({ page }) => {
    // SKIP: Требует предварительный вход
    const authPage = new AuthPage(page);

    // Сначала входим
    await authPage.login(TEST_USER.email, TEST_USER.password);

    // Выходим
    await authPage.logout();

    // Должен быть на главной или login
    await expect(page).toHaveURL(/\/(login)?$/, {
      timeout: TIMEOUTS.pageLoad,
    });
  });

  test('should allow access to home page without auth', async ({ page }) => {
    // Главная страница должна быть доступна без авторизации
    await page.goto('/');

    // Страница должна загрузиться (не редирект на login)
    await expect(page).not.toHaveURL(/\/login/);

    // Форма анализа должна быть видна
    const analysisForm = page.locator('[data-testid="mode-selector"], [data-testid="mode-business"]');
    await expect(analysisForm.first()).toBeVisible();
  });
});
