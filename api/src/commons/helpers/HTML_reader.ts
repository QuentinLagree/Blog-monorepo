import fs from 'fs';
import { join } from 'path/posix';

export function resolveTemplatePath(...segments: string[]) {
  // Chemin en prod/compilé
  const distPath = join(__dirname, '../../templates', ...segments);
  return distPath;
}
