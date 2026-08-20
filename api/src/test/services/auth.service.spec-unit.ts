import { AuthService } from 'src/modules/auth/auth.service';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { EmailOrPasswordNotMatchException } from 'src/modules/auth/exceptions/email-or-password-not-match.exception';
import { Role } from 'src/commons/roles/role.enum';
import { UserLoginCredentials } from 'src/modules/auth/dto/user-login-credentials.dto';
import { UserHaveAlreadyActiveSessionException } from 'src/modules/auth/exceptions/user-have-already-active-session.exception';

describe('AuthService', () => {
  let authService: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const passwordServiceMock = {
    verifyPassword: jest.fn(),
  };

  const createUserMock = (override = {}) => ({
    id: 1,
    email: 'test@test.com',
    password: 'hashed-password',
    role: Role.User,
    pseudo: 'testuser',
    nom: 'Doe',
    prenom: 'John',
    created_at: new Date(),
    updated_at: new Date(),
    ...override,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    authService = new AuthService(
      prismaMock as unknown as PrismaService,
      passwordServiceMock as unknown as PasswordService,
    );
  });

  describe('login', () => {
    it('should return user if credentials are valid', async () => {
      const payload = {
        email: 'test@test.com',
        password: 'password',
      } as UserLoginCredentials;

      const user = createUserMock({
        email: payload.email,
      });

      prismaMock.user.findUnique.mockResolvedValue(user);
      passwordServiceMock.verifyPassword.mockResolvedValue(true);

      const response = await authService.login(payload);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: payload.email,
        },
      });

      expect(passwordServiceMock.verifyPassword).toHaveBeenCalledWith(
        user.password,
        payload.password,
      );

      expect(response).toEqual(user);
    });

    it('should throw EmailOrPasswordNotMatchException if user is not found', async () => {
      const payload = {
        email: 'unknown@test.com',
        password: 'password',
      } as UserLoginCredentials;

      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(payload)).rejects.toThrow(
        EmailOrPasswordNotMatchException,
      );

      expect(passwordServiceMock.verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw EmailOrPasswordNotMatchException if password is wrong', async () => {
      const payload = {
        email: 'test@test.com',
        password: 'wrong-password',
      } as UserLoginCredentials;

      const user = createUserMock({
        email: payload.email,
      });

      prismaMock.user.findUnique.mockResolvedValue(user);
      passwordServiceMock.verifyPassword.mockResolvedValue(false);

      await expect(authService.login(payload)).rejects.toThrow(
        EmailOrPasswordNotMatchException,
      );

      expect(passwordServiceMock.verifyPassword).toHaveBeenCalledWith(
        user.password,
        payload.password,
      );
    });
  });

  describe('setUserSession', () => {
    it('should set user session if no active session exists', () => {
      const sessionUser = {
        id: 1,
        email: 'test@test.com',
        role: Role.User,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(null),
        set: jest.fn(),
      };

      authService.setUserSession(sessionMock as any, sessionUser);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(sessionMock.set).toHaveBeenCalledWith(
        'user',
        sessionUser,
      );
    });

    it('should throw UserAlreadySessionActive if session is already active', () => {
      const currentUser = {
        id: 1,
        email: 'test@test.com',
        role: Role.User,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(currentUser),
        set: jest.fn(),
      };

      expect(() =>
        authService.setUserSession(sessionMock as any, currentUser),
      ).toThrow(UserHaveAlreadyActiveSessionException);

      expect(sessionMock.set).not.toHaveBeenCalled();
    });
  });

  describe('throwAnNotSamePasswordExceptionIfNotSame', () => {
    it('should currently resolve without throwing', async () => {
      await expect(
        authService.throwAnNotSamePasswordExceptionIfNotSame(
          'password',
          'different-password',
        ),
      ).resolves.toBeUndefined();
    });
  });
});