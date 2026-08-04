import secureSession from '@fastify/secure-session';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { MAIL_QUEUE } from
  'src/commons/mailing/bullmq/bullmq.token';

import { TestAppModule } from './test-app.module';
import {
  mailQueueMock,
} from './test.mock-module';

export async function createE2EApp():
  Promise<NestFastifyApplication> {
  const moduleFixture =
    await Test.createTestingModule({
      imports: [
        TestAppModule,
      ],
    })
      .overrideProvider(
        MAIL_QUEUE,
      )
      .useValue(
        mailQueueMock,
      )
      .compile();

  const app =
    moduleFixture
      .createNestApplication<
        NestFastifyApplication
      >(
        new FastifyAdapter(),
      );

  const secretKey =
    process.env['SECRET_KEY'];

  if (!secretKey) {
    throw new Error(
      'La variable SECRET_KEY est absente de .env.test.',
    );
  }

  await app.register(
    secureSession,
    {
      salt:
        'mq9hDxBVDbspDR6n',

      key:
        Buffer.from(
          secretKey,
          'base64',
        ),

      cookie: {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  await app
    .getHttpAdapter()
    .getInstance()
    .ready();

  return app;
}