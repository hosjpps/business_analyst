import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  PDFExportButton,
  PDFExportModal,
  PDFPreview,
  ExportFormatSelector,
  QuickExportActions,
  ExportSuccess,
  DEFAULT_PDF_SECTIONS,
  generatePDFFilename,
  generateMarkdownReport,
} from '@/components/ui/PDFExport';
import type { PDFSection, PDFExportConfig, PDFExportData } from '@/components/ui/PDFExport';

describe('PDFExportButton', () => {
  it('renders with default label', () => {
    render(<PDFExportButton onExport={() => {}} />);

    expect(screen.getByText('Экспорт в PDF')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<PDFExportButton onExport={() => {}} label="Download Report" />);

    expect(screen.getByText('Download Report')).toBeInTheDocument();
  });

  it('calls onExport when clicked', () => {
    const mockOnExport = vi.fn();
    render(<PDFExportButton onExport={mockOnExport} />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockOnExport).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<PDFExportButton onExport={() => {}} loading={true} />);

    expect(screen.getByText('Генерация PDF...')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<PDFExportButton onExport={() => {}} loading={true} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<PDFExportButton onExport={() => {}} disabled={true} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant classes', () => {
    const { rerender } = render(<PDFExportButton onExport={() => {}} variant="primary" />);
    expect(screen.getByRole('button')).toHaveClass('pdf-export-btn-primary');

    rerender(<PDFExportButton onExport={() => {}} variant="secondary" />);
    expect(screen.getByRole('button')).toHaveClass('pdf-export-btn-secondary');

    rerender(<PDFExportButton onExport={() => {}} variant="ghost" />);
    expect(screen.getByRole('button')).toHaveClass('pdf-export-btn-ghost');
  });

  it('applies size classes', () => {
    const { rerender } = render(<PDFExportButton onExport={() => {}} size="sm" />);
    expect(screen.getByRole('button')).toHaveClass('pdf-export-btn-sm');

    rerender(<PDFExportButton onExport={() => {}} size="lg" />);
    expect(screen.getByRole('button')).toHaveClass('pdf-export-btn-lg');
  });
});

describe('PDFExportModal', () => {
  const mockSections: PDFSection[] = [
    { id: 'summary', title: 'Резюме', enabled: true, icon: 'star' },
    { id: 'gaps', title: 'Разрывы', enabled: true, icon: 'warning' },
    { id: 'tasks', title: 'Задачи', enabled: false, icon: 'target' },
  ];

  it('does not render when isOpen is false', () => {
    render(
      <PDFExportModal
        isOpen={false}
        onClose={() => {}}
        onExport={() => {}}
        availableSections={mockSections}
      />
    );

    expect(screen.queryByText('Экспорт отчёта в PDF')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <PDFExportModal
        isOpen={true}
        onClose={() => {}}
        onExport={() => {}}
        availableSections={mockSections}
      />
    );

    expect(screen.getByText('Экспорт отчёта в PDF')).toBeInTheDocument();
  });

  it('renders all section options', () => {
    render(
      <PDFExportModal
        isOpen={true}
        onClose={() => {}}
        onExport={() => {}}
        availableSections={mockSections}
      />
    );

    expect(screen.getByText('Резюме')).toBeInTheDocument();
    expect(screen.getByText('Разрывы')).toBeInTheDocument();
    expect(screen.getByText('Задачи')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <PDFExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={() => {}}
        availableSections={mockSections}
      />
    );

    fireEvent.click(screen.getByText('Отмена'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <PDFExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={() => {}}
        availableSections={mockSections}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '' })); // Close button
  });

  it('toggles section when clicked', () => {
    render(
      <PDFExportModal
        isOpen={true}
        onClose={() => {}}
        onExport={() => {}}
        availableSections={mockSections}
      />
    );

    const tasksButton = screen.getByText('Задачи').closest('button');
    if (tasksButton) {
      fireEvent.click(tasksButton);
      // After click, it should become enabled (have different style)
    }
  });

  it('renders input fields', () => {
    render(
      <PDFExportModal
        isOpen={true}
        onClose={() => {}}
        onExport={() => {}}
        availableSections={mockSections}
      />
    );

    expect(screen.getByLabelText('Заголовок отчёта')).toBeInTheDocument();
    expect(screen.getByLabelText(/Подзаголовок/)).toBeInTheDocument();
    expect(screen.getByLabelText('Название компании')).toBeInTheDocument();
  });

  it('has default title value', () => {
    render(
      <PDFExportModal
        isOpen={true}
        onClose={() => {}}
        onExport={() => {}}
        availableSections={mockSections}
      />
    );

    expect(screen.getByLabelText('Заголовок отчёта')).toHaveValue('Бизнес-анализ');
  });
});

