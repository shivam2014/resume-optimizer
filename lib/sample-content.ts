/**
 * Sample LaTeX content for testing template preview functionality
 */

export function getSampleContent(): string {
  return `\\documentclass[11pt,a4paper]{article}

% Required packages
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\usepackage{fontawesome}
\\usepackage{titlesec}
\\usepackage{enumitem}

% Document styling
\\pagestyle{empty}
\\titleformat{\\section}{\\Large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{12pt}{8pt}

\\begin{document}

% Header with contact information
\\begin{center}
  {\\Large\\bfseries John Doe}\\\\[4pt]
  \\faEnvelope\\ email@example.com \\quad
  \\faPhone\\ (555) 123-4567 \\quad
  \\faLinkedin\\ linkedin.com/in/johndoe \\quad
  \\faGithub\\ github.com/johndoe
\\end{center}

% Summary section
\\section{Professional Summary}
Experienced software engineer with expertise in full-stack development, cloud architecture, and agile methodologies. Strong track record of delivering scalable solutions and leading technical teams.

% Experience section
\\section{Professional Experience}
\\textbf{Senior Software Engineer} \\hfill 2020 -- Present\\\\
Tech Company Inc., San Francisco, CA
\\begin{itemize}[nosep]
  \\item Led development of microservices architecture serving 1M+ daily users
  \\item Implemented CI/CD pipelines reducing deployment time by 60\\%
  \\item Mentored junior developers and conducted technical interviews
\\end{itemize}

% Education section
\\section{Education}
\\textbf{Master of Science in Computer Science} \\hfill 2018\\\\
University of Technology \\hfill GPA: 3.8/4.0

% Skills section
\\section{Technical Skills}
\\textbf{Languages:} JavaScript, TypeScript, Python, Java, C++\\\\
\\textbf{Technologies:} React, Node.js, Docker, Kubernetes, AWS\\\\
\\textbf{Tools:} Git, Jenkins, Jira, Confluence

% Projects section
\\section{Notable Projects}
\\textbf{Cloud Migration Initiative} \\hfill 2021
\\begin{itemize}[nosep]
  \\item Successfully migrated legacy systems to cloud infrastructure
  \\item Reduced operational costs by 40\\% through optimization
\\end{itemize}

\\end{document}`
}