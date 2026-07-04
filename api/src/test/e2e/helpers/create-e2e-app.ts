import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import secureSession from '@fastify/secure-session';

import { TestAppModule } from './test-app.module';

export async function createE2EApp(): Promise<NestFastifyApplication> {

  const moduleFixture = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();


  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );


  await app.register(secureSession, {
    salt: 'mq9hDxBVDbspDR6n',
    key: Buffer.from(
      process.env['SECRET_KEY'] ||
        Buffer.from('12345678901234567890123456789012').toString('base64'),
      'base64',
    ),
    cookie: {
      path: '/',
      httpOnly: true,
    },
  });


  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
    }),
  );


  await app.init();


  await app.getHttpAdapter().getInstance().ready();


  return app;
}