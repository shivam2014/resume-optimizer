import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { StaticTemplatePreviewCarousel } from '@/components/StaticTemplatePreviewCarousel';

// Mock templates with realistic data
const mockTemplates = [
  { id: 'modern-1', name: 'Modern Template' },
  { id: 'professional-2', name: 'Professional Template' },
  { id: 'creative-3', name: 'Creative Template' },
];

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img
      data-testid="next-image"
      src={props.src}
      alt={props.alt}
      onLoad={props.onLoadingComplete}
      onError={props.onError}
    />
  },
}));

describe('StaticTemplatePreviewCarousel', () => {
  // Cleanup after each test
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders correctly with template data', () => {
    render(<StaticTemplatePreviewCarousel templates={mockTemplates} />);
    
    expect(screen.getByText('Modern Template')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous template/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next template/i })).toBeInTheDocument();
    expect(screen.getByTestId('next-image')).toHaveAttribute('src', '/templates/modern-1.png');
  });

  it('handles empty templates array', () => {
    render(<StaticTemplatePreviewCarousel templates={[]} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText(/no template selected/i)).toBeInTheDocument();
  });

  describe('Navigation', () => {
    it('cycles through templates forward', async () => {
      render(<StaticTemplatePreviewCarousel templates={mockTemplates} />);
      
      const nextButton = screen.getByRole('button', { name: /next template/i });
      
      // First template
      expect(screen.getByText('Modern Template')).toBeInTheDocument();
      
      // Go to second template
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText('Professional Template')).toBeInTheDocument();
      });
      
      // Go to third template
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText('Creative Template')).toBeInTheDocument();
      });
      
      // Cycle back to first template
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText('Modern Template')).toBeInTheDocument();
      });
    });

    it('cycles through templates backward', async () => {
      render(<StaticTemplatePreviewCarousel templates={mockTemplates} />);
      
      const prevButton = screen.getByRole('button', { name: /previous template/i });
      
      // First template
      expect(screen.getByText('Modern Template')).toBeInTheDocument();
      
      // Go to last template
      fireEvent.click(prevButton);
      await waitFor(() => {
        expect(screen.getByText('Creative Template')).toBeInTheDocument();
      });
    });
  });

  describe('Loading states', () => {
    it('shows loading state when changing templates', async () => {
      render(<StaticTemplatePreviewCarousel templates={mockTemplates} />);
      
      const nextButton = screen.getByRole('button', { name: /next template/i });
      fireEvent.click(nextButton);
      
      // Check loading state appears
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      // Simulate image load
      const image = screen.getByTestId('next-image');
      fireEvent.load(image);
      
      // Check loading state disappears
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('handles image load success correctly', async () => {
      render(<StaticTemplatePreviewCarousel templates={mockTemplates} />);
      
      const image = screen.getByTestId('next-image');
      fireEvent.load(image);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByText(/failed to load/i)).not.toBeInTheDocument();
    });

    it('handles image load error correctly', async () => {
      render(<StaticTemplatePreviewCarousel templates={mockTemplates} />);
      
      const image = screen.getByTestId('next-image');
      fireEvent.error(image);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByText(/failed to load template preview/i)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles single template correctly', () => {
      const singleTemplate = [mockTemplates[0]];
      render(<StaticTemplatePreviewCarousel templates={singleTemplate} />);
      
      // Navigation should still work (cycle through single template)
      const nextButton = screen.getByRole('button', { name: /next template/i });
      fireEvent.click(nextButton);
      
      expect(screen.getByText('Modern Template')).toBeInTheDocument();
    });

    it('handles rapid navigation clicks', async () => {
      render(<StaticTemplatePreviewCarousel templates={mockTemplates} />);
      
      const nextButton = screen.getByRole('button', { name: /next template/i });
      
      // Click multiple times rapidly
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      
      // Should end up at the correct template
      await waitFor(() => {
        expect(screen.getByText('Modern Template')).toBeInTheDocument();
      });
    });
  });

  it('matches snapshot', () => {
    const { container } = render(
      <StaticTemplatePreviewCarousel templates={mockTemplates} />
    );
    expect(container).toMatchSnapshot();
  });
});