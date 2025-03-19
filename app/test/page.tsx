'use client';

import LatexPreview from '@/components/latex-preview';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function TestPage() {
  const [content, setContent] = useState(`
% name with different font sizes
\\centerline{
  \\fontfamily{bch}\\selectfont\\textbf{
    {\\fontsize{20.74}{25}\\selectfont\\textls[50]{J}}
    {\\fontsize{14.4}{18}\\selectfont\\textls[50]{OHN}}
    \\hspace{0.5em}
    {\\fontsize{20.74}{25}\\selectfont\\textls[50]{D}}
    {\\fontsize{14.4}{18}\\selectfont\\textls[50]{OE}}
  }
}
\\vspace{+2pt}

% contact information
\\centerline{ +1-234-567-8900 | \\href{mailto:john.doe@example.com}{john.doe@example.com} | \\href{https://linkedin.com/in/johndoe}{linkedin.com/in/johndoe} }

\\vspace{+12pt}

% Summary
Senior Software Engineer with over 5 years of experience in full-stack development. Skilled in React, Node.js, and cloud architecture, with a proven track record of delivering scalable solutions.

% Skills section
\\section*{{\\fontsize{12}{14.4}\\selectfont\\textls[50]{S}}{\\fontsize{9}{10.8}\\selectfont\\textls[50]{KILLS}}}
\\begin{itemize}
\\item \\textbf{Frontend:} React, TypeScript, Next.js, Tailwind CSS
\\item \\textbf{Backend:} Node.js, Python, PostgreSQL, Redis
\\item \\textbf{Cloud:} AWS, Docker, Kubernetes, CI/CD
\\item \\textbf{Tools:} Git, JIRA, Figma, VS Code
\\end{itemize}

% Experience section
\\section*{{\\fontsize{12}{14.4}\\selectfont\\textls[50]{E}}{\\fontsize{9}{10.8}\\selectfont\\textls[50]{XPERIENCE}}}
\\textbf{Senior Software Engineer} \\hfill {Jan 2020 – Present} \\\\
\\textit{Tech Corp} \\hfill \\textit{San Francisco, CA}
\\begin{itemize}
  \\item Led development of microservices architecture serving 1M+ daily users
  \\item Implemented CI/CD pipeline reducing deployment time by 60%
  \\item Mentored junior developers and conducted technical interviews
\\end{itemize}
`);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Testing Default Template</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">Content</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[600px] p-4 font-mono text-sm border rounded"
          />
        </div>
        
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Preview</h2>
          <LatexPreview 
            template="templates/latex/Default_Resume-template.tex"
            content={content}
          />
        </div>
      </div>
    </div>
  );
}