// src/test/e2e/user-preference.controller.spec-e2e.ts

import request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { createE2EApp } from './helpers/create-e2e-app';
import { resetDatabase } from './helpers/reset-database.helper-e2e';
import { createLoggedAgent } from './helpers/auth.helper-e2e';

import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';

describe('UserPreferenceController e2e', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const endpoint = '/users/preferences';

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

  describe('GET /users/preferences', () => {
    it('should create and return default preferences when user has no preferences', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const response = await agent
        .get(endpoint)
        .expect(200);

      expect(response.body.data).toEqual({
        theme: 'system',
        language: 'fr',
        fontSize: 'medium',
        reduceAnimations: false,
        showReadingTime: true,
        showAuthorDetails: true,
        hideReadPosts: false,
        notifyOnLike: true,
        notifyOnContribution: true,
        emailNotifications: false,
        newsletter: false,
        profileVisible: true,
        showLikedPosts: false,
        showContributions: true,
      });

      const preferences =
        await prisma.userPreference.findUnique({
          where: {
            userId: user.id,
          },
        });

      expect(preferences).not.toBeNull();

      expect(preferences).toEqual(
        expect.objectContaining({
          userId: user.id,
          theme: 'system',
          language: 'fr',
          fontSize: 'medium',
        }),
      );
    });

    it('should return existing preferences', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      await prisma.userPreference.create({
        data: {
          userId: user.id,
          theme: 'dark',
          language: 'en',
          fontSize: 'large',
          notifyOnLike: false,
          newsletter: true,
        },
      });

      const response = await agent
        .get(endpoint)
        .expect(200);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          theme: 'dark',
          language: 'en',
          fontSize: 'large',
          notifyOnLike: false,
          newsletter: true,
        }),
      );
    });

    it('should return only one requested preference field', async () => {
      const { agent } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const response = await agent
        .get(`${endpoint}?fields=theme`)
        .expect(200);

      expect(response.body.data).toEqual({
        theme: 'system',
      });

      expect(
        Object.keys(response.body.data),
      ).toEqual(['theme']);
    });

    it('should return only requested preference fields', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      await prisma.userPreference.create({
        data: {
          userId: user.id,
          theme: 'dark',
          language: 'en',
          notifyOnLike: false,
        },
      });

      const response = await agent
        .get(
          `${endpoint}?fields=theme,language,notifyOnLike`,
        )
        .expect(200);

      expect(response.body.data).toEqual({
        theme: 'dark',
        language: 'en',
        notifyOnLike: false,
      });

      expect(
        Object.keys(response.body.data),
      ).toEqual(
        expect.arrayContaining([
          'theme',
          'language',
          'notifyOnLike',
        ]),
      );

      expect(
        Object.keys(response.body.data),
      ).toHaveLength(3);
    });

    it('should accept spaces around requested fields', async () => {
      const { agent } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const response = await agent
        .get(
          `${endpoint}?fields=%20theme%20,%20language%20`,
        )
        .expect(200);

      expect(response.body.data).toEqual({
        theme: 'system',
        language: 'fr',
      });
    });

    it('should return 400 for one invalid preference field', async () => {
      const { agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const response = await agent
        .get(`${endpoint}?fields=unknownColumn`)
        .expect(400);

      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'La préférence "unknownColumn" n\'existe pas.',
          data: expect.objectContaining({
            invalidFields: ['unknownColumn'],
          }),
        }),
      );
    });

    it('should return 400 when one requested field among valid fields is invalid', async () => {
      const { agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const response = await agent
        .get(
          `${endpoint}?fields=theme,unknownColumn,language`,
        )
        .expect(400);

      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'La préférence "unknownColumn" n\'existe pas.',
          data: expect.objectContaining({
            invalidFields: ['unknownColumn'],
          }),
        }),
      );
    });

    it('should return every invalid field', async () => {
      const { agent } = await createLoggedAgent(
        app,
        prisma,
        passwordService,
      );

      const response = await agent
        .get(
          `${endpoint}?fields=unknownOne,theme,unknownTwo`,
        )
        .expect(400);

      expect(response.body).toEqual(
        expect.objectContaining({
          message:
            "Les préférences suivantes n'existent pas : unknownOne, unknownTwo.",
          data: expect.objectContaining({
            invalidFields: [
              'unknownOne',
              'unknownTwo',
            ],
          }),
        }),
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      await request(app.getHttpServer())
        .get(endpoint)
        .expect(401);
    });
  });

  describe('PATCH /users/preferences', () => {
    it('should create preferences if user has no preference row', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const payload = {
        theme: 'dark',
        language: 'en',
        notifyOnLike: false,
      };

      const response = await agent
        .patch(endpoint)
        .send(payload)
        .expect(200);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          userId: user.id,
          theme: 'dark',
          language: 'en',
          notifyOnLike: false,
        }),
      );

      const preferences =
        await prisma.userPreference.findUnique({
          where: {
            userId: user.id,
          },
        });

      expect(preferences).toEqual(
        expect.objectContaining({
          userId: user.id,
          theme: 'dark',
          language: 'en',
          notifyOnLike: false,
        }),
      );
    });

    it('should update existing preferences', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      await prisma.userPreference.create({
        data: {
          userId: user.id,
          theme: 'system',
          language: 'fr',
          notifyOnLike: true,
        },
      });

      const response = await agent
        .patch(endpoint)
        .send({
          theme: 'dark',
          notifyOnLike: false,
        })
        .expect(200);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          userId: user.id,
          theme: 'dark',
          language: 'fr',
          notifyOnLike: false,
        }),
      );
    });

    it('should update only provided fields', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      await prisma.userPreference.create({
        data: {
          userId: user.id,
          theme: 'system',
          language: 'fr',
          newsletter: false,
        },
      });

      await agent
        .patch(endpoint)
        .send({
          newsletter: true,
        })
        .expect(200);

      const preferences =
        await prisma.userPreference.findUnique({
          where: {
            userId: user.id,
          },
        });

      expect(preferences).toEqual(
        expect.objectContaining({
          theme: 'system',
          language: 'fr',
          newsletter: true,
        }),
      );
    });

    it('should update every boolean preference', async () => {
      const { agent, user } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const payload = {
        reduceAnimations: true,
        showReadingTime: false,
        showAuthorDetails: false,
        hideReadPosts: true,
        notifyOnLike: false,
        notifyOnContribution: false,
        emailNotifications: true,
        newsletter: true,
        profileVisible: false,
        showLikedPosts: true,
        showContributions: false,
      };

      const response = await agent
        .patch(endpoint)
        .send(payload)
        .expect(200);

      expect(response.body.data).toEqual(
        expect.objectContaining(payload),
      );

      const preferences =
        await prisma.userPreference.findUnique({
          where: {
            userId: user.id,
          },
        });

      expect(preferences).toEqual(
        expect.objectContaining(payload),
      );
    });

    it('should return 400 for invalid theme', async () => {
      const { agent } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      await agent
        .patch(endpoint)
        .send({
          theme: 'blue',
        })
        .expect(400);
    });

    it('should return 400 for invalid language', async () => {
      const { agent } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      await agent
        .patch(endpoint)
        .send({
          language: 'de',
        })
        .expect(400);
    });

    it('should return 400 for invalid font size', async () => {
      const { agent } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      await agent
        .patch(endpoint)
        .send({
          fontSize: 'extra-large',
        })
        .expect(400);
    });

    it('should return 400 if boolean preference is a string', async () => {
      const { agent } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      await agent
        .patch(endpoint)
        .send({
          notifyOnLike: 'false',
        })
        .expect(400);
    });

    it('should reject unknown properties when whitelist forbids non-whitelisted fields', async () => {
      const { agent } =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      await agent
        .patch(endpoint)
        .send({
          theme: 'dark',
          unknownColumn: true,
        })
        .expect(400);
    });

    it('should return 401 when user is not authenticated', async () => {
      await request(app.getHttpServer())
        .patch(endpoint)
        .send({
          theme: 'dark',
        })
        .expect(401);
    });

    it('should not update preferences of another user', async () => {
      const firstUser =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
        );

      const secondUser =
        await createLoggedAgent(
          app,
          prisma,
          passwordService,
          {
            email:
              'second-preference-user@test.fr',
            pseudo:
              'second-preference-user',
          },
        );

      await prisma.userPreference.create({
        data: {
          userId: secondUser.user.id,
          theme: 'light',
        },
      });

      await firstUser.agent
        .patch(endpoint)
        .send({
          theme: 'dark',
        })
        .expect(200);

      const firstPreferences =
        await prisma.userPreference.findUnique({
          where: {
            userId: firstUser.user.id,
          },
        });

      const secondPreferences =
        await prisma.userPreference.findUnique({
          where: {
            userId: secondUser.user.id,
          },
        });

      expect(firstPreferences?.theme).toBe(
        'dark',
      );

      expect(secondPreferences?.theme).toBe(
        'light',
      );
    });
  });
});