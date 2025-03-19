const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

const TEMPLATES_DIR = path.join(process.cwd(), 'templates', 'latex');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'templates');
const TEMP_DIR = path.join(process.cwd(), 'temp');

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function generatePreview(templatePath, outputPath) {
  try {
    const templateName = path.basename(templatePath, '.tex');
    const timestamp = Date.now();
    const tempTexFile = path.join(TEMP_DIR, `preview_${timestamp}.tex`);
    const tempPdfFile = path.join(TEMP_DIR, `preview_${timestamp}.pdf`);
    const outputPngFile = path.join(OUTPUT_DIR, `${templateName.toLowerCase().replace(/\s+/g, '-')}.png`);

    // Create temp directory if it doesn't exist
    await ensureDir(TEMP_DIR);
    await ensureDir(OUTPUT_DIR);

    // Read and modify template for preview
    let templateContent = await fs.readFile(templatePath, 'utf-8');
    templateContent = templateContent.replace('%RESUME_CONTENT%', 'Sample resume content for preview');

    // Write modified template
    await fs.writeFile(tempTexFile, templateContent);

    // Generate PDF
    await execAsync(`pdflatex -output-directory ${TEMP_DIR} ${tempTexFile}`);
    
    // Convert PDF directly to PNG with desired size using pdftoppm
    await execAsync(`pdftoppm -png -r 150 -scale-to-x 600 -scale-to-y 850 ${tempPdfFile} ${outputPngFile.replace('.png', '')}`);

    // Rename the output file (pdftoppm adds -1 to the filename)
    await fs.rename(outputPngFile.replace('.png', '-1.png'), outputPngFile);

    // Clean up temp files
    await fs.unlink(tempTexFile);
    await fs.unlink(tempPdfFile);

    console.log(`Generated preview for ${templateName}`);
  } catch (error) {
    console.error(`Error generating preview for ${templatePath}:`, error);
  }
}

async function generateAllPreviews() {
  try {
    const templates = await fs.readdir(TEMPLATES_DIR);
    
    for (const template of templates) {
      if (template.endsWith('.tex')) {
        await generatePreview(
          path.join(TEMPLATES_DIR, template),
          path.join(OUTPUT_DIR, template.replace('.tex', '.png'))
        );
      }
    }

    console.log('All previews generated successfully');
  } catch (error) {
    console.error('Error generating previews:', error);
    process.exit(1);
  }
}

generateAllPreviews();