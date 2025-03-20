import fs from 'fs/promises';
import path from 'path';

/**
 * Options for generating a preview template
 */
export interface PreviewTemplateOptions {
  /** Title of the document */
  title?: string;
  /** Main content to include in the document body */
  content?: string;
  /** Author name to include in the title */
  author?: string;
  /** Date to include in the title */
  date?: string;
  /** Additional packages to include beyond those detected automatically */
  additionalPackages?: string[];
  /** Whether to include common LaTeX commands */
  includeCommonCommands?: boolean;
}

/**
 * Generates a LaTeX preview template with proper package handling
 * @param templatePath Path to the original LaTeX template
 * @param options Configuration options for the preview
 * @returns Promise containing the generated LaTeX content
 * @throws Error if template reading or generation fails
 */

const COMMON_PACKAGES = [
  '\\usepackage[T1]{fontenc}',
  '\\usepackage[utf8]{inputenc}',
  '\\usepackage{microtype}',
  '\\usepackage[margin=1cm]{geometry}',
  '\\usepackage{fancyhdr}',
  '\\usepackage{graphicx}',
  '\\usepackage[dvipsnames]{xcolor}',
  '\\usepackage{enumitem}',
  '\\usepackage{titlesec}',
  '\\usepackage{hyperref}',
  '\\usepackage{fontawesome}',
  '\\usepackage{calc}',
  '\\usepackage{array}',
  '\\usepackage{etoolbox}'
];

const PREVIEW_TEMPLATE = `%DOCUMENTCLASS%

% Essential packages (only included if not in original template)
%PACKAGES%

% Original preamble commands
%PREAMBLE%

\\begin{document}
%TITLE%
%CONTENT%
\\end{document}`;

interface TemplateRequirements {
  documentClass: string;
  packages: string[];
  preambleCommands: string[];
}

/**
 * Extracts LaTeX package requirements from a template file
 */
