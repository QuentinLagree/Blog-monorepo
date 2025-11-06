import path from 'path';
import { ConsoleTransport } from '../logger/console.transporter';
import { FileTransport } from '../logger/file-transport';
import { Logger } from '../logger/logger.log';
import { PlainFormatter } from '../logger/plain-formatter';
import { Message } from '../types/message/message';
import { MessageOptions } from '../types/message/message-options';

export function makeMessage<T>(
  log: string,
  message: string,
  data: T,
  options?: MessageOptions,
): Message<T> {
  const formatter = new PlainFormatter('fr-FR', /*useUTC*/ false);
  const logger = new Logger({
    transports: [
      new FileTransport({
        dir: path.join(process.cwd(), 'logs_files'),
        formatter,
      }),
      new ConsoleTransport(formatter),
    ],
  });
  const isTest =
    process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

  options = { log: options?.log ?? true, level: options?.level ?? 'Info' };

  if (options.log && !isTest) {
    if (options.level === 'Info') {
      logger.info(log);
    } else if (options.level === 'Warning') {
      logger.warn(log);
    } else if (options.level === 'Success') {
      logger.success(log);
    } else if (options.level === 'Fatal') {
      logger.fatal(log);
    } else if (options.level === 'Debug') {
      logger.debug(log);
    }
  }

  return { message, data };
}
