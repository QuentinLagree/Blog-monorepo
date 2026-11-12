// src/commons/redis/redis.module.ts
import { Global, Module, Provider } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS, REDIS_HTTP } from './redis.token';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';

const RedisProvider: Provider = {
  provide: REDIS,
  useFactory: () => {
    const url = process.env['REDIS_URL'] ?? 'redis://redis:6379';
    const options: RedisOptions = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
    const client = new Redis(url, options);

    client.on('error', (e) => console.error('[redis]', e?.message ?? e));
    return client;
  },
};

const HttpRedisProvider: Provider = {
  provide: REDIS_HTTP,
  useFactory: async () => {
    const client = new Redis(process.env['REDIS_URL'] ?? 'redis://redis:6379', {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      commandTimeout: 1500,
      connectTimeout: 1500,
      lazyConnect: true,
    });
    client.on('error', (error) => console.error('[redis-http]', error.message));
    let timer: ReturnType<typeof setTimeout>;
    try {
      await Promise.race([
        client.connect(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Redis HTTP startup timed out')),
            1500,
          );
        }),
      ]);
    } catch (error) {
      client.disconnect();
      throw error;
    } finally {
      clearTimeout(timer);
    }
    return client;
  },
};

@Global()
@Module({
  controllers: [RedisController],
  providers: [RedisProvider, HttpRedisProvider, RedisService],
  exports: [REDIS, REDIS_HTTP],
})
export class RedisModule {}
