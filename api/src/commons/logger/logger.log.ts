import { LoggerOptions } from './interfaces/logger-options';
import { LogEntry } from './types/log-entry';
import { LogLevel } from './types/log-level.enum';

export class Logger {
  private readonly pending = new Set<Promise<void>>();
  constructor(private opts: LoggerOptions) {}

  private async write(
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

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    const task = this.write(level, message, context);
    this.pending.add(task);
    void task.then(
      () => this.pending.delete(task),
      () => this.pending.delete(task),
    );
    return task;
  }

  async close(): Promise<void> {
    await Promise.allSettled([...this.pending]);
    const results = await Promise.allSettled(
      this.opts.transports.map((transport) => transport.close?.()),
    );
    const failed = results.find((result) => result.status === 'rejected');
    if (failed?.status === 'rejected') throw failed.reason;
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
