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

  describe('POST /password-recovery/request', () => {
    it('should request password recovery and add mail job', async () => {
      const user = await createTestUser(prisma, passwordService, {
        email: 'recovery@test.com',
      });

      const response = await request(app.getHttpServer())
        .post(`${endpoint}/forgot`)
        .send({
          email: user.email,
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(mailQueueMock.add).toHaveBeenCalled();
    });

    it('should return 404 if email does not exist', async () => {
      await request(app.getHttpServer())
        .post(`${endpoint}/forgot`)
        .send({
          email: 'unknown@test.com',
        })
        .expect(404);
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

  describe('POST /password-recovery/reset', () => {
    it('should reset password with valid token', async () => {
      const user = await createTestUser(prisma, passwordService, {
        email: 'reset@test.com',
        password: 'oldPassword123',
      });

      const token = '1234567890abcdef1234567890abcdef';

      await prisma.verificationTokens.create({
        data: {
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
          confirm_password: 'newPassword123'
        }).expect(201);

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

    it('should return an error if token is invalid', async () => {
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
        .expect((response) => {
          expect([400, 401, 404]).toContain(response.status);
        });
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
});