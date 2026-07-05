import request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { createE2EApp } from './helpers/create-e2e-app';
import { resetDatabase } from './helpers/reset-database.helper-e2e';
import { createLoggedAgent } from './helpers/auth.helper-e2e';
import { createTestPost } from './helpers/post.helper-e2e';

import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';

describe('UserToPostController e2e', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const endpoint = '/users/posts';

  beforeAll(async () => {
    app = await createE2EApp();
    prisma = app.get(PrismaService);
    passwordService = app.get(PasswordService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /users-posts/:id', () => {
    it('should return posts of one user', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'User post',
        content: 'User post content',
      });

      const response = await request(app.getHttpServer())
        .get(`${endpoint}/${user.id}`)
        .expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: post.id,
            title: 'User post',
            content: 'User post content',
            description: post.description,
            authorId: user.id,
            published_at: post.published_at.toISOString(),
            created_at: post.created_at.toISOString(),
            updated_at: post.updated_at.toISOString(),
          }),
        ]),
      );
    });

    it('should return an empty list if user has no posts', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const response = await request(app.getHttpServer())
        .get(`${endpoint}/${user.id}`)
        .expect(200);

      expect(response.body.data).toEqual(null);
    });

    it('should return 404 if user does not exist', async () => {
      await request(app.getHttpServer())
        .get(`${endpoint}/999999`)
        .expect(404);
    });

    it('should return 400 if id is not a number', async () => {
      await request(app.getHttpServer())
        .get(`${endpoint}/abc`)
        .expect(400);
    });
  });
});