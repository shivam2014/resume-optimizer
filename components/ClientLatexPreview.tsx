import React, { useEffect, useRef } from 'react';
import latex from 'latex.js';

interface ClientLatexPreviewProps {
  content: string;
  className?: string;
}

const ClientLatexPreview: React.FC<ClientLatexPreviewProps> = ({ content, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const latexInstance = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous render
    if (latexInstance.current) {
      containerRef.current.innerHTML = '';
    }

    try {
      // Create new LaTeX instance
      latexInstance.current = new latex.LaTeX({
        hyphenate: false,
        mathjax: {
          displayMath: [['$$', '$$']],
          inlineMath: [['$', '$']]
        }
      });

      // Render the content if instance exists
      if (latexInstance.current) {
        const rendered = latexInstance.current.render(content, {
          format: 'html',
          documentClass: 'article',
          packages: ['amsmath', 'amssymb', 'amsfonts']
        });
        containerRef.current.appendChild(rendered);
      }
    } catch (error) {
      // Fallback to raw content if LaTeX parsing fails
      containerRef.current.textContent = content;
      console.error('LaTeX rendering error:', error);
    }
  }, [content]);

  return (
    <div className={`overflow-auto p-4 border rounded-lg bg-white ${className}`}>
      <div ref={containerRef} className="latex-content" />
    </div>
  );
};

export default ClientLatexPreview;