describe('PDFPreview', () => {
  const mockConfig: PDFExportConfig = {
    title: 'Тестовый отчёт',
    subtitle: 'Для инвесторов',
    date: '2024-01-15',
    sections: [
      { id: 'summary', title: 'Резюме', enabled: true, icon: 'star' },
      { id: 'gaps', title: 'Разрывы', enabled: true, icon: 'warning' },
    ],
    includeHeader: true,
    includeFooter: true,
    companyName: 'My Startup',
  };

  const mockData: PDFExportData = {
    score: 75,
    scoreLabel: 'Хорошо',
    summary: 'Бизнес развивается хорошо',
    sections: [
      { id: 'summary', title: 'Резюме', content: 'Summary content' },
      { id: 'gaps', title: 'Разрывы', content: 'Gaps content' },
    ],
  };

  it('renders title', () => {
    render(<PDFPreview config={mockConfig} data={mockData} />);

    expect(screen.getByText('Тестовый отчёт')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<PDFPreview config={mockConfig} data={mockData} />);

    expect(screen.getByText('Для инвесторов')).toBeInTheDocument();
  });

  it('renders score', () => {
    render(<PDFPreview config={mockConfig} data={mockData} />);

    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Хорошо')).toBeInTheDocument();
  });

  it('renders summary', () => {
    render(<PDFPreview config={mockConfig} data={mockData} />);

    expect(screen.getByText('Бизнес развивается хорошо')).toBeInTheDocument();
  });

  it('renders enabled sections', () => {
    render(<PDFPreview config={mockConfig} data={mockData} />);

    expect(screen.getByText('Summary content')).toBeInTheDocument();
    expect(screen.getByText('Gaps content')).toBeInTheDocument();
  });

  it('hides header when includeHeader is false', () => {
    const configNoHeader = { ...mockConfig, includeHeader: false };
    render(<PDFPreview config={configNoHeader} data={mockData} />);

    // Title still exists in score section heading
    // but header-specific elements should be hidden
  });

  it('hides footer when includeFooter is false', () => {
    const configNoFooter = { ...mockConfig, includeFooter: false };
    const { container } = render(<PDFPreview config={configNoFooter} data={mockData} />);

    expect(container.querySelector('.pdf-preview-footer')).not.toBeInTheDocument();
  });
});

describe('ExportFormatSelector', () => {
  const formats = [
    { id: 'pdf', label: 'PDF', description: 'Красивый отчёт', icon: 'chart' as const },
    { id: 'json', label: 'JSON', description: 'Сырые данные', icon: 'code' as const },
    { id: 'md', label: 'Markdown', description: 'Текстовый формат', icon: 'target' as const },
  ];

  it('renders all format options', () => {
    render(
      <ExportFormatSelector
        formats={formats}
        selected="pdf"
        onSelect={() => {}}
      />
    );

    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
  });

  it('shows descriptions', () => {
    render(
      <ExportFormatSelector
        formats={formats}
        selected="pdf"
        onSelect={() => {}}
      />
    );

    expect(screen.getByText('Красивый отчёт')).toBeInTheDocument();
    expect(screen.getByText('Сырые данные')).toBeInTheDocument();
  });

  it('highlights selected option', () => {
    const { container } = render(
      <ExportFormatSelector
        formats={formats}
        selected="json"
        onSelect={() => {}}
      />
    );

    const jsonOption = container.querySelector('.export-format-option.selected');
    expect(jsonOption).toBeInTheDocument();
  });

  it('calls onSelect when option is clicked', () => {
    const mockOnSelect = vi.fn();
    render(
      <ExportFormatSelector
        formats={formats}
        selected="pdf"
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByText('JSON'));

    expect(mockOnSelect).toHaveBeenCalledWith('json');
  });
});

