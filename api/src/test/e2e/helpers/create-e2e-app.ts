import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import secureSession from '@fastify/secure-session';

import { TestAppModule } from './test-app.module';
import { MAIL_QUEUE } from 'src/commons/mailing/bullmq/bullmq.token';
import { mailQueueMock } from './test.mock-module';

export async function createE2EApp(): Promise<NestFastifyApplication> {

  const moduleFixture = await Test.createTestingModule({
    imports: [TestAppModule],
  })
  .overrideProvider(MAIL_QUEUE)
  .useValue(mailQueueMock).compile();


  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );


  await app.register(secureSession, {
    salt: 'mq9hDxBVDbspDR6n',
    key: Buffer.from(process.env["SECRET_KEY"]!, 'base64'),
    cookie: {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
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