import { LogFormatter } from './interfaces/log-entry';
import { LogEntry } from './types/log-entry';

export class PlainFormatter implements LogFormatter {
  fileExtension = 'log';
  constructor(
    private locale = 'fr-FR',
    private useUTC = false,
  ) {}
  private two(n: number) {
    return n.toString().padStart(2, '0');
  }
  format(entry: LogEntry): string {
    const d = entry.timestamp;
    const hh = this.two(this.useUTC ? d.getUTCHours() : d.getHours());
    const mm = this.two(this.useUTC ? d.getUTCMinutes() : d.getMinutes());
    const ss = this.two(this.useUTC ? d.getUTCSeconds() : d.getSeconds());
    const time = `${hh}:${mm}:${ss}${this.useUTC ? 'Z' : ''}`;
    const ctx = entry.context ? ' ' + JSON.stringify(entry.context) : '';
    return `[${time}] (${entry.level}) ${entry.message}${ctx}`;
  }
}
