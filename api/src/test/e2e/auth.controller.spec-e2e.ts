import request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { createE2EApp } from './helpers/create-e2e-app';
import { resetDatabase } from './helpers/reset-database.helper-e2e';
import { createLoggedAgent } from './helpers/auth.helper-e2e';

import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { createTestUser } from './helpers/create_user-helper-e2e';
import { Role } from 'src/commons/roles/role.enum';

describe('AuthController e2e', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const endpoint = '/auth';

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

  describe('POST /auth/register', () => {
    it('should register a user', async () => {
      const response = await request(app.getHttpServer())
        .post(`${endpoint}/register`)
        .send({
          email: 'register@test.com',
          pseudo: 'registerUser',
          nom: 'Doe',
          prenom: 'John',
          password: 'password123',
          role: Role.User
        }).expect(201)

        

        

      expect(response.body.data).toMatchObject({
        email: 'register@test.com',
        pseudo: 'registerUser',
        nom: 'Doe',
        prenom: 'John',
      });
      

      expect(response.body.data.password).toBeUndefined();

      const userInDb = await prisma.user.findUnique({
        where: {
          email: 'register@test.com',
        },
      });

      expect(userInDb).not.toBeNull();
    });

    it('should return 409 if email already exists', async () => {
      await createTestUser(prisma, passwordService, {
        email: 'already@test.com',
      });

      await request(app.getHttpServer())
        .post(`${endpoint}/register`)
        .send({
          email: 'already@test.com',
          pseudo: 'anotherUser',
          nom: 'Doe',
          prenom: 'John',
          password: 'password123',
          role: Role.User
        }).expect(409);
    });

    it('should return 400 if payload is invalid', async () => {
      await request(app.getHttpServer())
        .post(`${endpoint}/register`)
        .send({
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login a user and create a session', async () => {
      await createTestUser(prisma, passwordService, {
        email: 'login@test.com',
        password: 'password123',
      });

      const response = await request(app.getHttpServer())
        .post(`${endpoint}/login`)
        .send({
          email: 'login@test.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.message).toBe('La connection est un succès.');

      expect(response.body.data).toMatchObject({
        email: 'login@test.com',
      });

      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 if email does not exist', async () => {
      await request(app.getHttpServer())
        .post(`${endpoint}/login`)
        .send({
          email: 'unknown@test.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 401 if password is wrong', async () => {
      await createTestUser(prisma, passwordService, {
        email: 'wrong-password@test.com',
        password: 'password123',
      });

      await request(app.getHttpServer())
        .post(`${endpoint}/login`)
        .send({
          email: 'wrong-password@test.com',
          password: 'wrong-password',
        })
        .expect(401);
    });
  });

  describe('GET /auth/session', () => {
    it('should return loggedIn true if session is active', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const response = await agent
        .get(`${endpoint}/session`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'La session est bien active.',
        data: {
          loggedIn: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
      });
    });

    it('should return 401 if session is inactive', async () => {
      const response = await request(app.getHttpServer())
        .get(`${endpoint}/session`)
        .expect(401);

      expect(response.body.message).toBe('Aucune session active');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user', async () => {
      const { agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      await agent
        .post(`${endpoint}/logout`)
        .expect(201);

      await agent
        .get(`${endpoint}/session`)
        .expect(401);
    });
  });
});