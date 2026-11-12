const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../src/config/database');
function parts(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? parts(file)
      : entry.name.endsWith('.prisma.part')
        ? [file]
        : [];
  });
}
const base = fs.readFileSync(path.join(root, 'base.prisma.part'), 'utf8');
const models = parts(path.join(root, 'models'))
  .sort()
  .map(
    (file) =>
      `// ----- ${path.relative(root, file).replaceAll('\\', '/')} -----\n${fs.readFileSync(file, 'utf8').trim()}`,
  );
if (!models.length) throw new Error('Aucun modèle Prisma trouvé.');
fs.writeFileSync(
  path.join(root, 'schema.merged.prisma'),
  [
    '// AUTO-GENERATED FILE. DO NOT EDIT.\n// Run: npm run prisma:build',
    base.trim(),
    ...models,
  ].join('\n\n') + '\n',
);
console.log(`Schéma Prisma assemblé : ${models.length} fichiers de modèles.`);
