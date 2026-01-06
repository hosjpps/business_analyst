import { Page, Locator, expect } from '@playwright/test';
import { SELECTORS, TEST_USER, TIMEOUTS } from '../fixtures/test-data';

/**
 * Page Object для страниц авторизации (login/signup)
 */
export class AuthPage {
  readonly page: Page;

  // Login форма
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  // Навигация
  readonly signupLink: Locator;
  readonly loginLink: Locator;

  // Ошибки
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.loginForm = page.locator(SELECTORS.loginForm);
    this.emailInput = page.locator(SELECTORS.emailInput);
    this.passwordInput = page.locator(SELECTORS.passwordInput);
    this.submitButton = page.locator(SELECTORS.authSubmit);

    this.signupLink = page.locator('a[href="/signup"]');
    this.loginLink = page.locator('a[href="/login"]');

    this.errorMessage = page.locator('[role="alert"], .error-message');
  }

  /**
   * Перейти на страницу входа
   */
  async gotoLogin() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Перейти на страницу регистрации
   */
  async gotoSignup() {
    await this.page.goto('/signup');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Заполнить email
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Заполнить пароль
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Отправить форму
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Полный flow входа
   */
  async login(email = TEST_USER.email, password = TEST_USER.password) {
    await this.gotoLogin();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();

    // Ждём редирект на dashboard или главную
    await this.page.waitForURL(/\/(dashboard)?$/, {
      timeout: TIMEOUTS.pageLoad,
    });
  }

  /**
   * Полный flow регистрации
   */
  async signup(email: string, password: string) {
    await this.gotoSignup();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();

    // Ждём редирект или сообщение об успехе
    await this.page.waitForURL(/\/(dashboard|login)?$/, {
      timeout: TIMEOUTS.pageLoad,
    });
  }

  /**
   * Проверка что пользователь залогинен
   */
  async isLoggedIn(): Promise<boolean> {
    // Проверяем наличие элементов, которые видны только для авторизованных
    const userMenu = this.page.locator(SELECTORS.userMenu);
    const logoutButton = this.page.locator(SELECTORS.logoutButton);

    return (await userMenu.isVisible()) || (await logoutButton.isVisible());
  }

  /**
   * Выход из системы
   */
  async logout() {
    const logoutButton = this.page.locator(SELECTORS.logoutButton);

    // Попробуем найти кнопку выхода в разных местах
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Возможно нужно открыть меню пользователя
      const userMenu = this.page.locator(SELECTORS.userMenu);
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await logoutButton.click();
      }
    }

    // Ждём редирект на главную или login
    await this.page.waitForURL(/\/(login)?$/, {
      timeout: TIMEOUTS.pageLoad,
    });
  }

  /**
   * Получить текст ошибки
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return this.errorMessage.textContent();
    }
    return null;
  }

  /**
   * Проверка что форма валидна
   */
  async isFormValid(): Promise<boolean> {
    const isDisabled = await this.submitButton.isDisabled();
    return !isDisabled;
  }
}
