import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

const cwd = process.cwd();
const root = path.join(cwd, 'src/config/database');
const base = path.join(root, 'base.prisma');
const out = path.join(root, 'schema.merged.prisma');

// Patterns POSIX (marche sous Windows et Linux)
const patterns = [
  'src/config/database/models/*.prisma',
  'src/config/database/models/**/*.prisma',
];

const header = `// AUTO-GENERATED FILE. DO NOT EDIT.
// Run: npm run prisma:build
`;

function extractBlocks(content: string, block: string): string[] {
  const regex = new RegExp(`\\b${block}\\s+\\w+[\\s\\S]*?\\n}`, 'g');
  return [...content.matchAll(regex)].map((m) => m[0]);
}

function stripBlocks(content: string, blocks = ['datasource', 'generator']): string {
  let result = content;
  for (const b of blocks) {
    const regex = new RegExp(`\\b${b}\\s+\\w+[\\s\\S]*?\\n}`, 'g');
    result = result.replace(regex, '');
  }
  return result.trim();
}

function die(msg: string): never {
  console.error(msg);
  process.exit(1);
}

async function main() {
  console.log('[merge-prisma] CWD:', cwd);
  console.log('[merge-prisma] DB root:', root);

  if (!fs.existsSync(base)) die(`[merge-prisma] ❌ base.prisma introuvable: ${base}`);

  const baseContent = fs.readFileSync(base, 'utf8');
  const datasources = extractBlocks(baseContent, 'datasource').join('\n\n');
  const generators = extractBlocks(baseContent, 'generator').join('\n\n');
  const baseRest = stripBlocks(baseContent);

  // Cherche les .prisma
  let modelFiles: string[] = [];
  for (const p of patterns) {
    const found = await glob(p, { cwd, absolute: true, nodir: true });
    modelFiles.push(...found);
  }
  modelFiles = Array.from(new Set(modelFiles)).sort();

  console.log('[merge-prisma] Patterns:', patterns);
  console.log('[merge-prisma] Trouvés:', modelFiles.length);
  modelFiles.forEach((f) => console.log('  -', path.relative(cwd, f)));

  if (modelFiles.length === 0) {
    die('[merge-prisma] ❌ Aucun fichier .prisma trouvé dans src/config/database/models/');
  }

  const parts: string[] = [header];
  if (generators) parts.push(generators);
  if (datasources) parts.push(datasources);
  if (baseRest) parts.push(baseRest);

  for (const file of modelFiles) {
    const content = fs.readFileSync(file, 'utf8').trim();
    const cleaned = stripBlocks(content);
    if (cleaned) {
      parts.push(`// ----- ${path.relative(root, file)} -----\n${cleaned}`);
    }
  }

  const merged = parts.filter(Boolean).join('\n\n');
  fs.writeFileSync(out, merged, 'utf8');
  console.log('[merge-prisma] ✅ Schéma généré :', path.relative(cwd, out));
}

main().catch((err) => {
  console.error('[merge-prisma] ❌ Erreur:', err);
  process.exit(1);
});
