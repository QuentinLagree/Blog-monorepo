import { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import Redis from 'ioredis';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { REDIS } from 'src/commons/redis/redis.token';
import { PasswordService } from 'src/commons/services/argon.service';
import { createE2EApp } from './helpers/create-e2e-app';
import { createLoggedAgent } from './helpers/auth.helper-e2e';
import { resetDatabase } from './helpers/reset-database.helper-e2e';

describe('RedisController e2e', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    app = await createE2EApp();
    prisma = app.get(PrismaService);
    await app.get<Redis>(REDIS).ping();
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('should return the real Redis connection status to a connected user', async () => {
    const { agent } = await createLoggedAgent(
      app,
      prisma,
      app.get(PasswordService),
    );
    const response = await agent.get('/redis/status').expect(200);
    expect(response.body.data).toBe('ready');
  });

  it('should redirect unauthenticated users according to the guard configuration', async () => {
    const response = await request(app.getHttpServer())
      .get('/redis/status')
      .expect(302);
    expect(response.headers['location']).toBe('/');
  });
});
