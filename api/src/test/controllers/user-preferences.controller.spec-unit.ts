import { UserSession } from 'src/commons/types/session-user.type';
import { UserPreferenceQueryDto } from 'src/modules/user-preferences/dto/query-preferences.user.dto';
import { UserPreferenceField } from 'src/modules/user-preferences/helper/user.preferences.fields';
import { UserPreferenceController } from 'src/modules/user-preferences/user-preferences.controller';
import { UserPreferenceService } from 'src/modules/user-preferences/user-preferences.service';

describe('UserPreferenceController', () => {
  let controller: UserPreferenceController;

  const preferenceServiceMock = {
    getPreferences: jest.fn(),
    isProfileVisible: jest.fn(),
    updatePreferences: jest.fn(),
  };

  const userId = 1;

  const createSessionUser = (id = userId): UserSession => ({
    id,
    email: 'test@test.com',
    role: 'user',
  });

  beforeEach(() => {
    jest.resetAllMocks();

    controller = new UserPreferenceController(
      preferenceServiceMock as unknown as UserPreferenceService,
    );
  });

  describe('getPreferences', () => {
    const userSession: UserSession = {
      id: userId,
      email: 'test@test.com',
      role: 'user',
    };
    it('should return all preferences of connected user', async () => {
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

      preferenceServiceMock.getPreferences.mockResolvedValue(preferences);

      const response = await controller.getPreferences(
        {},
        {
          ...userSession,
        },
      );

      expect(preferenceServiceMock.getPreferences).toHaveBeenCalledWith(
        userId,
        undefined,
      );

      expect(response).toEqual({
        message: 'Préférences utilisateur récupérées.',
        data: {
          preferences,
        },
        meta: undefined,
      });
    });

    it('should return only requested preference fields', async () => {
      const query: UserPreferenceQueryDto = {
        fields: ['theme', 'language'],
      };

      const preferences = {
        theme: 'dark',
        language: 'fr',
      };

      preferenceServiceMock.getPreferences.mockResolvedValue(preferences);

      const response = await controller.getPreferences(query, {
        ...userSession,
      });

      expect(preferenceServiceMock.getPreferences).toHaveBeenCalledWith(
        userId,
        ['theme', 'language'],
      );

      expect(response.data).toEqual({
        preferences: {
          theme: 'dark',
          language: 'fr',
        },
      });
    });

    it('should use connected user id from CurrentUser', async () => {
      const anotherUserId = 42;
      const anotherSession = createSessionUser(anotherUserId);

      preferenceServiceMock.getPreferences.mockResolvedValue({});

      await controller.getPreferences({}, { ...anotherSession });

      expect(preferenceServiceMock.getPreferences).toHaveBeenCalledWith(
        anotherUserId,
        undefined,
      );
    });

    it('should propagate invalid preference field exception', async () => {
      const error = new Error('Invalid preference field');

      preferenceServiceMock.getPreferences.mockRejectedValue(error);

      await expect(
        controller.getPreferences(
          {
            fields: ['unknownColumn'] as unknown as UserPreferenceField[],
          },
          { ...userSession },
        ),
      ).rejects.toThrow(error);
    });

    it('should propagate preference service errors', async () => {
      const error = new Error('Unable to retrieve preferences');

      preferenceServiceMock.getPreferences.mockRejectedValue(error);

      await expect(
        controller.getPreferences(
          {},
          {
            ...userSession,
          },
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('updatePreferences', () => {
    const userSession: UserSession = {
      id: userId,
      email: 'test@test.com',
      role: 'user',
    };
    it('should update connected user preferences', async () => {
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

      const response = await controller.updatePreferences(payload, {
        ...userSession,
      });

      expect(preferenceServiceMock.updatePreferences).toHaveBeenCalledWith(
        userId,
        payload,
      );

      expect(response).toEqual({
        message: 'Les préférences ont été mises à jour.',
        data: { preferences: updatedPreferences },
        meta: undefined,
      });
    });

    it('should update only one preference', async () => {
      const payload = {
        newsletter: true,
      };

      preferenceServiceMock.updatePreferences.mockResolvedValue({
        userId,
        newsletter: true,
      });

      const response = await controller.updatePreferences(payload, {
        ...userSession,
      });

      expect(preferenceServiceMock.updatePreferences).toHaveBeenCalledWith(
        userId,
        {
          newsletter: true,
        },
      );

      expect(response.data).toEqual({
        preferences: {
          userId,
          newsletter: true,
        },
      });
    });

    it('should use connected user id from CurrentUser during update', async () => {
      const anotherUserId = 84;
      const anotherSession = createSessionUser(anotherUserId);

      const payload = {
        theme: 'light',
      };

      preferenceServiceMock.updatePreferences.mockResolvedValue(payload);

      await controller.updatePreferences(payload, { ...anotherSession });

      expect(preferenceServiceMock.updatePreferences).toHaveBeenCalledWith(
        anotherUserId,
        payload,
      );
    });

    it('should propagate preference update errors', async () => {
      const error = new Error('Unable to update preferences');

      preferenceServiceMock.updatePreferences.mockRejectedValue(error);

      await expect(
        controller.updatePreferences(
          {
            theme: 'dark',
          },
          { ...userSession },
        ),
      ).rejects.toThrow(error);
    });
  });
});
