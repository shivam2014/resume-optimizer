'use client';

import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { FC, useEffect } from 'react';

interface ClientLatexPreviewProps {
  content: string;
  className?: string;
  templateStyles?: string;
}

const ClientLatexPreview: FC<ClientLatexPreviewProps> = ({ 
  content, 
  className = '',
  templateStyles 
}) => {
  useEffect(() => {
    // Create a style element for the template styles
    if (templateStyles) {
      const styleElement = document.createElement('style');
      styleElement.textContent = templateStyles;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, [templateStyles]);

  return (
    <div className={`latex-preview ${className}`}>
      <Latex>{content}</Latex>
    </div>
  );
};

export default ClientLatexPreview;