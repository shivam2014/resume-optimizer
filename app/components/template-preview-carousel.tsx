import { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { TemplateMetadata, getTemplates, getSampleContent } from '@/lib/template-config';
import { cn } from '@/lib/utils';
import ClientLatexPreview from './client-latex-preview';

interface TemplatePreviewCarouselProps {
  templates?: TemplateMetadata[];
  content?: string;
  onTemplateSelect?: (template: TemplateMetadata) => void;
}

const TemplatePreviewCarousel: React.FC<TemplatePreviewCarouselProps> = ({
  templates = getTemplates(),
  content = getSampleContent(),
  onTemplateSelect
}) => {
  const [activeTemplate, setActiveTemplate] = useState<string>(templates[0].path);
  const [templateStyles, setTemplateStyles] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplateStyles = async () => {
      const styles = new Map<string, string>();
      
      for (const template of templates) {
        try {
          const response = await fetch(`/templates/latex/${template.path}/style.css`);
          if (response.ok) {
            const css = await response.text();
            styles.set(template.path, css);
          }
        } catch (err) {
          console.warn(`Failed to load styles for template ${template.path}:`, err);
        }
      }

      setTemplateStyles(styles);
      setLoading(false);
    };

    loadTemplateStyles();
  }, [templates]);

  const handleTemplateSelect = (template: TemplateMetadata) => {
    setActiveTemplate(template.path);
    onTemplateSelect?.(template);
  };

  return (
    <div className="w-full space-y-6">
      <Carousel className="w-full group">
        <CarouselContent className="-ml-2 md:-ml-4">
          {templates.map((template) => (
            <CarouselItem
              key={template.path}
              className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
            >
              <div className="relative aspect-[210/297] group">
                <Card
                  className={cn(
                    "h-full cursor-pointer transition-all duration-300 hover:shadow-lg overflow-hidden",
                    activeTemplate === template.path && "ring-2 ring-primary"
                  )}
                  onClick={() => handleTemplateSelect(template)}
                  aria-label={`Preview of ${template.name} template`}
                >
                  <CardContent className="p-4 h-full">
                    <ClientLatexPreview
                      content={content}
                      templateStyles={templateStyles.get(template.path)}
                      className="transform scale-[0.4] origin-top-left absolute inset-0 w-[250%] h-[250%]"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-4 text-white">
                      <h3 className="text-lg font-semibold text-center mb-2">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-sm text-center text-gray-200">
                          {template.description}
                        </p>
                      )}
                      {template.source && (
                        <a
                          href={template.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 text-sm text-blue-300 hover:text-blue-200 underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Source
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious className="bg-white hover:bg-gray-50" />
          <CarouselNext className="bg-white hover:bg-gray-50" />
        </div>
      </Carousel>

      <div className="flex justify-center gap-2">
        {templates.map((template) => (
          <button
            key={template.path}
            onClick={() => handleTemplateSelect(template)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              activeTemplate === template.path
                ? "bg-primary w-6"
                : "bg-gray-300 hover:bg-gray-400"
            )}
            aria-label={`Select ${template.name}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TemplatePreviewCarousel;