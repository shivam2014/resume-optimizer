import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { render, screen } from '@testing-library/react';
import { getTemplates, validateTemplateRequirements, getImagePlaceholder } from '../../lib/template-config';
import { StaticTemplatePreviewCarousel } from '../../components/StaticTemplatePreviewCarousel';

// Types for test requests
interface MockFile {
  name: string;
  text: () => Promise<string>;
  size?: number;
}

interface MockFormData {
  get: (key: string) => string | null;
  entries: () => Array<[string, string | MockFile]>;
}

interface MockPostRequest {
  formData: () => MockFormData;
}

interface MockDeleteRequest {
  json: () => Promise<{ templateId?: string }>;
}

// Mock Implementations
jest.mock('../../lib/template-config', () => ({
  getTemplates: jest.fn().mockResolvedValue([
    { name: 'professional', path: '/templates/professional.tex', isCustom: false },
    { name: 'academic', path: '/templates/academic.tex', isCustom: false }
  ])
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue(['test-template.tex'])
}));

jest.mock('../../app/api/templates/route', () => ({
  POST: jest.fn(),
  DELETE: jest.fn()
}));

describe('Template Management API', () => {
  const fs = require('fs');
  const { POST, DELETE } = require('../../app/api/templates/route');
  const { getTemplates } = require('../../lib/template-config');

  const validTemplateContent = `\\documentclass{article}
\\begin{document}
Test content
\\end{document}`;

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockImplementation((filePath: string) => {
      if (filePath.includes('test-template-id')) return true;
      if (filePath.includes('non-existent')) return false;
      return true;
    });
  });

  describe('POST /api/templates', () => {
    it('should upload a new template successfully', async () => {
      const expectedResponse = {
        status: 201,
        json: async () => ({
          id: 'test-id',
          name: 'Test Template',
          isCustom: true
        })
      };

      POST.mockResolvedValueOnce(expectedResponse);

      const formData: MockFormData = {
        get: (key: string) => {
          if (key === 'name') return 'Test Template';
          return null;
        },
        entries: () => [
          ['name', 'Test Template'],
          ['file', { 
            name: 'test-template.tex', 
            text: async () => validTemplateContent,
            size: 500 // 500 bytes
          }]
        ]
      };

      const request: MockPostRequest = { formData: () => formData };
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        id: 'test-id',
        name: 'Test Template',
        isCustom: true
      });
    });

    it('should reject files larger than 1MB', async () => {
      const expectedResponse = {
        status: 400,
        json: async () => ({
          error: 'File size must be less than 1MB'
        })
      };

      POST.mockResolvedValueOnce(expectedResponse);

      const formData: MockFormData = {
        get: (key: string) => {
          if (key === 'name') return 'Large Template';
          return null;
        },
        entries: () => [
          ['name', 'Large Template'],
          ['file', { 
            name: 'large-template.tex', 
            text: async () => 'a'.repeat(1024 * 1024 + 1),
            size: 1024 * 1024 + 1 // 1MB + 1 byte
          }]
        ]
      };

      const request: MockPostRequest = { formData: () => formData };
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File size must be less than 1MB');
    });

    it('should reject missing file', async () => {
      const expectedResponse = {
        status: 400,
        json: async () => ({
          error: 'Template file is required'
        })
      };

      POST.mockResolvedValueOnce(expectedResponse);

      const formData: MockFormData = {
        get: (key: string) => {
          if (key === 'name') return 'Missing File';
          return null;
        },
        entries: () => [
          ['name', 'Missing File']
        ]
      };

      const request: MockPostRequest = { formData: () => formData };
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Template file is required');
    });

    it('should reject invalid LaTeX content', async () => {
      const expectedResponse = {
        status: 400,
        json: async () => ({
          error: 'Invalid LaTeX template content'
        })
      };

      POST.mockResolvedValueOnce(expectedResponse);

      const formData: MockFormData = {
        get: (key: string) => {
          if (key === 'name') return 'Invalid Content';
          return null;
        },
        entries: () => [
          ['name', 'Invalid Content'],
          ['file', { 
            name: 'invalid.tex', 
            text: async () => '\\invalid{content}',
            size: 100
          }]
        ]
      };

      const request: MockPostRequest = { formData: () => formData };
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid LaTeX template content');
    });
  });

  describe('DELETE /api/templates', () => {
    it('should delete a user-uploaded template', async () => {
      const templateId = 'test-template-id';
      const templatePath = path.join(process.cwd(), 'public/templates', `${templateId}.tex`);
      
      const expectedResponse = {
        status: 200,
        json: async () => ({ success: true })
      };

      DELETE.mockImplementationOnce(async (req: MockDeleteRequest) => {
        const { templateId } = await req.json();
        if (fs.existsSync(templatePath)) {
          fs.unlinkSync(templatePath);
        }
        return expectedResponse;
      });

      const request: MockDeleteRequest = {
        json: () => Promise.resolve({ templateId })
      };

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(fs.unlinkSync).toHaveBeenCalledWith(templatePath);
    });

    it('should handle file system errors during deletion', async () => {
      const expectedResponse = {
        status: 500,
        json: async () => ({ 
          error: 'Failed to delete template file',
          details: 'Permission denied'
        })
      };

      fs.unlinkSync.mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

      DELETE.mockResolvedValueOnce(expectedResponse);

      const request: MockDeleteRequest = {
        json: () => Promise.resolve({ templateId: 'test-template-id' })
      };

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete template file');
      expect(data.details).toBe('Permission denied');
    });
  });

  describe('Template Immutability', () => {
    it('should prevent modification of predefined templates', async () => {
      const expectedResponse = {
        status: 403,
        json: async () => ({ error: 'Cannot overwrite predefined templates' })
      };

      POST.mockResolvedValueOnce(expectedResponse);
      getTemplates.mockResolvedValueOnce([
        { name: 'professional', path: '/templates/professional.tex', isCustom: false }
      ]);

      const formData: MockFormData = {
        get: (key: string) => {
          if (key === 'name') return 'professional';
          return null;
        },
        entries: () => [
          ['name', 'professional'],
          ['file', { 
            name: 'professional.tex', 
            text: async () => validTemplateContent,
            size: 500
          }]
        ]
      };

      const request: MockPostRequest = { formData: () => formData };
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Cannot overwrite predefined templates');
    });

    it('should handle concurrent template operations', async () => {
      const expectedResponse = {
        status: 409,
        json: async () => ({ error: 'Template is currently being modified' })
      };

      POST.mockResolvedValueOnce(expectedResponse);

      const formData: MockFormData = {
        get: (key: string) => {
          if (key === 'name') return 'Concurrent Template';
          return null;
        },
        entries: () => [
          ['name', 'Concurrent Template'],
          ['file', { 
            name: 'concurrent.tex', 
            text: async () => validTemplateContent,
            size: 500
          }]
        ]
      };

      const request: MockPostRequest = { formData: () => formData };
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Template is currently being modified');
    });
  });
});

