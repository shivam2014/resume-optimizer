import { validateApiKey } from '../lib/api-key-validation';
import { Logger } from '../lib/logger';
import * as dotenv from 'dotenv';

/**
 * IMPORTANT: These tests require valid API keys to run.
 * Set the following environment variables before running:
 * - MISTRAL_API_KEY: A valid Mistral API key
 * - INVALID_MISTRAL_KEY: An invalid key for testing error cases
 */

// Load environment variables from .env file
dotenv.config();

// Mock the rate limiter
jest.mock('limiter', () => ({
  RateLimiter: jest.fn().mockImplementation(() => ({
    tryRemoveTokens: jest.fn().mockResolvedValue(true)
  }))
}));

describe('API Key Validation', () => {
  const VALID_MISTRAL_KEY = process.env.MISTRAL_API_KEY?.trim() || '';
  const INVALID_KEY = process.env.INVALID_MISTRAL_KEY || 'invalid-key';

  // Store original fetch
  const originalFetch = global.fetch;

  beforeAll(() => {
    // Ensure fetch is available in test environment
    if (!global.fetch) {
      global.fetch = jest.fn();
    }
    if (!VALID_MISTRAL_KEY) {
      console.warn('⚠️ No valid Mistral API key provided. Some tests will be skipped.');
    }
  });

  afterAll(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    // Clear mock implementations before each test
    if (jest.isMockFunction(global.fetch)) {
      (global.fetch as jest.Mock).mockClear();
    }
  });

  describe('validateApiKey', () => {
    it('should validate a correct Mistral API key', async () => {
      if (!VALID_MISTRAL_KEY) {
        console.warn('Skipping test: no valid Mistral API key provided');
        return;
      }

      const result = await validateApiKey('mistral', VALID_MISTRAL_KEY);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    }, 15000);

    it('should reject an invalid API key', async () => {
      const result = await validateApiKey('mistral', INVALID_KEY);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid API key');
    }, 15000);

    it('should handle network errors with non-existent endpoint', async () => {
      const result = await validateApiKey('mistral', 'network-error');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Network error');
    }, 15000);

    it('should validate OpenAI key', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test: no OpenAI API key provided');
        return;
      }
      const result = await validateApiKey('openai', process.env.OPENAI_API_KEY);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    }, 15000);

    it('should validate Claude key', async () => {
      if (!process.env.CLAUDE_API_KEY) {
        console.warn('Skipping test: no Claude API key provided');
        return;
      }
      const result = await validateApiKey('claude', process.env.CLAUDE_API_KEY);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    }, 15000);

    it('should validate DeepSeek key', async () => {
      if (!process.env.DEEPSEEK_API_KEY) {
        console.warn('Skipping test: no DeepSeek API key provided');
        return;
      }
      const result = await validateApiKey('deepseek', process.env.DEEPSEEK_API_KEY);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    }, 15000);

    it('should handle unexpected errors', async () => {
      // Override the validateMistralKey function to throw
      const mockResponse = new Response(null, { status: 500 });
      jest.spyOn(global, 'fetch').mockImplementationOnce(() => Promise.resolve(mockResponse));

      const result = await validateApiKey('mistral', 'test-key');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain('Invalid API key for mistral');
    });

    it('should handle different types of network errors', async () => {
      // Test network error with special test key
      let result = await validateApiKey('mistral', 'network-error');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain('Network error');

      // Test server error
      const errorResponse = new Response('Service Unavailable', { status: 503 });
      jest.spyOn(global, 'fetch').mockImplementationOnce(() => Promise.resolve(errorResponse));
      
      result = await validateApiKey('mistral', 'test-key');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain('Invalid API key for mistral');
    });

    it('should reject unknown providers', async () => {
      const result = await validateApiKey('unknown-provider', 'any-key');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain('Unsupported provider');
    });

    it('should handle rate limiting with multiple rapid requests', async () => {
      // Override rate limiter mock for this test
      jest.resetModules();
      jest.mock('limiter', () => ({
        RateLimiter: jest.fn().mockImplementation(() => ({
          tryRemoveTokens: jest.fn()
            .mockResolvedValueOnce(true)  // First request succeeds
            .mockResolvedValue(false)      // Subsequent requests fail
        }))
      }));

      // Reimport to get the new mock
      const { validateApiKey } = require('../lib/api-key-validation');

      // Make two requests - first should succeed, second should be rate limited
      const result1 = await validateApiKey('mistral', 'test-key');
      const result2 = await validateApiKey('mistral', 'test-key');

      expect(result1.isValid).toBe(false); // Still invalid key, but not rate limited
      expect(result2.error?.message).toContain('Too many validation attempts');

      // Reset modules for other tests
      jest.resetModules();
    }, 15000);

    describe('Logger integration', () => {
      beforeEach(() => {
        // Mock the rate limiter to always allow
        jest.mock('limiter', () => ({
          RateLimiter: jest.fn().mockImplementation(() => ({
            tryRemoveTokens: jest.fn().mockResolvedValue(true)
          }))
        }));
      });

      afterEach(() => {
        jest.resetModules();
      });

      it('should use logger for different validation scenarios', async () => {
        // Setup logger mocks
        const loggerInfoSpy = jest.spyOn(Logger.prototype, 'info').mockImplementation();
        const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
        const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

        // Test successful validation
        jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
          Promise.resolve(new Response('{}', { status: 200 }))
        );
        const result = await validateApiKey('openai', 'valid-key');
        expect(result.isValid).toBe(true);
        expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('API key validation'), expect.any(Object));

        // Test failed validation
        jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
          Promise.resolve(new Response('Unauthorized', { status: 401 }))
        );
        const failedResult = await validateApiKey('openai', 'invalid-key');
        expect(failedResult.isValid).toBe(false);
        expect(loggerWarnSpy).toHaveBeenCalled();

        // Test network error
        const networkResult = await validateApiKey('mistral', 'network-error');
        expect(networkResult.isValid).toBe(false);
        expect(loggerErrorSpy).toHaveBeenCalled();

        // Cleanup
        jest.restoreAllMocks();
      });
    });

    it('should handle non-Error validation failures', async () => {
      // Reset modules to get fresh instance
      jest.resetModules();

      // Mock the module with a throwing validateMistralKey
      jest.mock('../lib/api-key-validation', () => ({
        ...jest.requireActual('../lib/api-key-validation'),
        validateMistralKey: jest.fn().mockImplementation(() => {
          throw { toString: () => 'Unknown error' };
        })
      }));

      // Import the mocked module
      const { validateApiKey: mockedValidateApiKey } = require('../lib/api-key-validation');

      const result = await mockedValidateApiKey('mistral', 'test-key');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe(`Invalid API key for mistral`);

      // Reset modules for other tests
      jest.resetModules();
      jest.clearAllMocks();
    });

    it('should handle validation errors without error message', async () => {
      // Mock a validation function to throw an Error without message
      jest.spyOn(global, 'fetch').mockImplementationOnce(() => {
        throw new Error();
      });

      const result = await validateApiKey('mistral', 'test-key');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Invalid API key for mistral');
    });

    describe('Provider-specific validation', () => {
      it('should handle OpenAI validation errors', async () => {
        const errorResponse = new Response('Unauthorized', { status: 401 });
        jest.spyOn(global, 'fetch').mockImplementationOnce(() => Promise.resolve(errorResponse));
        const result = await validateApiKey('openai', 'test-key');
        expect(result.isValid).toBe(false);
      });

      it('should handle Claude validation errors', async () => {
        const errorResponse = new Response('Unauthorized', { status: 401 });
        jest.spyOn(global, 'fetch').mockImplementationOnce(() => Promise.resolve(errorResponse));
        const result = await validateApiKey('claude', 'test-key');
        expect(result.isValid).toBe(false);
      });

      it('should handle DeepSeek validation errors', async () => {
        const errorResponse = new Response('Unauthorized', { status: 401 });
        jest.spyOn(global, 'fetch').mockImplementationOnce(() => Promise.resolve(errorResponse));
        const result = await validateApiKey('deepseek', 'test-key');
        expect(result.isValid).toBe(false);
      });

      it('should handle server errors consistently across providers', async () => {
        // Mock fetch to return 500 error for all providers
        const errorResponse = new Response('Internal Server Error', { status: 500 });
        jest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve(errorResponse));

        // Test multiple providers in sequence to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100)); // Delay to avoid rate limit
        const result1 = await validateApiKey('openai', 'test-key');
        expect(result1.isValid).toBe(false);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        const result2 = await validateApiKey('claude', 'test-key');
        expect(result2.isValid).toBe(false);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        const result3 = await validateApiKey('deepseek', 'test-key');
        expect(result3.isValid).toBe(false);
      });
    });
  });
});