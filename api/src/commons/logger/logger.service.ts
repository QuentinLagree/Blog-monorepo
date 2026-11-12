import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { closeRuntimeLogger } from './logger.runtime';

@Injectable()
export class LoggerService implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await closeRuntimeLogger();
  }
}
