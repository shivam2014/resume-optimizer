import { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { cn } from '@/lib/utils';

interface ClientLatexPreviewProps {
  content: string;
  className?: string;
  templateStyles?: string;
}

const ClientLatexPreview: React.FC<ClientLatexPreviewProps> = ({
  content,
  className,
  templateStyles
}) => {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full animate-pulse bg-gray-100 rounded-lg">
        <div className="h-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  try {
    return (
      <div className={cn("latex-preview", className)}>
        {templateStyles && (
          <style dangerouslySetInnerHTML={{ __html: templateStyles }} />
        )}
        <Latex>{content}</Latex>
      </div>
    );
  } catch (err) {
    console.error('LaTeX rendering error:', err);
    return (
      <div className="text-red-600 p-4 text-center">
        Failed to render LaTeX content. Please check the syntax.
      </div>
    );
  }
};

export default ClientLatexPreview;