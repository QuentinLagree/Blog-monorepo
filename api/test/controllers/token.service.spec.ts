import {
  CreatePrismaServiceMock,
  PrismaUserServiceMockType,
} from 'test/mocks/services/database/create.prisma.service.mocks';
import { TokenService } from '../../src/commons/token/token.service';
import { Test, TestingModule } from '@nestjs/testing';
import { TOKEN } from '../../src/commons/types/token.types';
import { VerificationTokens } from '@prisma/client';
import { VerificationEmailDto } from 'src/commons/verifications_email/verification_email.dto';
import { BadRequestException } from '@nestjs/common';
import { TokenExpiredOrInvalidException } from '../../src/commons/exceptions/TokenIsExpired.error';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import {
  createOtherVerificationEmailMock,
  createVerificationEmailMock,
} from 'test/mocks/create_verificationemail.mocks';

const FATAL_ERROR = 'database down';
describe('TokenService', () => {
  let service: TokenService;
  let _prisma: PrismaUserServiceMockType;

  beforeEach(async () => {
    _prisma = CreatePrismaServiceMock();

    const app: TestingModule = await Test.createTestingModule({
      providers: [TokenService, { provide: PrismaService, useValue: _prisma }],
    }).compile();

    service = app.get<TokenService>(TokenService);
  });

  it('TokenService should be defined', () => {
    expect(service).toBeDefined();
  });

  it('prisma service should be defined', () => {
    expect(_prisma).toBeDefined();
  });

  describe('TokenService - generate()', () => {
    beforeEach(() => {
      _prisma.verificationTokens.count.mockReset();
    });

    afterEach(() => jest.restoreAllMocks());
    it('should return a new random token', async () => {
      const randomToken: string = Buffer.from('a'.repeat(16), 'utf-8').toString(
        'hex',
      );

      jest
        .spyOn(require('crypto'), 'randomBytes')
        .mockReturnValue(Buffer.from('a'.repeat(16), 'utf-8'));

      _prisma.verificationTokens.count.mockResolvedValue(0);

      let result = service.generate();

      expect(randomToken).toHaveLength(32);

      await expect(result).resolves.toBe(randomToken);
      expect(_prisma.verificationTokens.count).toHaveBeenCalledTimes(1);
      await expect(_prisma.verificationTokens.count()).resolves.toBe(0);
      expect(_prisma.verificationTokens.count).toHaveBeenCalledWith({
        where: { code: randomToken },
      });
    });

    it('should return a new random token when token is already in database', async () => {
      const randomToken: string = Buffer.from('a'.repeat(16), 'utf-8').toString(
        'hex',
      );

      jest
        .spyOn(require('crypto'), 'randomBytes')
        .mockReturnValue(Buffer.from('a'.repeat(16), 'utf-8'));

      // Simule le token déjà existant une fois, puis inexistant
      _prisma.verificationTokens.count
        .mockResolvedValueOnce(1) // 1er appel : token existe
        .mockResolvedValueOnce(0); // 2e appel : token n'existe plus

      let result = service.generate();

      expect(randomToken).toHaveLength(32);

      await expect(result).resolves.toBe(randomToken);
      expect(_prisma.verificationTokens.count).toHaveBeenCalledTimes(2);
      expect(_prisma.verificationTokens.count).toHaveBeenNthCalledWith(1, {
        where: { code: randomToken },
      });
      expect(_prisma.verificationTokens.count).toHaveBeenNthCalledWith(2, {
        where: { code: randomToken },
      });
    });

    it('Should be a correct token', async () => {
      _prisma.verificationTokens.count.mockResolvedValue(0);
      const result = await service.generate();

      expect(result).toHaveLength(32);
      expect(result).toMatch(/^[a-f0-9]{32}$/);

      const tokenInstance: TOKEN = new TOKEN(result);
      expect(tokenInstance.getToken).toBe(result);
      expect(TOKEN.hasValid(tokenInstance.getToken)).toBe(true);
    });

    it('should throw if prisma.count throws', async () => {
      _prisma.verificationTokens.count.mockRejectedValue(new Error('DB error'));
      await expect(service.generate()).rejects.toThrow('DB error');
    });

    it('should call count with correct params for different tokens', async () => {
      const randomToken1 = Buffer.from('a'.repeat(16), 'utf-8').toString('hex');
      const randomToken2 = Buffer.from('b'.repeat(16), 'utf-8').toString('hex');
      const randomBytesMock = jest.spyOn(require('crypto'), 'randomBytes');
      randomBytesMock
        .mockReturnValueOnce(Buffer.from('a'.repeat(16), 'utf-8'))
        .mockReturnValueOnce(Buffer.from('b'.repeat(16), 'utf-8'));

      _prisma.verificationTokens.count
        .mockResolvedValueOnce(1) // 1er token existe
        .mockResolvedValueOnce(0); // 2e token n'existe pas

      let result = service.generate();

      await expect(result).resolves.toBe(randomToken2);
      expect(_prisma.verificationTokens.count).toHaveBeenNthCalledWith(1, {
        where: { code: randomToken1 },
      });
      expect(_prisma.verificationTokens.count).toHaveBeenNthCalledWith(2, {
        where: { code: randomToken2 },
      });
    });
  });

  describe('TokenService - set()', () => {
    beforeEach(() => {
      _prisma.verificationTokens.create.mockReset();
      _prisma.verificationTokens.findFirst.mockReset();
      _prisma.verificationTokens.delete.mockReset();
    });

    afterEach(() => jest.restoreAllMocks());
    it('Should return a new verificationEmail with new Token', async () => {
      let verificationEmailMock: VerificationTokens =
        createVerificationEmailMock();
      _prisma.verificationTokens.findFirst.mockResolvedValue(null);
      _prisma.verificationTokens.create.mockResolvedValue(
        verificationEmailMock,
      );

      const dto: VerificationEmailDto = createVerificationEmailMock();

      let result = service.set(dto);

      await expect(result).resolves.toBe(verificationEmailMock);
      expect(_prisma.verificationTokens.findFirst).toHaveBeenCalledTimes(1);
      await expect(_prisma.verificationTokens.findFirst()).resolves.toEqual(
        null,
      );
      expect(_prisma.verificationTokens.findFirst).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
    });

    it('Should return a BadRequestException when user already exist', async () => {
      _prisma.verificationTokens.findFirst.mockResolvedValue(null);
      _prisma.verificationTokens.create.mockRejectedValue(new Error());

      let dto: VerificationEmailDto = createVerificationEmailMock();
      let result = service.set(dto);

      await expect(result).rejects.toThrow(BadRequestException);
      expect(_prisma.verificationTokens.findFirst).toHaveBeenCalledTimes(1);
      await expect(_prisma.verificationTokens.findFirst()).resolves.toEqual(
        null,
      );
      expect(_prisma.verificationTokens.findFirst).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
    });

    it('Should delete token if expired and create new one', async () => {
      const expiredEmail = createVerificationEmailMock();
      expiredEmail.expired_at = new Date(Date.now() - 1000 * 60 * 60); // expired
      _prisma.verificationTokens.findFirst.mockResolvedValue(expiredEmail);
      _prisma.verificationTokens.create.mockResolvedValue(expiredEmail);
      _prisma.verificationTokens.delete.mockResolvedValue(undefined);

      const dto: VerificationEmailDto = createVerificationEmailMock();

      let result = service.set(dto);

      await expect(result).resolves.toBe(expiredEmail);
      expect(_prisma.verificationTokens.findFirst).toHaveBeenCalledTimes(1);
      expect(_prisma.verificationTokens.delete).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(_prisma.verificationTokens.create).toHaveBeenCalledWith({
        data: dto,
      });
    });

    it('Should not delete token if not expired', async () => {
      const validEmail = createVerificationEmailMock();
      validEmail.expired_at = new Date(Date.now() + 1000 * 60 * 60); // not expired
      _prisma.verificationTokens.findFirst.mockResolvedValue(validEmail);
      _prisma.verificationTokens.create.mockResolvedValue(validEmail);

      const dto: VerificationEmailDto = createVerificationEmailMock();

      let result = service.set(dto);

      await expect(result).resolves.toBe(validEmail);
      expect(_prisma.verificationTokens.findFirst).toHaveBeenCalledTimes(1);
      expect(_prisma.verificationTokens.delete).not.toHaveBeenCalled();
      expect(_prisma.verificationTokens.create).toHaveBeenCalledWith({
        data: dto,
      });
    });
  });

  describe('TokenService - delete()', () => {
    beforeEach(() => {
      _prisma.verificationTokens.delete.mockReset();
    });

    afterEach(() => jest.restoreAllMocks());

    it('Should return when delete verificationEmail successful', async () => {
      const validEmail = createVerificationEmailMock();

      _prisma.verificationTokens.delete.mockReturnValue(undefined);

      let result = service.delete(validEmail.email);
      await expect(result).resolves.toBe(undefined);
    });

    it('Should return error when delete method throw error', async () => {
      const validEmail = createVerificationEmailMock();
      _prisma.verificationTokens.delete.mockRejectedValue(
        new Error(FATAL_ERROR),
      );

      const result = service.delete(validEmail.email);

      await expect(result).rejects.toThrow(Error);
      expect(_prisma.verificationTokens.delete).toHaveBeenCalledTimes(1);
      await expect(_prisma.verificationTokens.delete).rejects.toThrow(
        new Error(FATAL_ERROR),
      );
      expect(_prisma.verificationTokens.delete).toHaveBeenCalledWith({
        where: { email: validEmail.email },
      });
    });
  });

  describe('TokenService - assertVerificationTokenIsValid()', () => {
    let tokenIsExpired: jest.Mock = jest.fn();
    beforeEach(() => {
      tokenIsExpired.mockReturnValue(true);
      tokenIsExpired.mockReset();
    });

    afterEach(() => jest.restoreAllMocks());

    it('Shoud return void when token and email are valid', async () => {
      const verifEmail = createVerificationEmailMock();

      _prisma.verificationTokens.findUnique.mockResolvedValue(verifEmail);

      let result = service.assertVerificationTokenIsValid(
        verifEmail.email,
        TOKEN.add(verifEmail.code),
      );

      await expect(result).resolves.toBe(undefined);
    });

    it('Shoud return a TokenExpiredOrInvalidException when email is invalid', async () => {
      const verifEmail = createVerificationEmailMock();
      const otherVerifEmail = createOtherVerificationEmailMock({
        code: verifEmail.code,
      });

      _prisma.verificationTokens.findUnique.mockResolvedValue(null);
      tokenIsExpired.mockReturnValue(true);

      let result = service.assertVerificationTokenIsValid(
        otherVerifEmail.email,
        TOKEN.add(otherVerifEmail.code),
      );

      await expect(result).rejects.toThrow(TokenExpiredOrInvalidException);
    });

    it('Shoud return a TokenExpiredOrInvalidException when code is invalid', async () => {
      const verifEmail = createVerificationEmailMock();
      const otherVerifEmail = createOtherVerificationEmailMock({
        email: verifEmail.email,
      });

      _prisma.verificationTokens.findUnique.mockResolvedValue(undefined);

      let result = service.assertVerificationTokenIsValid(
        otherVerifEmail.email,
        TOKEN.add(otherVerifEmail.code),
      );

      await expect(result).rejects.toThrow(TokenExpiredOrInvalidException);
    });

    it('Shoud return a TokenExpiredOrInvalidException when code is expired', async () => {
      const verifEmail = createVerificationEmailMock({
        expired_at: new Date(Date.now() + 1000 * 60 * 60),
      });

      _prisma.verificationTokens.findUnique.mockResolvedValue(undefined);
      tokenIsExpired.mockReturnValue(true);

      let result = service.assertVerificationTokenIsValid(
        verifEmail.email,
        TOKEN.add(verifEmail.code),
      );

      await expect(result).rejects.toThrow(TokenExpiredOrInvalidException);
    });
  });
});
