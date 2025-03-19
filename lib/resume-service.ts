import { generateText } from "ai"
import { mistral } from "@ai-sdk/mistral"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { deepseek } from "@ai-sdk/deepseek"

// Update the optimizeResume function to use the custom prompt
export async function optimizeResume(
  resumeText: string,
  jobDescription: string,
  provider = "mistral",
  apiKey?: string,
  customPrompt?: string,
): Promise<string> {
  // For demo purposes, we'll simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // In a real app, this would call the AI provider's API
  try {
    if (!apiKey) {
      throw new Error(`${getProviderName(provider)} API key is required`)
    }

    console.log(`Optimizing resume with ${provider} (API key length: ${apiKey.length})`)

    // Create the model with the API key
    const model = getAIModel(provider, apiKey)

    // Use the custom prompt if provided, otherwise use a default prompt
    const promptTemplate =
      customPrompt ||
      `
I need to optimize my resume for a job application. 
Here is my current resume:
---
${resumeText}
---

And here is the job description I'm applying for:
---
${jobDescription}
---

Please rewrite my resume to better match this job description. 
Highlight relevant skills and experience, use appropriate keywords, 
and maintain a professional tone. Keep the same basic structure but 
optimize the content to make me a stronger candidate for this specific role.
`

    // Construct the final prompt with the resume and job description
    const prompt = `
I need to optimize my resume for a job application according to these guidelines:

${promptTemplate}

Here is my current resume:
---
${resumeText}
---

And here is the job description I'm applying for:
---
${jobDescription}
---

Please rewrite my resume to better match this job description following the guidelines above.
`

    // Generate text using the AI model
    const { text } = await generateText({
      model,
      prompt,
      system:
        "You are a professional resume writer with expertise in optimizing resumes for specific job descriptions. Your goal is to help job seekers present their qualifications in the best possible light without fabricating experience or skills.",
    })

    return text
  } catch (error) {
    console.error("Error optimizing resume:", error)
    throw new Error(`Failed to optimize resume: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Update the getAIModel function to better handle the environment variable

function getAIModel(provider: string, apiKey: string) {
  // Ensure the API key is properly formatted (trimmed)
  const formattedApiKey = apiKey.trim()

  // Log the provider and key length for debugging
  console.log(`Creating AI model for ${provider} with API key of length ${formattedApiKey.length}`)

  try {
    switch (provider.toLowerCase()) {
      case "openai":
        return openai("gpt-4o", { apiKey: formattedApiKey })
      case "claude":
        return anthropic("claude-3-5-sonnet-20240620", { apiKey: formattedApiKey })
      case "deepseek":
        return deepseek("deepseek-coder", { apiKey: formattedApiKey })
      case "mistral":
      default:
        // For Mistral, we'll use the environment variable if available
        // This will work with the MISTRAL_API_KEY that's now set in your Vercel project
        return mistral("mistral-large-latest", {
          apiKey: formattedApiKey,
        })
    }
  } catch (error) {
    console.error(`Error creating AI model for ${provider}:`, error)
    throw new Error(
      `Failed to initialize ${getProviderName(provider)} model: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

// Add a helper function to get provider name
function getProviderName(provider: string): string {
  switch (provider.toLowerCase()) {
    case "openai":
      return "OpenAI"
    case "claude":
      return "Anthropic Claude"
    case "deepseek":
      return "DeepSeek AI"
    case "mistral":
    default:
      return "Mistral AI"
  }
}

// In a real app, you would have functions to:
// 1. Convert various file formats to text
// 2. Generate LaTeX from the optimized text
// 3. Convert LaTeX to PDF

