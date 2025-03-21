import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TemplateMetadata } from '@/types/templates';

interface StaticTemplatePreviewCarouselProps {
  templates: TemplateMetadata[];
}

export function StaticTemplatePreviewCarousel({ templates }: StaticTemplatePreviewCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!templates.length) {
    return (
      <Card className="w-full h-64 flex items-center justify-center">
        <p className="text-muted-foreground">No template selected</p>
      </Card>
    );
  }

  const currentTemplate = templates[currentIndex];

  const handlePrevious = () => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev === 0 ? templates.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev === templates.length - 1 ? 0 : prev + 1));
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const imagePath = currentTemplate.previewImage
    ? `/templates/latex/${currentTemplate.previewImage}`
    : `/templates/latex/${currentTemplate.name.toLowerCase()}.png`;

  return (
    <div className="relative w-full">
      <Card className="w-full aspect-[16/9] relative overflow-hidden">
        {isLoading && (
          <div role="status" className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
        
        <Image
          src={imagePath}
          alt={`Preview of ${currentTemplate.name} template`}
          fill
          className={cn(
            "object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoadingComplete={handleImageLoad}
          onError={handleImageError}
        />
        
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Preview image not available</p>
          </div>
        )}
      </Card>

      <div className="absolute inset-y-0 left-0 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          className="h-8 w-8 rounded-full bg-background/80 hover:bg-background/90"
          aria-label="Previous template"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="h-8 w-8 rounded-full bg-background/80 hover:bg-background/90"
          aria-label="Next template"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-sm font-medium text-white bg-background/80 inline-block px-2 py-1 rounded">
          {currentTemplate.name}
        </p>
      </div>
    </div>
  );
}