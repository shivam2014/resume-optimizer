import { type } from "os";

export type ApiProvider = "mistral" | "openai" | "claude" | "deepseek";

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateMistralKey(key: string): ValidationResult {
  if (!key) {
    return { isValid: false, error: "API key is required" };
  }

  if (typeof key !== "string") {
    return { isValid: false, error: "API key must be a string" };
  }

  if (!key.startsWith("ms-")) {
    return { isValid: false, error: "Mistral API key must start with 'ms-'" };
  }

  if (!/^ms-[a-zA-Z0-9]{32,}$/.test(key)) {
    const keyLength = key.length - 3; // Subtract 'ms-' prefix
    return {
      isValid: false,
      error: `Invalid Mistral API key format. Expected at least 32 alphanumeric characters after 'ms-', got ${keyLength}`
    };
  }

  return { isValid: true };
}

export function validateOpenAIKey(key: string): ValidationResult {
  if (!key.startsWith("sk-")) {
    return { isValid: false, error: "OpenAI API key must start with 'sk-'" };
  }
  if (!/^sk-[a-zA-Z0-9]{32,}$/.test(key)) {
    return { isValid: false, error: "Invalid OpenAI API key format" };
  }
  return { isValid: true };
}

export function validateClaudeKey(key: string): ValidationResult {
  if (!/^sk-[a-zA-Z0-9]{40,}$/.test(key)) {
    return { isValid: false, error: "Invalid Claude API key format" };
  }
  return { isValid: true };
}

export function validateDeepseekKey(key: string): ValidationResult {
  if (!/^[a-zA-Z0-9]{32,}$/.test(key)) {
    return { isValid: false, error: "Invalid Deepseek API key format" };
  }
  return { isValid: true };
}

export function validateApiKey(key: string, provider: ApiProvider): ValidationResult {
  switch (provider) {
    case "mistral":
      return validateMistralKey(key);
    case "openai":
      return validateOpenAIKey(key);
    case "claude":
      return validateClaudeKey(key);
    case "deepseek":
      return validateDeepseekKey(key);
    default:
      return { isValid: false, error: "Invalid provider" };
  }
}

export async function authenticateKey(key: string, provider: ApiProvider): Promise<ValidationResult> {
  try {
    const validation = validateApiKey(key, provider);
    if (!validation.isValid) {
      return validation;
    }

    // Basic test request to verify the key works
    const endpoint = getProviderEndpoint(provider);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "test" }],
        max_tokens: 5
      })
    });

    if (!response.ok) {
      return { isValid: false, error: `Authentication failed: ${response.statusText}` };
    }

    return { isValid: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { isValid: false, error: `Authentication error: ${errorMessage}` };
  }
}

function getProviderEndpoint(provider: ApiProvider): string {
  switch (provider) {
    case "mistral":
      return "https://api.mistral.ai/v1/chat/completions";
    case "openai":
      return "https://api.openai.com/v1/chat/completions";
    case "claude":
      return "https://api.anthropic.com/v1/messages";
    case "deepseek":
      return "https://api.deepseek.com/v1/chat/completions";
    default:
      throw new Error("Invalid provider");
  }
}