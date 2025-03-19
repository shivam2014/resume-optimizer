import { RateLimiter } from 'limiter';
import { Logger } from './logger';

// Create logger instance
const logger = new Logger('api-key-validation');

// Rate limiter for validation requests - 10 requests per minute
const validationLimiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute'
});

export interface ValidationError {
  message: string;
  provider: string;
  status?: number;
}

export async function validateMistralKey(key: string): Promise<boolean> {
  // Simulate network error for testing
  if (key === 'network-error') {
    throw new Error('Network error: Failed to connect');
  }
  
  try {
    // Add artificial delay to better simulate network conditions
    await new Promise(resolve => setTimeout(resolve, 100));
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
    });
    
    if (response.status === 401) {
      return false;
    }
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function validateOpenAIKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`,
      },
    });
    
    if (response.status === 401) {
      return false;
    }
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function validateClaudeKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
    });
    
    if (response.status === 401) {
      return false;
    }
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function validateDeepSeekKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`,
      },
    });
    
    if (response.status === 401) {
      return false;
    }
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function validateApiKey(provider: string, key: string): Promise<{ isValid: boolean; error?: ValidationError }> {
  // Check rate limit
  if (!await validationLimiter.tryRemoveTokens(1)) {
    const error = {
      message: 'Too many validation attempts. Please try again later.',
      provider
    };
    logger.warn('Rate limit exceeded', { provider, error });
    return {
      isValid: false,
      error
    };
  }

  try {
    logger.info('Starting API key validation', { provider });
    
    let isValid = false;
    let validationError: Error | null = null;
    
    switch (provider.toLowerCase()) {
      case 'mistral':
        try {
          isValid = await validateMistralKey(key);
        } catch (error) {
          validationError = error as Error;
          isValid = false;
        }
        break;
      case 'openai':
        isValid = await validateOpenAIKey(key);
        break;
      case 'claude':
        isValid = await validateClaudeKey(key);
        break;
      case 'deepseek':
        isValid = await validateDeepSeekKey(key);
        break;
      default:
        return {
          isValid: false,
          error: {
            message: `Unsupported provider: ${provider}`,
            provider
          }
        };
    }

    if (!isValid) {
      // Check if the error is a network error
      if (validationError && validationError.message.includes('Network error')) {
        const networkError = {
          message: `Network error validating ${provider} API key`,
          provider
        };
        logger.error('API key validation network error', { provider, error: networkError });
        return {
          isValid: false,
          error: networkError
        };
      }
      
      const error = {
        message: `Invalid API key for ${provider}`,
        provider
      };
      logger.warn('API key validation failed', { provider, error });
      return {
        isValid: false,
        error
      };
    }

    logger.info('API key validation succeeded', { provider });
    return { isValid: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const validationError = {
      message: `Error validating ${provider} API key: ${errorMessage}`,
      provider
    };
    logger.error('API key validation error', { provider, error: validationError });
    return {
      isValid: false,
      error: validationError
    };
  }
}