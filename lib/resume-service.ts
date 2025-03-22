import { validateApiKey } from "./api-key-validation";
import { Logger } from "./logger";

export type ApiProvider = "mistral" | "openai" | "claude" | "deepseek";

export interface ProcessingResult {
  extractedText: string;
  optimizedText: string;
  latexContent?: string;
}

interface ResumeProcessingParams {
  resumeText: string;
  jobDescription: string;
  provider: ApiProvider;
  apiKey: string;
  template?: string;
}

interface OptimizeResumeParams {
  resumeText: string;
  jobDescription: string;
  provider: ApiProvider;
  apiKey: string;
}

interface OptimizationResult {
  optimizedText: string;
  improvements: string[];
  score: number;
}

const logger = new Logger("resume-service");

export async function extractResumeText(text: string): Promise<string> {
  try {
    logger.info("Starting text extraction");
    // Remove any special characters and normalize whitespace
    const cleanedText = text
      .replace(/[^\w\s.,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    logger.info("Text extraction completed");
    return cleanedText;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Text extraction failed", { error: errorMessage });
    throw new Error(`Text extraction failed: ${errorMessage}`);
  }
}

export async function optimizeResumeText({
  resumeText,
  jobDescription,
  provider,
  apiKey,
}: OptimizeResumeParams): Promise<OptimizationResult> {
  try {
    // Validate API key
    const validationResult = await validateApiKey(provider, apiKey);
    if (!validationResult.isValid) {
      logger.error("API key validation failed", { provider, error: validationResult.error });
      throw new Error(`Validation failed: ${validationResult.error?.message}`);
    }

    logger.info("Starting resume optimization", { provider });

    const endpoint = getProviderEndpoint(provider);
    const modelParams = getModelParameters(provider);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...modelParams,
        messages: [
          {
            role: "system",
            content: "You are an expert resume optimizer. Analyze and improve the resume based on the job description.",
          },
          {
            role: "user",
            content: `Job Description: ${jobDescription}\n\nResume: ${resumeText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error("API request failed", { provider, status: response.status, error });
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const result = processProviderResponse(data, provider);
    
    logger.info("Resume optimization completed", { provider });
    return result;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Resume optimization failed", { error: errorMessage });
    throw new Error(`Resume optimization failed: ${errorMessage}`);
  }
}

export async function generateLatexFromTemplate(
  optimizedText: string,
  template?: string
): Promise<string> {
  try {
    logger.info("Starting LaTeX generation");
    
    if (!template) {
      logger.info("No template provided, using default template");
      return optimizedText; // Return plain text if no template is provided
    }

    // Basic LaTeX template implementation
    const latexContent = `
\\documentclass{article}
\\begin{document}
${optimizedText}
\\end{document}`;

    logger.info("LaTeX generation completed");
    return latexContent;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("LaTeX generation failed", { error: errorMessage });
    throw new Error(`LaTeX generation failed: ${errorMessage}`);
  }
}

export async function processResume({
  resumeText,
  jobDescription,
  provider,
  apiKey,
  template,
}: ResumeProcessingParams): Promise<ProcessingResult> {
  try {
    logger.info("Starting resume processing workflow");

    // Step 1: Extract text
    const extractedText = await extractResumeText(resumeText);
    
    // Step 2: Optimize the resume
    const { optimizedText } = await optimizeResumeText({
      resumeText: extractedText,
      jobDescription,
      provider,
      apiKey,
    });

    // Step 3: Generate LaTeX if template is provided
    const latexContent = template 
      ? await generateLatexFromTemplate(optimizedText, template)
      : undefined;

    logger.info("Resume processing workflow completed");

    return {
      extractedText,
      optimizedText,
      latexContent,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Resume processing workflow failed", { error: errorMessage });
    throw new Error(`Resume processing failed: ${errorMessage}`);
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

function getModelParameters(provider: ApiProvider): Record<string, unknown> {
  switch (provider) {
    case "mistral":
      return {
        model: "mistral-large-latest",
        temperature: 0.7,
        max_tokens: 2000,
      };
    case "openai":
      return {
        model: "gpt-4-turbo-preview",
        temperature: 0.7,
        max_tokens: 2000,
      };
    case "claude":
      return {
        model: "claude-3-opus-20240229",
        max_tokens: 2000,
      };
    case "deepseek":
      return {
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: 2000,
      };
    default:
      throw new Error("Invalid provider");
  }
}

function processProviderResponse(
  data: any,
  provider: ApiProvider
): OptimizationResult {
  try {
    const content = extractContentFromResponse(data, provider);
    
    return {
      optimizedText: content,
      improvements: [], // TODO: Extract specific improvements
      score: 0, // TODO: Implement scoring system
    };
  } catch (error) {
    logger.error("Failed to process provider response", { provider, error });
    throw new Error("Failed to process optimization result");
  }
}

function extractContentFromResponse(data: any, provider: ApiProvider): string {
  switch (provider) {
    case "mistral":
    case "openai":
    case "deepseek":
      return data.choices[0].message.content;
    case "claude":
      return data.content[0].text;
    default:
      throw new Error("Invalid provider");
  }
}
