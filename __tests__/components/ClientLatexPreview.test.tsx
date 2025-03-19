import { render, screen, cleanup } from '@testing-library/react';
import { type FC } from 'react';
import ClientLatexPreview from '../../app/components/ClientLatexPreview';

jest.mock('react-latex-next', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => (
    <div data-testid="latex-renderer">{children}</div>
  ))
}));

describe('ClientLatexPreview', () => {
  const originalHead = document.head.innerHTML;
  const sampleContent = 'E = mc^2';
  const sampleStyles = '.custom { color: red; }';

  beforeEach(() => {
    document.head.innerHTML = originalHead;
    jest.clearAllMocks();
  });

  afterEach(cleanup);

  test('renders LaTeX content with basic template', () => {
    render(<ClientLatexPreview content={sampleContent} />);
    
    expect(screen.getByTestId('latex-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('latex-renderer')).toHaveTextContent(sampleContent);
  });

  test('applies and cleans up template styles', () => {
    const { unmount } = render(
      <ClientLatexPreview content={sampleContent} templateStyles={sampleStyles} />
    );

    const styleElements = document.head.getElementsByTagName('style');
    expect(styleElements).toHaveLength(1);
    expect(styleElements[0].textContent).toBe(sampleStyles);

    unmount();
    expect(document.head.getElementsByTagName('style')).toHaveLength(0);
  });

  test('handles invalid LaTeX content gracefully', () => {
    const invalidContent = '\\invalid{command}';
    render(<ClientLatexPreview content={invalidContent} />);
    
    expect(screen.getByTestId('latex-renderer')).toHaveTextContent(invalidContent);
  });

  test('applies custom className', () => {
    const { container } = render(
      <ClientLatexPreview content={sampleContent} className="custom-preview" />
    );

    expect(container.firstChild).toHaveClass('custom-preview');
  });
});