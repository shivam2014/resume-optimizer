export interface TemplateMetadata {
  name: string;
  path: string;
  source?: string;
  description?: string;
}

export const templateConfig: TemplateMetadata[] = [
  {
    name: "Default Resume",
    path: "templates/latex/Default_Resume-template.tex",
    description: "Clean and professional resume template with modern typography"
  },
  {
    name: "John Miller CV",
    path: "templates/latex/John_Miller_CV.tex",
    source: "https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs",
    description: "Two-column CV template with a modern design"
  },
  {
    name: "Modular Professional CV",
    path: "templates/latex/Modular_professional_CV.tex",
    source: "https://www.overleaf.com/latex/templates/modular-professional-cv/cffcktvtxxmr",
    description: "Highly customizable professional CV template"
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