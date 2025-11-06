import { MailerService } from '@nestjs-modules/mailer';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { UserLoginCredentials } from '../user/dto/user.dto';
import { PrismaService } from '../../database/prisma.service';
import { PasswordNotMatchException } from '../../commons/utils/exceptions/PasswordNotMatchException.error';
import {
  CreateMailerServiceMock,
  MailerServiceMockType,
} from '../../usecases/mocks/services/auth/create.mailer.service.mocks';
import {
  CreatePrismaServiceMock,
  PrismaUserServiceMockType,
} from '../../usecases/mocks/services/database/create.prisma.service.mocks';
import {
  createUserLoginDto,
  createUserMock,
  createWrongUserLoginDto,
} from '../../usecases/mocks/create.user.mocks';
import { AuthService } from './auth.service';
import { TOKEN } from '../../usecases/types/token.types';
import { UserAlreadyActiveSession } from 'src/commons/exceptions/UserAlreadyActiveSession.error';

const FATAL_ERROR = 'Database Down';

describe('AuthService', () => {
  let service: AuthService;
  let _prisma: PrismaUserServiceMockType;
  let _mailer: MailerServiceMockType;

  // Initialisation avant chaque test
  beforeEach(async () => {
    _prisma = CreatePrismaServiceMock();
    _mailer = CreateMailerServiceMock();

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: _prisma },
        { provide: MailerService, useValue: _mailer },
      ],
    }).compile();

    service = app.get<AuthService>(AuthService);
  });

  describe('AuthService - providers are defined', () => {
    it('AuthService should be defined', () => {
      expect(service).toBeDefined();
    });

    it('service Prisma should be defined', () => {
      expect(_prisma).toBeDefined();
    });
    it('service Mailer should be defined', () => {
      expect(_mailer).toBeDefined();
    });
  });

  describe('AuthService - login()', () => {
    it('shoud return a user', async () => {
      let user: User = createUserMock();

      _prisma.user.findUnique.mockResolvedValue(user);

      jest
        .spyOn<AuthService, any>(service, 'comparePassword')
        .mockResolvedValue(true);

      const dto: UserLoginCredentials = createUserLoginDto();

      let result = service.login(dto);

      await expect(result).resolves.toBe(user);
    });

    it('Should return an error when user not found', async () => {
      _prisma.user.findUnique.mockResolvedValue(null);

      const dto: UserLoginCredentials = createWrongUserLoginDto();

      let result = service.login(dto);
      await expect(result).rejects.toThrow(NotFoundException);
    });

    it('Should return an error when password not match with hash password', async () => {
      const user: User = createUserMock();

      _prisma.user.findUnique.mockResolvedValue(user);

      const dto: UserLoginCredentials = createWrongUserLoginDto();

      let result = service.login(dto);
      await expect(result).rejects.toThrow(PasswordNotMatchException);
    });

    it('Should return an unexpected error', async () => {
      _prisma.user.findUnique.mockResolvedValue(new Error(FATAL_ERROR));

      const dto: UserLoginCredentials = createUserLoginDto();

      let result = service.login(dto);

      await expect(result).rejects.toThrow(Error);
    });

    describe('AuthService - setUserSession()', () => {
      it('should set a successful session when user login', () => {
        const sessionMock = {
          get: jest.fn().mockReturnValue(null),
          set: jest.fn(),
        };
        const user = createUserMock();
        service.setUserSession(sessionMock as any, user);
        expect(sessionMock.get).toHaveBeenCalledWith('user');
        expect(sessionMock.set).toHaveBeenCalledWith('user', user);
      });

      it('should throw UserAlreadyActiveSession if session already exists', () => {
        const sessionMock = {
          get: jest.fn().mockReturnValue({ id: 1 }),
          set: jest.fn(),
        };
        const user = createUserMock();
        expect(() => service.setUserSession(sessionMock as any, user)).toThrow(
          UserAlreadyActiveSession,
        );
      });
    });
  });
});
