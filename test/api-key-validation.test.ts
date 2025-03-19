import { validateApiKey } from '../lib/api-key-validation';
import * as dotenv from 'dotenv';

/**
 * IMPORTANT: These tests require valid API keys to run.
 * Set the following environment variables before running:
 * - MISTRAL_API_KEY: A valid Mistral API key
 * - INVALID_MISTRAL_KEY: An invalid key for testing error cases
 */

// Load environment variables from .env file
dotenv.config();

describe('API Key Validation', () => {
  const VALID_MISTRAL_KEY = process.env.MISTRAL_API_KEY?.trim() || '';
  const INVALID_KEY = process.env.INVALID_MISTRAL_KEY || 'invalid-key';

  beforeAll(() => {
    if (!VALID_MISTRAL_KEY) {
      console.warn('⚠️ No valid Mistral API key provided. Some tests will be skipped.');
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
      // Force a network error by using a special test key
      const result = await validateApiKey('mistral', 'network-error');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Network error');
    }, 15000);

    it('should reject unknown providers', async () => {
      const result = await validateApiKey('unknown-provider', 'any-key');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain('Unsupported provider');
    });

    it('should handle rate limiting with multiple rapid requests', async () => {
      // Make multiple requests in quick succession to trigger rate limiting
      const requests = Array(12).fill(null).map(() =>
        validateApiKey('mistral', VALID_MISTRAL_KEY || 'test-key')
      );
      
      const results = await Promise.all(requests);
      const rateLimited = results.some(result =>
        result.error?.message.includes('Too many validation attempts')
      );
      
      expect(rateLimited).toBe(true);
    }, 15000);
  });
});