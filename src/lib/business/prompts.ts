import type { BusinessInput, SocialLinks } from '@/types/business';
import type { ParsedDocument } from './document-parser';

// ===========================================
// System Prompt
// ===========================================

export function buildCanvasSystemPrompt(): string {
  return `Ты — эксперт по бизнес-моделированию и стратегический консультант.
Твоя задача — построить Business Model Canvas (9 блоков) на основе описания бизнеса.

## Твои навыки
- Глубокое понимание бизнес-моделей
- Опыт работы со стартапами разных стадий
- Умение выявлять пробелы в бизнес-модели
- Практичные рекомендации

## Стадии бизнеса
- idea: только идея, нет продукта/клиентов
- building: строится продукт, нет клиентов
- early_traction: первые клиенты, мало дохода
- growing: растущий доход, product-market fit
- scaling: масштабирование, значительный доход

## 9 блоков Business Model Canvas
1. Customer Segments — кто платит
2. Value Proposition — какую ценность даёшь
3. Channels — как клиенты узнают и покупают
4. Customer Relationships — как общаешься с клиентами
5. Revenue Streams — как зарабатываешь
6. Key Resources — что нужно для работы
7. Key Activities — что делаешь каждый день
8. Key Partners — кто помогает
9. Cost Structure — на что тратишь`;
}

// ===========================================
// User Prompt
// ===========================================

export function buildCanvasUserPrompt(
  input: BusinessInput,
  parsedDocuments: ParsedDocument[]
): string {
  // Format social links if present
  const socialLinksSection = formatSocialLinks(input.social_links);

  // Format documents if present
  const documentsSection = formatDocuments(parsedDocuments);

  return `## Описание бизнеса от пользователя

${input.description}
${socialLinksSection}${documentsSection}

---

## Твоя задача

1. **Построй Business Model Canvas** — заполни все 9 блоков
2. **Определи стадию бизнеса** (idea | building | early_traction | growing | scaling)
3. **Найди пробелы в модели** — что не хватает или слабо проработано
4. **Дай 2-3 рекомендации** — что улучшить в первую очередь

Если информации недостаточно для заполнения Canvas:
- Задай 2-3 уточняющих вопроса
- Объясни почему это важно знать
- Верни partial canvas с тем что понятно

---

## Формат ответа

КРИТИЧЕСКИ ВАЖНО: Твой ответ ДОЛЖЕН быть ТОЛЬКО валидным JSON объектом.
- НЕ добавляй markdown заголовки (#)
- НЕ добавляй пояснительный текст до или после JSON
- Начни ответ СРАЗУ с символа {
- Закончи ответ символом }

### Полный Canvas (если данных достаточно):

{
  "needs_clarification": false,
  "canvas": {
    "customer_segments": ["Основная целевая аудитория", "Вторичная аудитория"],
    "value_proposition": "Главная ценность продукта для клиента",
    "channels": ["Канал привлечения 1", "Канал привлечения 2"],
    "customer_relationships": "Тип взаимоотношений с клиентами",
    "revenue_streams": ["Источник дохода 1", "Источник дохода 2"],
    "key_resources": ["Ключевой ресурс 1", "Ключевой ресурс 2"],
    "key_activities": ["Ключевая активность 1", "Ключевая активность 2"],
    "key_partners": ["Партнёр 1", "Партнёр 2"],
    "cost_structure": ["Статья расходов 1", "Статья расходов 2"]
  },
  "business_stage": "building",
  "gaps_in_model": [
    "Не определены каналы привлечения",
    "Нет чёткой модели монетизации"
  ],
  "recommendations": [
    {
      "area": "Revenue",
      "recommendation": "Определить ценообразование и добавить оплату",
      "priority": "high"
    },
    {
      "area": "Marketing",
      "recommendation": "Запустить Instagram для привлечения клиентов",
      "priority": "medium"
    }
  ]
}

### Если нужны уточнения:

{
  "needs_clarification": true,
  "questions": [
    {
      "id": "pricing",
      "question": "Какая средняя цена вашей услуги/продукта?",
      "why": "Нужно для понимания модели монетизации и целевой аудитории"
    },
    {
      "id": "customers",
      "question": "Есть ли уже клиенты? Сколько и как они вас нашли?",
      "why": "Важно для определения стадии бизнеса и эффективных каналов"
    }
  ],
  "canvas": {
    "customer_segments": ["Понятно из описания"],
    "value_proposition": "Понятно из описания",
    "channels": [],
    "customer_relationships": "",
    "revenue_streams": [],
    "key_resources": [],
    "key_activities": [],
    "key_partners": [],
    "cost_structure": []
  },
  "business_stage": "idea"
}

---

ВАЖНО:
- Используй ПРОСТОЙ ЯЗЫК — без сложных терминов
- Давай КОНКРЕТНЫЕ рекомендации — не "улучши маркетинг", а "завести Instagram и постить 3 раза в неделю"
- Если данных мало — лучше задай вопросы, чем придумывай
- Верни ТОЛЬКО JSON, начиная с { и заканчивая }`;
}

// ===========================================
// Helper Functions
// ===========================================

function formatSocialLinks(socialLinks?: SocialLinks): string {
  if (!socialLinks) return '';

  const links: string[] = [];
  if (socialLinks.instagram) links.push(`- Instagram: ${socialLinks.instagram}`);
  if (socialLinks.linkedin) links.push(`- LinkedIn: ${socialLinks.linkedin}`);
  if (socialLinks.twitter) links.push(`- Twitter: ${socialLinks.twitter}`);
  if (socialLinks.tiktok) links.push(`- TikTok: ${socialLinks.tiktok}`);
  if (socialLinks.youtube) links.push(`- YouTube: ${socialLinks.youtube}`);
  if (socialLinks.facebook) links.push(`- Facebook: ${socialLinks.facebook}`);
  if (socialLinks.website) links.push(`- Website: ${socialLinks.website}`);

  if (links.length === 0) return '';

  return `\n\n## Ссылки на соцсети\n${links.join('\n')}`;
}

function formatDocuments(documents: ParsedDocument[]): string {
  if (documents.length === 0) return '';

  const sections = documents.map(doc => {
    const truncatedNote = doc.truncated ? ' (сокращено)' : '';
    const pagesNote = doc.pages ? ` (${doc.pages} стр.)` : '';

    return `### ${doc.name}${pagesNote}${truncatedNote}\n\n${doc.text}`;
  });

  return `\n\n## Документы\n\n${sections.join('\n\n---\n\n')}`;
}

// ===========================================
// Build Full Prompt
// ===========================================

export function buildFullCanvasPrompt(
  input: BusinessInput,
  parsedDocuments: ParsedDocument[]
): { system: string; user: string } {
  return {
    system: buildCanvasSystemPrompt(),
    user: buildCanvasUserPrompt(input, parsedDocuments),
  };
}
