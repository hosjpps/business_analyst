'use client';

export function Legend() {
  return (
    <div className="legend">
      <div className="legend-group">
        <span className="legend-title">Приоритет / Критичность:</span>
        <span className="legend-item"><span className="legend-dot high"></span>high — критично</span>
        <span className="legend-item"><span className="legend-dot medium"></span>medium — важно</span>
        <span className="legend-item"><span className="legend-dot low"></span>low — желательно</span>
      </div>
      <div className="legend-group">
        <span className="legend-title">Категории:</span>
        <span className="category-badge category-documentation">documentation</span>
        <span className="category-badge category-technical">technical</span>
        <span className="category-badge category-product">product</span>
        <span className="category-badge category-marketing">marketing</span>
        <span className="category-badge category-business">business</span>
      </div>
    </div>
  );
}
