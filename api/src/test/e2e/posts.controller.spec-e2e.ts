import request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { createE2EApp } from './helpers/create-e2e-app';
import { resetDatabase } from './helpers/reset-database.helper-e2e';
import {
  createLoggedAgent,
  createLoggedAdminAgent,
} from './helpers/auth.helper-e2e';
import { createTestPost } from './helpers/post.helper-e2e';

import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { PaginationDto } from 'src/modules/pagination/pagination.dto';
import { CreatePostDto } from 'src/modules/post/dto/create.post.dto';

describe('PostController e2e', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const endpoint = '/posts';

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

  describe('GET /post', () => {
    it('should return a list of posts', async () => {
      const { user, agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      ); 

      const post = await createTestPost(prisma, user.id, {
        title: 'First post',
        content: 'Content of first post',
      });

      const response = await agent
        .get(endpoint)
        .query({
          published: true
        } as PaginationDto)
        .expect(200)

        
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: post.id,
            title: post.title,
            content: post.content,
          }),
        ]),
      );
    });
    });

  describe('GET /post/:id', () => {
    it('should return a post by id', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Show post',
      });

      const response = await request(app.getHttpServer())
        .get(`${endpoint}/${post.id}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: post.id,
        title: post.title,
        content: post.content,
      });
    });

    it('should return 404 if post does not exist', async () => {
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

  describe('POST /post', () => {
    it('should create a post if user is connected', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const response = await agent
        .post(endpoint)
        .send({
          title: 'New post',
          description: "New post description",
          content: 'New post content',
        } as CreatePostDto)
        .expect(201)

      expect(response.body.data).toMatchObject({
        title: 'New post',
        content: 'New post content',
      });

      const postInDb = await prisma.post.findFirst({
        where: {
          title: 'New post',
          authorId: user.id,
        },
      });

      expect(postInDb).not.toBeNull();
    });

    it('should return 401 if user is not connected', async () => {
      await request(app.getHttpServer())
        .post(endpoint)
        .send({
          title: 'New post',
          content: 'New post content',
        })
        .expect(401);
    });

    it('should return 400 if payload is invalid', async () => {
      const { agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      await agent
        .post(endpoint)
        .send({
          title: '',
        })
        .expect(400);
    });
  });

  describe('PUT /post/:id', () => {
    it('should update own post', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Old title',
        content: 'Old content',
      });

      const response = await agent
        .patch(`${endpoint}/${post.id}`)
        .send({
          title: 'Updated title',
          content: 'Updated content',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: post.id,
        title: 'Updated title',
        content: 'Updated content',
      });
    });

    it('should return 403 if user tries to update another user post', async () => {
      const { user: owner } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const { agent: otherAgent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, owner.id);

      await otherAgent
        .patch(`${endpoint}/${post.id}`)
        .send({
          title: 'Hacked title',
        })
        .expect(403);
    });

    it('should allow admin to update another user post', async () => {
      const { user: owner } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const { agent: adminAgent } = await createLoggedAdminAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, owner.id);

      const response = await adminAgent
        .patch(`${endpoint}/${post.id}`)
        .send({
          title: 'Admin updated title',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: post.id,
        title: 'Admin updated title',
      });
    });

    it('should return 404 if post does not exist', async () => {
      const { agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      await agent
        .patch(`${endpoint}/999999`)
        .send({
          title: 'Updated title',
        })
        .expect(404);
    });
  });

  describe('DELETE /post/:id', () => {
    it('should delete own post', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id);

      await agent
        .delete(`${endpoint}/${post.id}`)
        .expect(200);

      const postInDb = await prisma.post.findUnique({
        where: {
          id: post.id,
        },
      });

      expect(postInDb).toBeNull();
    });

    it('should return 403 if user tries to delete another user post', async () => {
      const { user: owner } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const { agent: otherAgent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, owner.id);

      await otherAgent
        .delete(`${endpoint}/${post.id}`)
        .expect(403);
    });

    it('should allow admin to delete another user post', async () => {
      const { user: owner } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const { agent: adminAgent } = await createLoggedAdminAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, owner.id);

      await adminAgent
        .delete(`${endpoint}/${post.id}`)
        .expect(200);

      const postInDb = await prisma.post.findUnique({
        where: {
          id: post.id,
        },
      });

      expect(postInDb).toBeNull();
    });

    it('should return 404 if post does not exist', async () => {
      const { agent } = await createLoggedAgent(
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