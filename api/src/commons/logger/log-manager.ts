import { createReadStream, createWriteStream, constants } from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import { lock } from 'proper-lockfile';
import * as tar from 'tar';

const DAY = 86_400_000;
const dailyName = /^app-(\d{4}-\d{2})-(\d{2})\.log$/;
const archiveName = /^app-(\d{4}-\d{2})\.tar\.gz$/;

export const logDirectory = () =>
  path.resolve(
    process.env['LOG_DIR'] ?? path.join(process.cwd(), 'logs_files'),
  );

export interface LogPin {
  id: string;
  file: string;
  line?: number;
  note: string;
  createdAt: string;
}

export interface LogSearch {
  query?: string;
  level?: string;
  from?: string;
  to?: string;
  file?: string;
  limit?: number;
}

type Fingerprint = { bytes: number; sha256: string };
type Match = { file: string; line: number; text: string };

export class LogManager {
  readonly dir: string;

  constructor(directory = logDirectory()) {
    this.dir = path.resolve(directory);
  }

  private async directory(folder: string) {
    await fs.mkdir(folder, { recursive: true, mode: 0o700 });
    const stat = await fs.lstat(folder);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error(`Dossier de logs non autorisé : ${folder}`);
  }

  private async locked<T>(work: (assertLease: () => void) => Promise<T>) {
    await this.directory(this.dir);
    try {
      const archives = await fs.lstat(path.join(this.dir, 'archives'));
      if (!archives.isDirectory() || archives.isSymbolicLink())
        throw new Error('Dossier archives invalide.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    let compromised: Error | undefined;
    const release = await lock(this.dir, {
      lockfilePath: path.join(this.dir, '.maintenance.lock'),
      stale: 120_000,
      update: 30_000,
      retries: 0,
      onCompromised: (error) => {
        compromised = error;
      },
    });
    try {
      return await work(() => {
        if (compromised) throw compromised;
      });
    } finally {
      if (!compromised) await release();
    }
  }

  private validName(name: string) {
    if (
      name !== path.basename(name) ||
      (!dailyName.test(name) && !archiveName.test(name) && name !== 'app.log')
    )
      throw new Error(
        'Nom de fichier de log invalide. Les chemins sont interdits.',
      );
    const day = dailyName.exec(name);
    if (
      day &&
      new Date(`${day[1]}-${day[2]}T00:00:00Z`).toISOString().slice(0, 10) !==
        `${day[1]}-${day[2]}`
    )
      throw new Error('Date de fichier invalide.');
    const month = archiveName.exec(name)?.[1];
    if (month && !/^(\d{4})-(0[1-9]|1[0-2])$/.test(month))
      throw new Error('Mois invalide.');
    return name;
  }

  private location(name: string) {
    this.validName(name);
    return path.join(
      this.dir,
      ...(archiveName.test(name) ? ['archives', name] : [name]),
    );
  }

  private async regular(file: string) {
    const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink())
      throw new Error(`Fichier non régulier : ${path.basename(file)}`);
    return stat;
  }

  private async files() {
    const result: string[] = [];
    for (const entry of await fs.readdir(this.dir, { withFileTypes: true })) {
      if (dailyName.test(entry.name) || entry.name === 'app.log') {
        await this.regular(path.join(this.dir, entry.name));
        this.validName(entry.name);
        result.push(entry.name);
      }
    }
    const archives = path.join(this.dir, 'archives');
    try {
      const stat = await fs.lstat(archives);
      if (!stat.isDirectory() || stat.isSymbolicLink())
        throw new Error('Dossier archives invalide.');
      for (const entry of await fs.readdir(archives)) {
        if (archiveName.test(entry)) {
          await this.regular(path.join(archives, entry));
          result.push(this.validName(entry));
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    return result.sort();
  }

  private async pinsInternal(): Promise<LogPin[]> {
    const file = path.join(this.dir, '.pins.json');
    try {
      await this.regular(file);
      const pins: LogPin[] = JSON.parse(await fs.readFile(file, 'utf8'));
      if (
        !Array.isArray(pins) ||
        pins.some((pin) => !pin.id || !pin.file || typeof pin.note !== 'string')
      )
        throw new Error('Index des épingles invalide.');
      pins.forEach((pin) => this.validName(pin.file));
      return pins;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  private async savePins(pins: LogPin[], assertLease: () => void) {
    const temporary = path.join(this.dir, `.pins-${randomUUID()}.tmp`);
    try {
      await fs.writeFile(temporary, JSON.stringify(pins, null, 2) + '\n', {
        flag: 'wx',
        mode: 0o600,
      });
      assertLease();
      await fs.rename(temporary, path.join(this.dir, '.pins.json'));
    } finally {
      await fs.rm(temporary, { force: true });
    }
  }

  private protected(name: string, pins: LogPin[]) {
    const month = archiveName.exec(name)?.[1];
    return pins.some(
      (pin) =>
        pin.file === name || (month && dailyName.exec(pin.file)?.[1] === month),
    );
  }

  private async visitArchive(
    file: string,
    visit: (name: string, input: Readable) => Promise<void>,
  ) {
    await this.regular(file);
    const tasks: Promise<void>[] = [];
    const errors: unknown[] = [];
    const seen = new Set<string>();
    await tar.list({
      file,
      strict: true,
      noResume: true,
      onReadEntry: (entry) => {
        const task = (async () => {
          this.validName(entry.path);
          if (
            entry.type !== 'File' ||
            !dailyName.test(entry.path) ||
            seen.has(entry.path)
          )
            throw new Error('Entrée d’archive invalide ou dupliquée.');
          if (
            dailyName.exec(entry.path)?.[1] !==
              archiveName.exec(path.basename(file))?.[1] &&
            !path.basename(file).endsWith('.tmp')
          )
            throw new Error('Mois incohérent dans l’archive.');
          seen.add(entry.path);
          await visit(entry.path, entry as unknown as Readable);
        })().catch((error) => {
          errors.push(error);
          entry.resume();
        });
        tasks.push(task);
      },
    });
    await Promise.all(tasks);
    if (errors.length) throw errors[0];
  }

  private async fingerprint(input: Readable): Promise<Fingerprint> {
    const hash = createHash('sha256');
    let bytes = 0;
    for await (const chunk of input) {
      bytes += Buffer.byteLength(chunk);
      hash.update(chunk);
    }
    return { bytes, sha256: hash.digest('hex') };
  }

  private async archiveIndex(file: string) {
    const entries = new Map<string, Fingerprint>();
    await this.visitArchive(file, async (name, input) => {
      entries.set(name, await this.fingerprint(input));
    });
    return entries;
  }

  async list() {
    return this.locked(async () => {
      const pins = await this.pinsInternal();
      return Promise.all(
        (await this.files()).map(async (name) => {
          const stat = await this.regular(this.location(name));
          return {
            file: name,
            bytes: stat.size,
            archived: archiveName.test(name),
            pinned: this.protected(name, pins),
          };
        }),
      );
    });
  }

  async archive(options: { now?: Date; dryRun?: boolean } = {}) {
    return this.locked(async (assertLease) => {
      const now = options.now ?? new Date();
      const groups = new Map<string, string[]>();
      for (const file of await this.files()) {
        const month = dailyName.exec(file)?.[1];
        if (!month) continue;
        const [year, number] = month.split('-').map(Number);
        // The whole month must have been closed for thirty complete UTC days.
        if (now.getTime() < Date.UTC(year, number, 1) + 30 * DAY) continue;
        const stat = await this.regular(this.location(file));
        if (stat.mtimeMs > now.getTime() - 30 * DAY) continue;
        groups.set(month, [...(groups.get(month) ?? []), file]);
      }
      const result: { archive: string; files: string[]; dryRun: boolean }[] =
        [];
      for (const [month, files] of groups) {
        const name = `app-${month}.tar.gz`;
        result.push({ archive: name, files, dryRun: options.dryRun ?? false });
        if (options.dryRun) continue;
        await this.directory(path.join(this.dir, 'archives'));
        const destination = this.location(name);
        let previous = new Map<string, Fingerprint>();
        try {
          previous = await this.archiveIndex(destination);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
        const expected = new Map(previous);
        const added: string[] = [];
        for (const file of files) {
          const fingerprint = await this.fingerprint(
            createReadStream(this.location(file)),
          );
          const existing = previous.get(file);
          if (existing && existing.sha256 !== fingerprint.sha256)
            throw new Error(`Conflit avec un fichier déjà archivé : ${file}`);
          expected.set(file, fingerprint);
          if (!existing) added.push(file);
        }
        const temporary = path.join(
          this.dir,
          'archives',
          `.${name}-${randomUUID()}.tmp`,
        );
        try {
          await tar.create(
            {
              cwd: this.dir,
              file: temporary,
              gzip: true,
              portable: true,
              strict: true,
            },
            [...(previous.size ? [`@archives/${name}`] : []), ...added],
          );
          const verified = await this.archiveIndex(temporary);
          if (
            verified.size !== expected.size ||
            [...expected].some(
              ([file, value]) => verified.get(file)?.sha256 !== value.sha256,
            )
          )
            throw new Error(
              'Vérification de l’archive échouée : sources conservées.',
            );
          const handle = await fs.open(temporary, 'r+');
          try {
            await handle.chmod(0o600);
            await handle.sync();
          } finally {
            await handle.close();
          }
          assertLease();
          await fs.rename(temporary, destination);
          for (const file of files) {
            const current = await this.fingerprint(
              createReadStream(this.location(file)),
            );
            if (current.sha256 !== verified.get(file)?.sha256)
              throw new Error(
                `Fichier modifié pendant l’archivage, source conservée : ${file}`,
              );
            assertLease();
            await fs.unlink(this.location(file));
          }
        } finally {
          await fs.rm(temporary, { force: true });
        }
      }
      return result;
    });
  }

  private async source(
    name: string,
    visit: (input: Readable, file: string) => Promise<void>,
  ) {
    this.validName(name);
    if (archiveName.test(name)) {
      await this.visitArchive(this.location(name), (file, input) =>
        visit(input, file),
      );
      return;
    }
    try {
      await this.regular(this.location(name));
      await visit(createReadStream(this.location(name)), name);
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== 'ENOENT' ||
        !dailyName.test(name)
      )
        throw error;
      let found = false;
      await this.visitArchive(
        this.location(`app-${dailyName.exec(name)![1]}.tar.gz`),
        async (file, input) => {
          if (file === name) {
            found = true;
            await visit(input, file);
          } else input.resume();
        },
      );
      if (!found) throw new Error(`Log introuvable : ${name}`);
    }
  }

  async search(options: LogSearch = {}): Promise<Match[]> {
    return this.locked(async () => {
      const result: Match[] = [];
      const limit = options.limit ?? 100;
      if (!Number.isInteger(limit) || limit < 1 || limit > 10_000)
        throw new Error('La limite doit être comprise entre 1 et 10000.');
      for (const file of options.file ? [options.file] : await this.files()) {
        if (result.length >= limit) break;
        await this.source(file, async (input, name) => {
          const date = dailyName.exec(name) ? name.slice(4, 14) : '';
          if (
            (options.from && date < options.from) ||
            (options.to && date > options.to)
          ) {
            input.resume();
            return;
          }
          let line = 0;
          for await (const text of createInterface({
            input,
            crlfDelay: Infinity,
          })) {
            line++;
            if (
              result.length < limit &&
              (!options.query ||
                text.toLowerCase().includes(options.query.toLowerCase())) &&
              (!options.level ||
                /^\[\d{2}:\d{2}:\d{2}Z?\]\s+\(([^)]+)\)/.exec(text)?.[1] ===
                  options.level)
            )
              result.push({ file: name, line, text });
          }
        });
      }
      return result;
    });
  }

  async show(file: string, tail = 100) {
    return this.locked(async () => {
      if (!Number.isInteger(tail) || tail < 1 || tail > 10_000)
        throw new Error('tail doit être compris entre 1 et 10000.');
      const result: Match[] = [];
      await this.source(file, async (input, name) => {
        let line = 0;
        for await (const text of createInterface({
          input,
          crlfDelay: Infinity,
        })) {
          result.push({ file: name, line: ++line, text });
          if (result.length > tail) result.shift();
        }
      });
      return result;
    });
  }

  async check() {
    return this.locked(async () => {
      const results: {
        file: string;
        ok: boolean;
        entries?: number;
        error?: string;
      }[] = [];
      await this.pinsInternal();
      for (const file of await this.files()) {
        try {
          const entries = archiveName.test(file)
            ? (await this.archiveIndex(this.location(file))).size
            : undefined;
          if (!archiveName.test(file))
            await this.fingerprint(createReadStream(this.location(file)));
          results.push({ file, ok: true, entries });
        } catch (error) {
          results.push({ file, ok: false, error: (error as Error).message });
        }
      }
      return results;
    });
  }

  async pins() {
    return this.locked(() => this.pinsInternal());
  }

  async pin(file: string, note: string, line?: number) {
    return this.locked(async (assertLease) => {
      if (
        line !== undefined &&
        (!Number.isInteger(line) || line < 1 || archiveName.test(file))
      )
        throw new Error('Numéro de ligne invalide.');
      let count = 0;
      await this.source(file, async (input) => {
        for await (const _text of createInterface({
          input,
          crlfDelay: Infinity,
        }))
          count++;
      });
      if (line !== undefined && line > count)
        throw new Error('Cette ligne n’existe pas.');
      const pins = await this.pinsInternal();
      const pin: LogPin = {
        id: randomUUID(),
        file,
        line,
        note,
        createdAt: new Date().toISOString(),
      };
      pins.push(pin);
      await this.savePins(pins, assertLease);
      return pin;
    });
  }

  async unpin(id: string) {
    return this.locked(async (assertLease) => {
      const pins = await this.pinsInternal();
      if (!pins.some((pin) => pin.id === id))
        throw new Error('Épingle introuvable.');
      await this.savePins(
        pins.filter((pin) => pin.id !== id),
        assertLease,
      );
    });
  }

  async remove(file: string, confirmed = false, now = new Date()) {
    return this.locked(async (assertLease) => {
      if (!confirmed) throw new Error('Suppression refusée : ajouter --yes.');
      this.validName(file);
      if (
        file === 'app.log' ||
        (dailyName.test(file) &&
          file.slice(4, 14) >= now.toISOString().slice(0, 10))
      )
        throw new Error('Suppression du fichier actif ou futur interdite.');
      if (this.protected(file, await this.pinsInternal()))
        throw new Error(
          'Log épinglé : retirer ses épingles avant suppression.',
        );
      await this.regular(this.location(file));
      assertLease();
      await fs.unlink(this.location(file));
      return { deleted: file };
    });
  }

  async export(file: string, destination: string) {
    return this.locked(async () => {
      this.validName(file);
      const output = path.resolve(destination);
      const relative = path.relative(this.dir, output);
      if (
        relative === '' ||
        (!relative.startsWith(`..${path.sep}`) &&
          relative !== '..' &&
          !path.isAbsolute(relative))
      )
        throw new Error('Exporter en dehors du dossier de logs.');
      await fs.mkdir(path.dirname(output), { recursive: true });
      if (archiveName.test(file)) {
        await this.regular(this.location(file));
        await fs.copyFile(this.location(file), output, constants.COPYFILE_EXCL);
      } else {
        await this.source(file, (input) =>
          pipeline(
            input,
            createWriteStream(output, { flags: 'wx', mode: 0o600 }),
          ),
        );
      }
      return { exported: file, destination: output };
    });
  }
}
