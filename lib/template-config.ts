export interface TemplateMetadata {
  name: string;
  path: string;
  source?: string;
  description?: string;
  latexContent: string;
  imagePlaceholders?: Record<string, string>;
  requiredFonts?: string[];
  customPackages?: string[];
}

export const templateConfig: TemplateMetadata[] = [
  {
    name: "Default Resume",
    path: "templates/latex/Default_Resume-template.tex",
    description: "Clean and professional resume template with modern typography",
    latexContent: getSampleContent(),
    requiredFonts: ["charter"]
  },
  {
    name: "John Miller CV",
    path: "templates/latex/John_Miller_CV.tex",
    source: "https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs",
    description: "Two-column CV template with a modern design",
    latexContent: getSampleContent(),
    imagePlaceholders: {
      "joh.png.jpg": "/placeholder-user.jpg"
    },
    requiredFonts: ["FiraSans"]
  },
  {
    name: "Modular Professional CV",
    path: "templates/latex/Modular_professional_CV.tex",
    source: "https://www.overleaf.com/latex/templates/modular-professional-cv/cffcktvtxxmr",
    description: "Highly customizable professional CV template",
    latexContent: getSampleContent(),
    customPackages: ["fontawesome", "FiraSans"],
    requiredFonts: ["FiraSans", "FontAwesome"]
  }
];

export const getTemplates = (): TemplateMetadata[] => {
  return templateConfig;
};

export function getSampleContent(): string {
  return `
\\section{Work Experience}
\\begin{itemize}
  \\item Senior Software Engineer at Tech Corp
    \\begin{itemize}
      \\item Led development of key features
      \\item Improved system performance by 50\\%
    \\end{itemize}
  \\item Full Stack Developer at StartUp Inc
    \\begin{itemize}
      \\item Developed scalable web applications
      \\item Managed team of 5 developers
    \\end{itemize}
\\end{itemize}
`;
}

export function getImagePlaceholder(template: TemplateMetadata, imagePath: string): string {
  if (template.imagePlaceholders && template.imagePlaceholders[imagePath]) {
    return template.imagePlaceholders[imagePath];
  }
  return "/placeholder-user.jpg"; // Default fallback
}

export async function validateTemplateRequirements(template: TemplateMetadata): Promise<string[]> {
  const errors: string[] = [];
  
  if (template.requiredFonts) {
    await Promise.all(
      template.requiredFonts.map(async (font) => {
        const available = await isFontAvailable(font);
        if (!available) {
          errors.push(`Required font not installed: ${font}`);
        }
      })
    );
  }

  if (template.customPackages) {
    await Promise.all(
      template.customPackages.map(async (pkg) => {
        const available = await isPackageAvailable(pkg);
        if (!available) {
          errors.push(`Required LaTeX package not installed: ${pkg}`);
        }
      })
    );
  }

  return errors;
}

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function isFontAvailable(font: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('fc-list', [], { encoding: 'utf-8' });
    return stdout.toLowerCase().includes(font.toLowerCase());
  } catch (error) {
    console.error(`Error checking font availability: ${error}`);
    return false;
  }
}

async function isPackageAvailable(pkg: string): Promise<boolean> {
  try {
    await execFileAsync('kpsewhich', [`${pkg}.sty`], { encoding: 'utf-8' });
    return true;
  } catch (error) {
    console.error(`Error checking package availability: ${error}`);
    return false;
  }
}