// src/test/unit/user-preference/user-preference.controller.spec.ts

import { makeMessage } from 'src/commons/logger/logger.helper';
import { UserPreferenceController } from 'src/modules/user/user-preferences/user-preferences.controller';
import { UserPreferenceService } from 'src/modules/user/user-preferences/user-preferences.service';

describe('UserPreferenceController', () => {
  let controller: UserPreferenceController;

  const preferenceServiceMock = {
    getPreferences: jest.fn(),
    isProfileVisible: jest.fn(),
    updatePreferences: jest.fn(),
  };

  const userId = 1;
  const otherId = 2

  const createSessionMock = (
    id: number = userId,
  ) => ({
    get: jest.fn().mockImplementation(
      (key: string) => {
        if (key === 'user') {
          return {
            id,
          };
        }

        return undefined;
      },
    ),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new UserPreferenceController(
      preferenceServiceMock as unknown as UserPreferenceService,
    );
  });

  describe('getPreferences', () => {
    it('should return all preferences of connected user', async () => {
      const sessionMock =
        createSessionMock();

      const preferences = {
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
      };

      preferenceServiceMock.getPreferences.mockResolvedValue(
        preferences,
      );

      const response =
        await controller.getPreferences(
          {},
          sessionMock as any,
        );

      expect(
        sessionMock.get,
      ).toHaveBeenCalledWith('user');

      expect(
        preferenceServiceMock.getPreferences,
      ).toHaveBeenCalledWith(
        userId,
        undefined,
      );

      expect(response).toEqual(
        makeMessage(
          'User preferences',
          'Préférences utilisateur récupérées.',
          preferences,
        ),
      );
    });

    it('should return only requested preference fields', async () => {
      const sessionMock =
        createSessionMock();

      const query = {
        fields: 'theme,language',
      };

      const preferences = {
        theme: 'dark',
        language: 'fr',
      };

      preferenceServiceMock.getPreferences.mockResolvedValue(
        preferences,
      );

      const response =
        await controller.getPreferences(
          query,
          sessionMock as any,
        );

      expect(
        preferenceServiceMock.getPreferences,
      ).toHaveBeenCalledWith(
        userId,
        'theme,language',
      );

      expect(response.data).toEqual({
        theme: 'dark',
        language: 'fr',
      });
    });

    it('should use connected user id from session', async () => {
      const anotherUserId = 42;

      const sessionMock =
        createSessionMock(
          anotherUserId,
        );

      preferenceServiceMock.getPreferences.mockResolvedValue(
        {},
      );

      await controller.getPreferences(
        {},
        sessionMock as any,
      );

      expect(
        preferenceServiceMock.getPreferences,
      ).toHaveBeenCalledWith(
        anotherUserId,
        undefined,
      );
    });

    it('should propagate invalid preference field exception', async () => {
      const sessionMock =
        createSessionMock();

      const error = new Error(
        'Invalid preference field',
      );

      preferenceServiceMock.getPreferences.mockRejectedValue(
        error,
      );

      await expect(
        controller.getPreferences(
          {
            fields: 'unknownColumn',
          },
          sessionMock as any,
        ),
      ).rejects.toThrow(error);
    });

    it('should propagate preference service errors', async () => {
      const sessionMock =
        createSessionMock();

      const error = new Error(
        'Unable to retrieve preferences',
      );

      preferenceServiceMock.getPreferences.mockRejectedValue(
        error,
      );

      await expect(
        controller.getPreferences(
          {},
          sessionMock as any,
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('getProfileVisibility', () => {
    it('should return profilVisible to true', async () => {
      const userId = 1;

      preferenceServiceMock
        .isProfileVisible
        .mockResolvedValue(true);

      const result =
        await controller.getProfileVisibility(
          userId,
        );

      expect(
        preferenceServiceMock.isProfileVisible,
      ).toHaveBeenCalledTimes(1);

      expect(
        preferenceServiceMock.isProfileVisible,
      ).toHaveBeenCalledWith(userId);

      expect(result).toEqual({
        message:
          'Visibilité du profil récupérée.',
        data: {
          profileVisible: true,
        },
      });
    });

    it('should return profilVisible to false', async () => {
      const userId = 2;

      preferenceServiceMock
        .isProfileVisible
        .mockResolvedValue(false);

      const result =
        await controller.getProfileVisibility(
          userId,
        );

      expect(
        preferenceServiceMock.isProfileVisible,
      ).toHaveBeenCalledWith(userId);

      expect(result).toEqual({
        message:
          'Visibilité du profil récupérée.',
        data: {
          profileVisible: false,
        },
      });
    });

    it('should propagate preference get errors', async () => {
      const userId = 999;

      const error =
        new Error(
          'Impossible de récupérer la préférence.',
        );

      preferenceServiceMock
        .isProfileVisible
        .mockRejectedValue(error);

      await expect(
        controller.getProfileVisibility(
          userId,
        ),
      ).rejects.toThrow(error);

      expect(
        preferenceServiceMock.isProfileVisible,
      ).toHaveBeenCalledWith(userId);
    });
  });

  describe('updatePreferences', () => {
    it('should update connected user preferences', async () => {
      const sessionMock =
        createSessionMock();

      const payload = {
        theme: 'dark',
        language: 'fr',
        notifyOnLike: false,
      };

      const updatedPreferences = {
        userId,
        ...payload,
      };

      preferenceServiceMock.updatePreferences.mockResolvedValue(
        updatedPreferences,
      );

      const response =
        await controller.updatePreferences(
          payload,
          sessionMock as any,
        );

      expect(
        sessionMock.get,
      ).toHaveBeenCalledWith('user');

      expect(
        preferenceServiceMock.updatePreferences,
      ).toHaveBeenCalledWith(
        userId,
        payload,
      );

      expect(response).toEqual(
        makeMessage(
          'User preferences updated',
          'Les préférences ont été mises à jour.',
          updatedPreferences,
        ),
      );
    });

    it('should update only one preference', async () => {
      const sessionMock =
        createSessionMock();

      const payload = {
        newsletter: true,
      };

      preferenceServiceMock.updatePreferences.mockResolvedValue(
        {
          userId,
          newsletter: true,
        },
      );

      const response =
        await controller.updatePreferences(
          payload,
          sessionMock as any,
        );

      expect(
        preferenceServiceMock.updatePreferences,
      ).toHaveBeenCalledWith(
        userId,
        {
          newsletter: true,
        },
      );

      expect(response.data).toEqual({
        userId,
        newsletter: true,
      });
    });

    it('should use connected user id from session during update', async () => {
      const anotherUserId = 84;

      const sessionMock =
        createSessionMock(
          anotherUserId,
        );

      const payload = {
        theme: 'light',
      };

      preferenceServiceMock.updatePreferences.mockResolvedValue(
        payload,
      );

      await controller.updatePreferences(
        payload,
        sessionMock as any,
      );

      expect(
        preferenceServiceMock.updatePreferences,
      ).toHaveBeenCalledWith(
        anotherUserId,
        payload,
      );
    });

    it('should propagate preference update errors', async () => {
      const sessionMock =
        createSessionMock();

      const error = new Error(
        'Unable to update preferences',
      );

      preferenceServiceMock.updatePreferences.mockRejectedValue(
        error,
      );

      await expect(
        controller.updatePreferences(
          {
            theme: 'dark',
          },
          sessionMock as any,
        ),
      ).rejects.toThrow(error);
    });
  });
});