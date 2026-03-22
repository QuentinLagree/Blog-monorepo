// src/some.service.ts
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import chalk from 'chalk';
import Redis from 'ioredis';
import { REDIS } from './redis.token';

@Injectable()
export class RedisService implements OnModuleInit {
  constructor(@Inject(REDIS) private readonly redis: Redis) {

  }

  async set(key: string, value: string, ttl = 60) {
    await this.redis.set(key, value, 'EX', ttl);
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async onModuleInit() {
    
    if (["connect", "ready"].includes(this.redis.status) ) {
      console.log(
        `${chalk.green('> ')} ${chalk.bold.bgGreen(' GOOD ')} ${chalk.green('Connection établie avec Redis.')}\n`,
      );
    } else {
      console.log(
        `${chalk.red('> ')} ${chalk.bold.bgRed(' ERROR ')} ${chalk.red("Echec lors de la connection à Redis : ")}`,
      );
    }
  }
}