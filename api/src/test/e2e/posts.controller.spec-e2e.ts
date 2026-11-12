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

  describe(`GET ${endpoint}`, () => {
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
          published: true,
        } as PaginationDto)
        .expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: post.id,
            title: post.title,
          }),
        ]),
      );
    });
  });

  describe(`POST ${endpoint}`, () => {
    it('should create a new draft post', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const payload = {
        title: 'Created post',
        description: 'Created post description',
        content: 'Created post content',
      };

      const response = await agent.post(endpoint).send(payload).expect(201);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          title: payload.title,
          description: payload.description,
          content: payload.content,
          authorId: user.id,
          published_at: null,
        }),
      );

      const createdPost = await prisma.post.findFirst({
        where: {
          title: payload.title,
          authorId: user.id,
        },
      });

      expect(createdPost).not.toBeNull();

      expect(createdPost).toEqual(
        expect.objectContaining({
          title: payload.title,
          description: payload.description,
          content: payload.content,
          authorId: user.id,
          published_at: null,
        }),
      );
    });

    it('should return the expected success message', async () => {
      const { agent } = await createLoggedAgent(app, prisma, passwordService);

      const response = await agent
        .post(endpoint)
        .send({
          title: 'Message test post',
          description: 'Message test description',
          content: 'Message test content',
        })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          message:
            "La publication est créée, allez sur la page d'accueil ou votre compte pour la visualiser.",
          data: expect.objectContaining({
            title: 'Message test post',
          }),
        }),
      );
    });

    it('should use the authenticated user as the author', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const response = await agent
        .post(endpoint)
        .send({
          title: 'Author test',
          description: 'Author test description',
          content: 'Author test content',
        })
        .expect(201);

      expect(response.body.data.authorId).toBe(user.id);
    });

    it('should return 401 if the user is not authenticated', async () => {
      await request(app.getHttpServer())
        .post(endpoint)
        .send({
          title: 'Unauthorized post',
          description: 'Unauthorized description',
          content: 'Unauthorized content',
        })
        .expect(401);

      const post = await prisma.post.findFirst({
        where: {
          title: 'Unauthorized post',
        },
      });

      expect(post).toBeNull();
    });

    it('should return 400 if the payload is invalid', async () => {
      const { agent } = await createLoggedAgent(app, prisma, passwordService);

      await agent.post(endpoint).send({}).expect(400);
    });

    it('should strip unknown fields when creating a post', async () => {
      const { agent } = await createLoggedAgent(app, prisma, passwordService);

      const response = await agent
        .post(endpoint)
        .send({
          title: 'Invalid payload',
          description: 'Invalid payload description',
          content: 'Invalid payload content',
          unknownField: true,
        })
        .expect(201);
      expect(JSON.stringify(response.body)).not.toContain('unknownField');
      expect(JSON.stringify(response.body)).not.toContain('unknownColumn');
    });
  });

  describe(`PATCH ${endpoint}/:id/publish`, () => {
    it('should publish a draft belonging to the authenticated user', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const draft = await createTestPost(prisma, user.id, {
        title: 'Draft to publish',
        published_at: null,
      });

      const publishedAt = new Date();

      const response = await agent
        .patch(`${endpoint}/${draft.id}/publish`)
        .send({
          published_at: publishedAt.toISOString(),
        })
        .expect(201);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: draft.id,
          authorId: user.id,
          published_at: publishedAt.toISOString(),
        }),
      );

      const updatedPost = await prisma.post.findUnique({
        where: {
          id: draft.id,
        },
      });

      expect(updatedPost?.published_at).not.toBeNull();

      expect(updatedPost?.published_at?.toISOString()).toBe(
        publishedAt.toISOString(),
      );
    });

    it('should return the expected success message', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const draft = await createTestPost(prisma, user.id, {
        published_at: null,
      });

      const response = await agent
        .patch(`${endpoint}/${draft.id}/publish`)
        .send({
          published_at: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'La publication a été publiée.',
          data: expect.objectContaining({
            id: draft.id,
          }),
        }),
      );
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { user } = await createLoggedAgent(app, prisma, passwordService);

      const draft = await createTestPost(prisma, user.id, {
        published_at: null,
      });

      await request(app.getHttpServer())
        .patch(`${endpoint}/${draft.id}/publish`)
        .send({
          published_at: new Date().toISOString(),
        })
        .expect(401);
    });

    it('should reject an invalid post id before publication', async () => {
      const { agent } = await createLoggedAgent(app, prisma, passwordService);

      await agent
        .patch(`${endpoint}/abc/publish`)
        .send({
          published_at: new Date().toISOString(),
        })
        .expect(404);
    });

    it('should return 404 if the post does not exist', async () => {
      const { agent } = await createLoggedAgent(app, prisma, passwordService);

      await agent
        .patch(`${endpoint}/999999/publish`)
        .send({
          published_at: new Date().toISOString(),
        })
        .expect(404);
    });

    it('should reject an already published post', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id, {
        published_at: new Date(),
      });

      const response = await agent
        .patch(`${endpoint}/${post.id}/publish`)
        .send({
          published_at: new Date().toISOString(),
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /posts/post/:id', () => {
    it('should return a post by id', async () => {
      const { user } = await createLoggedAgent(app, prisma, passwordService);

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
      await request(app.getHttpServer()).get(`${endpoint}/999999`).expect(404);
    });

    it('should return 400 if id is not a number', async () => {
      await request(app.getHttpServer()).get(`${endpoint}/abc`).expect(400);
    });
  });

  describe('POST /posts', () => {
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
          description: 'New post description',
          content: 'New post content',
        } as CreatePostDto)
        .expect(201);

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
      const { agent } = await createLoggedAgent(app, prisma, passwordService);

      await agent
        .post(endpoint)
        .send({
          title: '',
        })
        .expect(400);
    });
  });

  describe('PATCH /posts/:id', () => {
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
      const { agent } = await createLoggedAgent(app, prisma, passwordService);

      await agent
        .patch(`${endpoint}/999999`)
        .send({
          title: 'Updated title',
        })
        .expect(404);
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete own post', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(prisma, user.id);

      await agent.delete(`${endpoint}/${post.id}`).expect(204);

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

      await otherAgent.delete(`${endpoint}/${post.id}`).expect(403);
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

      await adminAgent.delete(`${endpoint}/${post.id}`).expect(204);

      const postInDb = await prisma.post.findUnique({
        where: {
          id: post.id,
        },
      });

      expect(postInDb).toBeNull();
    });

    it('should return 404 if post does not exist', async () => {
      const { agent } = await createLoggedAgent(app, prisma, passwordService);

      await agent.delete(`${endpoint}/999999`).expect(404);
    });
  });

  describe('slug and pagination contracts', () => {
    it('should find a published post by its generated slug', async () => {
      const { user } = await createLoggedAgent(app, prisma, passwordService);
      const post = await createTestPost(prisma, user.id, {
        title: 'Mon article',
      });
      const response = await request(app.getHttpServer())
        .get('/posts/slug/mon-article-' + post.id)
        .expect(200);
      expect(response.body.data).toMatchObject({
        id: post.id,
        content: post.content,
      });
    });
    it('should reject malformed, mismatching and unknown slugs', async () => {
      const { user } = await createLoggedAgent(app, prisma, passwordService);
      const post = await createTestPost(prisma, user.id, {
        title: 'Mon article',
      });
      await request(app.getHttpServer()).get('/posts/slug/invalid').expect(400);
      await request(app.getHttpServer())
        .get('/posts/slug/other-title-' + post.id)
        .expect(404);
      await request(app.getHttpServer())
        .get('/posts/slug/mon-article-999999')
        .expect(404);
    });
    it('should paginate published summaries and return the total', async () => {
      const { user } = await createLoggedAgent(app, prisma, passwordService);
      for (let i = 0; i < 3; i++) await createTestPost(prisma, user.id);
      await createTestPost(prisma, user.id, { published_at: null });
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ published: true, limit: 2, page: 2 })
        .expect(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta).toEqual({
        currentPage: 2,
        limit: 2,
        totalArticle: 3,
      });
      expect(response.body.data[0]).not.toHaveProperty('content');
      expect(response.body.data[0]).not.toHaveProperty('_count');
    });
    it('should exclude completed reads only for the current user', async () => {
      const { agent, user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );
      const read = await createTestPost(prisma, user.id);
      const unread = await createTestPost(prisma, user.id);
      await prisma.postRead.create({
        data: {
          userId: user.id,
          postId: read.id,
          progress: 100,
          completed: true,
        },
      });
      const response = await agent
        .get('/posts')
        .query({ published: true, reading: false })
        .expect(200);
      expect(response.body.data.map((post) => post.id)).toEqual([unread.id]);
      const publicResponse = await request(app.getHttpServer())
        .get('/posts')
        .query({ published: true, reading: false })
        .expect(200);
      expect(publicResponse.body.data).toHaveLength(2);
    });
    it.each([
      { page: 0 },
      { limit: 999 },
      { published: 'invalid' },
      { reading: 'invalid' },
    ])('should reject invalid pagination %j', async (query) => {
      await request(app.getHttpServer()).get('/posts').query(query).expect(400);
    });
  });
});
