import { NextRequest, NextResponse } from "next/server";
import { processResume, ProcessingResult } from "@/lib/resume-service";
import { Logger } from "@/lib/logger";

const logger = new Logger("api-optimize");

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { resumeText, jobDescription, provider, apiKey, template } = body;

    if (!resumeText || !jobDescription || !provider || !apiKey) {
      logger.error("Missing required fields in request", {
        hasResumeText: !!resumeText,
        hasJobDescription: !!jobDescription,
        hasProvider: !!provider,
        hasApiKey: !!apiKey,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Process the resume
    const result: ProcessingResult = await processResume({
      resumeText,
      jobDescription,
      provider,
      apiKey,
      template,
    });

    logger.info("Resume optimization successful");
    return NextResponse.json({ result });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Resume optimization failed", { error: errorMessage });
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}