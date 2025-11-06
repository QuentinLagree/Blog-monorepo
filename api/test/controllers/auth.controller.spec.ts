import { HttpStatus, NotFoundException } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { User } from '@prisma/client';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { PasswordNotMatchException } from 'src/commons/exceptions/PasswordNotMatchException.error';
import { UserAlreadyActiveSession } from 'src/commons/exceptions/UserAlreadyActiveSession.error';
import {
  UserAlreadyExistWithEmail,
  UserAlreadyExistWithPseudo,
} from 'src/commons/exceptions/userAlreadyExist.error';
import { expectHttpExceptionWithMessage } from 'test/helpers/HTTPExceptionErrorHandleTest.utils';
import { makeMessage } from 'src/commons/helpers/logger.helper';
import * as validHelperClass from 'src/commons/helpers/dto/dto-validations.helper';
import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { UserLoginCredentials } from 'src/modules/auth/dto/user-login-credentials.dto';
import { UserService } from 'src/modules/user/user.service';
import {
  createUserMock,
  createUserLoginDto,
  createUserInvalidLoginDto,
  createWrongUserLoginDto,
  createInvalidDto,
  createNewUserMock,
} from 'test/mocks/create.user.mocks';
import { createAuthServiceMock } from 'test/mocks/services/auth/create.auth.service.mocks';
import { createUserServiceMock } from 'test/mocks/services/auth/create.user.service.mocks';

const FATAL_ERROR = 'Database Down';

let ValidDto: jest.SpyInstance;