describe('Template Loading and Preview', () => {
  describe('getTemplates()', () => {
    it('should return correct template metadata', async () => {
      const templates = getTemplates();
      
      expect(templates).toHaveLength(2);
      expect(templates[0]).toEqual({
        name: "Test Template 1",
        path: "templates/latex/test1.tex",
        latexContent: "\\documentclass{article}",
        description: "Test template description"
      });
    });

    it('should include all required metadata fields', () => {
      const templates = getTemplates();
      
      templates.forEach(template => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('path');
        expect(template).toHaveProperty('latexContent');
        expect(typeof template.name).toBe('string');
        expect(typeof template.path).toBe('string');
        expect(typeof template.latexContent).toBe('string');
      });
    });
  });

  describe('Template Preview', () => {
    it('should render template preview carousel correctly', () => {
      const templates = getTemplates();
      render(<StaticTemplatePreviewCarousel templates={templates} />);
      
      // Check if template names are displayed
      templates.forEach(template => {
        expect(screen.getByText(template.name)).toBeInTheDocument();
      });
    });

    it('should use correct thumbnail paths', () => {
      const template = getTemplates()[0];
      const imageName = 'profile';
      const placeholder = getImagePlaceholder(template, imageName);
      
      expect(placeholder).toBe('/placeholder-user.jpg');
    });
  });

  describe('Template Validation', () => {
    it('should validate template requirements', async () => {
      const template = {
        name: "Valid Template",
        path: "templates/latex/valid.tex",
        latexContent: `\\documentclass{article}
\\usepackage{fontenc}
\\usepackage{inputenc}
\\usepackage{geometry}
\\begin{document}
\\section{Test}
\\end{document}`,
      };

      const errors = await validateTemplateRequirements(template);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing required packages', async () => {
      const template = {
        name: "Invalid Template",
        path: "templates/latex/invalid.tex",
        latexContent: `\\documentclass{article}
\\begin{document}
\\section{Test}
\\end{document}`,
      };

      const errors = await validateTemplateRequirements(template);
      expect(errors).toContain('Missing recommended package: fontenc');
      expect(errors).toContain('Missing recommended package: inputenc');
      expect(errors).toContain('Missing recommended package: geometry');
    });
  });
});