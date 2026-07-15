import request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { createE2EApp } from './helpers/create-e2e-app';
import { resetDatabase } from './helpers/reset-database.helper-e2e';
import { createLoggedAgent } from './helpers/auth.helper-e2e';
import { createTestPost } from './helpers/post.helper-e2e';

import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';

describe('UserToPostController e2e', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const endpoint = '/users/posts';

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

  describe('GET /users/posts/:id', () => {
    it('should return published posts of one user', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'User post',
        content: 'User post content',
        published_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .get(`${endpoint}/${user.id}`)
        .expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: post.id,
            title: 'User post',
            content: 'User post content',
            description: post.description,
            authorId: user.id,
            published_at: post.published_at?.toISOString(),
            created_at: post.created_at.toISOString(),
            updated_at: post.updated_at.toISOString(),
          }),
        ]),
      );
    });

    it('should not return user drafts', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      await createTestPost(prisma, user.id, {
        title: 'Draft post',
        content: 'Draft post content',
        published_at: null,
      });

      const response = await request(app.getHttpServer())
        .get(`${endpoint}/${user.id}`)
        .expect(200);

      expect(response.body.data).toBeNull();
    });

    it('should return null if user has no published posts', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const response = await request(app.getHttpServer())
        .get(`${endpoint}/${user.id}`)
        .expect(200);

      expect(response.body.data).toBeNull();
    });

    it('should return 404 if user does not exist', async () => {
      await request(app.getHttpServer())
        .get(`${endpoint}/999999`)
        .expect(404);
    });

    it('should return 400 if user id is not a number', async () => {
      await request(app.getHttpServer())
        .get(`${endpoint}/abc`)
        .expect(400);
    });
  });

  describe('GET /users/posts/drafts/:id', () => {
    it('should return drafts of the connected user', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const draft = await createTestPost(prisma, user.id, {
        title: 'Draft post',
        content: 'Draft post content',
        published_at: null,
      });

      const response = await agent
        .get(`${endpoint}/drafts/${user.id}`)
        .expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: draft.id,
            title: draft.title,
            content: draft.content,
            authorId: user.id,
            published_at: null,
          }),
        ]),
      );
    });

    it('should return null if connected user has no drafts', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const response = await agent
        .get(`${endpoint}/drafts/${user.id}`)
        .expect(200);

      expect(response.body.data).toBeNull();
    });

    it('should return 401 if user is not authenticated', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      await request(app.getHttpServer())
        .get(`${endpoint}/drafts/${user.id}`)
        .expect(401);
    });

    it('should return 400 if user id is not a number', async () => {
      const { agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      await agent
        .get(`${endpoint}/drafts/abc`)
        .expect(403);
    });
  });

  describe('POST /users/posts/:id/add-like', () => {
    it('should add the first like to a post', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Post to like',
        content: 'Post content',
        published_at: new Date(),
      });

      const response = await agent
        .post(`${endpoint}/${post.id}/add-like`)
        .send({})
        .expect(201);

      expect(response.body.data).toEqual({
        liked: true,
        likesCount: 1,
      });

      const like = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: post.id,
          },
        },
      });

      expect(like).not.toBeNull();

      expect(like).toEqual(
        expect.objectContaining({
          userId: user.id,
          postId: post.id,
        }),
      );
    });

    it('should return the expected success message', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Post message test',
        content: 'Post content',
        published_at: new Date(),
      });

      const response = await agent
        .post(`${endpoint}/${post.id}/add-like`)
        .send({})
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          data: {
            liked: true,
            likesCount: 1,
          },
        }),
      );
    });

    it('should not create a duplicate like if user likes twice', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Post duplicate like',
        content: 'Post content',
        published_at: new Date(),
      });

      await agent
        .post(`${endpoint}/${post.id}/add-like`)
        .send({})
        .expect(201);

      const response = await agent
        .post(`${endpoint}/${post.id}/add-like`)
        .send({})
        .expect(201);

      expect(response.body.data).toEqual({
        liked: true,
        likesCount: 1,
      });

      const likes = await prisma.like.findMany({
        where: {
          userId: user.id,
          postId: post.id,
        },
      });

      expect(likes).toHaveLength(1);
    });

    it('should keep likes of different posts independent', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const firstPost = await createTestPost(prisma, user.id, {
        title: 'First post',
        content: 'First post content',
        published_at: new Date(),
      });

      const secondPost = await createTestPost(prisma, user.id, {
        title: 'Second post',
        content: 'Second post content',
        published_at: new Date(),
      });

      await agent
        .post(`${endpoint}/${firstPost.id}/add-like`)
        .send({})
        .expect(201);

      const response = await agent
        .post(`${endpoint}/${secondPost.id}/add-like`)
        .send({})
        .expect(201);

      expect(response.body.data).toEqual({
        liked: true,
        likesCount: 1,
      });

      const firstPostLikes = await prisma.like.count({
        where: {
          postId: firstPost.id,
        },
      });

      const secondPostLikes = await prisma.like.count({
        where: {
          postId: secondPost.id,
        },
      });

      expect(firstPostLikes).toBe(1);
      expect(secondPostLikes).toBe(1);
    });

    it('should return 401 if user is not authenticated', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        published_at: new Date(),
      });

      await request(app.getHttpServer())
        .post(`${endpoint}/${post.id}/add-like`)
        .send({})
        .expect(401);

      const likesCount = await prisma.like.count({
        where: {
          postId: post.id,
        },
      });

      expect(likesCount).toBe(0);
    });

    it('should return 400 if post id is not a number', async () => {
      const { agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      await agent
        .post(`${endpoint}/abc/add-like`)
        .send({})
        .expect(400);
    });
  });

  describe('DELETE /users/posts/:id/unlike', () => {
    it('should remove an existing like', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Post to unlike',
        content: 'Post content',
        published_at: new Date(),
      });

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      const response = await agent
        .delete(`${endpoint}/${post.id}/unlike`)
        .expect(200);

      expect(response.body.data).toEqual({
        liked: false,
        likesCount: 0,
      });

      const like = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: post.id,
          },
        },
      });

      expect(like).toBeNull();
    });

    it('should return the expected success message', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Unlike message test',
        content: 'Post content',
        published_at: new Date(),
      });

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      const response = await agent
        .delete(`${endpoint}/${post.id}/unlike`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          data: {
            liked: false,
            likesCount: 0,
          },
        }),
      );
    });

    it('should not throw if the like does not exist', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Post without like',
        content: 'Post content',
        published_at: new Date(),
      });

      const response = await agent
        .delete(`${endpoint}/${post.id}/unlike`)
        .expect(200);

      expect(response.body.data).toEqual({
        liked: false,
        likesCount: 0,
      });
    });

    it('should only delete the like for the requested post', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const firstPost = await createTestPost(prisma, user.id, {
        title: 'First liked post',
        content: 'First content',
        published_at: new Date(),
      });

      const secondPost = await createTestPost(prisma, user.id, {
        title: 'Second liked post',
        content: 'Second content',
        published_at: new Date(),
      });

      await prisma.like.createMany({
        data: [
          {
            userId: user.id,
            postId: firstPost.id,
          },
          {
            userId: user.id,
            postId: secondPost.id,
          },
        ],
      });

      await agent
        .delete(`${endpoint}/${firstPost.id}/unlike`)
        .expect(200);

      const firstLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: firstPost.id,
          },
        },
      });

      const secondLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: secondPost.id,
          },
        },
      });

      expect(firstLike).toBeNull();
      expect(secondLike).not.toBeNull();
    });

    it('should return 401 if user is not authenticated', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        published_at: new Date(),
      });

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      await request(app.getHttpServer())
        .delete(`${endpoint}/${post.id}/unlike`)
        .expect(401);

      const like = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: post.id,
          },
        },
      });

      expect(like).not.toBeNull();
    });

    it('should return 400 if post id is not a number', async () => {
      const { agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      await agent
        .delete(`${endpoint}/abc/unlike`)
        .expect(400);
    });
  });

  describe('GET /users/posts/:id/like-status', () => {
    it('should return liked false and zero likes for a new post', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Post without likes',
        content: 'Post content',
        published_at: new Date(),
      });

      const response = await agent
        .get(`${endpoint}/${post.id}/like-status`)
        .expect(200);

      expect(response.body.data).toEqual({
        liked: false,
        likesCount: 0,
      });
    });

    it('should return liked true when connected user liked the post', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Liked status post',
        content: 'Post content',
        published_at: new Date(),
      });

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      const response = await agent
        .get(`${endpoint}/${post.id}/like-status`)
        .expect(200);

      expect(response.body.data).toEqual({
        liked: true,
        likesCount: 1,
      });
    });

    it('should return the total number of likes for the post', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Like count post',
        content: 'Post content',
        published_at: new Date(),
      });

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      const response = await agent
        .get(`${endpoint}/${post.id}/like-status`)
        .expect(200);

      expect(response.body.data.likesCount).toBe(1);
      expect(response.body.data.liked).toBe(true);
    });

    it('should return the correct status after adding a like', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Status after like',
        content: 'Post content',
        published_at: new Date(),
      });

      await agent
        .post(`${endpoint}/${post.id}/add-like`)
        .send({})
        .expect(201);

      const response = await agent
        .get(`${endpoint}/${post.id}/like-status`)
        .expect(200);

      expect(response.body.data).toEqual({
        liked: true,
        likesCount: 1,
      });
    });

    it('should return the correct status after removing a like', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        title: 'Status after unlike',
        content: 'Post content',
        published_at: new Date(),
      });

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      await agent
        .delete(`${endpoint}/${post.id}/unlike`)
        .expect(200);

      const response = await agent
        .get(`${endpoint}/${post.id}/like-status`)
        .expect(200);

      expect(response.body.data).toEqual({
        liked: false,
        likesCount: 0,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        published_at: new Date(),
      });

      await request(app.getHttpServer())
        .get(`${endpoint}/${post.id}/like-status`)
        .expect(401);
    });

    it('should return 400 if post id is not a number', async () => {
      const { agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      await agent
        .get(`${endpoint}/abc/like-status`)
        .expect(400);
    });
  });
});