import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

const execFileAsync = promisify(execFile);

const FONT_URLS = {
  FiraSans: {
    url: 'https://fonts.google.com/download?family=Fira+Sans',
    files: ['FiraSans-Regular.ttf', 'FiraSans-Bold.ttf', 'FiraSans-Italic.ttf']
  },
  FontAwesome: {
    url: 'https://use.fontawesome.com/releases/v6.4.0/fontawesome-free-6.4.0-desktop.zip',
    files: ['FontAwesome.otf']
  },
  Charter: {
    url: 'https://practicaltypography.com/fonts/charter.zip',
    files: ['Charter-Regular.ttf', 'Charter-Bold.ttf', 'Charter-Italic.ttf']
  }
};

async function isFontAvailable(font: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('fc-list', [], { encoding: 'utf-8' });
    return stdout.toLowerCase().includes(font.toLowerCase());
  } catch (error) {
    console.error(`Error checking font availability: ${error}`);
    return false;
  }
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const fileStream = createWriteStream(destPath);
      pipeline(response, fileStream)
        .then(() => resolve())
        .catch(reject);
    }).on('error', reject);
  });
}

async function extractFonts(zipPath: string, destDir: string): Promise<void> {
  // For simplicity, we'll use the unzip command line tool
  await execFileAsync('unzip', ['-o', zipPath, '-d', destDir]);
}

async function installFont(fontName: string): Promise<void> {
  const fontInfo = FONT_URLS[fontName as keyof typeof FONT_URLS];
  if (!fontInfo) {
    throw new Error(`Unknown font: ${fontName}`);
  }

  const tempDir = path.join(process.cwd(), 'temp', 'fonts');
  await fs.mkdir(tempDir, { recursive: true });

  const downloadPath = path.join(tempDir, `${fontName}.zip`);
  console.log(`Downloading ${fontName}...`);
  await downloadFile(fontInfo.url, downloadPath);

  console.log(`Extracting ${fontName}...`);
  await extractFonts(downloadPath, tempDir);

  // Copy fonts to system font directory or local project directory
  const fontDir = path.join(process.cwd(), 'public/fonts');
  await fs.mkdir(fontDir, { recursive: true });

  for (const file of fontInfo.files) {
    const sourcePath = path.join(tempDir, file);
    const destPath = path.join(fontDir, file);
    await fs.copyFile(sourcePath, destPath);
  }

  // Clean up temp files
  await fs.rm(tempDir, { recursive: true, force: true });
}

async function updateFontCache(): Promise<void> {
  console.log('Updating font cache...');
  await execFileAsync('fc-cache', ['-f', '-v']);
}

async function main() {
  const requiredFonts = ['FiraSans', 'FontAwesome', 'Charter'];
  const missingFonts: string[] = [];

  for (const font of requiredFonts) {
    const isAvailable = await isFontAvailable(font);
    if (!isAvailable) {
      missingFonts.push(font);
    }
  }

  if (missingFonts.length === 0) {
    console.log('All required fonts are already installed.');
    return;
  }

  console.log('Missing fonts:', missingFonts.join(', '));

  for (const font of missingFonts) {
    try {
      await installFont(font);
      console.log(`Successfully installed ${font}`);
    } catch (error) {
      console.error(`Failed to install ${font}:`, error);
    }
  }

  await updateFontCache();
  console.log('Font installation complete.');
}

main().catch(console.error);