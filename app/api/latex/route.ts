import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { content, template } = await req.json();

    if (!content || !template) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Read the template
    const templateContent = readFileSync(template, "utf-8");

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), "temp");
    await mkdir(tempDir, { recursive: true });

    // Create unique filename for this request
    const timestamp = Date.now();
    const texFile = path.join(tempDir, `resume_${timestamp}.tex`);
    const pdfFile = path.join(tempDir, `resume_${timestamp}.pdf`);

    // Insert content into template
    // This is a simple replacement - you may need to adjust based on your template structure
    const finalContent = templateContent.replace("%RESUME_CONTENT%", content);

    // Write the TeX file
    await writeFile(texFile, finalContent);

    // Run pdflatex twice to resolve references
    await execAsync(`pdflatex -output-directory ${tempDir} ${texFile}`);
    await execAsync(`pdflatex -output-directory ${tempDir} ${texFile}`);

    // Read the generated PDF
    const pdfContent = readFileSync(pdfFile);

    // Clean up temp files
    await execAsync(`rm ${tempDir}/resume_${timestamp}.*`);

    // Return the PDF
    return new NextResponse(pdfContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"'
      }
    });

  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

