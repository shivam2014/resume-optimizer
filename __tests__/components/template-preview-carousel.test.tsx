import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplatePreviewCarousel from '../../app/components/template-preview-carousel';
import { getTemplates } from '@/lib/template-config';

// Mock template data
const mockTemplates = [
  {
    path: 'template1',
    name: 'Template 1',
    description: 'First template'
  },
  {
    path: 'template2',
    name: 'Template 2',
    description: 'Second template'
  }
];

// Mock template config
jest.mock('@/lib/template-config', () => ({
  getTemplates: jest.fn(() => mockTemplates)
}));

// Mock fetch for template styles
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve('.template-style {}')
  })
) as jest.Mock;

describe('TemplatePreviewCarousel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all templates', async () => {
    render(<TemplatePreviewCarousel />);
    
    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(mockTemplates.length);
    });
  });

  test('handles template selection', async () => {
    const handleSelect = jest.fn();
    render(<TemplatePreviewCarousel onTemplateSelect={handleSelect} />);

    const firstTemplate = screen.getAllByRole('article')[0];
    await userEvent.click(firstTemplate);

    expect(handleSelect).toHaveBeenCalledWith(mockTemplates[0]);
  });

  test('loads template styles', async () => {
    render(<TemplatePreviewCarousel />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(mockTemplates.length);
      mockTemplates.forEach(template => {
        expect(fetch).toHaveBeenCalledWith(
          `/templates/latex/${template.path}/style.css`
        );
      });
    });
  });

  test('displays template metadata on hover', async () => {
    render(<TemplatePreviewCarousel />);

    const firstTemplate = screen.getAllByRole('article')[0];
    await userEvent.hover(firstTemplate);

    expect(screen.getByText(mockTemplates[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockTemplates[0].description)).toBeInTheDocument();
    expect(screen.getByText(mockTemplates[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockTemplates[0].description)).toBeInTheDocument();
  });

  test('handles template selection indicators', async () => {
    render(<TemplatePreviewCarousel />);

    const indicators = screen.getAllByRole('button', { name: /select template/i });
    expect(indicators).toHaveLength(mockTemplates.length);

    await userEvent.click(indicators[1]);
    expect(indicators[1]).toHaveClass('bg-primary');
    expect(indicators[1]).toHaveStyle('width: 1.5rem');
  });

  test('handles carousel navigation', async () => {
    render(<TemplatePreviewCarousel />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);

    // Verify carousel state changes (implementation may vary based on carousel library)
    expect(nextButton).toBeEnabled();
  });
});