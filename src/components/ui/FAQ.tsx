'use client';

import { useState, useCallback } from 'react';
import { Icon } from './Icon';
import type { FAQItem, FAQSection } from '@/types/ux';

// ===========================================
// Single FAQ Item (Accordion)
// ===========================================

interface FAQItemProps {
  item: FAQItem;
  expanded: boolean;
  onToggle: () => void;
}

function FAQItemCard({ item, expanded, onToggle }: FAQItemProps) {
  return (
    <>
      <div className={`faq-item ${expanded ? 'expanded' : ''}`}>
        <button
          type="button"
          className="faq-question"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <Icon name="question" size="sm" color="info" />
          <span className="faq-question-text">{item.question}</span>
          <span className={`faq-toggle-arrow ${expanded ? 'rotated' : ''}`}>
            <Icon name="arrow-down" size="sm" />
          </span>
        </button>

        {expanded && (
          <div className="faq-answer-wrapper open">
            <div className="faq-answer">
              <p className="faq-answer-text">{item.answer}</p>

              {item.example && (
                <div className="faq-example">
                  <Icon name="info" size="sm" color="info" />
                  <span>Пример: {item.example}</span>
                </div>
              )}

              {item.learnMoreUrl && (
                <a
                  href={item.learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="faq-learn-more"
                >
                  Узнать больше
                  <Icon name="arrow-right" size="sm" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .faq-item {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .faq-item:hover {
          border-color: var(--border-emphasis);
        }

        .faq-item.expanded {
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 1px rgba(88, 166, 255, 0.2);
        }

        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          color: var(--text-primary);
          transition: background 0.2s ease;
        }

        .faq-question:hover {
          background: var(--bg-tertiary);
        }

        .faq-question-text {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
        }

        .faq-toggle-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s var(--ease-out-back, cubic-bezier(0.34, 1.56, 0.64, 1));
        }

        .faq-toggle-arrow.rotated {
          transform: rotate(180deg);
        }

        .faq-answer-wrapper {
          overflow: hidden;
          animation: faqAnswerSlide 0.3s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
        }

        @keyframes faqAnswerSlide {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }

        .faq-answer {
          padding: 0 16px 16px 16px;
        }

        .faq-answer-text {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0 0 12px 0;
        }

        .faq-example {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px;
          background: var(--bg-tertiary);
          border-radius: 6px;
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .faq-learn-more {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--accent-blue);
          text-decoration: none;
          transition: gap 0.2s ease;
        }

        .faq-learn-more:hover {
          gap: 8px;
          text-decoration: underline;
        }

        @media (prefers-reduced-motion: reduce) {
          .faq-item,
          .faq-question,
          .faq-toggle-arrow,
          .faq-learn-more {
            transition: none;
          }
          .faq-answer-wrapper {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

// ===========================================
// FAQ List Component
// ===========================================

interface FAQListProps {
  items: FAQItem[];
  allowMultiple?: boolean;
  defaultExpanded?: string | string[];
}

export function FAQList({
  items,
  allowMultiple = false,
  defaultExpanded = [],
}: FAQListProps) {
  const initialExpanded = Array.isArray(defaultExpanded)
    ? new Set(defaultExpanded)
    : new Set([defaultExpanded]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(initialExpanded);

  const toggleItem = useCallback(
    (id: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);

        if (next.has(id)) {
          next.delete(id);
        } else {
          if (!allowMultiple) {
            next.clear();
          }
          next.add(id);
        }

        return next;
      });
    },
    [allowMultiple]
  );

  return (
    <>
      <div className="faq-list">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="faq-list-item"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <FAQItemCard
              item={item}
              expanded={expandedIds.has(item.id)}
              onToggle={() => toggleItem(item.id)}
            />
          </div>
        ))}
      </div>
      <style jsx>{`
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .faq-list-item {
          animation: faqItemSlideIn 0.3s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
        }

        @keyframes faqItemSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .faq-list-item {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

// ===========================================
// FAQ Section with Header
// ===========================================

interface FAQSectionProps {
  section: FAQSection;
  allowMultiple?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function FAQSectionComponent({
  section,
  allowMultiple = false,
  collapsible = true,
  defaultCollapsed = false,
}: FAQSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`faq-section ${collapsed ? 'collapsed' : ''}`}>
      <div
        className="faq-section-header"
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={
          collapsible
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setCollapsed(!collapsed);
                }
              }
            : undefined
        }
      >
        <div className="faq-section-title-area">
          <Icon name="question" size="md" color="info" />
          <div>
            <h3 className="faq-section-title">{section.title}</h3>
            {section.description && (
              <p className="faq-section-description">{section.description}</p>
            )}
          </div>
        </div>

        {collapsible && (
          <Icon
            name="arrow-down"
            size="sm"
            className={`faq-section-toggle ${collapsed ? '' : 'rotated'}`}
          />
        )}
      </div>

      {!collapsed && (
        <div className="faq-section-content">
          <FAQList items={section.items} allowMultiple={allowMultiple} />
        </div>
      )}
    </div>
  );
}

// ===========================================
// Contextual FAQ Widget
// ===========================================

interface ContextualFAQProps {
  context: 'analysis' | 'business' | 'gaps' | 'tasks' | 'general';
  maxItems?: number;
  showHeader?: boolean;
}

// Pre-defined FAQ items for different contexts
const CONTEXT_FAQ: Record<string, FAQItem[]> = {
  analysis: [
    {
      id: 'what-is-analysis',
      question: 'Что анализирует система?',
      answer:
        'Система анализирует ваш код на GitHub: структуру проекта, используемые технологии, качество кода, безопасность и готовность к масштабированию.',
      example: 'Если у вас SaaS-продукт, мы проверим наличие платёжной интеграции, аналитики и системы авторизации.',
    },
    {
      id: 'how-long-analysis',
      question: 'Сколько времени занимает анализ?',
      answer:
        'Обычно анализ занимает от 30 секунд до 2 минут в зависимости от размера репозитория. Большие проекты (более 1000 файлов) могут анализироваться дольше.',
    },
    {
      id: 'private-repos',
      question: 'Можно ли анализировать приватные репозитории?',
      answer:
        'Да, для этого нужно добавить GitHub токен с правами на чтение репозиториев. Мы не храним ваш код — он используется только для анализа.',
    },
  ],
  business: [
    {
      id: 'what-is-canvas',
      question: 'Что такое Business Model Canvas?',
      answer:
        'Business Model Canvas — это визуальный инструмент для описания бизнес-модели. Он состоит из 9 блоков: клиенты, ценность, каналы, отношения, доходы, ресурсы, активности, партнёры и расходы.',
      example: 'Для Uber: клиенты — пассажиры и водители, ценность — быстрые и удобные поездки, канал — мобильное приложение.',
    },
    {
      id: 'why-business-info',
      question: 'Зачем указывать информацию о бизнесе?',
      answer:
        'Понимая ваш бизнес, мы даём более точные рекомендации. Например, если вы работаете в медицине, мы подскажем про необходимость HIPAA-compliance. Если у вас B2B SaaS — про интеграцию SSO.',
    },
    {
      id: 'what-is-stage',
      question: 'Как определяется стадия бизнеса?',
      answer:
        'Мы анализируем признаки в коде и описании: наличие платёжной системы, количество пользователей, инфраструктуру. Стадии: идея, MVP, рост, масштабирование.',
    },
  ],
  gaps: [
    {
      id: 'what-are-gaps',
      question: 'Что такое "разрывы" (gaps)?',
      answer:
        'Разрывы — это расхождения между тем, что нужно вашему бизнесу, и тем, что реально реализовано в продукте. Например, если вы планируете монетизацию, но в коде нет платёжной системы — это разрыв.',
    },
    {
      id: 'gap-priority',
      question: 'Как определяется приоритет разрывов?',
      answer:
        'Приоритет зависит от стадии бизнеса и влияния на рост. Критические разрывы блокируют развитие (нет оплаты = нет дохода). Средние влияют на эффективность. Низкие — на оптимизацию.',
    },
    {
      id: 'alignment-score',
      question: 'Что означает Alignment Score?',
      answer:
        'Alignment Score (0-100) показывает, насколько ваш продукт соответствует бизнес-целям. 70+ означает хорошее соответствие. 40-69 — нужны доработки. Менее 40 — серьёзное расхождение.',
      example: 'Если вы хотите продавать подписки, но в коде нет Stripe — ваш score будет ниже.',
    },
  ],
  tasks: [
    {
      id: 'how-tasks-generated',
      question: 'Как генерируются задачи?',
      answer:
        'Задачи создаются на основе найденных разрывов. Для каждого разрыва мы предлагаем конкретные шаги по устранению, инструменты и оценку времени.',
    },
    {
      id: 'task-estimates',
      question: 'Насколько точны оценки времени?',
      answer:
        'Оценки основаны на среднем времени выполнения типичных задач. Для вашего проекта время может отличаться в зависимости от сложности кода и вашего опыта.',
    },
    {
      id: 'which-task-first',
      question: 'С какой задачи лучше начать?',
      answer:
        'Начните с задач высокого приоритета — они влияют на доход или безопасность. Если хотите быстрый результат, выбирайте "Quick Wins" — задачи, которые можно сделать за 15-30 минут.',
    },
  ],
  general: [
    {
      id: 'data-privacy',
      question: 'Как защищены мои данные?',
      answer:
        'Мы не храним ваш код. Анализ происходит в памяти и сразу удаляется. Результаты анализа можно экспортировать и сохранить локально.',
    },
    {
      id: 'who-is-this-for',
      question: 'Для кого этот инструмент?',
      answer:
        'Для предпринимателей, которые хотят понять, что нужно улучшить в продукте. Для разработчиков, которые хотят оценить качество проекта. Для инвесторов, которые хотят оценить tech due diligence.',
    },
    {
      id: 'how-accurate',
      question: 'Насколько точен анализ?',
      answer:
        'Анализ основан на паттернах кода и лучших практиках. Для бизнес-рекомендаций важно правильно описать свой бизнес. Чем больше информации вы предоставите, тем точнее будут рекомендации.',
    },
  ],
};

export function ContextualFAQ({
  context,
  maxItems,
  showHeader = true,
}: ContextualFAQProps) {
  const items = CONTEXT_FAQ[context] || CONTEXT_FAQ.general;
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  const contextTitles: Record<string, string> = {
    analysis: 'Часто задаваемые вопросы об анализе',
    business: 'Вопросы о бизнес-модели',
    gaps: 'Вопросы о разрывах и рекомендациях',
    tasks: 'Вопросы о задачах',
    general: 'Частые вопросы',
  };

  return (
    <div className="contextual-faq">
      {showHeader && (
        <div className="contextual-faq-header">
          <Icon name="question" size="md" color="info" />
          <h4>{contextTitles[context]}</h4>
        </div>
      )}
      <FAQList items={displayItems} allowMultiple={false} />
    </div>
  );
}

// ===========================================
// Inline Help Trigger
// ===========================================

interface InlineHelpProps {
  question: string;
  answer: string;
  example?: string;
}

export function InlineHelp({ question, answer, example }: InlineHelpProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`inline-help ${expanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="inline-help-trigger"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <Icon name="question" size="sm" color="info" />
        <span>{question}</span>
        <Icon
          name="arrow-down"
          size="sm"
          className={`inline-help-icon ${expanded ? 'rotated' : ''}`}
        />
      </button>

      {expanded && (
        <div className="inline-help-content">
          <p>{answer}</p>
          {example && (
            <div className="inline-help-example">
              <Icon name="info" size="sm" />
              <span>Пример: {example}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Re-export with shorter names
export { FAQSectionComponent as FAQSection };
