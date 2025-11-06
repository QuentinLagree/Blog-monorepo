import { LogFormatter } from './interfaces/log-entry';
import { LogTransport } from './interfaces/log-transport';
import { LogEntry } from './types/log-entry';
import { LogLevel } from './types/log-level.enum';

export class ConsoleTransport implements LogTransport {
  // Pas de chalk ici; on garde le transport minimal et testable
  constructor(private formatter: LogFormatter) {}
  async write(entry: LogEntry): Promise<void> {
    const line = this.formatter.format(entry);
    if (entry.level === LogLevel.Warning) console.warn(line);
    else if (entry.level === LogLevel.Fatal) console.error(line);
    else console.log(line);
  }
}
