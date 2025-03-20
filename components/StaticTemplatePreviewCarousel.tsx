import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StaticTemplatePreviewCarouselProps {
  templates: {
    id: string;
    name: string;
  }[];
}

export function StaticTemplatePreviewCarousel({ templates }: StaticTemplatePreviewCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleNext = () => {
    setIsImageLoading(true);
    setCurrentIndex((prev) => (prev + 1) % templates.length);
  };

  const handlePrev = () => {
    setIsImageLoading(true);
    setCurrentIndex((prev) => (prev - 1 + templates.length) % templates.length);
  };

  if (!templates.length) return null;

  const currentTemplate = templates[currentIndex];
  const thumbnailPath = `/templates/thumbnails/${currentTemplate.name.toLowerCase().replace(/ /g, '_')}`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative">
        <div className="overflow-hidden rounded-lg shadow-lg">
          <div className="relative w-full min-h-[300px] md:min-h-[400px] lg:min-h-[500px]">
            {currentTemplate ? (
              <>
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <Image
                  src={`${thumbnailPath}@2x.png`}
                  alt={`Preview of ${currentTemplate.name} template`}
                  fill
                  quality={90}
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  className={cn(
                    "object-contain transition-opacity duration-300",
                    isImageLoading ? "opacity-0" : "opacity-100"
                  )}
                  onLoadingComplete={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
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
        {currentTemplate.name}
      </div>
    </div>
  );
}