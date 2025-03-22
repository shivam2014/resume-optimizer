export interface ImagePlaceholders {
  [key: string]: string;
}

export interface BaseTemplateMetadata {
  id: string;
  name: string;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  path: string;
  latexContent: string;
  description?: string;
  source?: string;
  imagePlaceholders?: ImagePlaceholders;
  requiredFonts?: string[];
  customPackages?: string[];
  previewImage?: string;
  isDefault?: boolean;
}