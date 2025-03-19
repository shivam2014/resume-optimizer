import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateApiKey } from "@/lib/api-key-validation";
import { optimizeResume, type ApiProvider } from "@/lib/resume-service";
import { Logger } from "@/lib/logger";

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

const OptimizeRequestSchema = z.object({
  resumeText: z.string().min(1, "Resume text is required"),
  jobDescription: z.string().min(1, "Job description is required"),
  provider: z.enum(["mistral", "openai", "claude", "deepseek"] as const),
  apiKey: z.string().min(1, "API key is required"),
});

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  return "127.0.0.1";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  // Clean up old records
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
    }
  }

  if (!record) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, reset: now + RATE_LIMIT_WINDOW };
  }

  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, reset: now + RATE_LIMIT_WINDOW };
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, reset: record.timestamp + RATE_LIMIT_WINDOW };
  }

  record.count += 1;
  return { 
    allowed: true, 
    remaining: MAX_REQUESTS - record.count,
    reset: record.timestamp + RATE_LIMIT_WINDOW
  };
}

export async function POST(request: NextRequest) {
  const logger = new Logger("api/optimize");
  
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const { allowed, remaining, reset } = checkRateLimit(ip);
    
    if (!allowed) {
      logger.warn("Rate limit exceeded", { ip });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          }
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = OptimizeRequestSchema.safeParse(body);

    if (!result.success) {
      logger.error("Validation error", { errors: result.error.flatten() });
      return NextResponse.json(
        { error: "Invalid request", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { resumeText, jobDescription, provider, apiKey } = result.data;

    // Validate API key
    const keyValidation = await validateApiKey(provider as ApiProvider, apiKey);
    if (!keyValidation.isValid) {
      logger.error("Invalid API key", { provider, error: keyValidation.error?.message });
      return NextResponse.json(
        { error: keyValidation.error?.message },
        { status: 401 }
      );
    }

    // Optimize resume
    const optimizedResume = await optimizeResume({
      resumeText,
      jobDescription,
      provider: provider as ApiProvider,
      apiKey,
    });

    logger.info("Resume optimization successful", { provider });
    return NextResponse.json({ 
      result: optimizedResume,
    }, {
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Unexpected error", { error: errorMessage });
    
    return NextResponse.json(
      { error: "Internal server error", message: errorMessage },
      { status: 500 }
    );
  }
}