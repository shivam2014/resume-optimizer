import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { TemplateMetadata } from '../types/templates';

const execFileAsync = promisify(execFile);

/**
 * Validates template requirements like fonts and packages
 */
export async function validateTemplateRequirements(template: TemplateMetadata): Promise<string[]> {
  const errors: string[] = [];

  // Check required fonts if specified
  if (template.requiredFonts?.length) {
    try {
      const { stdout } = await execFileAsync('fc-list', [], { encoding: 'utf-8' });
      for (const font of template.requiredFonts) {
        if (!stdout.includes(font)) {
          errors.push(`Required font not installed: ${font}`);
        }
      }
    } catch (error) {
      errors.push('Failed to check font requirements');
    }
  }

  // Check LaTeX packages if specified
  if (template.customPackages?.length) {
    for (const pkg of template.customPackages) {
      try {
        await execFileAsync('kpsewhich', [`${pkg}.sty`], { encoding: 'utf-8' });
      } catch (error) {
        errors.push(`Required LaTeX package not installed: ${pkg}`);
      }
    }
  }

  return errors;
}