import request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { createE2EApp } from './helpers/create-e2e-app';
import { resetDatabase } from './helpers/reset-database.helper-e2e';

import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { mailQueueMock } from './helpers/test.mock-module';
import { createTestUser } from './helpers/create_user-helper-e2e';

describe('PasswordRecoveryController e2e', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const endpoint = '/password';

  beforeAll(async () => {
    app = await createE2EApp();
    prisma = app.get(PrismaService);
    passwordService = app.get(PasswordService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /password/forgot', () => {
    it('should request password recovery and add mail job', async () => {
      const user = await createTestUser(prisma, passwordService, {
        email: 'recovery@test.com',
      });

      const response = await request(app.getHttpServer())
        .post(`${endpoint}/forgot`)
        .send({
          email: user.email,
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(mailQueueMock.add).toHaveBeenCalled();
    });

    it('should accept an unknown email without revealing account existence', async () => {
      await request(app.getHttpServer())
        .post(`${endpoint}/forgot`)
        .send({
          email: 'unknown@test.com',
        })
        .expect(200);
    });

    it('should return 400 if email is invalid', async () => {
      await request(app.getHttpServer())
        .post(`${endpoint}/forgot`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('POST /password/reset', () => {
    it('should reset password with valid token', async () => {
      const user = await createTestUser(prisma, passwordService, {
        email: 'reset@test.com',
        password: 'oldPassword123',
      });

      const token = '1234567890abcdef1234567890abcdef';

      await prisma.verificationTokens.create({
        data: {
          userId: user.id,
          email: user.email,
          code: token,
          expired_at: new Date(Date.now() + 1000 * 60 * 15),
        },
      });

      await request(app.getHttpServer())
        .post(`${endpoint}/reset`)
        .send({
          email: user.email,
          token,
          password: 'newPassword123',
          confirm_password: 'newPassword123',
        })
        .expect(201);

      const updatedUser = await prisma.user.findUnique({
        where: {
          email: user.email,
        },
      });

      expect(updatedUser).not.toBeNull();

      const passwordIsUpdated = await passwordService.verifyPassword(
        updatedUser!.password,
        'newPassword123',
      );

      expect(passwordIsUpdated).toBe(true);
    });

    it('should reject malformed reset payloads', async () => {
      const user = await createTestUser(prisma, passwordService, {
        email: 'invalid-token@test.com',
      });

      await request(app.getHttpServer())
        .post(`${endpoint}/reset`)
        .send({
          email: user.email,
          token: 'invalid-token',
          password: 'newPassword123',
        })
        .expect(400);
    });

    it('should return 400 if payload is invalid', async () => {
      await request(app.getHttpServer())
        .post(`${endpoint}/reset`)
        .send({
          email: 'invalid-email',
          token: '',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('reset token authorization', () => {
    const token = '1234567890abcdef1234567890abcdef';
    const payload = (email: string) => ({
      email,
      token,
      password: 'newPassword123',
      confirm_password: 'newPassword123',
    });
    it('should confirm a valid token without consuming it', async () => {
      const user = await createTestUser(prisma, passwordService);
      await prisma.verificationTokens.create({
        data: {
          userId: user.id,
          email: user.email,
          code: token,
          expired_at: new Date(Date.now() + 60000),
        },
      });
      const response = await request(app.getHttpServer())
        .get('/password/reset')
        .query({ email: user.email, token })
        .expect(200);
      expect(response.body.data).toEqual({ email: user.email, token });
      expect(await prisma.verificationTokens.count()).toBe(1);
    });
    it.each(['missing', 'expired', 'wrong-email'] as const)(
      'should prevent password changes for a %s token',
      async (scenario) => {
        const user = await createTestUser(prisma, passwordService);
        if (scenario !== 'missing')
          await prisma.verificationTokens.create({
            data: {
              userId: user.id,
              email: scenario === 'wrong-email' ? 'other@test.com' : user.email,
              code: token,
              expired_at: new Date(
                Date.now() + (scenario === 'expired' ? -1000 : 60000),
              ),
            },
          });
        await request(app.getHttpServer())
          .post('/password/reset')
          .send(payload(user.email))
          .expect(409);
        const persisted = await prisma.user.findUniqueOrThrow({
          where: { id: user.id },
        });
        expect(persisted.password).toBe(user.password);
      },
    );
    it('should consume a reset token and reject its sequential reuse', async () => {
      const user = await createTestUser(prisma, passwordService);
      await prisma.verificationTokens.create({
        data: {
          userId: user.id,
          email: user.email,
          code: token,
          expired_at: new Date(Date.now() + 60000),
        },
      });
      await request(app.getHttpServer())
        .post('/password/reset')
        .send(payload(user.email))
        .expect(201);
      expect(
        await prisma.verificationTokens.count({ where: { email: user.email } }),
      ).toBe(0);
      await request(app.getHttpServer())
        .post('/password/reset')
        .send({
          ...payload(user.email),
          password: 'anotherPassword123',
          confirm_password: 'anotherPassword123',
        })
        .expect(409);
      const persisted = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
      });
      await expect(
        passwordService.verifyPassword(persisted.password, 'newPassword123'),
      ).resolves.toBe(true);
    });
    it('should reject missing tokens and different passwords without changing the account', async () => {
      const user = await createTestUser(prisma, passwordService);
      const { token: _omitted, ...withoutToken } = payload(user.email);
      await request(app.getHttpServer())
        .post('/password/reset')
        .send(withoutToken)
        .expect(400);
      await request(app.getHttpServer())
        .post('/password/reset')
        .send({ ...payload(user.email), confirm_password: 'differentPassword' })
        .expect(401);
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
          .password,
      ).toBe(user.password);
    });
    it('should reject malformed and expired tokens on confirmation', async () => {
      const user = await createTestUser(prisma, passwordService);
      await request(app.getHttpServer())
        .get('/password/reset')
        .query({ email: user.email, token: 'invalid' })
        .expect(400);
      await prisma.verificationTokens.create({
        data: {
          userId: user.id,
          email: user.email,
          code: token,
          expired_at: new Date(Date.now() - 1000),
        },
      });
      await request(app.getHttpServer())
        .get('/password/reset')
        .query({ email: user.email, token })
        .expect(409);
    });
    it('should accept another request without replacing an active token', async () => {
      const user = await createTestUser(prisma, passwordService);
      await request(app.getHttpServer())
        .post('/password/forgot')
        .send({ email: user.email })
        .expect(200);
      await request(app.getHttpServer())
        .post('/password/forgot')
        .send({ email: user.email })
        .expect(200);
      expect(mailQueueMock.add).toHaveBeenCalledTimes(1);
    });
  });

  it('should replace an expired token and render the actual recovery email', async () => {
    const user = await createTestUser(prisma, passwordService);
    await prisma.verificationTokens.create({
      data: {
        userId: user.id,
        email: user.email,
        code: '1234567890abcdef1234567890abcdef',
        expired_at: new Date(Date.now() - 1000),
      },
    });
    await request(app.getHttpServer())
      .post('/password/forgot')
      .send({ email: user.email })
      .expect(200);
    const saved = await prisma.verificationTokens.findUniqueOrThrow({
      where: { email: user.email },
    });
    expect(saved.expired_at.getTime()).toBeGreaterThan(Date.now());
    expect(saved.code).toMatch(/^[0-9a-f]{32}$/);
    expect(await prisma.verificationTokens.count()).toBe(1);
    const [jobName, mail] = mailQueueMock.add.mock.calls[0];
    expect(jobName).toBe('mail');
    expect(mail.to).toBe(user.email);
    expect(mail.html).toContain(saved.code);
    expect(mail.html).not.toContain('{{url}}');
  });
});
