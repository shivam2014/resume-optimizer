const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts');
const FONTS = [
  {
    name: 'Latin Modern Roman',
    url: 'https://www.gust.org.pl/projects/e-foundry/latin-modern/download/lm2.004otf.zip',
    files: [
      'lmroman10-regular.otf',
      'lmroman10-bold.otf',
      'lmroman10-italic.otf'
    ]
  },
  {
    name: 'Latin Modern Math',
    url: 'https://www.gust.org.pl/projects/e-foundry/lm-math/download/latinmodern-math-1959.zip',
    files: ['latinmodern-math.otf']
  }
];

// Create fonts directory if it doesn't exist
if (!fs.existsSync(FONTS_DIR)) {
  fs.mkdirSync(FONTS_DIR, { recursive: true });
}

// Download and extract fonts
async function setupFonts() {
  console.log('Setting up LaTeX fonts...');

  // Create temporary directory for downloads
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  try {
    for (const font of FONTS) {
      console.log(`Downloading ${font.name}...`);
      
      // Download zip file
      const zipPath = path.join(tempDir, `${font.name.toLowerCase().replace(/\s+/g, '-')}.zip`);
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(zipPath);
        https.get(font.url, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      });

      // Extract files
      console.log(`Extracting ${font.name}...`);
      execSync(`unzip -o "${zipPath}" -d "${tempDir}"`);

      // Copy font files to public/fonts
      for (const fontFile of font.files) {
        const sourcePath = path.join(tempDir, '**', fontFile);
        const targetPath = path.join(FONTS_DIR, fontFile);
        
        // Find and copy the font file
        const foundFile = execSync(`find "${tempDir}" -name "${fontFile}"`).toString().trim();
        if (foundFile) {
          fs.copyFileSync(foundFile, targetPath);
          console.log(`Copied ${fontFile} to public/fonts`);
        }
      }
    }

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('Font setup complete!');

  } catch (error) {
    console.error('Error setting up fonts:', error);
    process.exit(1);
  }
}

// Update package.json with setup script
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = require(packageJsonPath);

if (!packageJson.scripts['setup:fonts']) {
  packageJson.scripts['setup:fonts'] = 'node scripts/setup-latex-fonts.js';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Added setup:fonts script to package.json');
}

setupFonts();