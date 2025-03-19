import { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LatexPreviewProps {
  template: string;
  content: string;
}

export default function LatexPreview({ template, content }: LatexPreviewProps) {
  const [processedContent, setProcessedContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Basic preprocessing of LaTeX content
      const cleanContent = content.trim()
        .replace(/\\begin{document}|\\end{document}/g, '')
        .replace(/\\section\*{([^}]*)}/g, '\\text{\\Large $1}\\\\')
        .replace(/\\begin{itemize}/g, '')
        .replace(/\\end{itemize}/g, '')
        .replace(/\\item/g, '•')
        .replace(/\\hfill/g, '\\quad\\quad');

      setProcessedContent(cleanContent);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing LaTeX');
    }
  }, [template, content]);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!processedContent) {
    return <div>No content to preview</div>;
  }

  return (
    <div className="latex-preview bg-white p-4">
      <BlockMath>{processedContent}</BlockMath>
    </div>
  );
}