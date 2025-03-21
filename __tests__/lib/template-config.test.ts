import { execFile, ChildProcess, ExecFileException, ExecFileOptions } from 'node:child_process';
import {
  getTemplates,
  getImagePlaceholder,
  validateTemplateRequirements,
  TemplateMetadata
} from '../../lib/template-config';

// Mock the modules
jest.mock('node:child_process');
jest.mock('node:util', () => ({
  ...jest.requireActual('node:util'),
  promisify: (fn: any) => fn
}));

const mockExecFile = jest.mocked(execFile);

describe('Template Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTemplates = [
    {
      name: 'Test Template 1',
      path: 'templates/latex/test1.tex',
      latexContent: '\\documentclass{article}',
      description: 'Test template description'
    },
    {
      name: 'Test Template 2',
      path: 'templates/latex/test2.tex',
      latexContent: '\\documentclass{article}',
      description: 'Test template description'
    }
  ];

  // Mock the getTemplates function
  jest.mock('../../lib/template-config', () => ({
    ...jest.requireActual('../../lib/template-config'),
    getTemplates: jest.fn(() => mockTemplates)
  }));

  describe('getTemplates()', () => {
    it('should return an array of template metadata', () => {
      const templates = getTemplates();
      expect(templates).toEqual(mockTemplates);
    });

    it('should have valid template paths starting with templates/latex/', () => {
      const templates = getTemplates();
      templates.forEach(template => {
        expect(template.path).toMatch(/^templates\/latex\/.*\.tex$/);
      });
    });

    it('should have required properties for each template', () => {
      const templates = getTemplates();
      templates.forEach(template => {
        expect(template).toMatchObject({
          name: expect.any(String),
          path: expect.any(String),
          latexContent: expect.any(String),
          description: expect.any(String)
        });
      });
    });
  });

  describe('getImagePlaceholder()', () => {
    const mockTemplate: TemplateMetadata = {
      name: "Test Template",
      path: "templates/latex/test.tex",
      latexContent: "",
      imagePlaceholders: {
        "test.jpg": "/custom-placeholder.jpg"
      }
    };

    it('should return custom placeholder when defined', () => {
      const result = getImagePlaceholder(mockTemplate, "test.jpg");
      expect(result).toBe("/custom-placeholder.jpg");
    });

    it('should return default placeholder when image not found', () => {
      const result = getImagePlaceholder(mockTemplate, "nonexistent.jpg");
      expect(result).toBe("/placeholder-user.jpg");
    });

    it('should return default placeholder when template has no placeholders', () => {
      const templateWithoutPlaceholders: TemplateMetadata = {
        name: "Test Template",
        path: "templates/latex/test.tex",
        latexContent: ""
      };
      
      const result = getImagePlaceholder(templateWithoutPlaceholders, "test.jpg");
      expect(result).toBe("/placeholder-user.jpg");
    });
  });

  describe('validateTemplateRequirements()', () => {
    it('should validate fonts and packages when both are required', async () => {
      const template: TemplateMetadata = {
        name: "Test Template",
        path: "templates/latex/test.tex",
        latexContent: `\\documentclass{article}
\\usepackage{fontenc}
\\usepackage{inputenc}
\\usepackage{geometry}
\\begin{document}
\\end{document}`,
        requiredFonts: ["FiraSans"],
        customPackages: ["fontawesome"]
      };

      mockExecFile
        // Mock successful font check
        .mockImplementationOnce((cmd, args, opts, callback) => {
          if (callback) {
            callback(null, 'FiraSans', '');
          }
          return Promise.resolve({ stdout: 'FiraSans', stderr: '' }) as any;
        })
        // Mock successful package check
        .mockImplementationOnce((cmd, args, opts, callback) => {
          if (callback) {
            callback(null, '/usr/share/texmf/tex/latex/fontawesome.sty', '');
          }
          return Promise.resolve({ stdout: '/usr/share/texmf/tex/latex/fontawesome.sty', stderr: '' }) as any;
        });

      const errors = await validateTemplateRequirements(template);
      expect(errors).toHaveLength(0);
      expect(mockExecFile).toHaveBeenCalledTimes(2);
      expect(mockExecFile).toHaveBeenCalledWith('fc-list', [], { encoding: 'utf-8' });
      expect(mockExecFile).toHaveBeenCalledWith('kpsewhich', ['fontawesome.sty'], { encoding: 'utf-8' });
    });

    it('should return errors when fonts are missing', async () => {
      const template: TemplateMetadata = {
        name: "Test Template",
        path: "templates/latex/test.tex",
        latexContent: "",
        requiredFonts: ["MissingFont"]
      };

      mockExecFile.mockImplementationOnce((cmd, args, opts, callback) => {
        if (callback) {
          callback(null, '', '');
        }
        return Promise.resolve({ stdout: '', stderr: '' }) as any;
      });

      const errors = await validateTemplateRequirements(template);
      expect(errors).toContain('Required font not installed: MissingFont');
      expect(mockExecFile).toHaveBeenCalledTimes(1);
      expect(mockExecFile).toHaveBeenCalledWith('fc-list', [], { encoding: 'utf-8' });
    });

    it('should return errors when packages are missing', async () => {
      const template: TemplateMetadata = {
        name: "Test Template",
        path: "templates/latex/test.tex",
        latexContent: "",
        customPackages: ["missing-package"]
      };

      const error = new Error('Command failed') as ExecFileException;
      error.code = 1;

      mockExecFile.mockImplementationOnce((cmd, args, opts, callback) => {
        if (callback) {
          callback(error, '', '');
        }
        return Promise.reject(error) as any;
      });

      const errors = await validateTemplateRequirements(template);
      expect(errors).toContain('Required LaTeX package not installed: missing-package');
      expect(mockExecFile).toHaveBeenCalledTimes(1);
      expect(mockExecFile).toHaveBeenCalledWith('kpsewhich', ['missing-package.sty'], { encoding: 'utf-8' });
    });
  });
});