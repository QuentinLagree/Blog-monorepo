// api/test/helpers/test-mocks.module.ts

import { Module } from '@nestjs/common';
import { MAIL_QUEUE } from 'src/commons/mailing/bullmq/bullmq.token';
import { REDIS } from 'src/commons/redis/redis.token';

export const redisMock = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  quit: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
};

export const mailQueueMock = {
  add: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
};

@Module({
  providers: [
    {
      provide: REDIS,
      useValue: redisMock,
    },
    {
      provide: MAIL_QUEUE,
      useValue: mailQueueMock,
    },
  ],
  exports: [REDIS, MAIL_QUEUE],
})
export class TestMocksModule {}