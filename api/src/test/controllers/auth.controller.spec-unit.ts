import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { UserLoginCredentials } from 'src/modules/auth/dto/user-login-credentials.dto';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { UserService } from 'src/modules/user/user.service';
import { makeMessage } from 'src/commons/logger/logger.helper';

describe('AuthController', () => {
  let authController: AuthController;

  const authServiceMock = {
    login: jest.fn(),
    setUserSession: jest.fn(),
  };

  const userServiceMock = {
    create: jest.fn(),
  };

  const createUserMock = (override = {}) => ({
    id: 1,
    email: 'test@test.com',
    nom: 'Doe',
    prenom: 'John',
    role: 'User',
    password: 'hashed-password',
    created_at: new Date(),
    updated_at: new Date(),
    ...override,
  });

  const createLoginDtoMock = (override = {}) => ({
    email: 'test@test.com',
    password: 'password',
    ...override,
  });

  const createUserDtoMock = (override = {}) => ({
    email: 'test@test.com',
    password: 'password',
    nom: 'Doe',
    prenom: 'John',
    pseudo: 'johnny',
    ...override,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    authController = new AuthController(
      authServiceMock as unknown as AuthService,
      userServiceMock as unknown as UserService,
    );
  });

  describe('status', () => {
    it('should return active session message if user is logged in', async () => {
      const sessionUser = {
        id: 1,
        email: 'test@test.com',
        role: 'User',
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(sessionUser),
      };

      const response = await authController.status(sessionMock as any);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(response).toEqual(
        makeMessage('', 'La session est bien active.', {
          loggedIn: true,
          user: sessionUser,
        }),
      );
    });

    it('should throw HttpException if no session is active', async () => {
      const sessionMock = {
        get: jest.fn().mockReturnValue(undefined),
      };

      await expect(
        authController.status(sessionMock as any),
      ).rejects.toThrow(HttpException);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      try {
        await authController.status(sessionMock as any);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.UNAUTHORIZED);
        expect((error as HttpException).getResponse()).toEqual(
          makeMessage('', 'Aucune session active', {
            loggedIn: false,
          }),
        );
      }
    });
  });

  describe('logout', () => {
    it('should delete session and return success message', async () => {
      const sessionMock = {
        delete: jest.fn(),
      };

      const response = await authController.logout(sessionMock as any);

      expect(sessionMock.delete).toHaveBeenCalledTimes(1);

      expect(response).toEqual(
        makeMessage(
          '',
          "La déconnection de ton compte s'est éffectué avec succée",
          null,
        ),
      );
    });
  });

  describe('login', () => {
    it('should login user, set session and return user session', async () => {
      const payload = createLoginDtoMock() as UserLoginCredentials;

      const loggedUser = createUserMock({
        id: 1,
        email: payload.email,
        role: 'User',
      });

      const sessionMock = {};

      authServiceMock.login.mockResolvedValue(loggedUser);
      authServiceMock.setUserSession.mockReturnValue(undefined);

      const response = await authController.login(
        payload,
        sessionMock as any,
      );

      expect(authServiceMock.login).toHaveBeenCalledWith(payload);

      expect(authServiceMock.setUserSession).toHaveBeenCalledWith(
        sessionMock,
        {
          id: loggedUser.id,
          email: loggedUser.email,
          role: loggedUser.role,
        },
      );

      expect(response).toEqual(
        makeMessage(
          `User Login Success (${loggedUser.id})`,
          'La connection est un succès.',
          {
            id: loggedUser.id,
            email: loggedUser.email,
            role: loggedUser.role,
          },
        ),
      );
    });

    it('should throw an error if login fails', async () => {
      const payload = createLoginDtoMock() as UserLoginCredentials;
      const sessionMock = {};
      const error = new Error('Invalid credentials');

      authServiceMock.login.mockRejectedValue(error);

      await expect(
        authController.login(payload, sessionMock as any),
      ).rejects.toThrow(error);

      expect(authServiceMock.login).toHaveBeenCalledWith(payload);
      expect(authServiceMock.setUserSession).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register user and return success message', async () => {
      const payload = createUserDtoMock() as UserDto;

      const createdUser = createUserMock({
        id: 1,
        email: payload.email,
      });

      userServiceMock.create.mockResolvedValue(createdUser);

      const response = await authController.register(payload);

      expect(userServiceMock.create).toHaveBeenCalledWith(payload);

      expect(response).toEqual(
        makeMessage(
          'User register !',
          "L'enregistrement de ton compte s'est déroulé avec succès. Maintenant tu peux te connecter.",
          createdUser,
        ),
      );
    });

    it('should throw an error if register fails', async () => {
      const payload = createUserDtoMock() as UserDto;
      const error = new Error('User already exists');

      userServiceMock.create.mockRejectedValue(error);

      await expect(
        authController.register(payload),
      ).rejects.toThrow(error);

      expect(userServiceMock.create).toHaveBeenCalledWith(payload);
    });
  });
});