import fs from 'fs/promises';
import path from 'path';
import { TemplateMetadata, getImagePlaceholder, validateTemplateRequirements } from './template-config';

interface TemplateConfig {
  contentPlaceholder: string;
  sampleContent: string;
  transformContent?: (content: string) => string;
  previewStyles?: string;
  requiresGlyphToUnicode?: boolean;
  hasImages?: boolean;
  requiredPackages?: string[];
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
      return content.replace(/\\section{([^}]+)}/g, '\\headright{$1}{\\workIcon}');
    },
    previewStyles: `
      .preview-container {
        font-family: "Fira Sans", sans-serif;
        background: #fff;
      }
    `
  }
};

/**
 * Loads a LaTeX template from the filesystem
 */
export async function loadTemplate(templatePath: string): Promise<TemplateMetadata> {
  try {
    const fullPath = path.join(process.cwd(), templatePath);
    const latexContent = await fs.readFile(fullPath, 'utf-8');
    
    const name = path.basename(templatePath, '.tex');
    const template: TemplateMetadata = {
      name,
      path: templatePath,
      latexContent
    };

    // Extract required packages from template content
    const packageRegex = /\\usepackage(?:\[.*?\])?\{([^}]+)\}/g;
    const customPackages: string[] = [];
    let match;
    while ((match = packageRegex.exec(latexContent)) !== null) {
      customPackages.push(match[1]);
    }
    template.customPackages = customPackages;

    return template;
  } catch (error) {
    throw new Error(`Failed to load template ${templatePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Lists all available LaTeX templates in the templates directory
 */
export async function listAvailableTemplates(): Promise<string[]> {
  try {
    const templatesDir = path.join(process.cwd(), 'templates/latex');
    const files = await fs.readdir(templatesDir);
    return files.filter(file => file.endsWith('.tex'));
  } catch (error) {
    throw new Error('Failed to list available templates');
  }
}

export function getTemplateConfig(templatePath: string): TemplateConfig {
  const templateName = templatePath.split('/').pop() || '';
  return templateConfigs[templateName] || {
    contentPlaceholder: '%RESUME_CONTENT%',
    sampleContent: '% No specific template configuration found'
  };
}

export async function transformTemplateContent(template: TemplateMetadata, content: string): Promise<string> {
  const config = getTemplateConfig(template.path);
  let transformedContent = content;

  try {
    // Validate template requirements first
    const errors = await validateTemplateRequirements(template);
    if (errors.length > 0) {
      console.warn('Template requirements not met:', errors);
    }

    // Apply content transformations
    if (config.transformContent) {
      transformedContent = config.transformContent(content);
    }

    // Handle glyphtounicode
    if (config.requiresGlyphToUnicode && !content.includes('\\input{glyphtounicode}')) {
      transformedContent = transformedContent.replace(
        /\\begin{document}/,
        '% Note: glyphtounicode functionality is handled by the PDF generator\n\\begin{document}'
      );
    }

    // Handle images with proper error handling and placeholders
    const imageRegex = /\\includegraphics(\[.*?\])?{([^}]+)}/g;
    if (template.imagePlaceholders && imageRegex.test(content)) {
      transformedContent = transformedContent.replace(
        imageRegex,
        (match, options, imagePath) => {
          try {
            const placeholder = getImagePlaceholder(template, imagePath);
            return `\\includegraphics${options || ''}{${placeholder}}`;
          } catch (error) {
            console.error(`Error processing image ${imagePath}:`, error);
            return `% Failed to process image: ${imagePath}\n% Using default placeholder\n\\includegraphics${options || ''}{/placeholder-user.jpg}`;
          }
        }
      );
    }

    // Check and handle required fonts
    if (template.requiredFonts?.length) {
      const fontWarnings = template.requiredFonts
        .filter(font => !transformedContent.includes(`\\usepackage{${font}}`))
        .map(font => `% Warning: Template requires ${font} font package`);
      
      if (fontWarnings.length > 0) {
        transformedContent = transformedContent.replace(
          /\\documentclass.*?\n/,
          `$&${fontWarnings.join('\n')}\n`
        );
      }
    }

    return transformedContent;
  } catch (error) {
    console.error('Error transforming template content:', error);
    throw new Error('Failed to transform template content');
  }
}

export function getTemplatePreviewStyles(templatePath: string): string {
  const config = getTemplateConfig(templatePath);
  return config.previewStyles || '';
}

export async function validateLatexTemplate(template: TemplateMetadata): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check basic structure
    if (!template.latexContent?.includes('\\documentclass')) {
      errors.push('Missing document class declaration');
    }

    if (!template.latexContent?.includes('\\begin{document}')) {
      errors.push('Missing document environment');
    }

    if (!template.latexContent?.includes('\\end{document}')) {
      errors.push('Missing end of document');
    }

    // Check for required packages
    const requiredPackages = ['fontenc', 'inputenc', 'geometry'];
    requiredPackages.forEach(pkg => {
      if (!template.latexContent?.includes(`\\usepackage{${pkg}}`)) {
        warnings.push(`Missing recommended package: ${pkg}`);
      }
    });

    // Check custom package requirements
    if (template.customPackages?.length) {
      const requirementErrors = await validateTemplateRequirements(template);
      errors.push(...requirementErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Failed to validate template: ' + (error instanceof Error ? error.message : 'Unknown error')],
      warnings
    };
  }
}