import { TokenService } from 'src/commons/services/token.service';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { TOKEN } from 'src/commons/types/token.types';
import { ResetTokenAlreadyActiveException } from 'src/modules/handle-password/exceptions/reset-token-already-active.exception';
import { TokenExpiredOrInvalidException } from 'src/modules/handle-password/exceptions/token-expired-or-invalid.exception';

describe('TokenService', () => {
  let tokenService: TokenService;

  const prismaMock = {
    verificationTokens: {
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const VALID_TOKEN = '1234567890abcdef1234567890abcdef';

  const createVerificationTokenMock = (override = {}) => ({
    id: 1,
    email: 'test@test.com',
    code: VALID_TOKEN,
    expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
    created_at: new Date(),
    updated_at: new Date(),
    ...override,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    tokenService = new TokenService(
      prismaMock as unknown as PrismaService,
    );
  });

  describe('generate', () => {
    it('should generate a unique hexadecimal token of 32 characters', async () => {
      prismaMock.verificationTokens.count.mockResolvedValue(0);

      const response = await tokenService.generate();

      expect(response).toMatch(/^[0-9a-f]{32}$/);
      expect(prismaMock.verificationTokens.count).toHaveBeenCalledWith({
        where: {
          code: response,
        },
      });
    });

    it('should regenerate token if generated token already exists', async () => {
      prismaMock.verificationTokens.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);

      const response = await tokenService.generate();

      expect(response).toMatch(/^[0-9a-f]{32}$/);
      expect(prismaMock.verificationTokens.count).toHaveBeenCalledTimes(2);
    });
  });

  describe('set', () => {
    it('should create a verification token if no active token exists', async () => {
      const tokenDto = {
        email: 'test@test.com',
        code: VALID_TOKEN,
        expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
      };

      const createdToken = createVerificationTokenMock(tokenDto);

      prismaMock.verificationTokens.findFirst.mockResolvedValue(null);
      prismaMock.verificationTokens.create.mockResolvedValue(createdToken);

      const response = await tokenService.set(tokenDto);

      expect(prismaMock.verificationTokens.findFirst).toHaveBeenCalledWith({
        where: {
          email: tokenDto.email,
        },
      });

      expect(prismaMock.verificationTokens.create).toHaveBeenCalledWith({
        data: tokenDto,
      });

      expect(response).toEqual(createdToken);
    });

    it('should throw ResetTokenAlreadyActiveException if token already exists and is not expired', async () => {
      const tokenDto = {
        email: 'test@test.com',
        code: VALID_TOKEN,
        expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
      };

      const existingToken = createVerificationTokenMock({
        email: tokenDto.email,
        expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
      });

      prismaMock.verificationTokens.findFirst.mockResolvedValue(existingToken);

      await expect(tokenService.set(tokenDto)).rejects.toThrow(
        ResetTokenAlreadyActiveException,
      );

      expect(prismaMock.verificationTokens.deleteMany).not.toHaveBeenCalled();
      expect(prismaMock.verificationTokens.create).not.toHaveBeenCalled();
    });

    it('should delete expired token and create a new one', async () => {
      const tokenDto = {
        email: 'test@test.com',
        code: VALID_TOKEN,
        expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
      };

      const expiredToken = createVerificationTokenMock({
        email: tokenDto.email,
        expired_at: new Date(Date.now() - 1000),
      });

      const createdToken = createVerificationTokenMock(tokenDto);

      prismaMock.verificationTokens.findFirst.mockResolvedValue(expiredToken);
      prismaMock.verificationTokens.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.verificationTokens.create.mockResolvedValue(createdToken);

      const response = await tokenService.set(tokenDto);

      expect(prismaMock.verificationTokens.deleteMany).toHaveBeenCalledWith({
        where: {
          email: tokenDto.email,
        },
      });

      expect(prismaMock.verificationTokens.create).toHaveBeenCalledWith({
        data: tokenDto,
      });

      expect(response).toEqual(createdToken);
    });
  });

  describe('delete', () => {
    it('should delete verification tokens by email', async () => {
      const email = 'test@test.com';

      prismaMock.verificationTokens.deleteMany.mockResolvedValue({ count: 1 });

      await tokenService.delete(email);

      expect(prismaMock.verificationTokens.deleteMany).toHaveBeenCalledWith({
        where: {
          email,
        },
      });
    });
  });

  describe('assertVerificationTokenIsValid', () => {
    it('should resolve if token exists and is not expired', async () => {
      const email = 'test@test.com';
      const token = TOKEN.add(VALID_TOKEN);

      const verificationToken = createVerificationTokenMock({
        email,
        code: token.getToken,
        expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
      });

      prismaMock.verificationTokens.findFirst.mockResolvedValue(verificationToken);

      await expect(
        tokenService.assertVerificationTokenIsValid(email, token),
      ).resolves.toBeUndefined();

      expect(prismaMock.verificationTokens.findFirst).toHaveBeenCalledWith({
        where: {
          email,
          code: token.getToken,
        },
      });
    });

    it('should throw TokenExpiredOrInvalidException if token does not exist', async () => {
      const email = 'test@test.com';
      const token = TOKEN.add(VALID_TOKEN);

      prismaMock.verificationTokens.findFirst.mockResolvedValue(null);

      await expect(
        tokenService.assertVerificationTokenIsValid(email, token),
      ).rejects.toThrow(TokenExpiredOrInvalidException);
    });

    it('should throw TokenExpiredOrInvalidException if token is expired', async () => {
      const email = 'test@test.com';
      const token = TOKEN.add(VALID_TOKEN);

      const expiredToken = createVerificationTokenMock({
        email,
        code: token.getToken,
        expired_at: new Date(Date.now() - 1000),
      });

      prismaMock.verificationTokens.findFirst.mockResolvedValue(expiredToken);

      await expect(
        tokenService.assertVerificationTokenIsValid(email, token),
      ).rejects.toThrow(TokenExpiredOrInvalidException);
    });
  });
});