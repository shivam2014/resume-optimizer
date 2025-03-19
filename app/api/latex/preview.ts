import { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { parse, HtmlGenerator } from 'latex.js';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'latex-previews');
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { template, content } = req.body;
  
  if (!template || !content) {
    return res.status(400).json({ error: 'Missing template or content' });
  }

  try {
    // Create cache directory if it doesn't exist
    await fs.mkdir(CACHE_DIR, { recursive: true });

    // Generate cache key
    const cacheKey = createHash('md5')
      .update(template + content)
      .digest('hex');
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.html`);

    // Check cache
    try {
      const stats = await fs.stat(cachePath);
      if (Date.now() - stats.mtimeMs < CACHE_TTL) {
        const cachedHtml = await fs.readFile(cachePath, 'utf-8');
        return res.status(200).json({ html: cachedHtml });
      }
    } catch (err) {
      // Cache miss, continue with generation
    }

    // Generate LaTeX preview
    const latexContent = template.replace('{{content}}', content);
    const generator = new HtmlGenerator({ hyphenate: false });
    const parser = parse(latexContent, { generator });
    const html = generator.stylesAndScripts() + generator.documentFragment.innerHTML;

    // Save to cache
    await fs.writeFile(cachePath, html);

    return res.status(200).json({ html });
  } catch (err) {
    console.error('LaTeX preview generation failed:', err);
    return res.status(500).json({ error: 'Failed to generate preview' });
  }
}