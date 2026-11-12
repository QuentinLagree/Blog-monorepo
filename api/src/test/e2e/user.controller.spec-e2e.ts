import request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { createE2EApp } from './helpers/create-e2e-app';
import { resetDatabase } from './helpers/reset-database.helper-e2e';
import {
  createLoggedAgent,
  createLoggedAdminAgent,
} from './helpers/auth.helper-e2e';

import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { createTestUser } from './helpers/create_user-helper-e2e';

describe('UserController e2e', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const endpoint = '/users';

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

  describe('GET /users', () => {
    it('should return a list of users if connected user is admin', async () => {
      const { agent, user: admin } = await createLoggedAdminAgent(
        app,
        prisma,
        passwordService,
      );

      const secondUser = await createTestUser(prisma, passwordService, {
        email: 'test32@gmail.com',
      });

      const response = await agent.get(endpoint).expect(200);

      expect(response.body.message).toBe('Liste de tous les utilisateurs');

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: admin.id,
            pseudo: admin.pseudo,
            role: admin.role,
          }),
          expect.objectContaining({
            id: secondUser.id,
            pseudo: secondUser.pseudo,
            role: secondUser.role,
          }),
        ]),
      );

      expect(response.body.data).toHaveLength(2);

      response.body.data.forEach((user) => {
        expect(user.password).toBeUndefined();
      });
    });

    it('should return 401 if user is not connected', async () => {
      await request(app.getHttpServer()).get(endpoint).expect(401);
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by id', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const response = await agent.get(`${endpoint}/${user.id}`).expect(200);

      expect(response.body).toMatchObject({
        message: `L'utilisateur ${user.id} a bien été trouvé.`,
        data: {
          id: user.id,
          pseudo: user.pseudo,
          role: user.role,
        },
      });

      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 404 if user does not exist', async () => {
      const { agent } = await createLoggedAgent(app, prisma, passwordService);

      await agent.get(`${endpoint}/999999`).expect(404);
    });

    it('should return 400 if id is not a number', async () => {
      const { agent } = await createLoggedAgent(app, prisma, passwordService);

      await agent.get(`${endpoint}/abc`).expect(400);
    });
  });

  describe('PUT /users/:id', () => {
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

  describe('DELETE /users/:id', () => {
    it('should delete a user if connected user is admin', async () => {
      const { agent } = await createLoggedAdminAgent(
        app,
        prisma,
        passwordService,
      );

      const userToDelete = await createTestUser(prisma, passwordService);

      await agent.delete(`${endpoint}/${userToDelete.id}`).expect(204);

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

      await agent.delete(`${endpoint}/999999`).expect(404);
    });
  });

  describe('user article lists', () => {
    it('should return only drafts of the requested user', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );
      const draft = await prisma.post.create({
        data: {
          authorId: user.id,
          title: 'Draft',
          content: 'Body',
          description: 'Description',
          published_at: null,
        },
      });
      await prisma.post.create({
        data: {
          authorId: user.id,
          title: 'Published',
          content: 'Body',
          description: 'Description',
          published_at: new Date(),
        },
      });
      const response = await agent
        .get('/users/' + user.id + '/drafts')
        .expect(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: draft.id,
        published_at: null,
      });
      expect(response.body.data[0]).not.toHaveProperty('content');
    });
    it('should return an empty array when the user has no drafts', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );
      const response = await agent
        .get('/users/' + user.id + '/drafts')
        .expect(200);
      expect(response.body.data).toEqual([]);
    });
    it('should require authentication to list drafts', async () => {
      await request(app.getHttpServer())
        .get('/users/999999/drafts')
        .expect(401);
    });
    it('should reject an invalid user id when listing drafts', async () => {
      const { agent } = await createLoggedAgent(app, prisma, passwordService);
      await agent.get('/users/abc/drafts').expect(400);
      await agent.get('/users/999999/drafts').expect(403);
    });
    it('should allow an admin to list every post belonging to a user', async () => {
      const { agent } = await createLoggedAdminAgent(
        app,
        prisma,
        passwordService,
      );
      const user = await createTestUser(prisma, passwordService);
      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          title: 'Post',
          content: 'Body',
          description: 'Description',
        },
      });
      const response = await agent
        .get('/users/' + user.id + '/posts')
        .expect(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(post.id);
    });
    it('should forbid regular users from the admin article list', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );
      await agent.get('/users/' + user.id + '/posts').expect(403);
    });
    it('should return an empty admin article list and reject missing users', async () => {
      const { agent, user } = await createLoggedAdminAgent(
        app,
        prisma,
        passwordService,
      );
      const response = await agent
        .get('/users/' + user.id + '/posts')
        .expect(200);
      expect(response.body.data).toEqual([]);
      await agent.get('/users/999999/posts').expect(404);
    });
    it('should prevent updating or deleting another account without the required role', async () => {
      const { agent } = await createLoggedAgent(app, prisma, passwordService);
      const other = await createTestUser(prisma, passwordService);
      await agent
        .put('/users/' + other.id)
        .send({ pseudo: 'changed' })
        .expect(403);
      await agent.delete('/users/' + other.id).expect(403);
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: other.id } }))
          .pseudo,
      ).toBe(other.pseudo);
    });
    it('should create a user through the users controller', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'users-create@test.com',
          pseudo: 'created-user',
          nom: 'Doe',
          prenom: 'John',
          password: 'password12345',
        })
        .expect(201);
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: 'users-create@test.com' },
      });
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data).not.toHaveProperty('password');
      await expect(
        passwordService.verifyPassword(user.password, 'password12345'),
      ).resolves.toBe(true);
    });
  });
});
