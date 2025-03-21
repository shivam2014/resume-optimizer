export interface ImagePlaceholders {
  [key: string]: string;
}

export interface BaseTemplateMetadata {
  name: string;
  path: string;
  latexContent: string;
}

export interface TemplateMetadata extends BaseTemplateMetadata {
  description?: string;
  source?: string;
  imagePlaceholders?: ImagePlaceholders;
  requiredFonts?: string[];
  customPackages?: string[];
  previewImage?: string;
  isDefault?: boolean;
}