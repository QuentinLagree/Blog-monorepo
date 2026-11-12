import request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { createE2EApp } from './helpers/create-e2e-app';
import {
  createLoggedAgent,
  createLoggedAdminAgent,
} from './helpers/auth.helper-e2e';
import { createTestUser } from './helpers/create_user-helper-e2e';
import { createTestPost } from './helpers/post.helper-e2e';
import { resetDatabase } from './helpers/reset-database.helper-e2e';
import { mailQueueMock } from './helpers/test.mock-module';

describe('Security regressions', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let passwords: PasswordService;
  const token = '1234567890abcdef1234567890abcdef';
  beforeAll(async () => {
    app = await createE2EApp();
    prisma = app.get(PrismaService);
    passwords = app.get(PasswordService);
  });
  beforeEach(async () => {
    jest.resetAllMocks();
    await resetDatabase(prisma);
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('should never expose drafts in public lists, detail or slug lookups', async () => {
    const author = await createTestUser(prisma, passwords);
    const draft = await createTestPost(prisma, author.id, {
      title: 'Private draft',
      published_at: null,
    });
    const published = await createTestPost(prisma, author.id);
    const response = await request(app.getHttpServer())
      .get('/posts')
      .expect(200);
    expect(response.body.data.map((post) => post.id)).toEqual([published.id]);
    await request(app.getHttpServer())
      .get('/posts')
      .query({ published: false })
      .expect(403);
    await request(app.getHttpServer())
      .get('/posts/' + draft.id)
      .expect(404);
    await request(app.getHttpServer())
      .get('/posts/slug/private-draft-' + draft.id)
      .expect(404);
  });

  it('should restrict draft access and interactions to the author or a current admin', async () => {
    const owner = await createLoggedAgent(app, prisma, passwords);
    const other = await createLoggedAgent(app, prisma, passwords);
    const admin = await createLoggedAdminAgent(app, prisma, passwords);
    const draft = await createTestPost(prisma, owner.user.id, {
      title: 'Private draft',
      published_at: null,
    });
    for (const client of [owner.agent, admin.agent]) {
      await client.get('/posts/' + draft.id).expect(200);
      await client.get('/posts/slug/private-draft-' + draft.id).expect(200);
      const list = await client
        .get('/posts')
        .query({ published: false })
        .expect(200);
      expect(list.body.data.map((post) => post.id)).toContain(draft.id);
    }
    await other.agent.get('/posts/' + draft.id).expect(404);
    await other.agent.get('/posts/slug/private-draft-' + draft.id).expect(404);
    const list = await other.agent
      .get('/posts')
      .query({ published: false })
      .expect(200);
    expect(list.body.data).toEqual([]);
    await other.agent.get('/users/' + owner.user.id + '/drafts').expect(403);
    await other.agent
      .post('/users/posts/' + draft.id + '/add-like')
      .expect(404);
    await other.agent
      .get('/users/posts/' + draft.id + '/reading-status')
      .expect(404);
    await other.agent
      .patch('/users/posts/' + draft.id + '/reading-progress')
      .send({ progress: 50 })
      .expect(404);
    expect(await prisma.like.count()).toBe(0);
    expect(await prisma.postRead.count()).toBe(0);
    await prisma.user.update({
      where: { id: admin.user.id },
      data: { role: 'user' },
    });
    await admin.agent.get('/posts/' + draft.id).expect(404);
    await admin.agent.get('/users/' + owner.user.id + '/drafts').expect(403);
  });

  it('should allow exactly one of two simultaneous reset requests to consume a token', async () => {
    const user = await createTestUser(prisma, passwords);
    await prisma.verificationTokens.create({
      data: {
        userId: user.id,
        email: user.email,
        code: token,
        expired_at: new Date(Date.now() + 60000),
      },
    });
    const payload = (password: string) => ({
      email: user.email,
      token,
      password,
      confirm_password: password,
    });
    const results = await Promise.all(
      ['firstPassword123', 'secondPassword123'].map((password) =>
        request(app.getHttpServer())
          .post('/password/reset')
          .send(payload(password)),
      ),
    );
    expect(results.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    const winner =
      results[0].status === 201 ? 'firstPassword123' : 'secondPassword123';
    const saved = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    await expect(
      passwords.verifyPassword(saved.password, winner),
    ).resolves.toBe(true);
    expect(await prisma.verificationTokens.count()).toBe(0);
  });

  it('should roll back token consumption when the account update fails', async () => {
    const user = await createTestUser(prisma, passwords);
    await prisma.verificationTokens.create({
      data: {
        userId: user.id,
        email: user.email,
        code: token,
        expired_at: new Date(Date.now() + 60000),
      },
    });
    const transaction = prisma.$transaction.bind(prisma);
    const failure = jest.spyOn(prisma, '$transaction').mockImplementationOnce(((
      callback: any,
    ) =>
      transaction(async (tx: any) =>
        callback(
          new Proxy(tx, {
            get(target, property) {
              if (property === 'user')
                return new Proxy(target.user, {
                  get(delegate, method) {
                    if (method === 'update')
                      return () =>
                        Promise.reject(new Error('Simulated update failure'));
                    return delegate[method];
                  },
                });
              return target[property];
            },
          }),
        ),
      )) as any);
    try {
      await request(app.getHttpServer())
        .post('/password/reset')
        .send({
          email: user.email,
          token,
          password: 'password12345',
          confirm_password: 'password12345',
        })
        .expect(500);
    } finally {
      failure.mockRestore();
    }
    expect(
      await prisma.verificationTokens.count({ where: { userId: user.id } }),
    ).toBe(1);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
        .password,
    ).toBe(user.password);
  });

  it('should build recovery links from configuration and release tokens after enqueue failure', async () => {
    const user = await createTestUser(prisma, passwords);
    mailQueueMock.add.mockRejectedValueOnce(new Error('Queue unavailable'));
    await request(app.getHttpServer())
      .post('/password/forgot')
      .set('Origin', 'https://untrusted.example')
      .send({ email: user.email })
      .expect(500);
    expect(await prisma.verificationTokens.count()).toBe(0);
    mailQueueMock.add.mockResolvedValueOnce({ id: 'test' });
    await request(app.getHttpServer())
      .post('/password/forgot')
      .set('Origin', 'https://untrusted.example')
      .send({ email: user.email })
      .expect(200);
    const mail = mailQueueMock.add.mock.calls[1][1];
    expect(mail.html).toContain('http://localhost:4200/auth/reset');
    expect(mail.html).not.toContain('untrusted.example');
    expect(await prisma.verificationTokens.count()).toBe(1);
  });

  it('should enforce pseudo uniqueness on updates and concurrent registrations', async () => {
    const first = await createLoggedAgent(app, prisma, passwords, {
      pseudo: 'reserved',
    });
    const second = await createLoggedAgent(app, prisma, passwords);
    await second.agent
      .put('/users/' + second.user.id)
      .send({ pseudo: first.user.pseudo })
      .expect(409);
    const results = await Promise.all(
      ['one@test.com', 'two@test.com'].map((email) =>
        request(app.getHttpServer()).post('/auth/register').send({
          email,
          pseudo: 'concurrent',
          nom: 'Doe',
          prenom: 'John',
          password: 'password12345',
        }),
      ),
    );
    expect(results.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    expect(await prisma.user.count({ where: { pseudo: 'concurrent' } })).toBe(
      1,
    );
  });
});
