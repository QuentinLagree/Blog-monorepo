// src/bullmq/bullmq.module.ts
import { Global, Module } from '@nestjs/common';
import { BullMQService } from './bullmq.service';
import { MAIL_QUEUE } from './bullmq.token';
import { REDIS } from 'src/commons/redis/redis.token';
import { Queue } from 'bullmq';
import type Redis from 'ioredis'; // tu utilises ioredis
import { RedisModule } from 'src/commons/redis/redis.module'; // doit exporter REDIS

@Global()
@Module({
  imports: [RedisModule], // si RedisModule est @Global, ce n'est pas strictement nécessaire
  providers: [
    {
      provide: MAIL_QUEUE,
      useFactory: (redis: Redis) =>
        new Queue('mail', {
          connection: redis as any,
          defaultJobOptions: {
            attempts: 5,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: 1000,
            removeOnFail: 1000,
          },
        }),
      inject: [REDIS],
    },
    BullMQService,
  ],
  exports: [MAIL_QUEUE],
})
export class BullMQModule {}
