import { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { createE2EApp } from './helpers/create-e2e-app';

describe('AuthController e2e', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    if (app) {
        await app.close();
    }
  });

  describe('GET /', () => {
    it('should return "Main Page" with 200', async () => {
      await request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Main Page');
    });
  });
});