async function extractPackageRequirements(templatePath: string): Promise<TemplateRequirements> {
  const content = await fs.readFile(templatePath, 'utf-8');
  
  // Find documentclass with its options
  const classMatch = content.match(/\\documentclass(\[.*?\])?\{.*?\}/);
  const documentClass = classMatch ? classMatch[0] : '\\documentclass{article}';
  
  // Find all package declarations with their options
  const packages: string[] = [];
  const packageMatches = content.match(/\\usepackage(\[.*?\])?\{.*?\}/g) || [];
  packages.push(...packageMatches);

  // Extract all preamble commands (between documentclass and begin{document})
  // Split content into lines to avoid regex 's' flag
  const lines = content.split('\n');
  const docClassIndex = lines.findIndex(line => line.includes('\\documentclass'));
  const beginDocIndex = lines.findIndex(line => line.includes('\\begin{document}'));
  let preambleCommands: string[] = [];
  
  if (docClassIndex !== -1 && beginDocIndex !== -1) {
    preambleCommands = lines
      .slice(docClassIndex + 1, beginDocIndex)
      .filter((line: string) => {
        const trimmed = line.trim();
        return trimmed &&
               !trimmed.startsWith('%') && // Skip comments
               !trimmed.startsWith('\\documentclass') && // Skip document class
               !trimmed.startsWith('\\usepackage') && // Skip packages
               !trimmed.includes('\\begin{document}'); // Skip document begin
      });
  }

  // Add packages based on content analysis
  if (content.includes('\\begin{tabularx}')) {
    packages.push('\\usepackage{tabularx}');
  }
  if (content.includes('\\begin{longtable}')) {
    packages.push('\\usepackage{longtable}');
  }
  if (content.match(/\\(textcolor|color)\{/)) {
    packages.push('\\usepackage[dvipsnames]{xcolor}');
  }
  if (content.match(/\\setmainfont/)) {
    packages.push('\\usepackage{fontspec}');
  }

  return {
    documentClass,
    packages,
    preambleCommands
  };
}

/**
 * Removes duplicate package declarations from an array of package statements
 */
interface PackageInfo {
  name: string;
  options: string | null;
  fullDeclaration: string;
  priority: number;
}

function parsePackage(pkg: string): PackageInfo {
  const match = pkg.match(/\\usepackage(?:\[(.*?)\])?\{(.*?)\}/);
  if (!match) {
    throw new Error(`Invalid package declaration: ${pkg}`);
  }
  
  return {
    name: match[2],
    options: match[1] || null,
    fullDeclaration: pkg,
    // Assign higher priority to packages with options
    priority: match[1] ? 2 : 1
  };
}

function removeDuplicatePackages(packages: string[]): string[] {
  const packageMap = new Map<string, PackageInfo>();
  
  // Process each package declaration
  packages.forEach(pkg => {
    try {
      const info = parsePackage(pkg);
      
      // If package already exists, keep the higher priority version
      const existing = packageMap.get(info.name);
      if (!existing || info.priority > existing.priority) {
        packageMap.set(info.name, info);
      }
    } catch (error) {
      console.warn(`Skipping invalid package declaration: ${pkg}`);
    }
  });

  // Special handling for potentially conflicting packages
  if (packageMap.has('fontspec') && packageMap.has('fontenc')) {
    packageMap.delete('fontenc'); // fontspec supersedes fontenc
  }

  if (packageMap.has('unicode-math') && packageMap.has('amsmath')) {
    packageMap.delete('amsmath'); // unicode-math includes amsmath functionality
  }

  // Return the package declarations in order, with common packages first
  const commonPackageNames = new Set(COMMON_PACKAGES.map(pkg => parsePackage(pkg).name));
  const commonPackages: string[] = [];
  const otherPackages: string[] = [];

  packageMap.forEach(info => {
    if (commonPackageNames.has(info.name)) {
      commonPackages.push(info.fullDeclaration);
    } else {
      otherPackages.push(info.fullDeclaration);
    }
  });

  return [...commonPackages, ...otherPackages];
}

// Common LaTeX commands and settings that might be needed
const COMMON_LATEX_COMMANDS = `
% Common commands and settings
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}
\\raggedbottom
\\raggedright

% Custom commands for CV/Resume
\\newcommand{\\cvSection}[1]{\\section*{#1}\\vspace{-0.5em}}
\\newcommand{\\cvItem}[2]{\\textbf{#1} & #2 \\\\}
\\newcommand{\\cvEntry}[4]{\\textbf{#1} & #2 & #3 & #4 \\\\}
`;

export async function generatePreviewTemplate(
  templatePath: string,
  options: Partial<PreviewTemplateOptions> = {}
): Promise<string> {
  try {
    // Extract template requirements
    const requirements = await extractPackageRequirements(templatePath);
    
    // Read the original template content
    const content = await fs.readFile(templatePath, 'utf-8');
    
    // Extract content between \begin{document} and \end{document}
    const documentMatch = content.match(/\\begin{document}([\s\S]*?)\\end{document}/);
    const extractedContent = documentMatch ? documentMatch[1].trim() : '';
    
    // Create preview content
    let previewContent = PREVIEW_TEMPLATE;
    
    // Use original document class
    previewContent = previewContent.replace('%DOCUMENTCLASS%', requirements.documentClass);
    
    // Combine and dedupe packages
    const allPackages = [
      ...requirements.packages,
      ...(options.additionalPackages || [])
    ];

    // Add only essential common packages that aren't in the original template
    const originalPackageNames = new Set(requirements.packages.map(pkg => {
      const match = pkg.match(/\\usepackage(?:\[.*?\])?\{(.*?)\}/);
      return match ? match[1] : '';
    }));

    const essentialPackages = COMMON_PACKAGES.filter(pkg => {
      const match = pkg.match(/\\usepackage(?:\[.*?\])?\{(.*?)\}/);
      const pkgName = match ? match[1] : '';
      return !originalPackageNames.has(pkgName);
    });

    // Combine and dedupe all packages
    const dedupedPackages = removeDuplicatePackages([
      ...requirements.packages,
      ...essentialPackages,
      ...(options.additionalPackages || [])
    ]);
    
    // Build the final template
    const packageSection = dedupedPackages.join('\n');
    previewContent = previewContent.replace('%PACKAGES%', packageSection);
    
    // Add preamble commands
    const preambleSection = [
      options.includeCommonCommands !== false ? COMMON_LATEX_COMMANDS : '',
      ...requirements.preambleCommands
    ].filter(Boolean).join('\n');
    previewContent = previewContent.replace('%PREAMBLE%', preambleSection);
    
    if (options.title) {
      const titleBlock = [
        '\\title{' + options.title + '}',
        options.author ? '\\author{' + options.author + '}' : '',
        options.date ? '\\date{' + options.date + '}' : '\\date{}',
        '\\maketitle'
      ].filter(Boolean).join('\n');
      previewContent = previewContent.replace('%TITLE%', titleBlock);
    } else {
      previewContent = previewContent.replace('%TITLE%', '');
    }
    
    // Use either extracted content or provided content
    const finalContent = options.content || extractedContent;
    previewContent = previewContent.replace('%CONTENT%', finalContent);
    
    return previewContent;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to generate preview template: ${errorMessage}`);
  }
}

export async function createTemporaryPreview(
  templatePath: string,
  options?: Partial<PreviewTemplateOptions>
): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const previewContent = await generatePreviewTemplate(templatePath, options);
  const tempDir = path.join(process.cwd(), 'temp');
  const timestamp = Date.now();
  const tempPath = path.join(tempDir, `preview-${timestamp}.tex`);
  
  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(tempPath, previewContent);
    
    return {
      path: tempPath,
      cleanup: async () => {
        try {
          await fs.unlink(tempPath);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error(`Failed to cleanup temporary preview file: ${errorMessage}`);
        }
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to create temporary preview: ${errorMessage}`);
  }
}