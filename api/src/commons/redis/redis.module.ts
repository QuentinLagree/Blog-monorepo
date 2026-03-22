// src/commons/redis/redis.module.ts
import { Global, Module, Provider } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS } from './redis.token';
import { RedisService } from './redis.service';

const RedisProvider: Provider = {
  provide: REDIS,
  useFactory: () => {
    const url = process.env.REDIS_URL ?? 'redis://redis:6379';
    const options: RedisOptions = {
      // ⬇️ BullMQ exige ceci
      maxRetriesPerRequest: null,
      // ⬇️ souvent recommandé avec BullMQ (évite une attente initiale)
      enableReadyCheck: false,
    };
    const client = new Redis(url, options);

    client.on('error', (e) => console.error('[redis]', e?.message ?? e));
    return client;
  },
};

@Global()
@Module({
  providers: [RedisProvider, RedisService],
  exports: [REDIS],
})
export class RedisModule {}
