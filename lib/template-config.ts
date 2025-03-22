import { TemplateMetadata, BaseTemplateMetadata } from '../types/templates';

const DEFAULT_PLACEHOLDER = '/placeholder-user.png';

/**
 * Returns sample LaTeX content for testing and previews
 */
export const getSampleContent = (): string => {
  return `\\documentclass{article}
\\usepackage{fontenc}
\\usepackage{inputenc}
\\usepackage{geometry}
\\begin{document}
\\section{Work Experience}
\\end{document}`;
};

/**
 * Returns an array of available LaTeX templates with their metadata
 * Used by tests and preview components
 */
export const getTemplates = (): TemplateMetadata[] => {
  return [
    {
      id: "default-resume",
      name: "Default Resume",
      path: "templates/latex/Default_Resume.tex",
      latexContent: `\\documentclass[11pt,a4paper]{article}
\\usepackage{fontenc}
\\usepackage{inputenc}
\\usepackage{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\geometry{left=2cm,right=2cm,top=2cm,bottom=2cm}

\\begin{document}
\\pagestyle{empty}

% Header
\\begin{center}
\\textbf{\\Large \\VAR{name}}\\\\[0.3em]
\\VAR{email} | \\VAR{phone} | \\VAR{location}
\\end{center}

\\section*{Summary}
\\VAR{summary}

\\section*{Experience}
\\VAR{experience}

\\section*{Education}
\\VAR{education}

\\section*{Skills}
\\VAR{skills}

\\end{document}`,
      description: "A simple and clean default resume template",
      previewImage: "/templates/latex/Default_Resume-template.jpg",
      isDefault: true
    },
    {
      id: "john-miller-cv",
      name: "John Miller CV",
      path: "templates/latex/John_Miller_CV.tex",
      latexContent: `\\documentclass[11pt,a4paper]{article}
\\usepackage{fontenc}
\\usepackage{inputenc}
\\usepackage{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{fontawesome5}

\\geometry{left=2cm,right=2cm,top=2cm,bottom=2cm}

\\titleformat{\\section}{\\Large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{12pt}{8pt}

\\begin{document}
\\pagestyle{empty}

% Header
\\begin{center}
\\textbf{\\Huge \\VAR{name}}\\\\[0.5em]
\\VAR{title}\\\\[0.3em]
\\faEnvelope\\ \\href{mailto:\\VAR{email}}{\\VAR{email}} $|$
\\faPhone\\ \\VAR{phone} $|$
\\faMapMarker\\ \\VAR{location} $|$
\\faLinkedin\\ \\href{\\VAR{linkedin}}{LinkedIn}
\\end{center}

\\section{Professional Summary}
\\VAR{summary}

\\section{Work Experience}
\\VAR{experience}

\\section{Education}
\\VAR{education}

\\section{Skills}
\\VAR{skills}

\\end{document}`,
      description: "A clean and professional CV template with modern icons and clear section hierarchy",
      requiredFonts: ["FontAwesome"],
      customPackages: ["fontawesome5", "titlesec"],
      previewImage: "/templates/latex/John_Miller_CV.jpeg"
    },
    {
      id: "modular-professional-cv",
      name: "Modular Professional CV",
      path: "templates/latex/Modular_Professional_CV.tex",
      latexContent: `\\documentclass[11pt,a4paper]{article}
\\usepackage{fontenc}
\\usepackage{inputenc}
\\usepackage{geometry}
\\usepackage{xcolor}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\geometry{left=1.5cm,right=1.5cm,top=2cm,bottom=2cm}
\\definecolor{primary}{RGB}{0,90,160}

\\titleformat{\\section}{\\color{primary}\\Large\\bfseries}{}{0em}{}
\\titlespacing*{\\section}{0pt}{12pt}{6pt}

\\begin{document}
\\pagestyle{empty}

% Header
\\begin{center}
\\textbf{\\Huge \\VAR{name}}\\\\[0.5em]
{\\Large \\VAR{title}}\\\\[0.3em]
\\VAR{email} $|$ \\VAR{phone} $|$ \\VAR{location}\\\\
\\href{\\VAR{linkedin}}{LinkedIn} $|$ \\href{\\VAR{portfolio}}{Portfolio}
\\end{center}

\\section{Professional Summary}
\\VAR{summary}

\\section{Core Competencies}
\\VAR{competencies}

\\section{Professional Experience}
\\VAR{experience}

\\section{Education}
\\VAR{education}

\\section{Technical Skills}
\\VAR{skills}

\\section{Certifications}
\\VAR{certifications}

\\end{document}`,
      description: "A modular and customizable professional CV template with color accents",
      customPackages: ["xcolor", "titlesec"],
      previewImage: "/templates/latex/Modular_Professional_CV.jpeg"
    }
  ];
};

/**
 * Returns the appropriate image placeholder for a given template and image name
 */
export const getImagePlaceholder = (
  template: TemplateMetadata,
  imageName: string
): string => {
  if (template.imagePlaceholders?.[imageName]) {
    return template.imagePlaceholders[imageName];
  }
  return DEFAULT_PLACEHOLDER;
};

/**
 * Client-side template validation
 */
export const validateBasicTemplate = (template: TemplateMetadata): string[] => {
  const errors: string[] = [];
  
  if (!template.latexContent.includes('\\documentclass')) {
    errors.push('Missing document class declaration');
  }

  if (!template.latexContent.includes('\\begin{document}')) {
    errors.push('Missing document environment');
  }

  const requiredPackages = ['fontenc', 'inputenc', 'geometry'];
  requiredPackages.forEach(pkg => {
    if (!template.latexContent.includes(`\\usepackage{${pkg}}`)) {
      errors.push(`Missing recommended package: ${pkg}`);
    }
  });

  return errors;
};