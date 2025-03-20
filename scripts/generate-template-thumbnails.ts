import latex from 'node-latex';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { createTemporaryPreview } from '../lib/preview-template-generator';
import { templateConfig, validateTemplateRequirements } from '../lib/template-config';

const TEMPLATES_DIR = path.join(process.cwd(), 'templates', 'latex');
const THUMBNAILS_DIR = path.join(process.cwd(), 'public', 'templates', 'thumbnails');
const TEMP_DIR = path.join(process.cwd(), 'temp');
const REGULAR_WIDTH = 600;
const RETINA_WIDTH = REGULAR_WIDTH * 2;
const MAX_RETRIES = 3;

interface PrerequisiteCheck {
  name: string;
  check: () => Promise<boolean>;
  errorMessage: string;
}

async function checkPrerequisites(): Promise<boolean> {
  try {
    console.log('Checking prerequisites...');

    // Define prerequisite checks
    const checks: PrerequisiteCheck[] = [
      {
        name: 'LaTeX Installation',
        check: async () => {
          try {
            await new Promise((resolve, reject) => {
              const child = require('child_process').exec('pdflatex --version');
              child.on('exit', (code: number | null) => code === 0 ? resolve(true) : reject());
              child.on('error', reject);
            });
            return true;
          } catch {
            return false;
          }
        },
        errorMessage: 'LaTeX (pdflatex) is not installed or not in PATH'
      },
      {
        name: 'XeLaTeX Installation',
        check: async () => {
          try {
            await new Promise((resolve, reject) => {
              const child = require('child_process').exec('xelatex --version');
              child.on('exit', (code: number | null) => code === 0 ? resolve(true) : reject());
              child.on('error', reject);
            });
            return true;
          } catch {
            return false;
          }
        },
        errorMessage: 'XeLaTeX is not installed or not in PATH'
      },
      {
        name: 'Required Directories',
        check: async () => {
          try {
            await fs.access(TEMPLATES_DIR);
            return true;
          } catch {
            return false;
          }
        },
        errorMessage: `Templates directory not found: ${TEMPLATES_DIR}`
      }
    ];

    // Run template-specific checks
    for (const template of templateConfig) {
      console.log(`Checking template: ${template.name}`);
      const errors = await validateTemplateRequirements(template);
      if (errors.length > 0) {
        console.error(`Template ${template.name} prerequisites not met:`, errors);
        return false;
      }
    }

    // Run general prerequisite checks
    for (const check of checks) {
      console.log(`Checking ${check.name}...`);
      try {
        const passed = await check.check();
        if (!passed) {
          console.error(`Prerequisite check failed: ${check.errorMessage}`);
          return false;
        }
      } catch (error) {
        console.error(`Error during ${check.name} check:`, error);
        return false;
      }
    }

    console.log('All prerequisites checked successfully');
    return true;
  } catch (error) {
    console.error('Error checking prerequisites:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

interface LatexError extends Error {
  code?: string;
  logFile?: string;
}

async function generatePdfFromLatex(filePath: string, attempt = 1): Promise<Buffer> {
  const latexContent = await fs.readFile(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const errorLogPath = path.join(TEMP_DIR, `${fileName}-error-${attempt}.log`);
  
  console.log(`[${fileName}] Attempt ${attempt}/${MAX_RETRIES}: Compiling LaTeX...`);
  
  return new Promise((resolve, reject) => {
    const pdfStream = latex(latexContent, {
      inputs: path.dirname(filePath),
      cmd: attempt === 1 ? 'xelatex' : 'pdflatex', // Try different engine on retry
      errorLogs: errorLogPath,
      passes: 2 // Run twice to resolve references
    });
    
    const chunks: Buffer[] = [];
    pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
    pdfStream.on('error', async (err: LatexError) => {
      // Read and parse the error log
      let errorDetails = '';
      try {
        errorDetails = await fs.readFile(errorLogPath, 'utf-8');
      } catch {
        errorDetails = 'Error log not available';
      }

      // Analyze error type
      const isPackageError = errorDetails.includes('Package') && errorDetails.includes('not found');
      const isFontError = errorDetails.includes('Font') && errorDetails.includes('not found');
      
      console.error(`[${fileName}] LaTeX Error (Attempt ${attempt}/${MAX_RETRIES}):`);
      console.error(err.message);
      console.error('Error details:', errorDetails.split('\n').slice(0, 5).join('\n'));

      if (attempt < MAX_RETRIES) {
        const delay = attempt * 1000; // Increasing delay between retries
        console.log(`[${fileName}] Waiting ${delay}ms before retry...`);
        await new Promise(r => setTimeout(r, delay));

        if (isPackageError || isFontError) {
          console.log(`[${fileName}] Detected ${isPackageError ? 'package' : 'font'} error, trying alternate configuration...`);
        }

        try {
          const result = await generatePdfFromLatex(filePath, attempt + 1);
          resolve(result);
        } catch (retryError) {
          reject(retryError);
        }
      } else {
        err.code = isPackageError ? 'PACKAGE_ERROR' :
                  isFontError ? 'FONT_ERROR' : 'COMPILATION_ERROR';
        err.logFile = errorLogPath;
        reject(err);
      }
    });
  });
}

async function shouldGenerateThumbnail(texPath: string, thumbnailPath: string): Promise<boolean> {
  try {
    const thumbnailStat = await fs.stat(thumbnailPath);
    const texStat = await fs.stat(texPath);
    
    return texStat.mtime > thumbnailStat.mtime;
  } catch {
    return true;
  }
}

async function generateThumbnail(
  image: sharp.Sharp,
  width: number,
  outputPath: string,
  isRetina: boolean
): Promise<void> {
  await image
    .clone()
    .resize(width)
    .png()
    .toFile(outputPath);
  
  console.log(`Generated ${isRetina ? 'retina' : 'regular'} thumbnail: ${path.basename(outputPath)}`);
}

async function cleanup(specificFiles?: string[]) {
  try {
    console.log('Cleaning up temporary files...');
    
    // Create unique subdirectory for this run
    const runDir = path.join(TEMP_DIR, Date.now().toString());
    
    // Clean up old temp directories (older than 24 hours)
    const tempDirs = await fs.readdir(TEMP_DIR);
    const oldDirs = [];
    for (const dir of tempDirs) {
      const dirPath = path.join(TEMP_DIR, dir);
      try {
        const stats = await fs.stat(dirPath);
        if (stats.isDirectory() &&
            Date.now() - stats.mtimeMs > 24 * 60 * 60 * 1000) {
          oldDirs.push(dir);
        }
      } catch {
        continue;
      }
    }

    // Remove old directories
    for (const dir of oldDirs) {
      const dirPath = path.join(TEMP_DIR, dir);
      await fs.rm(dirPath, { recursive: true, force: true });
      console.log(`Removed old temp directory: ${dir}`);
    }

    // Clean specific files if provided
    if (specificFiles?.length) {
      await Promise.all(
        specificFiles.map(file =>
          fs.unlink(file).catch(err =>
            console.warn(`Warning: Could not delete ${file}:`, err.message)
          )
        )
      );
      return;
    }

    // Clean all temporary LaTeX files
    const tempPatterns = [
      '*.aux', '*.log', '*.out', '*.synctex.gz',
      '*.fls', '*.fdb_latexmk', '*.bbl', '*.blg'
    ];
    
    const tempFiles = await glob(`{${tempPatterns.join(',')}}`, {
      cwd: TEMP_DIR,
      absolute: true
    });

    await Promise.all(
      tempFiles.map(file =>
        fs.unlink(file).catch(err =>
          console.warn(`Warning: Could not delete ${file}:`, err.message)
        )
      )
    );

    console.log(`Cleanup completed: Removed ${tempFiles.length} temporary files`);
  } catch (error) {
    console.warn('Warning: Error during cleanup:', error instanceof Error ? error.message : error);
  }
}

async function generateThumbnails() {
  try {
    // Check prerequisites first
    const prerequisitesMet = await checkPrerequisites();
    if (!prerequisitesMet) {
      console.error('Prerequisites check failed. Exiting...');
      process.exit(1);
    }

    // Ensure directories exist
    await Promise.all([
      ensureDirectoryExists(THUMBNAILS_DIR),
      ensureDirectoryExists(TEMP_DIR)
    ]);
    
    const texFiles = await glob('*.tex', { cwd: TEMPLATES_DIR });
    console.log(`Found ${texFiles.length} template files`);
    
    for (const texFile of texFiles) {
      const templatePath = path.join(TEMPLATES_DIR, texFile);
      const templateName = path.basename(texFile, '.tex')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_');
      
      const regularThumbnailPath = path.join(THUMBNAILS_DIR, `${templateName}.png`);
      const retinaThumbnailPath = path.join(THUMBNAILS_DIR, `${templateName}@2x.png`);
      
      console.log(`\nProcessing template: ${texFile}`);
      
      try {
        if (!await shouldGenerateThumbnail(templatePath, regularThumbnailPath)) {
          console.log(`Skipping ${texFile} - thumbnails are up to date`);
          continue;
        }
        
        // Create preview version of the template
        const previewTemplate = await createTemporaryPreview(templatePath, {
          title: templateName.replace(/_/g, ' ')
        });
        
        try {
          // Generate PDF from preview template
          const pdfBuffer = await generatePdfFromLatex(previewTemplate.path);
          
          // Convert PDF to image
          const image = sharp(pdfBuffer, { density: 300 });
          
          // Generate both regular and retina thumbnails
          await Promise.all([
            generateThumbnail(image, REGULAR_WIDTH, regularThumbnailPath, false),
            generateThumbnail(image, RETINA_WIDTH, retinaThumbnailPath, true)
          ]);
          
          console.log(`Successfully processed ${texFile}`);
        } finally {
          // Cleanup temporary preview file
          await previewTemplate.cleanup();
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Error processing ${texFile}:`, errorMessage);
      }
    }
    
    console.log('\nThumbnail generation completed');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Fatal error during thumbnail generation:', errorMessage);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

generateThumbnails();