describe('AuthController Tests', () => {
  let controller: AuthController;
  let _user: { [K in keyof UserService]: jest.Mock };
  let _auth: { [K in keyof AuthService]: jest.Mock };

  beforeEach(async () => {
    _user = createUserServiceMock();
    _auth = createAuthServiceMock();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: UserService, useValue: _user },
        { provide: AuthService, useValue: _auth },
      ],
    }).compile();

    controller = app.get<AuthController>(AuthController);
  });

  describe('AuthController - providers are defined', () => {
    it('controller should be defined ', () => {
      expect(controller).toBeDefined();
    });

    it('UserService shoud be defined', () => {
      expect(_user).toBeDefined();
    });

    it('AuthService shoud be defined', () => {
      expect(_auth).toBeDefined();
    });
  });

  describe('AuthController - status()', () => {
    let sessionMock: any;

    beforeEach(() => {
      sessionMock = {
        get: jest.fn(),
        set: jest.fn(),
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Should return a success message when session is active', async () => {
      const userMock = createUserMock();

      sessionMock = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'user') return userMock;
          return undefined;
        }),
      };

      let result = controller.status(sessionMock);

      expect(sessionMock.get).toHaveBeenCalledWith('user');
      await expect(result).resolves.toEqual({
        message: 'La session est bien active.',
        data: { loggedIn: true, user: userMock },
      });
    });

    it('Should throw error when session is inactive', async () => {
      sessionMock.get.mockReturnValue(undefined);

      await expectHttpExceptionWithMessage(
        () => controller.status(sessionMock),
        HttpStatus.UNAUTHORIZED,
        makeMessage('', 'Aucune session active', { loggedIn: false }),
      );
    });
  });

  describe('AuthController - login()', () => {
    let sessionMock: any;

    beforeEach(() => {
      ValidDto = jest.spyOn(validHelperClass, 'dtoIsValid');
      sessionMock = {
        get: jest.fn(),
        set: jest.fn(),
      };
      _auth.setUserSession.mockReset();
      _auth.login.mockReset();
      ValidDto.mockReset();
      ValidDto.mockResolvedValue([]);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Should return a successful login message', async () => {
      let user = createUserMock();

      _auth.login.mockResolvedValue(user);
      _auth.setUserSession.mockResolvedValue(undefined);

      let dto: UserLoginCredentials = createUserLoginDto();

      let result = controller.login(dto, sessionMock);

      await expect(result).resolves.toEqual({
        message: 'La connection est un succès.',
        data: user,
      });
    });

    it('Should return an error message when invalid dto', async () => {
      let invalidDto: UserLoginCredentials = createUserInvalidLoginDto();

      const error = ['Dto Is invalid!'];
      ValidDto.mockResolvedValue(error);

      await expectHttpExceptionWithMessage(
        () => controller.login(invalidDto, sessionMock),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          'User logged failed !',
          'Tous les champs sont requis.',
          error,
        ),
      );
    });

    it('Should return an error message when user have already session', async () => {
      let user: User = createUserMock();

      _auth.login.mockResolvedValue(user);
      _auth.setUserSession.mockImplementation(() => {
        throw new UserAlreadyActiveSession();
      });

      let dto: UserLoginCredentials = createUserLoginDto();

      await expectHttpExceptionWithMessage(
        () => controller.login(dto, sessionMock),
        HttpStatus.CONFLICT,
        makeMessage(
          'User logged failed (already logged)',
          'Vous êtes déjà connecté...',
          null,
        ),
        _auth.login,
        1,
      );
    });

    it('Should return an error message when user not found', async () => {
      _auth.login.mockRejectedValue(new NotFoundException());

      let dto: UserLoginCredentials = createWrongUserLoginDto();

      await expectHttpExceptionWithMessage(
        () => controller.login(dto, sessionMock),
        HttpStatus.UNAUTHORIZED,
        makeMessage(
          'User logged failed',
          "L'email ou le mot de passe est incorrect",
          null,
        ),
      );
    });

    it('Should return an error message when password not match with hash password', async () => {
      _auth.login.mockRejectedValue(new PasswordNotMatchException());

      let dto: UserLoginCredentials = createWrongUserLoginDto();

      await expectHttpExceptionWithMessage(
        () => controller.login(dto, sessionMock),
        HttpStatus.UNAUTHORIZED,
        makeMessage(
          'User logged failed',
          "L'email ou le mot de passe est incorrect",
          null,
        ),
      );
    });

    it('Should return a fatal error message when error is unexpected', async () => {
      const error = new Error(FATAL_ERROR);
      _auth.login.mockRejectedValue(error);

      let dto: UserLoginCredentials = createWrongUserLoginDto();

      await expectHttpExceptionWithMessage(
        () => controller.login(dto, sessionMock),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Fatal Error',
          "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
          error,
          { level: 'Fatal' },
        ),
      );
    });
  });

  describe('AuthController - register()', () => {
    beforeEach(() => {
      ValidDto = jest.spyOn(validHelperClass, 'dtoIsValid');
      _user.create.mockReset;
      ValidDto.mockClear();
      ValidDto.mockResolvedValue([]);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Should return a successful register message', async () => {
      const dto: UserDto = createUserMock();

      let new_user: Partial<User> = createUserMock({
        ...dto,
        id: 2,
        email: 'johndoe2@gmail.com',
      });
      _user.create.mockResolvedValue(new_user);

      let result = controller.register(dto);

      expect(result).resolves.toEqual({
        message:
          "L'enregistrement de ton compte s'est déroulé avec succès. Maintenant tu peux te connecter.",
        data: new_user,
      });
    });

    it('Should return an error message when invalid dto', async () => {
      const invalidDto: UserDto = createInvalidDto();

      const error = ['Dto Is invalid!'];
      ValidDto.mockResolvedValue(error);

      await expectHttpExceptionWithMessage(
        () => controller.register(invalidDto),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          'User logged failed !',
          'Tous les champs sont requis.',
          error,
        ),
      );
    });

    it('Should return an error message when user already exist with email', async () => {
      _user.create.mockRejectedValue(new UserAlreadyExistWithEmail());

      const dto: UserDto = createNewUserMock({
        pseudo: 'NotSamePseudo',
      });

      await expectHttpExceptionWithMessage(
        () => controller.register(dto),
        HttpStatus.CONFLICT,
        makeMessage(
          'User created failed',
          'Cette email est déjà utiliser, si vous avez déjà un compte, vous pouvez vous connecter.',
          null,
        ),
        _user.create,
        1,
      );
    });

    it('Should return an error message when user already exist with pseudo', async () => {
      _user.create.mockRejectedValue(new UserAlreadyExistWithPseudo());

      const dto: UserDto = createNewUserMock({
        email: 'notSameemail@gmail.com',
      });

      await expectHttpExceptionWithMessage(
        () => controller.register(dto),
        HttpStatus.CONFLICT,
        makeMessage(
          'User created failed',
          "Ce nom d'utilisateur est déjà utilisé.",
          null,
        ),
        _user.create,
        1,
      );
    });

    it('Should return a fatal error message when error is unexpected', async () => {
      const error = new Error(FATAL_ERROR);

      _user.create.mockRejectedValue(error);

      let dto: UserLoginCredentials = createWrongUserLoginDto();

      await expectHttpExceptionWithMessage(
        () => controller.register(dto as UserDto),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Fatal Error',
          "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
          error,
          { level: 'Fatal' },
        ),
      );
    });
  });
});
