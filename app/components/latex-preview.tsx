import { useEffect, useState } from 'react';
import { parse, HtmlGenerator } from 'latex.js';
import { Skeleton } from '@/components/ui/skeleton';

interface LatexPreviewProps {
  template: string;
  content: string;
}

const LatexPreview: React.FC<LatexPreviewProps> = ({ template, content }) => {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generatePreview = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load template content
        const response = await fetch(`/api/latex/template?path=${encodeURIComponent(template)}`);
        if (!response.ok) {
          throw new Error('Failed to load template');
        }
        const templateContent = await response.text();
        
        // Replace content placeholder with actual content
        const latexContent = templateContent.replace('%RESUME_CONTENT%', content);
        
        // Create LaTeX parser with custom configuration
        const generator = new HtmlGenerator({
          hyphenate: false,
          styleSheet: [
            '/latex-styles.css',
          ],
        });
        const parser = parse(latexContent, { generator });
        
        // Generate HTML preview with proper styling
        const html = `
          ${generator.stylesAndScripts()}
          <div class="latex-preview-container">
            ${generator.documentFragment.innerHTML}
          </div>
        `;
        setPreviewHtml(html);
      } catch (err) {
        console.error('LaTeX preview generation failed:', err);
        setError('Failed to generate preview. Please check your LaTeX syntax.');
      } finally {
        setIsLoading(false);
      }
    };

    if (template && content) {
      const timeoutId = setTimeout(generatePreview, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [template, content]);

  if (isLoading) {
    return (
      <div className="w-full h-[500px] bg-white rounded-lg p-4">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[500px] bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-[500px] overflow-auto bg-white p-4 rounded-lg shadow-sm"
      dangerouslySetInnerHTML={{ __html: previewHtml }}
    />
  );
};

export default LatexPreview;