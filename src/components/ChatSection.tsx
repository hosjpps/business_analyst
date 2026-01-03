'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Analysis, ChatResponse } from '@/types';
import type { BusinessCanvas } from '@/types/business';
import type { GapAnalyzeResponse } from '@/types/gaps';
import type { CompetitorAnalyzeResponse } from '@/types/competitor';
import { MarkdownRenderer } from './MarkdownRenderer';
import { usePersistedChatHistory } from '@/hooks/useLocalStorage';

interface ChatSectionProps {
  // Legacy prop for code-only analysis (backwards compatible)
  analysis?: Analysis;
  // Full analysis context
  businessCanvas?: BusinessCanvas | null;
  gapAnalysis?: GapAnalyzeResponse | null;
  competitorAnalysis?: CompetitorAnalyzeResponse | null;
  // Analysis mode
  mode?: 'code' | 'business' | 'full' | 'competitor';
  onError: (error: string) => void;
}

export function ChatSection({
  analysis,
  businessCanvas,
  gapAnalysis,
  competitorAnalysis,
  mode = 'code',
  onError
}: ChatSectionProps) {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = usePersistedChatHistory();
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [currentStreamingQuestion, setCurrentStreamingQuestion] = useState('');
  const [useStreaming] = useState(true); // Toggle for streaming mode
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // When chat history changes, expand only the last item
  useEffect(() => {
    if (chatHistory.length > 0) {
      setExpandedItems(new Set([chatHistory.length - 1]));
    }
  }, [chatHistory.length]);

  // Toggle item expansion
  const toggleItem = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Expand/collapse all
  const toggleAll = () => {
    if (expandedItems.size === chatHistory.length) {
      setExpandedItems(new Set());
    } else {
      setExpandedItems(new Set(chatHistory.map((_, i) => i)));
    }
  };

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, []);

  // Handle chat with streaming
  const handleChatStream = useCallback(async () => {
    if (!chatMessage.trim()) return;

    const currentQuestion = chatMessage.trim();
    setChatLoading(true);
    setChatMessage('');
    setStreamingAnswer('');
    setCurrentStreamingQuestion(currentQuestion);

    try {
      // Build request body based on mode
      const requestBody: Record<string, unknown> = {
        session_id: Date.now().toString(),
        message: currentQuestion,
        analysis_mode: mode
      };

      // Add code analysis (legacy support)
      if (analysis) {
        requestBody.previous_analysis = analysis;
      }

      // Add business canvas
      if (businessCanvas) {
        requestBody.business_canvas = businessCanvas;
      }

      // Add gap analysis
      if (gapAnalysis?.success) {
        requestBody.gap_analysis = {
          gaps: gapAnalysis.gaps,
          alignment_score: gapAnalysis.alignment_score,
          verdict: gapAnalysis.verdict,
          tasks: gapAnalysis.tasks
        };
      }

      // Add competitor analysis
      if (competitorAnalysis?.success) {
        requestBody.competitor_analysis = {
          your_advantages: competitorAnalysis.your_advantages,
          your_gaps: competitorAnalysis.your_gaps,
          market_position: competitorAnalysis.market_position,
          recommendations: competitorAnalysis.recommendations
        };
      }

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Stream error');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullAnswer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Stream complete
              setChatHistory(prev => [...prev, {
                question: currentQuestion,
                answer: fullAnswer
              }]);
              setStreamingAnswer('');
              setCurrentStreamingQuestion('');
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullAnswer += parsed.content;
                  setStreamingAnswer(fullAnswer);
                }
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка чата');
    } finally {
      setChatLoading(false);
    }
  }, [chatMessage, analysis, businessCanvas, gapAnalysis, competitorAnalysis, mode, onError]);

  // Handle chat without streaming (fallback)
  const handleChatRegular = useCallback(async () => {
    if (!chatMessage.trim()) return;

    const currentQuestion = chatMessage.trim();
    setChatLoading(true);
    setChatMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: Date.now().toString(),
          message: currentQuestion,
          previous_analysis: analysis
        })
      });

      const data: ChatResponse = await response.json();

      if (data.success) {
        setChatHistory(prev => [...prev, {
          question: currentQuestion,
          answer: data.answer
        }]);
      } else {
        onError(data.error || 'Ошибка чата');
      }
    } catch (err) {
      onError('Не удалось отправить сообщение');
    } finally {
      setChatLoading(false);
    }
  }, [chatMessage, analysis, onError]);

  const handleChat = useStreaming ? handleChatStream : handleChatRegular;

  // Get appropriate header based on mode
  const chatTitle = mode === 'full'
    ? '💬 Консультант по проекту'
    : 'Задать вопрос';

  return (
    <div className="chat-section">
      <div className="chat-header">
        <h3>{chatTitle}</h3>
        {chatHistory.length > 1 && (
          <button className="toggle-all-btn" onClick={toggleAll}>
            {expandedItems.size === chatHistory.length ? '▲ Свернуть все' : '▼ Развернуть все'}
          </button>
        )}
      </div>

      {/* История чата */}
      {chatHistory.length > 0 && (
        <div className="chat-history">
          {chatHistory.map((item, i) => {
            const isExpanded = expandedItems.has(i);
            return (
              <div key={i} className={`chat-item ${isExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="chat-question" onClick={() => toggleItem(i)}>
                  <span className="chat-toggle">{isExpanded ? '▼' : '▶'}</span>
                  <span className="chat-label">Вопрос {i + 1}:</span>
                  <p className="chat-question-text">{item.question}</p>
                </div>
                {isExpanded && (
                  <div className="chat-answer">
                    <div className="chat-answer-header">
                      <span className="chat-label">Ответ:</span>
                      <button
                        className="copy-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.answer);
                        }}
                        title="Копировать"
                      >
                        📋 Копировать
                      </button>
                    </div>
                    <div className="chat-answer-content">
                      <MarkdownRenderer content={item.answer} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Streaming answer */}
      {streamingAnswer && (
        <div className="chat-item streaming expanded">
          <div className="chat-question">
            <span className="chat-toggle">▼</span>
            <span className="chat-label">Вопрос:</span>
            <p className="chat-question-text">{currentStreamingQuestion}</p>
          </div>
          <div className="chat-answer">
            <span className="chat-label">Ответ:</span>
            <div className="chat-answer-content">
              <MarkdownRenderer content={streamingAnswer} />
            </div>
          </div>
        </div>
      )}

      {/* Форма ввода */}
      <div className="chat-input">
        <input
          type="text"
          placeholder={
            mode === 'full'
              ? "Спроси про бизнес, код, разрывы или конкурентов..."
              : "Как мне сделать первую задачу? Почему это важно?"
          }
          value={chatMessage}
          onChange={e => setChatMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !chatLoading && handleChat()}
          disabled={chatLoading}
        />
        <button onClick={handleChat} disabled={chatLoading || !chatMessage.trim()}>
          {chatLoading ? '...' : 'Отправить'}
        </button>
      </div>

      <style jsx>{`
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .chat-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .toggle-all-btn {
          padding: 6px 12px;
          font-size: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-all-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .chat-item {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          margin-bottom: 12px;
          overflow: hidden;
          transition: all 0.2s;
        }

        .chat-item.collapsed {
          background: var(--bg-primary);
        }

        .chat-question {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .chat-item.collapsed .chat-question:hover {
          background: var(--bg-secondary);
        }

        .chat-toggle {
          color: var(--text-muted);
          font-size: 10px;
          flex-shrink: 0;
          margin-top: 3px;
          width: 12px;
        }

        .chat-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .chat-question-text {
          margin: 0;
          font-size: 14px;
          color: var(--text-primary);
          flex: 1;
        }

        .chat-item.collapsed .chat-question-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chat-answer {
          padding: 0 16px 16px 36px;
          border-top: 1px solid var(--border-muted);
        }

        .chat-answer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0 8px 0;
        }

        .copy-button {
          padding: 4px 8px;
          font-size: 11px;
          background: transparent;
          border: 1px solid var(--border-default);
          color: var(--text-muted);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-button:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .chat-answer-content {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.6;
        }

        .chat-item.streaming {
          border-color: var(--accent-blue);
        }
      `}</style>
    </div>
  );
}
