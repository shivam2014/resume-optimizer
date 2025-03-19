import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templatePath = searchParams.get('path');

    if (!templatePath) {
      return NextResponse.json({ error: 'Template path is required' }, { status: 400 });
    }

    // Ensure the path is within the templates directory
    const fullPath = path.join(process.cwd(), templatePath);
    if (!fullPath.startsWith(path.join(process.cwd(), 'templates'))) {
      return NextResponse.json({ error: 'Invalid template path' }, { status: 400 });
    }

    const templateContent = readFileSync(fullPath, 'utf-8');
    return new NextResponse(templateContent, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error reading template:', error);
    return NextResponse.json({ error: 'Failed to read template' }, { status: 500 });
  }
}