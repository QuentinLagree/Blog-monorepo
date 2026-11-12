const fs = require('node:fs');
const { parseEnv } = require('node:util');
const { PrismaClient } = require('@prisma/client');
if (fs.existsSync('.env')) {
  for (const [key, value] of Object.entries(
    parseEnv(fs.readFileSync('.env', 'utf8')),
  ))
    process.env[key] ??= value;
}
const prisma = new PrismaClient();
(async () => {
  try {
    const duplicates = await prisma.user.groupBy({
      by: ['pseudo'],
      _count: { pseudo: true },
      having: { pseudo: { _count: { gt: 1 } } },
    });
    if (duplicates.length) {
      console.error(
        'Migration refusée : résoudre manuellement les pseudos en doublon avant le déploiement.',
      );
      console.error(JSON.stringify(duplicates));
      process.exitCode = 1;
    } else console.log('Aucun pseudo en doublon.');
  } catch (error) {
    if (error.code === 'P2021')
      console.log(
        'Base vierge : la table utilisateur sera créée par les migrations.',
      );
    else {
      console.error(
        'Vérification impossible. Contrôler DATABASE_URL et la disponibilité MySQL.',
      );
      process.exitCode = 1;
    }
  }
})().finally(() => prisma.$disconnect());
