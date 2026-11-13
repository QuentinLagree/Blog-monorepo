import * as fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { lock } from 'proper-lockfile';
import * as tar from 'tar';
import { LogManager } from 'src/commons/logger/log-manager';
import { runLogs } from 'src/commons/logger/logs.cli';

describe('Log management', () => {
  let workspace: string;
  let directory: string;
  let manager: LogManager;
  const now = new Date('2026-11-13T12:00:00Z');
  const file = 'app-2026-09-01.log';
  const content =
    '[10:00:00] (Info) Démarrage\n[10:01:00] (Fatal) Erreur base de données\n';

  async function write(
    name = file,
    text = content,
    modified = new Date('2026-09-02T00:00:00Z'),
  ) {
    await fs.writeFile(path.join(directory, name), text);
    await fs.utimes(path.join(directory, name), modified, modified);
  }

  beforeEach(async () => {
    workspace = await fs.mkdtemp(path.join(tmpdir(), 'blog-log-manager-'));
    directory = path.join(workspace, 'logs');
    await fs.mkdir(directory);
    manager = new LogManager(directory);
  });

  afterEach(async () => {
    await fs.rm(workspace, { recursive: true, force: true });
  });

  it('previews archive candidates without modifying sources or creating archives', async () => {
    await write();
    expect(await manager.archive({ now, dryRun: true })).toEqual([
      { archive: 'app-2026-09.tar.gz', files: [file], dryRun: true },
    ]);
    expect(await fs.readFile(path.join(directory, file), 'utf8')).toBe(content);
    expect((await fs.readdir(directory)).sort()).toEqual([file]);
  });

  it('waits thirty complete UTC days after month end and preserves recently modified logs', async () => {
    await write();
    expect(
      await manager.archive({ now: new Date('2026-10-30T23:59:59Z') }),
    ).toEqual([]);
    await write(
      'app-2026-09-02.log',
      'recent',
      new Date('2026-11-12T00:00:00Z'),
    );
    await write(
      'app-2026-10-01.log',
      'october',
      new Date('2026-10-01T00:00:00Z'),
    );
    await manager.archive({ now: new Date('2026-10-31T00:00:00Z') });
    expect(await fs.readdir(directory)).toEqual(
      expect.arrayContaining([
        'archives',
        'app-2026-09-02.log',
        'app-2026-10-01.log',
      ]),
    );
  });

  it('groups daily files by month and preserves their exact content on individual export', async () => {
    await write();
    await write('app-2026-09-02.log', 'other\n');
    await manager.archive({ now });
    expect(await fs.readdir(directory)).toEqual(['archives']);
    expect(await fs.readdir(path.join(directory, 'archives'))).toEqual([
      'app-2026-09.tar.gz',
    ]);
    const exported = path.join(workspace, 'download.log');
    await manager.export(file, exported);
    expect(await fs.readFile(exported, 'utf8')).toBe(content);
    expect(await manager.check()).toEqual([
      { file: 'app-2026-09.tar.gz', ok: true, entries: 2 },
    ]);
  });

  it('merges late eligible files into an existing month without losing archived files', async () => {
    await write();
    await manager.archive({ now });
    await write('app-2026-09-02.log', 'late\n');
    await manager.archive({ now });
    expect(await manager.show(file)).toHaveLength(2);
    expect(await manager.show('app-2026-09-02.log')).toEqual([
      { file: 'app-2026-09-02.log', line: 1, text: 'late' },
    ]);
    expect(await manager.archive({ now })).toEqual([]);
  });

  it('recovers a source left after a completed archive but refuses conflicting contents', async () => {
    await write();
    await manager.archive({ now });
    await write();
    await manager.archive({ now });
    await write(file, 'conflicting content');
    await expect(manager.archive({ now })).rejects.toThrow('Conflit');
    expect(await fs.readFile(path.join(directory, file), 'utf8')).toBe(
      'conflicting content',
    );
    expect((await manager.show('app-2026-09.tar.gz'))[1].text).toContain(
      'Erreur',
    );
  });

  it('preserves sources when an existing archive is corrupt', async () => {
    await write();
    await fs.mkdir(path.join(directory, 'archives'));
    await fs.writeFile(
      path.join(directory, 'archives', 'app-2026-09.tar.gz'),
      'invalid gzip archive',
    );
    await expect(manager.archive({ now })).rejects.toThrow();
    expect(await fs.readFile(path.join(directory, file), 'utf8')).toBe(content);
    expect((await manager.check()).some((check) => !check.ok)).toBe(true);
  });

  it('searches text and levels in archives and live files with dates and a result limit', async () => {
    await write();
    await manager.archive({ now });
    await write(
      'app-2026-11-12.log',
      '[11:00:00] (Fatal) Erreur récente\n[11:01:00] (Info) Le texte contient (Fatal) sans être une erreur\n',
    );
    expect(await manager.search({ level: 'Fatal' })).toHaveLength(2);
    expect(
      await manager.search({
        query: 'ERREUR',
        level: 'Fatal',
        from: '2026-09-01',
        to: '2026-09-30',
      }),
    ).toEqual([
      { file, line: 2, text: '[10:01:00] (Fatal) Erreur base de données' },
    ]);
    expect(await manager.search({ query: 'erreur', limit: 1 })).toHaveLength(1);
    expect((await manager.show(file, 1))[0].line).toBe(2);
  });

  it('keeps pins across compression and protects the containing archive until unpinned', async () => {
    await write();
    const pin = await manager.pin(file, 'Incident à analyser', 2);
    await expect(manager.remove(file, true, now)).rejects.toThrow('épinglé');
    await manager.archive({ now });
    expect(await manager.pins()).toEqual([pin]);
    expect((await manager.list())[0].pinned).toBe(true);
    await expect(
      manager.remove('app-2026-09.tar.gz', true, now),
    ).rejects.toThrow('épinglé');
    await manager.unpin(pin.id);
    await manager.remove('app-2026-09.tar.gz', true, now);
    expect(await manager.list()).toEqual([]);
  });

  it('validates pin lines, confirmation and active file protection', async () => {
    await write();
    await expect(manager.pin(file, 'invalid', 3)).rejects.toThrow('ligne');
    await expect(manager.remove(file)).rejects.toThrow('--yes');
    await write('app-2026-11-13.log');
    await expect(
      manager.remove('app-2026-11-13.log', true, now),
    ).rejects.toThrow('actif');
    await manager.remove(file, true, now);
    expect(await fs.readdir(directory)).toEqual(['app-2026-11-13.log']);
  });

  it('rejects traversal and never overwrites an export destination', async () => {
    await write();
    await expect(manager.show('../private.log')).rejects.toThrow('invalide');
    await expect(
      manager.export(file, path.join(directory, file)),
    ).rejects.toThrow('dehors');
    const output = path.join(workspace, 'existing.log');
    await fs.writeFile(output, 'keep');
    await expect(manager.export(file, output)).rejects.toThrow();
    expect(await fs.readFile(output, 'utf8')).toBe('keep');
  });

  it('refuses unsafe archive entries without extracting them', async () => {
    await fs.mkdir(path.join(directory, 'archives'));
    await fs.writeFile(path.join(workspace, 'private.txt'), 'not a log');
    await tar.create(
      {
        cwd: workspace,
        file: path.join(directory, 'archives', 'app-2026-09.tar.gz'),
        gzip: true,
      },
      ['private.txt'],
    );
    await expect(manager.show('app-2026-09.tar.gz')).rejects.toThrow();
    expect((await manager.check())[0].ok).toBe(false);
  });

  it('rejects a second maintenance operation while another process holds the lock', async () => {
    const release = await lock(directory, {
      lockfilePath: path.join(directory, '.maintenance.lock'),
    });
    try {
      await expect(manager.archive({ now })).rejects.toMatchObject({
        code: 'ELOCKED',
      });
    } finally {
      await release();
    }
    expect(await manager.list()).toEqual([]);
  });

  it('exposes commands with strict argument validation and a failing integrity exit status', async () => {
    const output = jest.fn();
    await expect(runLogs(['--help'], output)).resolves.toBe(0);
    expect(output).toHaveBeenCalledWith(
      expect.stringContaining('logs:archive'),
    );
    await expect(
      runLogs(['delete', file, '--dir', directory], output),
    ).rejects.toThrow('--yes');
    await expect(
      runLogs(['archive', '--yes', '--dir', directory], output),
    ).rejects.toThrow('non autorisée');
    await expect(
      runLogs(['search', '--from', '2026-02-30', '--dir', directory], output),
    ).rejects.toThrow('Date');
    await expect(
      runLogs(['search', '--level', 'invalid', '--dir', directory], output),
    ).rejects.toThrow('Niveaux');
    await fs.mkdir(path.join(directory, 'archives'));
    await fs.writeFile(
      path.join(directory, 'archives', 'app-2026-09.tar.gz'),
      'broken',
    );
    expect(await runLogs(['check', '--dir', directory], output)).toBe(1);
  });
});
