import path from 'path';
import { Dirent } from 'fs';
import fs from 'fs/promises';
import { 
  loadTemplate, 
  listAvailableTemplates, 
  transformTemplateContent, 
  validateLatexTemplate 
} from '../../lib/latex-template-handlers';
import { TemplateMetadata } from '../../lib/template-config';

// Mock fs promises
jest.mock('fs/promises');
const mockedFs = jest.mocked(fs);

describe('LaTeX Template Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadTemplate', () => {
    const sampleLatexContent = `
\\documentclass{article}
\\usepackage{fontenc}
\\usepackage{inputenc}
\\usepackage{geometry}
\\begin{document}
\\section{Test}
\\end{document}`;

    beforeEach(() => {
      mockedFs.readFile.mockResolvedValue(sampleLatexContent);
    });

    it('should load a template successfully', async () => {
      const templatePath = 'templates/latex/test-template.tex';
      const template = await loadTemplate(templatePath);

      expect(template).toMatchObject({
        name: 'test-template',
        path: templatePath,
        latexContent: sampleLatexContent,
        customPackages: ['fontenc', 'inputenc', 'geometry']
      });
    });

    it('should handle file read errors', async () => {
      mockedFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(loadTemplate('nonexistent.tex'))
        .rejects
        .toThrow('Failed to load template');
    });

    it('should extract custom packages correctly', async () => {
      const contentWithPackages = `
\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\usepackage[T1]{fontenc}
\\begin{document}
\\end{document}`;

      mockedFs.readFile.mockResolvedValue(contentWithPackages);
      const template = await loadTemplate('test.tex');

      expect(template.customPackages).toContain('inputenc');
      expect(template.customPackages).toContain('geometry');
      expect(template.customPackages).toContain('fontenc');
    });
  });

  describe('listAvailableTemplates', () => {
    it('should list all .tex files in templates directory', async () => {
      const createDirent = (name: string, isFile: boolean): Dirent => ({
        name,
        isFile: () => isFile,
        isDirectory: () => !isFile,
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isSymbolicLink: () => false,
        isFIFO: () => false,
        isSocket: () => false,
        parentPath: 'templates/latex',
        path: path.join('templates/latex', name)
      });

      const mockDirents = [
        createDirent('template1.tex', true),
        createDirent('template2.tex', true),
        createDirent('other.txt', true)
      ];

      mockedFs.readdir.mockResolvedValue(mockDirents);

      const templates = await listAvailableTemplates();

      expect(templates).toContain('template1.tex');
      expect(templates).toContain('template2.tex');
      expect(templates).not.toContain('other.txt');
    });

    it('should handle directory read errors', async () => {
      mockedFs.readdir.mockRejectedValue(new Error('Directory not found'));

      await expect(listAvailableTemplates())
        .rejects
        .toThrow('Failed to list available templates');
    });
  });

  describe('transformTemplateContent', () => {
    const sampleTemplate: TemplateMetadata = {
      name: 'Test Template',
      path: 'templates/latex/test.tex',
      latexContent: `
\\documentclass{article}
\\usepackage{fontenc}
\\begin{document}
\\section{Test}
\\end{document}`,
      requiredFonts: ['someFont'],
      customPackages: ['geometry']
    };

    it('should transform content and add font warnings', async () => {
      const content = '\\section{Test Content}';
      const transformed = await transformTemplateContent(sampleTemplate, content);

      expect(transformed).toContain('Warning: Template requires someFont');
      expect(transformed).toContain('\\section{Test Content}');
    });

    it('should handle image placeholders', async () => {
      const contentWithImage = '\\includegraphics{test.jpg}';
      const templateWithImages: TemplateMetadata = {
        ...sampleTemplate,
        imagePlaceholders: {
          'test.jpg': '/placeholder.jpg'
        }
      };

      const transformed = await transformTemplateContent(templateWithImages, contentWithImage);
      expect(transformed).toContain('\\includegraphics{/placeholder.jpg}');
    });
  });

  describe('validateLatexTemplate', () => {
    it('should validate a correct template', async () => {
      const validTemplate: TemplateMetadata = {
        name: 'Valid Template',
        path: 'test.tex',
        latexContent: `
\\documentclass{article}
\\usepackage{fontenc}
\\usepackage{inputenc}
\\usepackage{geometry}
\\begin{document}
\\section{Test}
\\end{document}`
      };

      const result = await validateLatexTemplate(validTemplate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required elements', async () => {
      const invalidTemplate: TemplateMetadata = {
        name: 'Invalid Template',
        path: 'test.tex',
        latexContent: '\\section{Test}'
      };

      const result = await validateLatexTemplate(invalidTemplate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing document class declaration');
      expect(result.errors).toContain('Missing document environment');
    });

    it('should warn about missing recommended packages', async () => {
      const templateWithMissingPackages: TemplateMetadata = {
        name: 'Template',
        path: 'test.tex',
        latexContent: `
\\documentclass{article}
\\begin{document}
\\end{document}`
      };

      const result = await validateLatexTemplate(templateWithMissingPackages);
      expect(result.warnings).toContain('Missing recommended package: fontenc');
      expect(result.warnings).toContain('Missing recommended package: inputenc');
      expect(result.warnings).toContain('Missing recommended package: geometry');
    });
  });
});