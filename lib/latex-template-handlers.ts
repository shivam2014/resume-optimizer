import { TemplateMetadata } from './template-config';

interface TemplateConfig {
  contentPlaceholder: string;
  sampleContent: string;
  transformContent?: (content: string) => string;
  previewStyles?: string;
}

const templateConfigs: Record<string, TemplateConfig> = {
  'Default_Resume-template.tex': {
    contentPlaceholder: '%RESUME_CONTENT%',
    sampleContent: `
\\section{Work Experience}
\\entry
  {2020-Present}
  {Senior Software Engineer}
  {Tech Company}
  {
    \\begin{itemize}
      \\item Led development of key features
      \\item Improved system performance by 50\\%
    \\end{itemize}
  }`,
    previewStyles: `
      .preview-container {
        font-family: "Charter", serif;
        line-height: 1.5;
      }
    `
  },
  'John_Miller_CV.tex': {
    contentPlaceholder: '%RESUME_CONTENT%',
    sampleContent: `
\\section{Work Experience}
\\textsc{Senior Developer} at \\textit{Tech Corp.}  \\dates{2020--Present} \\\\
\\smaller{Led development of key features and improved system performance}

\\is
\\smaller{Managed team of 5 developers and implemented new architecture}`,
    transformContent: (content: string) => {
      // Add specific transformations for John Miller CV format
      return content.replace(/\\section{([^}]+)}/g, '\\headright{$1}{\\workIcon}');
    },
    previewStyles: `
      .preview-container {
        font-family: "Fira Sans", sans-serif;
        background: #fff;
      }
    `
  },
  'Modular_professional_CV.tex': {
    contentPlaceholder: '%RESUME_CONTENT%',
    sampleContent: `
\\section{Work Experience}{\\workIcon}
\\cvEntryNTPLD
    {Company Name}{2020 -- Present}
    {Senior Developer}{Location}{
    \\cvItemS{Python, JavaScript, React}
    \\cvItem{Led development of key features}
    \\cvItem{Improved system performance by 50\\%}
}`,
    transformContent: (content: string) => {
      // Add specific transformations for Modular Professional CV format
      return content.replace(/\\section{([^}]+)}/g, '\\section{$1}{\\workIcon}');
    },
    previewStyles: `
      .preview-container {
        font-family: "Fira Sans", sans-serif;
        color: #333;
      }
    `
  }
};

export function getTemplateConfig(templatePath: string): TemplateConfig {
  const templateName = templatePath.split('/').pop() || '';
  return templateConfigs[templateName] || {
    contentPlaceholder: '%RESUME_CONTENT%',
    sampleContent: '% No specific template configuration found'
  };
}

export function transformTemplateContent(template: TemplateMetadata, content: string): string {
  const config = getTemplateConfig(template.path);
  if (config.transformContent) {
    return config.transformContent(content);
  }
  return content;
}

export function getTemplatePreviewStyles(templatePath: string): string {
  const config = getTemplateConfig(templatePath);
  return config.previewStyles || '';
}