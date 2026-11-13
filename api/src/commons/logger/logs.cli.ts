import { parseArgs } from 'node:util';
import { LogManager } from './log-manager';
import { LogLevel } from './types/log-level.enum';

export const LOGS_HELP = `Gestion des logs (dates UTC)

  pnpm logs:list                             Fichiers, archives, tailles, protections
  pnpm logs:check                            Lecture et intégrité des archives
  pnpm logs:show app-2026-09-01.log --tail 50  Dernières lignes, même si archivées
  pnpm logs:search --query erreur --level Fatal --from 2026-09-01 --to 2026-09-30
  pnpm logs:archive --dry-run                 Prévisualiser les mois éligibles
  pnpm logs:archive                           Archiver les mois clos depuis 30 jours
  pnpm logs:pin app-2026-09-01.log --line 12 --note "Erreur à analyser"
  pnpm logs:pins                             Lister les épingles et leurs identifiants
  pnpm logs:unpin IDENTIFIANT                 Retirer une épingle
  pnpm logs:download app-2026-09.tar.gz --out ../exports/septembre.tar.gz
  pnpm logs:delete app-2026-09.tar.gz --yes    Supprimer un fichier non protégé

Options communes : --dir DOSSIER, --help.
Recherche : --file NOM, --limit 100 (maximum 10000), texte sans expression régulière.
Export : destination obligatoire, aucun écrasement ; un log archivé peut être exporté seul.
Épingles : protègent le fichier et l’archive qui le contient, même après compression.
Suppression : --yes obligatoire, fichiers du jour et logs épinglés refusés.
`;

const commands: Record<string, string[]> = {
  list: [],
  check: [],
  show: ['tail'],
  search: ['query', 'level', 'from', 'to', 'file', 'limit'],
  archive: ['dry-run'],
  pin: ['line', 'note'],
  pins: [],
  unpin: [],
  export: ['out'],
  download: ['out'],
  delete: ['yes'],
};

export async function runLogs(
  args: string[],
  output: (text: string) => void = console.log,
): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      help: { type: 'boolean' },
      dir: { type: 'string' },
      query: { type: 'string' },
      level: { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' },
      file: { type: 'string' },
      limit: { type: 'string' },
      tail: { type: 'string' },
      line: { type: 'string' },
      note: { type: 'string' },
      out: { type: 'string' },
      yes: { type: 'boolean' },
      'dry-run': { type: 'boolean' },
    },
  });
  if (values.help || positionals.length === 0) {
    output(LOGS_HELP);
    return 0;
  }
  const [command, target] = positionals;
  if (!commands[command])
    throw new Error(`Commande inconnue : ${command}. Utiliser --help.`);
  const needsTarget = [
    'show',
    'pin',
    'unpin',
    'export',
    'download',
    'delete',
  ].includes(command);
  if (positionals.length !== (needsTarget ? 2 : 1))
    throw new Error('Nombre d’arguments incorrect. Utiliser --help.');
  for (const option of Object.keys(values)) {
    if (!['dir', 'help', ...commands[command]].includes(option))
      throw new Error(`Option --${option} non autorisée pour ${command}.`);
  }
  for (const date of [values.from, values.to]) {
    if (
      date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)
    )
      throw new Error('Date invalide : utiliser YYYY-MM-DD.');
  }
  if (values.from && values.to && values.from > values.to)
    throw new Error('La date de début doit précéder la date de fin.');
  if (
    values.level &&
    !Object.values(LogLevel).includes(values.level as LogLevel)
  )
    throw new Error(`Niveaux : ${Object.values(LogLevel).join(', ')}.`);
  const manager = new LogManager(values.dir);
  let result: unknown;
  let status = 0;
  switch (command) {
    case 'list':
      result = await manager.list();
      break;
    case 'check': {
      const checks = await manager.check();
      result = checks;
      status = checks.some((check) => !check.ok) ? 1 : 0;
      break;
    }
    case 'archive':
      result = await manager.archive({ dryRun: values['dry-run'] });
      break;
    case 'show': {
      const lines = await manager.show(
        target,
        values.tail === undefined ? undefined : Number(values.tail),
      );
      if (lines.length) output(lines.map((line) => line.text).join('\n'));
      return 0;
    }
    case 'search':
      result = await manager.search({
        query: values.query,
        level: values.level,
        from: values.from,
        to: values.to,
        file: values.file,
        limit: values.limit === undefined ? undefined : Number(values.limit),
      });
      break;
    case 'pin':
      result = await manager.pin(
        target,
        values.note ?? '',
        values.line === undefined ? undefined : Number(values.line),
      );
      break;
    case 'pins':
      result = await manager.pins();
      break;
    case 'unpin':
      await manager.unpin(target);
      result = { unpinned: target };
      break;
    case 'delete':
      result = await manager.remove(target, values.yes);
      break;
    case 'download':
    case 'export':
      if (!values.out) throw new Error('Destination requise : --out CHEMIN.');
      result = await manager.export(target, values.out);
  }
  output(JSON.stringify(result, null, 2));
  return status;
}

if (require.main === module) {
  void runLogs(process.argv.slice(2)).then(
    (status) => {
      process.exitCode = status;
    },
    (error) => {
      console.error(`[logs] ${(error as Error).message}`);
      process.exitCode = 1;
    },
  );
}
