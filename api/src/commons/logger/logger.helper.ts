import path from "path";
import { ConsoleTransport } from "./console.transporter";
import { FileTransport } from "./file-transport";
import { PlainFormatter } from "./plain-formatter";
import { Message } from "../types/dto/message/message";
import { MessageOptions } from "../types/dto/message/message-options";
import { Logger } from "./logger.log";

export function makeMessage<T = any, K = {}>(
  log: string,
  message: string,
  data: T,
  meta?: K,
  options?: MessageOptions,
): Message<T, K> {
  const formatter = new PlainFormatter('fr-FR', false);

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
    process.env['NODE_ENV'] === 'test' ||
    process.env['JEST_WORKER_ID'] !== undefined;

  options = {
    log: options?.log ?? true,
    level: options?.level ?? 'Info',
  };

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

  return { message, data, meta };
}