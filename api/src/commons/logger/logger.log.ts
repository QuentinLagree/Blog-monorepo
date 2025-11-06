import { LoggerOptions } from './interfaces/logger-options';
import { LogEntry } from './types/log-entry';
import { LogLevel } from './types/log-level.enum';

export class Logger {
  constructor(private opts: LoggerOptions) {}

  private async log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ) {
    const entry: LogEntry = { timestamp: new Date(), level, message, context };
    // écrire vers tous les transports; ne pas throw au premier échec
    const results = await Promise.allSettled(
      this.opts.transports.map((t) => t.write(entry)),
    );
    const rejected = results.find((r) => r.status === 'rejected');
    if (rejected) {
      // Tu peux remonter, logger ailleurs, ou agréger
      // Ici, on remonte une seule erreur (ou bien tu fais un console.error “best effort”)
      throw (rejected as PromiseRejectedResult).reason;
    }
  }

  info(msg: string, ctx?: Record<string, unknown>) {
    return this.log(LogLevel.Info, msg, ctx);
  }
  warn(msg: string, ctx?: Record<string, unknown>) {
    return this.log(LogLevel.Warning, msg, ctx);
  }
  success(msg: string, ctx?: Record<string, unknown>) {
    return this.log(LogLevel.Success, msg, ctx);
  }
  debug(msg: string, ctx?: Record<string, unknown>) {
    return this.log(LogLevel.Debug, msg, ctx);
  }
  fatal(msg: string, ctx?: Record<string, unknown>) {
    return this.log(LogLevel.Fatal, msg, ctx);
  }
}
