import { Page, Locator, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../fixtures/test-data';

/**
 * Page Object для главной страницы анализа
 */
export class HomePage {
  readonly page: Page;

  // Режимы анализа
  readonly modeSelector: Locator;
  readonly modeCode: Locator;
  readonly modeBusiness: Locator;
  readonly modeFull: Locator;
  readonly modeCompetitor: Locator;

  // Форма ввода
  readonly businessDescription: Locator;
  readonly githubUrl: Locator;
  readonly fileUpload: Locator;
  readonly submitButton: Locator;

  // Прогресс
  readonly progressIndicator: Locator;

  // Результаты
  readonly businessCanvas: Locator;
  readonly codeAnalysis: Locator;
  readonly gapDetection: Locator;
  readonly alignmentScore: Locator;
  readonly tasksList: Locator;

  // Clarification
  readonly clarificationSection: Locator;
  readonly clarificationQuestions: Locator;
  readonly clarificationInput: Locator;
  readonly clarificationSubmit: Locator;

  // Chat
  readonly chatSection: Locator;
  readonly chatInput: Locator;
  readonly chatSubmit: Locator;
  readonly chatMessages: Locator;

  // Export
  readonly exportJson: Locator;
  readonly exportMarkdown: Locator;

  // Demo
  readonly demoButton: Locator;
  readonly demoScenarioSelector: Locator;

  constructor(page: Page) {
    this.page = page;

    // Режимы
    this.modeSelector = page.locator(SELECTORS.modeSelector);
    this.modeCode = page.locator(SELECTORS.modeCode);
    this.modeBusiness = page.locator(SELECTORS.modeBusiness);
    this.modeFull = page.locator(SELECTORS.modeFull);
    this.modeCompetitor = page.locator(SELECTORS.modeCompetitor);

    // Форма
    this.businessDescription = page.locator(SELECTORS.businessDescription);
    this.githubUrl = page.locator(SELECTORS.githubUrl);
    this.fileUpload = page.locator(SELECTORS.fileUpload);
    this.submitButton = page.locator(SELECTORS.submitButton);

    // Прогресс
    this.progressIndicator = page.locator(SELECTORS.progressIndicator);

    // Результаты
    this.businessCanvas = page.locator(SELECTORS.businessCanvas);
    this.codeAnalysis = page.locator(SELECTORS.codeAnalysis);
    this.gapDetection = page.locator(SELECTORS.gapDetection);
    this.alignmentScore = page.locator(SELECTORS.alignmentScore);
    this.tasksList = page.locator(SELECTORS.tasksList);

    // Clarification
    this.clarificationSection = page.locator(SELECTORS.clarificationSection);
    this.clarificationQuestions = page.locator(SELECTORS.clarificationQuestions);
    this.clarificationInput = page.locator(SELECTORS.clarificationInput);
    this.clarificationSubmit = page.locator(SELECTORS.clarificationSubmit);

    // Chat
    this.chatSection = page.locator(SELECTORS.chatSection);
    this.chatInput = page.locator(SELECTORS.chatInput);
    this.chatSubmit = page.locator(SELECTORS.chatSubmit);
    this.chatMessages = page.locator(SELECTORS.chatMessages);

    // Export
    this.exportJson = page.locator(SELECTORS.exportJson);
    this.exportMarkdown = page.locator(SELECTORS.exportMarkdown);

    // Demo
    this.demoButton = page.locator(SELECTORS.demoButton);
    this.demoScenarioSelector = page.locator(SELECTORS.demoScenarioSelector);
  }

  /**
   * Навигация на главную страницу
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Выбор режима анализа
   */
  async selectMode(mode: 'code' | 'business' | 'full' | 'competitor') {
    const modeMap = {
      code: this.modeCode,
      business: this.modeBusiness,
      full: this.modeFull,
      competitor: this.modeCompetitor,
    };

    await modeMap[mode].click();
    // Подождать анимацию переключения
    await this.page.waitForTimeout(300);
  }

  /**
   * Заполнение описания бизнеса
   */
  async fillBusinessDescription(text: string) {
    await this.businessDescription.fill(text);
  }

  /**
   * Заполнение GitHub URL
   */
  async fillGitHubUrl(url: string) {
    await this.githubUrl.fill(url);
  }

  /**
   * Загрузка файлов
   */
  async uploadFiles(filePaths: string[]) {
    await this.fileUpload.setInputFiles(filePaths);
  }

  /**
   * Отправка формы анализа
   */
  async submitAnalysis() {
    await this.submitButton.click();
  }

  /**
   * Ожидание завершения анализа
   */
  async waitForAnalysisComplete(timeout = TIMEOUTS.llmResponse) {
    // Ждём пока прогресс-индикатор исчезнет
    await expect(this.progressIndicator).toBeHidden({ timeout });
  }

  /**
   * Ответ на уточняющие вопросы
   */
  async answerClarification(answer: string) {
    await this.clarificationInput.fill(answer);
    await this.clarificationSubmit.click();
  }

  /**
   * Отправка сообщения в чат
   */
  async sendChatMessage(message: string) {
    await this.chatInput.fill(message);
    await this.chatSubmit.click();
  }

  /**
   * Ожидание появления Business Canvas
   */
  async waitForBusinessCanvas(timeout = TIMEOUTS.llmResponse) {
    await expect(this.businessCanvas).toBeVisible({ timeout });
  }

  /**
   * Ожидание появления Gap Detection
   */
  async waitForGapDetection(timeout = TIMEOUTS.llmResponse) {
    await expect(this.gapDetection).toBeVisible({ timeout });
  }

  /**
   * Проверка наличия ошибки валидации
   */
  async hasValidationError(): Promise<boolean> {
    const errorMessage = this.page.locator('.validation-error, .form-error');
    return errorMessage.isVisible();
  }

  /**
   * Получение текста ошибки
   */
  async getErrorMessage(): Promise<string> {
    const errorEl = this.page.locator('.error-message, [role="alert"]');
    const text = await errorEl.textContent();
    return text || '';
  }

  /**
   * Проверка что кнопка submit заблокирована
   */
  async isSubmitDisabled(): Promise<boolean> {
    return this.submitButton.isDisabled();
  }

  /**
   * Клик по Demo кнопке
   */
  async clickDemo() {
    await this.demoButton.click();
  }

  /**
   * Выбор сценария демо
   */
  async selectDemoScenario(scenarioIndex: number) {
    const scenarios = this.page.locator(SELECTORS.demoScenarioCard);
    await scenarios.nth(scenarioIndex).click();
  }

  /**
   * Экспорт в JSON
   */
  async exportToJson() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportJson.click();
    return downloadPromise;
  }

  /**
   * Экспорт в Markdown
   */
  async exportToMarkdown() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportMarkdown.click();
    return downloadPromise;
  }

  /**
   * Получение Alignment Score
   */
  async getAlignmentScore(): Promise<number> {
    const scoreText = await this.alignmentScore.textContent();
    const match = scoreText?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Получение количества задач
   */
  async getTasksCount(): Promise<number> {
    const tasks = this.tasksList.locator('.task-item, [data-testid="task-item"]');
    return tasks.count();
  }

  /**
   * Получение количества gaps
   */
  async getGapsCount(): Promise<number> {
    const gaps = this.gapDetection.locator('.gap-card, [data-testid="gap-card"]');
    return gaps.count();
  }
}
