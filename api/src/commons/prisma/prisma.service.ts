import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import chalk from 'chalk';

import { PrismaClient } from '@prisma/client';

export const PEPPER = process.env["ARGON2_PEPPER"]

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static isInitiated: boolean = false;

  async onModuleInit() {
    
    if (!PrismaService.isInitiated)
      try {
        await this.$connect();
        if (process.env['NODE_ENV'] === 'test') return;
        console.log(
          `\n${chalk.green('> ')} ${chalk.bold.bgGreen(' GOOD ')} ${chalk.green('Connection établie avec la base de donnée.')}\n`,
        );
        PrismaService.isInitiated = true;
      } catch (error) {
        console.log(
          `${chalk.red('> ')} ${chalk.bold.bgRed(' ERROR ')} ${chalk.red('Echec lors de la connection à la base de donnée. Réessayer plus tard. (impossibilité de se connecter à la base de donnée)')}`,
        );
        console.log(
          `${chalk.red('> ')} ${chalk.bold.bgRed(' ERROR ')} ${chalk.red('Erreur : ' + error)}`,
        );
        throw error;
      }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    if (process.env['NODE_ENV'] == 'dev') {

      console.log(
        `${chalk.blue('> ')} ${chalk.bold.bgBlue(' INFO ')} ${chalk.white('La déconnection de la base de donnée est un succée.')}`,
      );
    }
  }
}
