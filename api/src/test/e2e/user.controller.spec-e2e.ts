import request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { createE2EApp } from './helpers/create-e2e-app';
import { resetDatabase } from './helpers/reset-database.helper-e2e';
import { createLoggedAgent, createLoggedAdminAgent } from './helpers/auth.helper-e2e';

import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { Role } from 'src/commons/roles/role.enum';
import { createTestUser } from './helpers/create_user-helper-e2e';

describe('UserController e2e', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const endpoint = '/user';

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

  describe('GET /user', () => {
    it('should return a list of users if connected user is admin', async () => {
      const { agent, user: admin } = await createLoggedAdminAgent(
        app,
        prisma,
        passwordService,
      );

      const secondUser = await createTestUser(prisma, passwordService, {
        email: 'test32@gmail.com',
      });

      const response = await agent
        .get(endpoint)
        .expect(200);

      expect(response.body.message).toBe('Liste de tous les utilisateurs');

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: admin.id,
            email: admin.email,
            pseudo: admin.pseudo,
            nom: admin.nom,
            prenom: admin.prenom,
            role: admin.role,
          }),
          expect.objectContaining({
            id: secondUser.id,
            email: secondUser.email,
            pseudo: secondUser.pseudo,
            nom: secondUser.nom,
            prenom: secondUser.prenom,
            role: secondUser.role,
          }),
        ]),
      );

      expect(response.body.data).toHaveLength(2);

      response.body.data.forEach((user) => {
        expect(user.password).toBeUndefined();
      });
    });

    it('should return 403 if connected user is not admin', async () => {
      const { agent } = await createLoggedAgent(app, prisma, passwordService, {
        role: Role.User,
      });

      const response = await agent
        .get(endpoint)
        .expect(403);

      expect(response.body).toMatchObject({
        message: `Vous n'avez pas l'autorisation d'accéder à cette ressource.`,
      });
    });

    it('should return 401 if user is not connected', async () => {
      await request(app.getHttpServer())
        .get(endpoint)
        .expect(401);
    });
  });

  describe('GET /user/:id', () => {
    it('should return a user by id', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const response = await agent
        .get(`${endpoint}/${user.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: `L'utilisateur ${user.id} a bien été trouvé.`,
        data: {
          id: user.id,
          email: user.email,
          pseudo: user.pseudo,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
        },
      });

      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 404 if user does not exist', async () => {
      const { agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      await agent
        .get(`${endpoint}/999999`)
        .expect(404);
    });

    it('should return 400 if id is not a number', async () => {
      const { agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      await agent
        .get(`${endpoint}/abc`)
        .expect(400);
    });
  });

  describe('PUT /user/:id', () => {
    it('should update current user', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const response = await agent
        .put(`${endpoint}/${user.id}`)
        .send({
          pseudo: 'updatedPseudo',
          nom: 'Updated',
          prenom: 'User',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: user.id,
        pseudo: 'updatedPseudo',
        nom: 'Updated',
        prenom: 'User',
      });

      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 404 if user does not exist', async () => {
      const { agent } = await createLoggedAdminAgent(
        app,
        prisma,
        passwordService,
      );

      await agent
        .put(`${endpoint}/999999`)
        .send({
          pseudo: 'unknown',
        })
        .expect(404);
    });
  });

  describe('DELETE /user/:id', () => {
    it('should delete a user if connected user is admin', async () => {
      const { agent } = await createLoggedAdminAgent(
        app,
        prisma,
        passwordService,
      );

      const userToDelete = await createTestUser(prisma, passwordService);

      await agent
        .delete(`${endpoint}/${userToDelete.id}`)
        .expect(200);

      const deletedUser = await prisma.user.findUnique({
        where: {
          id: userToDelete.id,
        },
      });

      expect(deletedUser).toBeNull();
    });

    it('should return 404 if user does not exist', async () => {
      const { agent } = await createLoggedAdminAgent(
        app,
        prisma,
        passwordService,
      );

      await agent
        .delete(`${endpoint}/999999`)
        .expect(404);
    });
  });
});