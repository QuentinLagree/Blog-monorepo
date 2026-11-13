import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { closeRuntimeLogger } from './logger.runtime';
import { LogManager } from './log-manager';

@Injectable()
export class LoggerService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private maintenance?: Promise<void>;

  onModuleInit(): void {
    if (
      process.env['NODE_ENV'] === 'test' ||
      process.env['LOG_ARCHIVE_ENABLED'] === 'false'
    )
      return;
    const manager = new LogManager();
    const maintain = () => {
      if (this.maintenance) return;
      this.maintenance = manager
        .archive()
        .then(() => {})
        .catch((error) =>
          console.error('[logger] archivage impossible:', error.message),
        )
        .finally(() => {
          this.maintenance = undefined;
        });
    };
    maintain();
    this.timer = setInterval(maintain, 60 * 60 * 1000);
    this.timer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    clearInterval(this.timer);
    await this.maintenance;
    await closeRuntimeLogger();
  }
}
