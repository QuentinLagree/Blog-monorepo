import { sessionVersion } from 'src/commons/services/session-version';
import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { UserLoginCredentials } from 'src/modules/auth/dto/user-login-credentials.dto';
import { UserService } from 'src/modules/user/user.service';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';

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
    role: 'user',
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
    jest.resetAllMocks();

    authController = new AuthController(
      authServiceMock as unknown as AuthService,
      userServiceMock as unknown as UserService,
    );
  });

  describe('logout', () => {
    it('should delete session and return success message', async () => {
      const sessionMock = {
        delete: jest.fn(),
      };

      const response = await authController.logout(sessionMock as any);

      expect(sessionMock.delete).toHaveBeenCalledTimes(1);

      expect(response).toEqual({
        message: "La déconnection de ton compte s'est effectué avec succès",
        data: null,
        meta: undefined,
      });
    });
  });

  describe('login', () => {
    it('should login user, set session and return user session', async () => {
      const payload = createLoginDtoMock() as UserLoginCredentials;

      const loggedUser = createUserMock({
        id: 1,
        email: payload.email,
        role: 'user',
      });

      const sessionMock = {};

      authServiceMock.login.mockResolvedValue(loggedUser);
      authServiceMock.setUserSession.mockReturnValue(undefined);

      const response = await authController.login(payload, sessionMock as any);

      expect(authServiceMock.login).toHaveBeenCalledWith(payload);

      expect(authServiceMock.setUserSession).toHaveBeenCalledWith(sessionMock, {
        id: loggedUser.id,
        email: loggedUser.email,
        role: loggedUser.role,
        credentialVersion: sessionVersion(loggedUser.password),
      });

      expect(response).toEqual({
        message: 'La connection est un succès.',
        data: {
          id: loggedUser.id,
          email: loggedUser.email,
          role: loggedUser.role,
        },
        meta: undefined,
      });
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
      const payload = createUserDtoMock() as CreateUserDto;

      const createdUser = createUserMock({
        id: 1,
        email: payload.email,
      });

      userServiceMock.create.mockResolvedValue(createdUser);

      const response = await authController.register(payload);

      expect(userServiceMock.create).toHaveBeenCalledWith(payload);

      expect(response).toEqual({
        message:
          "L'enregistrement de ton compte s'est déroulé avec succès. Maintenant tu peux te connecter.",
        data: createdUser,
        meta: undefined,
      });
    });

    it('should throw an error if register fails', async () => {
      const payload = createUserDtoMock() as CreateUserDto;
      const error = new Error('User already exists');

      userServiceMock.create.mockRejectedValue(error);

      await expect(authController.register(payload)).rejects.toThrow(error);

      expect(userServiceMock.create).toHaveBeenCalledWith(payload);
    });
  });

  it('should propagate a session creation failure after successful authentication', async () => {
    const payload = createLoginDtoMock();
    const user = createUserMock();
    const session = {} as Parameters<AuthController['login']>[1];
    const error = new Error('Session creation failed');
    authServiceMock.login.mockResolvedValue(user);
    authServiceMock.setUserSession.mockImplementation(() => {
      throw error;
    });
    await expect(authController.login(payload, session)).rejects.toBe(error);
    expect(authServiceMock.setUserSession).toHaveBeenCalledWith(session, {
      id: user.id,
      email: user.email,
      role: 'user',
      credentialVersion: sessionVersion(user.password),
    });
  });
});
