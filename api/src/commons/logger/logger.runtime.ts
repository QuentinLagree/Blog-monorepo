import path from 'node:path';
import { Logger } from './logger.log';
import { FileTransport } from './file-transport';
import { ConsoleTransport } from './console.transporter';
import { PlainFormatter } from './plain-formatter';

let runtime: Logger | undefined;
export function getRuntimeLogger(): Logger {
  if (!runtime) {
    const formatter = new PlainFormatter('fr-FR', false);
    runtime = new Logger({
      transports: [
        new FileTransport({
          dir: process.env['LOG_DIR'] ?? path.join(process.cwd(), 'logs_files'),
          formatter,
        }),
        new ConsoleTransport(formatter),
      ],
    });
  }
  return runtime;
}
export async function closeRuntimeLogger(): Promise<void> {
  const current = runtime;
  runtime = undefined;
  if (current) await current.close();
}
