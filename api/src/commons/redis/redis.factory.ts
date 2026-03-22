// src/redis/redis.provider.ts
import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from './redis.token';

let client: Redis | null = null;
let connecting: Promise<Redis> | null = null;

export const RedisProvider: Provider = {
  provide: REDIS,
  useFactory: async (): Promise<Redis> => {
    if (client) return client; // ioredis gère déjà l'état de connexion

    if (!client) {
      client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
        // options utiles :
        retryStrategy: (times) => Math.min(times * 500, 5000), // backoff jusqu’à 5s
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            console.warn('[redis] reconnecting after READONLY state...');
            return true;
          }
          return false;
        },
      });

      client.on('connect', () => console.log('[redis] connected'));
      client.on('ready', () => console.log('[redis] ready'));
      client.on('error', (err) =>
        console.error('[redis] error:', err?.message ?? err),
      );
      client.on('close', () => console.warn('[redis] connection closed'));
      client.on('reconnecting', () => console.warn('[redis] reconnecting...'));
    }

    // ioredis connecte automatiquement, mais on peut attendre explicitement
    connecting ??= new Promise<Redis>((resolve, reject) => {
      if (!client) return reject(new Error('Redis client not initialized'));
      client.once('ready', () => resolve(client!));
      client.once('error', (err) => reject(err));
    }).finally(() => (connecting = null));

    return connecting;
  },
};
