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
import type Redis from 'ioredis';
import { REDIS_HTTP } from 'src/commons/redis/redis.token';

describe('Security lifecycle', () => {
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

  it.each(['nom', 'prenom', 'pseudo', 'email', 'password'])(
    'should reject null for %s and preserve the account',
    async (field) => {
      const user = await createLoggedAgent(app, prisma, passwords);
      await user.agent
        .put('/users/' + user.user.id)
        .send({ [field]: null })
        .expect(400);
      expect(
        await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } }),
      ).toEqual(user.user);
    },
  );

  it('should accept omitted update fields', async () => {
    const user = await createLoggedAgent(app, prisma, passwords);
    await user.agent
      .put('/users/' + user.user.id)
      .send({ pseudo: 'new-pseudo' })
      .expect(200);
    const persisted = await prisma.user.findUniqueOrThrow({
      where: { id: user.user.id },
    });
    expect(persisted.email).toBe(user.user.email);
    expect(persisted.password).toBe(user.user.password);
  });

  it('should revoke old links before an email address is reassigned', async () => {
    const user = await createLoggedAgent(app, prisma, passwords);
    await user.agent
      .post('/password/forgot')
      .send({ email: user.user.email })
      .expect(200);
    const old = await prisma.verificationTokens.findUniqueOrThrow({
      where: { userId: user.user.id },
    });
    await user.agent
      .put('/users/' + user.user.id)
      .send({ email: 'changed@test.com' })
      .expect(200);
    expect(
      await prisma.verificationTokens.count({
        where: { userId: user.user.id },
      }),
    ).toBe(0);
    const replacement = await createTestUser(prisma, passwords, {
      email: user.user.email,
    });
    await request(app.getHttpServer())
      .post('/password/reset')
      .send({
        email: replacement.email,
        token: old.code,
        password: 'newPassword12345',
        confirm_password: 'newPassword12345',
      })
      .expect(409);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: replacement.id } }))
        .password,
    ).toBe(replacement.password);
    await user.agent
      .post('/password/forgot')
      .send({ email: 'changed@test.com' })
      .expect(200);
    expect(
      (
        await prisma.verificationTokens.findUniqueOrThrow({
          where: { userId: user.user.id },
        })
      ).email,
    ).toBe('changed@test.com');
  });

  it('should cascade deletion of recovery tokens with the account', async () => {
    const user = await createLoggedAgent(app, prisma, passwords);
    const admin = await createLoggedAdminAgent(app, prisma, passwords);
    await user.agent
      .post('/password/forgot')
      .send({ email: user.user.email })
      .expect(200);
    const old = await prisma.verificationTokens.findUniqueOrThrow({
      where: { userId: user.user.id },
    });
    await admin.agent.delete('/users/' + user.user.id).expect(204);
    expect(
      await prisma.verificationTokens.count({
        where: { userId: user.user.id },
      }),
    ).toBe(0);
    const replacement = await createTestUser(prisma, passwords, {
      email: user.user.email,
    });
    await request(app.getHttpServer())
      .post('/password/reset')
      .send({
        email: replacement.email,
        token: old.code,
        password: 'newPassword12345',
        confirm_password: 'newPassword12345',
      })
      .expect(409);
  });

  it('should revoke recovery links after a regular password change', async () => {
    const user = await createLoggedAgent(app, prisma, passwords);
    await user.agent
      .post('/password/forgot')
      .send({ email: user.user.email })
      .expect(200);
    const old = await prisma.verificationTokens.findUniqueOrThrow({
      where: { userId: user.user.id },
    });
    await user.agent
      .put('/users/' + user.user.id)
      .send({ password: 'newPassword12345' })
      .expect(200);
    expect(
      await prisma.verificationTokens.count({
        where: { userId: user.user.id },
      }),
    ).toBe(0);
    await request(app.getHttpServer())
      .get('/password/reset')
      .query({ email: user.user.email, token: old.code })
      .expect(409);
  });

  it('should reject a token bound to another account even if its email matches', async () => {
    const first = await createTestUser(prisma, passwords);
    const second = await createTestUser(prisma, passwords);
    await prisma.verificationTokens.create({
      data: {
        userId: first.id,
        email: second.email,
        code: token,
        expired_at: new Date(Date.now() + 60000),
      },
    });
    await request(app.getHttpServer())
      .post('/password/reset')
      .send({
        email: second.email,
        token,
        password: 'newPassword12345',
        confirm_password: 'newPassword12345',
      })
      .expect(409);
    await request(app.getHttpServer())
      .get('/password/reset')
      .query({ email: second.email, token })
      .expect(409);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: second.id } }))
        .password,
    ).toBe(second.password);
  });

  it('should return 503 within a bounded delay when a limiter command hangs', async () => {
    const redis = app.get<Redis>(REDIS_HTTP);
    const hung = jest
      .spyOn(redis, 'eval')
      .mockImplementationOnce(() => new Promise(() => {}));
    try {
      const response = await request(app.getHttpServer())
        .post('/password/forgot')
        .send({ email: 'unknown@test.com' })
        .timeout({ deadline: 4000 })
        .expect(503);
      expect(response.headers['retry-after']).toBe('2');
      expect(mailQueueMock.add).not.toHaveBeenCalled();
    } finally {
      hung.mockRestore();
    }
  });

  it('should return 503 when the dedicated HTTP Redis connection is offline', async () => {
    const redis = app.get<Redis>(REDIS_HTTP);
    const disconnected = new Promise<void>((resolve) =>
      redis.once('end', resolve),
    );
    redis.disconnect();
    await disconnected;
    try {
      await request(app.getHttpServer())
        .post('/password/forgot')
        .send({ email: 'unknown@test.com' })
        .timeout({ deadline: 4000 })
        .expect(503);
      expect(mailQueueMock.add).not.toHaveBeenCalled();
    } finally {
      await redis.connect();
    }
  });

  it('should forbid deletion after an administrator is demoted', async () => {
    const owner = await createTestUser(prisma, passwords);
    const post = await createTestPost(prisma, owner.id);
    const admin = await createLoggedAdminAgent(app, prisma, passwords);
    await prisma.user.update({
      where: { id: admin.user.id },
      data: { role: 'user' },
    });
    await admin.agent.delete('/posts/' + post.id).expect(403);
    expect(await prisma.post.count({ where: { id: post.id } })).toBe(1);
  });

  it('should invalidate all previously issued cookies after password recovery', async () => {
    const user = await createLoggedAgent(app, prisma, passwords);
    await prisma.verificationTokens.create({
      data: {
        userId: user.user.id,
        email: user.user.email,
        code: token,
        expired_at: new Date(Date.now() + 60000),
      },
    });
    await request(app.getHttpServer())
      .post('/password/reset')
      .send({
        email: user.user.email,
        token,
        password: 'newPassword12345',
        confirm_password: 'newPassword12345',
      })
      .expect(201);
    await request(app.getHttpServer())
      .get('/me')
      .set('Cookie', user.cookies)
      .expect(401);
    await user.agent.get('/me').expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.user.email, password: 'newPassword12345' })
      .expect(200);
  });

  it('should invalidate an existing session after a normal password change', async () => {
    const user = await createLoggedAgent(app, prisma, passwords);
    await user.agent
      .put('/users/' + user.user.id)
      .send({ password: 'newPassword12345' })
      .expect(200);
    await user.agent.get('/me').expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.user.email, password: 'newPassword12345' })
      .expect(200);
  });

  it('should reject a cookie belonging to a deleted account', async () => {
    const user = await createLoggedAgent(app, prisma, passwords);
    await prisma.user.delete({ where: { id: user.user.id } });
    await user.agent.get('/me').expect(401);
  });

  it('should replace an expired token once under concurrent recovery requests', async () => {
    const user = await createTestUser(prisma, passwords);
    await prisma.verificationTokens.create({
      data: {
        userId: user.id,
        email: user.email,
        code: token,
        expired_at: new Date(Date.now() - 1000),
      },
    });
    const responses = await Promise.all(
      Array.from({ length: 3 }, () =>
        request(app.getHttpServer())
          .post('/password/forgot')
          .send({ email: user.email }),
      ),
    );
    expect(responses.map((response) => response.status)).toEqual([
      200, 200, 200,
    ]);
    expect(mailQueueMock.add).toHaveBeenCalledTimes(1);
    const saved = await prisma.verificationTokens.findUniqueOrThrow({
      where: { email: user.email },
    });
    expect(mailQueueMock.add.mock.calls[0][1].recovery.code).toBe(saved.code);
    const unknown = await request(app.getHttpServer())
      .post('/password/forgot')
      .send({ email: 'unknown@test.com' })
      .expect(200);
    expect(unknown.body).toEqual(responses[0].body);
  });

  it('should reject short registration and reset passwords without consuming a token', async () => {
    const data = {
      email: 'new@test.com',
      pseudo: 'new-user',
      nom: 'Doe',
      prenom: 'John',
    };
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...data, password: '12345678901' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...data, password: '123456789012' })
      .expect(201);
    const registered = await prisma.user.findUniqueOrThrow({
      where: { email: data.email },
    });
    await prisma.verificationTokens.create({
      data: {
        userId: registered.id,
        email: data.email,
        code: token,
        expired_at: new Date(Date.now() + 60000),
      },
    });
    await request(app.getHttpServer())
      .post('/password/reset')
      .send({
        email: data.email,
        token,
        password: '12345678901',
        confirm_password: '12345678901',
      })
      .expect(400);
    expect(
      await prisma.verificationTokens.count({ where: { email: data.email } }),
    ).toBe(1);
  });

  it('should paginate deterministically when creation dates are identical', async () => {
    const owner = await createTestUser(prisma, passwords);
    const created_at = new Date('2026-01-01T00:00:00Z');
    const first = await createTestPost(prisma, owner.id);
    const second = await createTestPost(prisma, owner.id);
    const third = await createTestPost(prisma, owner.id);
    await prisma.post.updateMany({
      where: { id: { in: [first.id, second.id, third.id] } },
      data: { created_at },
    });
    const page1 = await request(app.getHttpServer())
      .get('/posts')
      .query({ page: 1, limit: 2 })
      .expect(200);
    const page2 = await request(app.getHttpServer())
      .get('/posts')
      .query({ page: 2, limit: 2 })
      .expect(200);
    expect(page1.body.data.map((post) => post.id)).toEqual([
      third.id,
      second.id,
    ]);
    expect(page2.body.data.map((post) => post.id)).toEqual([first.id]);
  });

  it('should enforce production request limits through Redis and return Retry-After', async () => {
    const previous = process.env['E2E_REAL_RATE_LIMITS'];
    let limitedApp: NestFastifyApplication | undefined;
    try {
      process.env['E2E_REAL_RATE_LIMITS'] = 'true';
      limitedApp = await createE2EApp();
      for (let index = 0; index < 5; index++) {
        await request(limitedApp.getHttpServer())
          .post('/password/forgot')
          .send({ email: `unknown-${index}@test.com` })
          .expect(200);
      }
      const blocked = await request(limitedApp.getHttpServer())
        .post('/password/forgot')
        .send({ email: 'another@test.com' })
        .expect(429);
      expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    } finally {
      if (limitedApp) await limitedApp.close();
      if (previous === undefined) delete process.env['E2E_REAL_RATE_LIMITS'];
      else process.env['E2E_REAL_RATE_LIMITS'] = previous;
    }
  });
});
