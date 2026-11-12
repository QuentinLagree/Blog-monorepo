import { Message } from '../types/dto/message/message';
import { MessageOptions } from '../types/dto/message/message-options';
import { getRuntimeLogger } from './logger.runtime';

export function makeMessage<T = any, K = {}>(
  log: string,
  message: string,
  data: T,
  meta?: K,
  options?: MessageOptions,
): Message<T, K> {
  const isTest =
    process.env['NODE_ENV'] === 'test' ||
    process.env['JEST_WORKER_ID'] !== undefined;

  options = {
    log: options?.log ?? true,
    level: options?.level ?? 'Info',
  };

  if (options.log && !isTest) {
    const logger = getRuntimeLogger();
    const methods = {
      Info: 'info',
      Warning: 'warn',
      Success: 'success',
      Fatal: 'fatal',
      Debug: 'debug',
    } as const;
    void logger[methods[options.level]](log).catch((error) => {
      console.error(
        '[logger] write failed:',
        error instanceof Error ? error.message : error,
      );
    });
  }

  return { message, data, meta };
}
