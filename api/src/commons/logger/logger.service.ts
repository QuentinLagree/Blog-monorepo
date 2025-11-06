import { Injectable, OnModuleInit } from '@nestjs/common';
import chalk from 'chalk';
import { Logger } from './logger.log';
import { FileTransport } from './file-transport';
import path from 'path';
import { ConsoleTransport } from './console.transporter';
import { PlainFormatter } from './plain-formatter';

const formatter = new PlainFormatter('fr-FR', /*useUTC*/ false);

@Injectable()
export class LoggerService implements OnModuleInit {
  private static isInitiated: boolean = false;
  private logger: Logger = new Logger({
    transports: [
      new FileTransport({
        dir: path.join(process.cwd(), 'logs_files'),
        formatter,
      }),
      new ConsoleTransport(formatter),
    ],
  });

  async onModuleInit() {
    if (!LoggerService.isInitiated) {
      try {
        console.log(
          `\n\n${chalk.green('> ')} ${chalk.bold.bgGreen(' GOOD ')} ${chalk.green('Le logger est bien initialisé.')}\n`,
        );
      } catch (error) {
        console.log(
          `${chalk.red('> ')} ${chalk.bold.bgRed(' ERROR ')} ${chalk.red("Echec lors de l'initialisation du logger : " + error)}`,
        );
      }
      LoggerService.isInitiated = true;
    }
  }
}
