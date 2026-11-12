// src/some.service.ts
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import chalk from 'chalk';
import Redis from 'ioredis';
import { REDIS, REDIS_HTTP } from './redis.token';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(REDIS_HTTP) private readonly httpRedis: Redis,
  ) {}

  async set(key: string, value: string, ttl = 60) {
    await this.redis.set(key, value, 'EX', ttl);
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async onModuleDestroy(): Promise<void> {
    this.httpRedis.disconnect();
    await this.redis.quit();
  }

  async onModuleInit() {
    if (['connect', 'ready'].includes(this.redis.status)) {
      console.log(
        `${chalk.green('> ')} ${chalk.bold.bgGreen(' GOOD ')} ${chalk.green('Connection établie avec Redis.')}\n`,
      );
    } else {
      console.log(
        `${chalk.red('> ')} ${chalk.bold.bgRed(' ERROR ')} ${chalk.red('Echec lors de la connection à Redis : ')}`,
      );
    }
  }
}
