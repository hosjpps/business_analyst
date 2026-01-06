import { Page, Locator, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../fixtures/test-data';

/**
 * Page Object для Dashboard (список проектов)
 */
export class DashboardPage {
  readonly page: Page;

  // Список проектов
  readonly projectsList: Locator;
  readonly projectCards: Locator;
  readonly createProjectButton: Locator;
  readonly emptyState: Locator;

  // Навигация
  readonly topNav: Locator;
  readonly homeLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.projectsList = page.locator(SELECTORS.projectsList);
    this.projectCards = page.locator(SELECTORS.projectCard);
    this.createProjectButton = page.locator(SELECTORS.createProjectButton);
    this.emptyState = page.locator('[data-testid="empty-state"], .empty-state');

    this.topNav = page.locator(SELECTORS.topNav);
    this.homeLink = page.locator(SELECTORS.navHome);
  }

  /**
   * Перейти на dashboard
   */
  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Получить количество проектов
   */
  async getProjectsCount(): Promise<number> {
    return this.projectCards.count();
  }

  /**
   * Проверить что dashboard пустой
   */
  async isEmpty(): Promise<boolean> {
    const count = await this.getProjectsCount();
    return count === 0;
  }

  /**
   * Клик по проекту по индексу
   */
  async openProject(index: number) {
    await this.projectCards.nth(index).click();
    // Ждём загрузки страницы проекта
    await this.page.waitForURL(/\/projects\/[a-zA-Z0-9-]+/, {
      timeout: TIMEOUTS.pageLoad,
    });
  }

  /**
   * Создать новый проект
   */
  async createProject() {
    await this.createProjectButton.click();
  }

  /**
   * Удалить проект по индексу
   */
  async deleteProject(index: number) {
    const deleteButton = this.projectCards
      .nth(index)
      .locator(SELECTORS.deleteProjectButton);
    await deleteButton.click();

    // Подтверждение удаления (если есть модал)
    const confirmButton = this.page.locator(
      '[data-testid="confirm-delete"], button:has-text("Удалить")'
    );
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
    }
  }

  /**
   * Получить имя проекта по индексу
   */
  async getProjectName(index: number): Promise<string | null> {
    const nameEl = this.projectCards
      .nth(index)
      .locator('[data-testid="project-name"], .project-name, h3');
    return nameEl.textContent();
  }

  /**
   * Поиск проекта по имени
   */
  async findProjectByName(name: string): Promise<Locator | null> {
    const project = this.projectCards.filter({
      has: this.page.locator(`text="${name}"`),
    });

    if ((await project.count()) > 0) {
      return project.first();
    }
    return null;
  }

  /**
   * Проверить что пользователь редиректится на login если не авторизован
   */
  async expectRedirectToLogin() {
    await expect(this.page).toHaveURL(/\/login/, {
      timeout: TIMEOUTS.pageLoad,
    });
  }
}
