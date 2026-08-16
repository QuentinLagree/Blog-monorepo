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

  

  describe(`POST ${endpoint}/:id/add-like`, () => {
    it('should add the first like to a post', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          title: 'Post to like',
          content: 'Post content',
          published_at: new Date(),
        },
      );

      const response = await agent
        .post(
          `${endpoint}/${post.id}/add-like`,
        )
        .send({})
        .expect(201);

      expect(response.body.data).toEqual({
        liked: true,
        likesCount: 1,
      });

      const like =
        await prisma.like.findUnique({
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
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          title: 'Like message test',
          published_at: new Date(),
        },
      );

      const response = await agent
        .post(
          `${endpoint}/${post.id}/add-like`,
        )
        .send({})
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          message:
            'Le like a été effectué avec succès.',
          data: {
            liked: true,
            likesCount: 1,
          },
        }),
      );
    });

    it('should not create a duplicate like', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          title: 'Duplicate like post',
          published_at: new Date(),
        },
      );

      await agent
        .post(
          `${endpoint}/${post.id}/add-like`,
        )
        .send({})
        .expect(201);

      const response = await agent
        .post(
          `${endpoint}/${post.id}/add-like`,
        )
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

    it('should keep likes from different posts independent', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const firstPost =
        await createTestPost(
          prisma,
          user.id,
          {
            title: 'First liked post',
            published_at: new Date(),
          },
        );

      const secondPost =
        await createTestPost(
          prisma,
          user.id,
          {
            title: 'Second liked post',
            published_at: new Date(),
          },
        );

      await agent
        .post(
          `${endpoint}/${firstPost.id}/add-like`,
        )
        .send({})
        .expect(201);

      await agent
        .post(
          `${endpoint}/${secondPost.id}/add-like`,
        )
        .send({})
        .expect(201);

      const firstPostLikes =
        await prisma.like.count({
          where: {
            postId: firstPost.id,
          },
        });

      const secondPostLikes =
        await prisma.like.count({
          where: {
            postId: secondPost.id,
          },
        });

      expect(firstPostLikes).toBe(1);
      expect(secondPostLikes).toBe(1);
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          published_at: new Date(),
        },
      );

      await request(app.getHttpServer())
        .post(
          `${endpoint}/${post.id}/add-like`,
        )
        .send({})
        .expect(401);

      const likesCount =
        await prisma.like.count({
          where: {
            postId: post.id,
          },
        });

      expect(likesCount).toBe(0);
    });

    it('should return 400 if the post id is not a number', async () => {
      const { agent } =
        await createLoggedAgent(
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

  describe(`DELETE ${endpoint}/:id/unlike`, () => {
    it('should remove an existing like', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          title: 'Post to unlike',
          published_at: new Date(),
        },
      );

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      const response = await agent
        .delete(
          `${endpoint}/${post.id}/unlike`,
        )
        .expect(200);

      expect(response.body.data).toEqual({
        liked: false,
        likesCount: 0,
      });

      const like =
        await prisma.like.findUnique({
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
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          published_at: new Date(),
        },
      );

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      const response = await agent
        .delete(
          `${endpoint}/${post.id}/unlike`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          message:
            'Le like a été supprimé avec succès.',
          data: {
            liked: false,
            likesCount: 0,
          },
        }),
      );
    });

    it('should not throw if the like does not exist', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          published_at: new Date(),
        },
      );

      const response = await agent
        .delete(
          `${endpoint}/${post.id}/unlike`,
        )
        .expect(200);

      expect(response.body.data).toEqual({
        liked: false,
        likesCount: 0,
      });
    });

    it('should only remove the like from the requested post', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const firstPost =
        await createTestPost(
          prisma,
          user.id,
          {
            title: 'First liked post',
            published_at: new Date(),
          },
        );

      const secondPost =
        await createTestPost(
          prisma,
          user.id,
          {
            title: 'Second liked post',
            published_at: new Date(),
          },
        );

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
        .delete(
          `${endpoint}/${firstPost.id}/unlike`,
        )
        .expect(200);

      const firstLike =
        await prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: user.id,
              postId: firstPost.id,
            },
          },
        });

      const secondLike =
        await prisma.like.findUnique({
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

    it('should return 401 if the user is not authenticated', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          published_at: new Date(),
        },
      );

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      await request(app.getHttpServer())
        .delete(
          `${endpoint}/${post.id}/unlike`,
        )
        .expect(401);

      const like =
        await prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: user.id,
              postId: post.id,
            },
          },
        });

      expect(like).not.toBeNull();
    });

    it('should return 400 if the post id is not a number', async () => {
      const { agent } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      await agent
        .delete(`${endpoint}/abc/unlike`)
        .expect(400);
    });
  });

  describe(`GET ${endpoint}/:id/like-status`, () => {
    it('should return a negative status for a post without likes', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          published_at: new Date(),
        },
      );

      const response = await agent
        .get(
          `${endpoint}/${post.id}/like-status`,
        )
        .expect(200);

      expect(response.body.data).toEqual({
        liked: false,
        likesCount: 0,
      });
    });

    it('should return liked true when the authenticated user liked the post', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          published_at: new Date(),
        },
      );

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      const response = await agent
        .get(
          `${endpoint}/${post.id}/like-status`,
        )
        .expect(200);

      expect(response.body.data).toEqual({
        liked: true,
        likesCount: 1,
      });
    });

    it('should return the expected success message', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          published_at: new Date(),
        },
      );

      const response = await agent
        .get(
          `${endpoint}/${post.id}/like-status`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          message:
            "Statut du like de l'article.",
          data: {
            liked: false,
            likesCount: 0,
          },
        }),
      );
    });

    it('should return the updated status after adding a like', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          published_at: new Date(),
        },
      );

      await agent
        .post(
          `${endpoint}/${post.id}/add-like`,
        )
        .send({})
        .expect(201);

      const response = await agent
        .get(
          `${endpoint}/${post.id}/like-status`,
        )
        .expect(200);

      expect(response.body.data).toEqual({
        liked: true,
        likesCount: 1,
      });
    });

    it('should return the updated status after removing a like', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          published_at: new Date(),
        },
      );

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      await agent
        .delete(
          `${endpoint}/${post.id}/unlike`,
        )
        .expect(200);

      const response = await agent
        .get(
          `${endpoint}/${post.id}/like-status`,
        )
        .expect(200);

      expect(response.body.data).toEqual({
        liked: false,
        likesCount: 0,
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { user } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const post = await createTestPost(
        prisma,
        user.id,
        {
          published_at: new Date(),
        },
      );

      await request(app.getHttpServer())
        .get(
          `${endpoint}/${post.id}/like-status`,
        )
        .expect(401);
    });

    it('should return 400 if the post id is not a number', async () => {
      const { agent } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      await agent
        .get(`${endpoint}/abc/like-status`)
        .expect(400);
    });
  });

  describe(
    `GET ${endpoint}/profil/:id/like-count`,
    () => {
      it('should return zero for a post without likes', async () => {
        const { user } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        const response = await request(
          app.getHttpServer(),
        )
          .get(
            `${endpoint}/profil/${post.id}/like-count`,
          )
          .expect(200);

        expect(response.body.data).toEqual({
          liked: false,
          likesCount: 0,
        });
      });

      it('should return the total number of likes for the post', async () => {
        const { user } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        await prisma.like.create({
          data: {
            userId: user.id,
            postId: post.id,
          },
        });

        const response = await request(
          app.getHttpServer(),
        )
          .get(
            `${endpoint}/profil/${post.id}/like-count`,
          )
          .expect(200);

        expect(response.body.data).toEqual({
          liked: false,
          likesCount: 1,
        });
      });

      it('should return the expected success message', async () => {
        const { user } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        const response = await request(
          app.getHttpServer(),
        )
          .get(
            `${endpoint}/profil/${post.id}/like-count`,
          )
          .expect(200);

        expect(response.body).toEqual({
          message:
            "Nombre de like de l'article.",
          data: {
            liked: false,
            likesCount: 0,
          },
        });
      });

      it('should be accessible without authentication', async () => {
        const { user } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        await request(app.getHttpServer())
          .get(
            `${endpoint}/profil/${post.id}/like-count`,
          )
          .expect(200);
      });

      it('should always return liked false', async () => {
        const { user } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        await prisma.like.create({
          data: {
            userId: user.id,
            postId: post.id,
          },
        });

        const response = await request(
          app.getHttpServer(),
        )
          .get(
            `${endpoint}/profil/${post.id}/like-count`,
          )
          .expect(200);

        expect(
          response.body.data.liked,
        ).toBe(false);
      });

      it('should return 400 if the post id is not a number', async () => {
        await request(app.getHttpServer())
          .get(
            `${endpoint}/profil/abc/like-count`,
          )
          .expect(400);
      });

      it('should return zero for an unknown numeric post id', async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .get(
            `${endpoint}/profil/999999/like-count`,
          )
          .expect(200);

        expect(response.body.data).toEqual({
          liked: false,
          likesCount: 0,
        });
      });
    },
  );

  describe(
    `GET ${endpoint}/:postId/reading-status`,
    () => {
      it('should return 401 if the user is not authenticated', async () => {
        const { user } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        await request(app.getHttpServer())
          .get(
            `${endpoint}/${post.id}/reading-status`,
          )
          .expect(401);
      });

      it('should return a not-started reading status', async () => {
        const { user, agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        const response = await agent
          .get(
            `${endpoint}/${post.id}/reading-status`,
          )
          .expect(200);

        expect(response.body.data).toEqual({
          hasStarted: false,
          completed: false,
          progress: 0,
        });
      });

      it('should return the expected success message', async () => {
        const { user, agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        const response = await agent
          .get(
            `${endpoint}/${post.id}/reading-status`,
          )
          .expect(200);

        expect(response.body).toEqual({
          message:
            "Statut de lecture de l'article.",
          data: {
            hasStarted: false,
            completed: false,
            progress: 0,
          },
        });
      });

      it('should return the saved reading progress', async () => {
        const { user, agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        await prisma.postRead.create({
          data: {
            userId: user.id,
            postId: post.id,
            progress: 45,
            completed: false,
          },
        });

        const response = await agent
          .get(
            `${endpoint}/${post.id}/reading-status`,
          )
          .expect(200);

        expect(response.body.data).toEqual({
          hasStarted: true,
          completed: false,
          progress: 45,
        });
      });

      it('should return a completed reading status', async () => {
        const { user, agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        await prisma.postRead.create({
          data: {
            userId: user.id,
            postId: post.id,
            progress: 100,
            completed: true,
          },
        });

        const response = await agent
          .get(
            `${endpoint}/${post.id}/reading-status`,
          )
          .expect(200);

        expect(response.body.data).toEqual({
          hasStarted: true,
          completed: true,
          progress: 100,
        });
      });

      it('should return 404 if the post does not exist', async () => {
        const { agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        await agent
          .get(
            `${endpoint}/999999/reading-status`,
          )
          .expect(404);
      });

      it('should return 400 if the post id is not a number', async () => {
        const { agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        await agent
          .get(
            `${endpoint}/abc/reading-status`,
          )
          .expect(400);
      });
    },
  );

  describe(
    `PATCH ${endpoint}/:postId/reading-progress`,
    () => {
      it('should return 401 if the user is not authenticated', async () => {
        const { user } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        await request(app.getHttpServer())
          .patch(
            `${endpoint}/${post.id}/reading-progress`,
          )
          .send({
            progress: 60,
          })
          .expect(401);

        const postRead =
          await prisma.postRead.findUnique({
            where: {
              userId_postId: {
                userId: user.id,
                postId: post.id,
              },
            },
          });

        expect(postRead).toBeNull();
      });

      it('should create the reading progress', async () => {
        const { user, agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        const response = await agent
          .patch(
            `${endpoint}/${post.id}/reading-progress`,
          )
          .send({
            progress: 60,
          })
          .expect(200);

        expect(response.body.data).toEqual(
          expect.objectContaining({
            userId: user.id,
            postId: post.id,
            progress: 60,
            completed: false,
          }),
        );

        const postRead =
          await prisma.postRead.findUnique({
            where: {
              userId_postId: {
                userId: user.id,
                postId: post.id,
              },
            },
          });

        expect(postRead).toEqual(
          expect.objectContaining({
            userId: user.id,
            postId: post.id,
            progress: 60,
            completed: false,
          }),
        );
      });

      it('should return the expected success message', async () => {
        const { user, agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        const response = await agent
          .patch(
            `${endpoint}/${post.id}/reading-progress`,
          )
          .send({
            progress: 25,
          })
          .expect(200);

        expect(response.body).toEqual(
          expect.objectContaining({
            message:
              'La progression de lecture a été mise à jour.',
            data: expect.objectContaining({
              progress: 25,
            }),
          }),
        );
      });

      it('should update an existing reading progress', async () => {
        const { user, agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        await prisma.postRead.create({
          data: {
            userId: user.id,
            postId: post.id,
            progress: 20,
            completed: false,
          },
        });

        await agent
          .patch(
            `${endpoint}/${post.id}/reading-progress`,
          )
          .send({
            progress: 75,
          })
          .expect(200);

        const postRead =
          await prisma.postRead.findUnique({
            where: {
              userId_postId: {
                userId: user.id,
                postId: post.id,
              },
            },
          });

        expect(postRead).toEqual(
          expect.objectContaining({
            progress: 75,
            completed: false,
          }),
        );
      });

      it('should mark the reading as completed at 95 percent', async () => {
        const { user, agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        const response = await agent
          .patch(
            `${endpoint}/${post.id}/reading-progress`,
          )
          .send({
            progress: 95,
          })
          .expect(200);

        expect(response.body.data).toEqual(
          expect.objectContaining({
            progress: 95,
            completed: true,
          }),
        );
      });

      it('should mark the reading as completed at 100 percent', async () => {
        const { user, agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        const response = await agent
          .patch(
            `${endpoint}/${post.id}/reading-progress`,
          )
          .send({
            progress: 100,
          })
          .expect(200);

        expect(response.body.data).toEqual(
          expect.objectContaining({
            progress: 100,
            completed: true,
          }),
        );
      });

      it('should return 404 if the post does not exist', async () => {
        const { agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        await agent
          .patch(
            `${endpoint}/999999/reading-progress`,
          )
          .send({
            progress: 50,
          })
          .expect(404);
      });

      it('should return 400 if the post id is not a number', async () => {
        const { agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        await agent
          .patch(
            `${endpoint}/invalid/reading-progress`,
          )
          .send({
            progress: 50,
          })
          .expect(400);
      });

      it('should return 400 if progress is missing', async () => {
        const { user, agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        await agent
          .patch(
            `${endpoint}/${post.id}/reading-progress`,
          )
          .send({})
          .expect(400);
      });

      it('should return 400 if progress is not a number', async () => {
        const { user, agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        await agent
          .patch(
            `${endpoint}/${post.id}/reading-progress`,
          )
          .send({
            progress: 'invalid',
          })
          .expect(400);
      });

      it('should return 400 if the payload contains an unknown field', async () => {
        const { user, agent } =
          await createLoggedAgent(
            app,
            prisma,
            passwordService,
          );

        const post =
          await createTestPost(
            prisma,
            user.id,
            {
              published_at: new Date(),
            },
          );

        await agent
          .patch(
            `${endpoint}/${post.id}/reading-progress`,
          )
          .send({
            progress: 50,
            unknownField: true,
          })
          .expect(400);
      });
    },
  );
});