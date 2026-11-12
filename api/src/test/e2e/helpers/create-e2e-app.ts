import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { MAIL_QUEUE } from 'src/commons/mailing/bullmq/bullmq.token';
import { BullMQService } from 'src/commons/mailing/bullmq/bullmq.service';
import { configureHttp } from 'src/config/configure-http';
import { TestAppModule } from './test-app.module';
import { mailQueueMock } from './test.mock-module';

export async function createE2EApp(): Promise<NestFastifyApplication> {
  if (!process.env['SECRET_KEY'])
    throw new Error('SECRET_KEY is required for e2e tests.');
  const moduleFixture = await Test.createTestingModule({
    imports: [TestAppModule],
  })
    .overrideProvider(MAIL_QUEUE)
    .useValue(mailQueueMock)
    .overrideProvider(BullMQService)
    .useValue({})
    .compile();
  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ bodyLimit: 1048576 }),
  );
  try {
    await configureHttp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    return app;
  } catch (error) {
    await app.close();
    throw error;
  }
}
