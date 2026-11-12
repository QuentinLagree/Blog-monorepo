import { promises as fsp } from 'fs';
import { createWriteStream } from 'fs';
import { FileTransportOptions } from './interfaces/files/log-file-transport';
import { LogTransport } from './interfaces/log-transport';
import { LogEntry } from './types/log-entry';
import path from 'path';

export class FileTransport implements LogTransport {
  private stream?: import('fs').WriteStream;
  private currentFilePath?: string;
  private rotateDaily: boolean;
  private filePrefix: string;
  private pending: Promise<void> = Promise.resolve();

  constructor(private opts: FileTransportOptions) {
    this.rotateDaily = opts.rotateDaily ?? true;
    this.filePrefix = opts.filePrefix ?? 'app';
  }

  private async ensureDir() {
    await fsp.mkdir(this.opts.dir, { recursive: true });
  }

  private fileNameFor(date: Date) {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const ext = this.opts.formatter.fileExtension ?? 'log';
    return `${this.filePrefix}-${yyyy}-${mm}-${dd}.${ext}`;
  }

  private async openStreamIfNeeded(date: Date) {
    await this.ensureDir();
    const fileName = this.rotateDaily
      ? this.fileNameFor(date)
      : `${this.filePrefix}.${this.opts.formatter.fileExtension ?? 'log'}`;
    const filePath = path.join(this.opts.dir, fileName);

    if (this.stream && this.currentFilePath === filePath) return;

    // (re)ouvrir si jour différent / autre fichier
    await this.closeStream();
    this.stream = createWriteStream(filePath, { flags: 'a' });
    // write callbacks propagate the failure to the caller; prevent an additional
    // unhandled stream error event on open/write failures.
    this.stream.on('error', () => {});
    this.currentFilePath = filePath;
  }

  private async writeEntry(entry: LogEntry): Promise<void> {
    await this.openStreamIfNeeded(entry.timestamp);
    return new Promise((resolve, reject) => {
      const line = this.opts.formatter.format(entry) + '\n';
      this.stream!.write(line, (err) => (err ? reject(err) : resolve()));
    });
  }

  write(entry: LogEntry): Promise<void> {
    const task = this.pending.then(() => this.writeEntry(entry));
    this.pending = task.catch(() => {});
    return task;
  }

  async flush(): Promise<void> {
    await this.pending;
  }

  async close(): Promise<void> {
    await this.pending;
    await this.closeStream();
  }

  private async closeStream(): Promise<void> {
    if (!this.stream) return;
    if (!this.stream.destroyed)
      await new Promise<void>((resolve) => this.stream!.end(resolve));
    this.stream = undefined;
    this.currentFilePath = undefined;
  }
}