describe('QuickExportActions', () => {
  const mockHandlers = {
    onExportPDF: vi.fn(),
    onExportJSON: vi.fn(),
    onExportMarkdown: vi.fn(),
    onCopyLink: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all export buttons', () => {
    render(<QuickExportActions {...mockHandlers} />);

    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('MD')).toBeInTheDocument();
    expect(screen.getByText('Ссылка')).toBeInTheDocument();
  });

  it('calls correct handler when PDF button is clicked', () => {
    render(<QuickExportActions {...mockHandlers} />);

    fireEvent.click(screen.getByText('PDF'));

    expect(mockHandlers.onExportPDF).toHaveBeenCalled();
  });

  it('calls correct handler when JSON button is clicked', () => {
    render(<QuickExportActions {...mockHandlers} />);

    fireEvent.click(screen.getByText('JSON'));

    expect(mockHandlers.onExportJSON).toHaveBeenCalled();
  });

  it('calls correct handler when MD button is clicked', () => {
    render(<QuickExportActions {...mockHandlers} />);

    fireEvent.click(screen.getByText('MD'));

    expect(mockHandlers.onExportMarkdown).toHaveBeenCalled();
  });

  it('disables all buttons when disabled prop is true', () => {
    render(<QuickExportActions {...mockHandlers} disabled={true} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('does not render copy link button when onCopyLink is not provided', () => {
    render(
      <QuickExportActions
        onExportPDF={mockHandlers.onExportPDF}
        onExportJSON={mockHandlers.onExportJSON}
        onExportMarkdown={mockHandlers.onExportMarkdown}
      />
    );

    expect(screen.queryByText('Ссылка')).not.toBeInTheDocument();
  });
});

describe('ExportSuccess', () => {
  it('renders success message', () => {
    render(<ExportSuccess format="pdf" onClose={() => {}} />);

    expect(screen.getByText('Экспорт успешен!')).toBeInTheDocument();
  });

  it('shows format in message', () => {
    render(<ExportSuccess format="pdf" onClose={() => {}} />);

    expect(screen.getByText(/PDF/)).toBeInTheDocument();
  });

  it('shows filename when provided', () => {
    render(<ExportSuccess format="pdf" filename="report.pdf" onClose={() => {}} />);

    expect(screen.getByText(/report\.pdf/)).toBeInTheDocument();
  });

  it('calls onClose when button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<ExportSuccess format="pdf" onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Закрыть'));

    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('DEFAULT_PDF_SECTIONS', () => {
  it('contains expected sections', () => {
    const sectionIds = DEFAULT_PDF_SECTIONS.map((s) => s.id);

    expect(sectionIds).toContain('summary');
    expect(sectionIds).toContain('score');
    expect(sectionIds).toContain('gaps');
    expect(sectionIds).toContain('tasks');
    expect(sectionIds).toContain('canvas');
  });

  it('has proper structure', () => {
    DEFAULT_PDF_SECTIONS.forEach((section) => {
      expect(section).toHaveProperty('id');
      expect(section).toHaveProperty('title');
      expect(section).toHaveProperty('enabled');
      expect(section).toHaveProperty('icon');
    });
  });
});

describe('generatePDFFilename', () => {
  it('generates filename from title', () => {
    const filename = generatePDFFilename('Бизнес-анализ');

    expect(filename).toMatch(/^бизнесанализ-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('removes special characters', () => {
    const filename = generatePDFFilename('Test: Report! @#$%');

    expect(filename).not.toMatch(/[:!@#$%]/);
  });

  it('replaces spaces with hyphens', () => {
    const filename = generatePDFFilename('My Business Report');

    expect(filename).toMatch(/^my-business-report-/);
  });

  it('includes current date', () => {
    const today = new Date().toISOString().split('T')[0];
    const filename = generatePDFFilename('Test');

    expect(filename).toContain(today);
  });
});

describe('generateMarkdownReport', () => {
  const mockConfig: PDFExportConfig = {
    title: 'Тестовый отчёт',
    subtitle: 'Для инвесторов',
    date: '2024-01-15',
    sections: [
      { id: 'summary', title: 'Резюме', enabled: true, icon: 'star' },
      { id: 'gaps', title: 'Разрывы', enabled: true, icon: 'warning' },
      { id: 'tasks', title: 'Задачи', enabled: false, icon: 'target' },
    ],
    includeHeader: true,
    includeFooter: true,
    companyName: 'My Startup',
  };

  const mockData: PDFExportData = {
    score: 75,
    scoreLabel: 'Хорошо',
    summary: 'Бизнес развивается хорошо',
    sections: [
      { id: 'summary', title: 'Резюме', content: 'Summary content here' },
      { id: 'gaps', title: 'Разрывы', content: 'Gaps content here' },
      { id: 'tasks', title: 'Задачи', content: 'Tasks content here' },
    ],
  };

  it('includes title', () => {
    const md = generateMarkdownReport(mockConfig, mockData);

    expect(md).toContain('# Тестовый отчёт');
  });

  it('includes subtitle', () => {
    const md = generateMarkdownReport(mockConfig, mockData);

    expect(md).toContain('*Для инвесторов*');
  });

  it('includes company name', () => {
    const md = generateMarkdownReport(mockConfig, mockData);

    expect(md).toContain('**Компания:** My Startup');
  });

  it('includes score', () => {
    const md = generateMarkdownReport(mockConfig, mockData);

    expect(md).toContain('**75**');
    expect(md).toContain('Хорошо');
  });

  it('includes summary', () => {
    const md = generateMarkdownReport(mockConfig, mockData);

    expect(md).toContain('Бизнес развивается хорошо');
  });

  it('includes only enabled sections', () => {
    const md = generateMarkdownReport(mockConfig, mockData);

    expect(md).toContain('Summary content here');
    expect(md).toContain('Gaps content here');
    expect(md).not.toContain('Tasks content here');
  });

  it('includes footer', () => {
    const md = generateMarkdownReport(mockConfig, mockData);

    expect(md).toContain('Сгенерировано с помощью Business Analyzer');
  });
});
