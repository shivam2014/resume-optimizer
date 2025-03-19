import { useState, useEffect } from 'react';
import ClientLatexPreview from './ClientLatexPreview';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TemplatePreviewCarouselProps {
  templates: {
    id: string;
    latexContent: string;
    name: string;
  }[];
}

export function TemplatePreviewCarousel({ templates }: TemplatePreviewCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % templates.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + templates.length) % templates.length);
  };

  if (!templates.length) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative">
        <div className="overflow-hidden rounded-lg shadow-lg">
          <div className="transition-transform duration-300 ease-in-out">
            {templates[currentIndex] ? (
              <ClientLatexPreview
                key={templates[currentIndex].id}
                content={templates[currentIndex].latexContent}
                className="w-full min-h-[300px] md:min-h-[400px] lg:min-h-[500px]"
              />
            ) : (
              <div className="w-full min-h-[300px] md:min-h-[400px] lg:min-h-[500px] flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">No template selected</p>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        {templates[currentIndex].name}
      </div>
    </div>
  );
}