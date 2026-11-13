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

  it.each([
    ['get', '/me'],
    ['get', '/me/profile'],
    ['patch', '/me/profile'],
    ['delete', '/me'],
  ] as const)('requires authentication for %s %s', async (method, route) => {
    await request(app.getHttpServer())[method](route).expect(401);
  });

  it('returns session information without credential secrets', async () => {
    const { agent, user } = await createLoggedAgent(app, prisma, passwords);
    const response = await agent.get('/me').expect(200);
    expect(response.body.data).toEqual({
      loggedIn: true,
      user: { id: user.id, email: user.email, role: user.role },
    });
  });

  it('returns only the current private profile without password or relations', async () => {
    const { agent, user } = await createLoggedAgent(app, prisma, passwords);
    const response = await agent.get('/me/profile').expect(200);
    expect(Object.keys(response.body.data).sort()).toEqual(
      [
        'id',
        'nom',
        'prenom',
        'pseudo',
        'email',
        'role',
        'created_at',
        'updated_at',
      ].sort(),
    );
    expect(response.body.data).toMatchObject({
      id: user.id,
      email: user.email,
    });
  });

  it('updates only the current account and ignores ownership and role fields', async () => {
    const { agent, user } = await createLoggedAgent(app, prisma, passwords);
    const other = await createTestUser(prisma, passwords);
    const response = await agent
      .patch('/me/profile')
      .send({
        pseudo: 'my-new-pseudo',
        id: other.id,
        role: 'admin',
        posts: { deleteMany: {} },
      })
      .expect(200);
    expect(response.body.data).toMatchObject({
      id: user.id,
      pseudo: 'my-new-pseudo',
      role: user.role,
    });
    expect(response.body.data).not.toHaveProperty('posts');
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: other.id } })).pseudo,
    ).toBe(other.pseudo);
    await agent.get('/me').expect(200);
  });

  it.each([
    { email: 'invalid' },
    { pseudo: '' },
    { password: 'short' },
    { email: null },
  ])('rejects an invalid profile update %j', async (payload) => {
    const { agent, user } = await createLoggedAgent(app, prisma, passwords);
    await agent.patch('/me/profile').send(payload).expect(400);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).email,
    ).toBe(user.email);
  });

  it.each(['email', 'pseudo'] as const)(
    'rejects a duplicate %s without changing the account',
    async (field) => {
      const { agent, user } = await createLoggedAgent(app, prisma, passwords);
      const other = await createTestUser(prisma, passwords, {
        pseudo: 'other-user',
      });
      await agent
        .patch('/me/profile')
        .send({ [field]: other[field] })
        .expect(409);
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))[
          field
        ],
      ).toBe(user[field]);
    },
  );

  it('refreshes the session email after changing it', async () => {
    const { agent } = await createLoggedAgent(app, prisma, passwords);
    await agent
      .patch('/me/profile')
      .send({ email: 'changed@test.com' })
      .expect(200);
    const response = await agent.get('/me').expect(200);
    expect(response.body.data.user.email).toBe('changed@test.com');
  });

  it('hashes a new password and invalidates current and previous sessions', async () => {
    const { agent, user, cookies } = await createLoggedAgent(
      app,
      prisma,
      passwords,
    );
    const password = 'new-secure-password-123';
    const response = await agent
      .patch('/me/profile')
      .send({ password })
      .expect(200);
    expect(response.body.data).not.toHaveProperty('password');
    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(stored.password).not.toBe(password);
    expect(stored.password).not.toBe(user.password);
    await agent.get('/me').expect(401);
    await request(app.getHttpServer())
      .get('/me')
      .set('Cookie', cookies)
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password })
      .expect(200);
  });

  it('deletes the current account and its articles, preserves other accounts and expires the session', async () => {
    const { agent, user, cookies } = await createLoggedAgent(
      app,
      prisma,
      passwords,
    );
    const other = await createTestUser(prisma, passwords);
    await createTestPost(prisma, user.id);
    const otherPost = await createTestPost(prisma, other.id);
    const response = await agent.delete('/me').expect(204);
    expect(response.text).toBe('');
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(await prisma.post.count({ where: { authorId: user.id } })).toBe(0);
    expect(
      await prisma.post.findUnique({ where: { id: otherPost.id } }),
    ).not.toBeNull();
    expect(
      await prisma.user.findUnique({ where: { id: other.id } }),
    ).not.toBeNull();
    await agent.get('/me').expect(401);
    await request(app.getHttpServer())
      .get('/me')
      .set('Cookie', cookies)
      .expect(401);
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
});
