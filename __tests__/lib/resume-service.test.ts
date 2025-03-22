// Jest is automatically available in the test environment
import { 
  extractResumeText,
  optimizeResumeText,
  generateLatexFromTemplate,
  processResume,
  type ApiProvider
} from '../../lib/resume-service';
import { validateApiKey } from '../../lib/api-key-validation';

// Mock external dependencies
jest.mock('../../lib/api-key-validation');
jest.mock('../../lib/logger');

// Mock fetch globally
global.fetch = jest.fn();

describe('Resume Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractResumeText', () => {
    it('should clean and normalize text', async () => {
      const input = 'This is a test  resume!\n@#$% with special chars.';
      const expected = 'This is a test resume with special chars.';
      const result = await extractResumeText(input);
      expect(result).toBe(expected);
    });

    it('should handle empty input', async () => {
      const result = await extractResumeText('');
      expect(result).toBe('');
    });

    it('should throw error on invalid input', async () => {
      await expect(extractResumeText(null as unknown as string))
        .rejects
        .toThrow('Text extraction failed');
    });
  });

  describe('optimizeResumeText', () => {
    const mockParams = {
      resumeText: 'Test resume',
      jobDescription: 'Test job',
      provider: 'openai' as ApiProvider,
      apiKey: 'test-key'
    };

    const mockApiResponse = {
      choices: [{
        message: {
          content: 'Optimized resume content'
        }
      }]
    };

    beforeEach(() => {
      (validateApiKey as jest.Mock).mockResolvedValue({ isValid: true });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });
    });

    it('should optimize resume text successfully', async () => {
      const result = await optimizeResumeText(mockParams);
      
      expect(result).toEqual({
        optimizedText: 'Optimized resume content',
        improvements: [],
        score: 0
      });
      
      expect(validateApiKey).toHaveBeenCalledWith(mockParams.provider, mockParams.apiKey);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should throw error on API key validation failure', async () => {
      (validateApiKey as jest.Mock).mockResolvedValue({ 
        isValid: false, 
        error: new Error('Invalid API key') 
      });

      await expect(optimizeResumeText(mockParams))
        .rejects
        .toThrow('Validation failed');
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Server Error'
      });

      await expect(optimizeResumeText(mockParams))
        .rejects
        .toThrow('Resume optimization failed: response.text is not a function');
    });
  });

  describe('generateLatexFromTemplate', () => {
    it('should generate LaTeX content with template', async () => {
      const optimizedText = 'Test resume content';
      const template = 'basic';
      const result = await generateLatexFromTemplate(optimizedText, template);
      
      expect(result).toContain('\\documentclass{article}');
      expect(result).toContain(optimizedText);
      expect(result).toContain('\\end{document}');
    });

    it('should return plain text when no template is provided', async () => {
      const optimizedText = 'Test resume content';
      const result = await generateLatexFromTemplate(optimizedText);
      
      expect(result).toBe(optimizedText);
    });

    it('should handle invalid input gracefully', async () => {
      const nullInput = null as unknown as string;
      const result = await generateLatexFromTemplate(nullInput);
      expect(result).toBe(nullInput);
    });

    it('should handle errors in LaTeX generation', async () => {
      const mockTemplate = Symbol('invalid') as unknown as string; // Use Symbol to force type coercion error
      await expect(generateLatexFromTemplate('test', mockTemplate))
        .rejects
        .toThrow('LaTeX generation failed: Cannot convert a Symbol value to a string');
    });
  });

  describe('processResume', () => {
    const mockParams = {
      resumeText: 'Original resume text',
      jobDescription: 'Job description',
      provider: 'openai' as ApiProvider,
      apiKey: 'test-key',
      template: 'basic'
    };

    beforeEach(() => {
      (validateApiKey as jest.Mock).mockResolvedValue({ isValid: true });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: 'Optimized content'
            }
          }]
        })
      });
    });

    it('should process resume with all steps', async () => {
      const result = await processResume(mockParams);

      expect(result).toEqual({
        extractedText: 'Original resume text',
        optimizedText: 'Optimized content',
        latexContent: expect.stringContaining('\\documentclass{article}')
      });
    });

    it('should process resume without template', async () => {
      const result = await processResume({
        ...mockParams,
        template: undefined
      });

      expect(result).toEqual({
        extractedText: 'Original resume text',
        optimizedText: 'Optimized content',
        latexContent: undefined
      });
    });

    it('should handle errors in the workflow', async () => {
      (validateApiKey as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(processResume(mockParams))
        .rejects
        .toThrow('Resume processing failed');
    });
  });
});