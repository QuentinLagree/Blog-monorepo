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
    await this.close();
    this.stream = createWriteStream(filePath, { flags: 'a' });
    this.currentFilePath = filePath;
  }

  async write(entry: LogEntry): Promise<void> {
    await this.openStreamIfNeeded(entry.timestamp);
    return new Promise((resolve, reject) => {
      const line = this.opts.formatter.format(entry) + '\n';
      this.stream!.write(line, (err) => (err ? reject(err) : resolve()));
    });
  }

  async flush(): Promise<void> {
    if (!this.stream) return;
    await new Promise<void>((resolve) =>
      this.stream!.once('drain', () => resolve()),
    );
  }

  async close(): Promise<void> {
    if (!this.stream) return;
    await new Promise<void>((resolve) => this.stream!.end(resolve));
    this.stream = undefined;
    this.currentFilePath = undefined;
  }
}
