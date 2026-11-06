import { PrismaService } from 'src/commons/prisma/prisma.service';
import { InvalidPreferenceFieldException } from 'src/modules/user-preferences/exceptions/invalid-preference-field.exception';
import { UserPreferenceField } from 'src/modules/user-preferences/helper/user.preferences.fields';
import { UserPreferenceService } from 'src/modules/user-preferences/user-preferences.service';

describe('UserPreferenceService', () => {
  let service: UserPreferenceService;

  const prismaMock = {
    userPreference: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const userId = 1;

  const preferencesMock = {
    id: 1,
    userId,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new UserPreferenceService(
      prismaMock as unknown as PrismaService,
    );
  });

  describe('getPreferences', () => {
    it('should return all user preferences', async () => {
      prismaMock.userPreference.upsert.mockResolvedValue(
        preferencesMock,
      );

      const result = await service.getPreferences(userId);

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId,
        },
        create: {
          userId,
        },
        update: {},
        select: undefined,
      });

      expect(result).toEqual(preferencesMock);
    });

    it('should create default preferences if user preferences do not exist', async () => {
      prismaMock.userPreference.upsert.mockResolvedValue(
        preferencesMock,
      );

      await service.getPreferences(userId);

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
          },
          create: {
            userId,
          },
          update: {},
        }),
      );
    });

    it('should return only one requested field', async () => {
      prismaMock.userPreference.upsert.mockResolvedValue({
        theme: 'dark',
      });

      const result = await service.getPreferences(
        userId,
        ["theme"],
      );

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId,
        },
        create: {
          userId,
        },
        update: {},
        select: {
          theme: true,
        },
      });

      expect(result).toEqual({
        theme: 'dark',
      });
    });

    it('should return only requested fields', async () => {
      prismaMock.userPreference.upsert.mockResolvedValue({
        theme: 'dark',
        language: 'fr',
        notifyOnLike: false,
      });

      const result = await service.getPreferences(
        userId,
        ["theme","language","notifyOnLike"],
      );

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId,
        },
        create: {
          userId,
        },
        update: {},
        select: {
          theme: true,
          language: true,
          notifyOnLike: true,
        },
      });

      expect(result).toEqual({
        theme: 'dark',
        language: 'fr',
        notifyOnLike: false,
      });
    });

    it('should trim spaces around requested fields', async () => {
      prismaMock.userPreference.upsert.mockResolvedValue({
        theme: 'system',
        language: 'fr',
      });

      await service.getPreferences(
        userId,
        ["theme", "language"],
      );

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            theme: true,
            language: true,
          },
        }),
      );
    });

    it('should ignore empty values between commas', async () => {
      prismaMock.userPreference.upsert.mockResolvedValue({
        theme: 'system',
        language: 'fr',
      });

      await service.getPreferences(
        userId,
        ["theme", "language"],
      );

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            theme: true,
            language: true,
          },
        }),
      );
    });

    it('should throw InvalidPreferenceFieldException for one invalid field', async () => {
      await expect(
        service.getPreferences(
          userId,
          ['unknownColumn'] as unknown as UserPreferenceField[],
        ),
      ).rejects.toThrow(
        InvalidPreferenceFieldException,
      );

      expect(
        prismaMock.userPreference.upsert,
      ).not.toHaveBeenCalled();
    });

    it('should expose one invalid field in the exception response', async () => {
      expect.assertions(3);

      try {
        await service.getPreferences(
          userId,
          ["unknownColumn"] as unknown as UserPreferenceField[]
        );

          throw new InvalidPreferenceFieldException(["unknownColumn"])
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          InvalidPreferenceFieldException,
        );

        const response = (
          error as InvalidPreferenceFieldException
        ).getResponse() as {
          message: string;
          data: string[];
          meta?: unknown;
        };

        expect(response.data).toEqual([
          'unknownColumn',
        ]);
      }

      expect(
        prismaMock.userPreference.upsert,
      ).not.toHaveBeenCalled();
    });

    it('should throw InvalidPreferenceFieldException when one field among valid fields is invalid', async () => {
      await expect(
        service.getPreferences(
          userId,
          ["theme", "unknownColumn", "language"] as unknown as UserPreferenceField[]
        ),
      ).rejects.toThrow(
        InvalidPreferenceFieldException,
      );

      expect(
        prismaMock.userPreference.upsert,
      ).not.toHaveBeenCalled();
    });

    it('should expose every invalid field in the exception', async () => {
      expect.assertions(4);

      try {
        await service.getPreferences(
          userId,
          ["unknownOne","theme","unknownTwo"] as unknown as UserPreferenceField[],
        );

        throw new InvalidPreferenceFieldException(["unknownTwo", "unknownOne"])
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          InvalidPreferenceFieldException,
        );

        const response = (
          error as InvalidPreferenceFieldException
        ).getResponse() as {
          message: string;
          data: string[];
          meta?: unknown;
        };

        expect(response.data).toEqual([
          'unknownOne',
          'unknownTwo',
        ]);

        expect(response.message).toBe(
          "Les préférences suivantes n'existent pas : unknownOne, unknownTwo. Contactez un administrateur pour obtenir de l'aide.",
        );
      }

      expect(
        prismaMock.userPreference.upsert,
      ).not.toHaveBeenCalled();
    });

    it('should not query Prisma if at least one field is invalid', async () => {
      await expect(
        service.getPreferences(
          userId,
          ["theme","unknownOne","language","unknownTwo"] as unknown as UserPreferenceField[],
        ),
      ).rejects.toThrow(
        InvalidPreferenceFieldException,
      );

      expect(
        prismaMock.userPreference.upsert,
      ).not.toHaveBeenCalled();
    });

    it('should propagate Prisma errors', async () => {
      const error = new Error(
        'Database unavailable',
      );

      prismaMock.userPreference.upsert.mockRejectedValue(
        error,
      );

      await expect(
        service.getPreferences(userId),
      ).rejects.toThrow(error);

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledTimes(1);
    });
  });


  describe('isProfileVisible', () => {
    it('should return true when the profile is visible', async () => {
      prismaMock.userPreference.findUnique.mockResolvedValue({
        profileVisible: true,
      });

      const result =
        await service.isProfileVisible(
          userId,
        );

      expect(
        prismaMock.userPreference.findUnique,
      ).toHaveBeenCalledTimes(1);

      expect(
        prismaMock.userPreference.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          userId,
        },
        select: {
          profileVisible: true,
        },
      });

      expect(result).toBe(true);
    });

    it('should return false when the profile is private', async () => {
      prismaMock.userPreference.findUnique.mockResolvedValue({
        profileVisible: false,
      });

      const result =
        await service.isProfileVisible(
          userId,
        );

      expect(
        prismaMock.userPreference.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          userId,
        },
        select: {
          profileVisible: true,
        },
      });

      expect(result).toBe(false);
    });

    it('should return true when the user has no preference row', async () => {
      prismaMock.userPreference.findUnique.mockResolvedValue(
        null,
      );

      const result =
        await service.isProfileVisible(
          userId,
        );

      expect(result).toBe(true);
    });

    it('should use the supplied user id', async () => {
      const anotherUserId = 42;

      prismaMock.userPreference.findUnique.mockResolvedValue({
        profileVisible: true,
      });

      await service.isProfileVisible(
        anotherUserId,
      );

      expect(
        prismaMock.userPreference.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          userId: anotherUserId,
        },
        select: {
          profileVisible: true,
        },
      });
    });

    it('should propagate Prisma errors', async () => {
      const error = new Error(
        'Profile visibility lookup failed',
      );

      prismaMock.userPreference.findUnique.mockRejectedValue(
        error,
      );

      await expect(
        service.isProfileVisible(
          userId,
        ),
      ).rejects.toThrow(error);

      expect(
        prismaMock.userPreference.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          userId,
        },
        select: {
          profileVisible: true,
        },
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update existing user preferences', async () => {
      const payload = {
        theme: 'dark',
        notifyOnLike: false,
      };

      const updatedPreferences = {
        ...preferencesMock,
        ...payload,
      };

      prismaMock.userPreference.upsert.mockResolvedValue(
        updatedPreferences,
      );

      const result =
        await service.updatePreferences(
          userId,
          payload,
        );

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId,
        },
        create: {
          userId,
          ...payload,
        },
        update: payload,
      });

      expect(result).toEqual(
        updatedPreferences,
      );
    });

    it('should create preferences if they do not exist', async () => {
      const payload = {
        theme: 'light',
        language: 'en',
      };

      prismaMock.userPreference.upsert.mockResolvedValue({
        ...preferencesMock,
        ...payload,
      });

      const result =
        await service.updatePreferences(
          userId,
          payload,
        );

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId,
        },
        create: {
          userId,
          theme: 'light',
          language: 'en',
        },
        update: {
          theme: 'light',
          language: 'en',
        },
      });

      expect(result).toEqual({
        ...preferencesMock,
        ...payload,
      });
    });

    it('should update only provided properties', async () => {
      const payload = {
        newsletter: true,
      };

      const updatedPreferences = {
        ...preferencesMock,
        newsletter: true,
      };

      prismaMock.userPreference.upsert.mockResolvedValue(
        updatedPreferences,
      );

      const result =
        await service.updatePreferences(
          userId,
          payload,
        );

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId,
        },
        create: {
          userId,
          newsletter: true,
        },
        update: {
          newsletter: true,
        },
      });

      expect(result).toEqual(
        updatedPreferences,
      );
    });

    it('should update several boolean preferences', async () => {
      const payload = {
        reduceAnimations: true,
        showReadingTime: false,
        notifyOnLike: false,
        newsletter: true,
        profileVisible: false,
      };

      const updatedPreferences = {
        ...preferencesMock,
        ...payload,
      };

      prismaMock.userPreference.upsert.mockResolvedValue(
        updatedPreferences,
      );

      const result =
        await service.updatePreferences(
          userId,
          payload,
        );

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId,
        },
        create: {
          userId,
          ...payload,
        },
        update: payload,
      });

      expect(result).toEqual(
        updatedPreferences,
      );
    });

    it('should accept an empty update payload', async () => {
      const payload = {};

      prismaMock.userPreference.upsert.mockResolvedValue(
        preferencesMock,
      );

      const result =
        await service.updatePreferences(
          userId,
          payload,
        );

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId,
        },
        create: {
          userId,
        },
        update: {},
      });

      expect(result).toEqual(preferencesMock);
    });

    it('should use the supplied user id', async () => {
      const anotherUserId = 42;

      const payload = {
        theme: 'dark',
      };

      prismaMock.userPreference.upsert.mockResolvedValue({
        ...preferencesMock,
        userId: anotherUserId,
        theme: 'dark',
      });

      await service.updatePreferences(
        anotherUserId,
        payload,
      );

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId: anotherUserId,
        },
        create: {
          userId: anotherUserId,
          theme: 'dark',
        },
        update: {
          theme: 'dark',
        },
      });
    });

    it('should propagate Prisma errors during update', async () => {
      const error = new Error(
        'Preference update failed',
      );

      prismaMock.userPreference.upsert.mockRejectedValue(
        error,
      );

      await expect(
        service.updatePreferences(userId, {
          theme: 'dark',
        }),
      ).rejects.toThrow(error);

      expect(
        prismaMock.userPreference.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId,
        },
        create: {
          userId,
          theme: 'dark',
        },
        update: {
          theme: 'dark',
        },
      });
    });
  });
});