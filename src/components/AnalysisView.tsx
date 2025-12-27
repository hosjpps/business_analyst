'use client';

import type { Analysis } from '@/types';
import { Legend } from './Legend';

interface AnalysisViewProps {
  analysis: Analysis;
}

export function AnalysisView({ analysis }: AnalysisViewProps) {
  return (
    <>
      {/* Summary */}
      <div className="section">
        <h2>
          Анализ проекта
          <span className={`stage-badge stage-${analysis.detected_stage}`}>
            {analysis.detected_stage}
          </span>
        </h2>
        <p>{analysis.project_summary}</p>
      </div>

      {/* Tech Stack */}
      {analysis.tech_stack.length > 0 && (
        <div className="section">
          <h3>Технологии</h3>
          <div className="tech-stack">
            {analysis.tech_stack.map((tech, i) => (
              <span key={i} className="tech-tag">{tech}</span>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <Legend />

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div className="section">
          <h3>Сильные стороны</h3>
          {analysis.strengths.map((s, i) => (
            <div key={i} className="strength-item">
              <div className="item-header">
                <span className="item-title">{s.area}</span>
              </div>
              <p className="item-detail">{s.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div className="section">
          <h3>Проблемы</h3>
          {analysis.issues.map((issue, i) => (
            <div key={i} className={`issue-item severity-${issue.severity}`}>
              <div className="item-header">
                <span className="item-title">{issue.area}</span>
                <span className="item-meta">
                  {issue.severity} {issue.file_path && `• ${issue.file_path}`}
                </span>
              </div>
              <p className="item-detail">{issue.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tasks */}
      {analysis.tasks.length > 0 && (
        <div className="section">
          <h3>Задачи на неделю</h3>
          {analysis.tasks.map((task, i) => (
            <div key={i} className={`task-item priority-${task.priority}`}>
              <div className="item-header">
                <span className="item-title">{task.title}</span>
                <span className="item-meta">
                  <span className={`category-badge category-${task.category}`}>
                    {task.category}
                  </span>
                  {' '}~{task.estimated_minutes} мин
                </span>
              </div>
              <p className="item-detail">{task.description}</p>
              {task.depends_on && (
                <p className="item-meta" style={{ marginTop: 8 }}>
                  Зависит от: {task.depends_on}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Next Milestone */}
      {analysis.next_milestone && (
        <div className="section">
          <h3>Следующая цель</h3>
          <p>{analysis.next_milestone}</p>
        </div>
      )}
    </>
  );
}
