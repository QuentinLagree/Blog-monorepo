import { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { createE2EApp } from './helpers/create-e2e-app';
import { createLoggedAgent } from './helpers/auth.helper-e2e';
import { createTestPost } from './helpers/post.helper-e2e';
import { createTestUser } from './helpers/create_user-helper-e2e';
import { resetDatabase } from './helpers/reset-database.helper-e2e';

describe('MeController e2e', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let passwords: PasswordService;
  beforeAll(async () => {
    app = await createE2EApp();
    prisma = app.get(PrismaService);
    passwords = app.get(PasswordService);
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('should return only the current user posts, including their drafts', async () => {
    const { agent, user } = await createLoggedAgent(app, prisma, passwords);
    const own = await createTestPost(prisma, user.id, { published_at: null });
    const other = await createTestUser(prisma, passwords);
    await createTestPost(prisma, other.id);
    const response = await agent.get('/me/posts').expect(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: own.id,
      authorId: user.id,
    });
    expect(response.body.data[0]).not.toHaveProperty('content');
  });

  it('should return an empty list when the current user has no posts', async () => {
    const { agent } = await createLoggedAgent(app, prisma, passwords);
    const response = await agent.get('/me/posts').expect(200);
    expect(response.body.data).toEqual([]);
  });

  it('should require a session for personal posts', async () => {
    await request(app.getHttpServer()).get('/me/posts').expect(401);
  });

  it('should return article form metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/me/metadata')
      .expect(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        title: expect.anything(),
        content: expect.anything(),
      }),
    );
  });
});
