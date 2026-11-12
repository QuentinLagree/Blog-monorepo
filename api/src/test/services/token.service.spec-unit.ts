import { Prisma } from '@prisma/client';
import { TokenService } from 'src/commons/services/token.service';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { TOKEN } from 'src/commons/types/token.types';
import { ResetTokenAlreadyActiveException } from 'src/modules/handle-password/exceptions/reset-token-already-active.exception';
import { TokenExpiredOrInvalidException } from 'src/modules/handle-password/exceptions/token-expired-or-invalid.exception';
import { UserNotFoundException } from 'src/modules/user/exceptions/user-not-found.exception';

describe('TokenService', () => {
  let tokenService: TokenService;

  const prismaMock = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
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
    jest.resetAllMocks();
    prismaMock.$queryRaw.mockResolvedValue([{ id: 1 }]);
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock));

    tokenService = new TokenService(prismaMock as unknown as PrismaService);
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
    const payload = {
      email: 'test@test.com',
      code: VALID_TOKEN,
      expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
    };
    it('should not create an orphan token if the account disappeared', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);
      await expect(tokenService.set(payload)).rejects.toThrow(
        UserNotFoundException,
      );
      expect(prismaMock.verificationTokens.create).not.toHaveBeenCalled();
      expect(prismaMock.verificationTokens.deleteMany).not.toHaveBeenCalled();
    });
    it('should replace only expired tokens inside one transaction', async () => {
      const saved = createVerificationTokenMock(payload);
      prismaMock.verificationTokens.create.mockResolvedValue(saved);
      await expect(tokenService.set(payload)).resolves.toEqual(saved);
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.verificationTokens.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1, expired_at: { lt: expect.any(Date) } },
      });
      expect(prismaMock.verificationTokens.create).toHaveBeenCalledWith({
        data: { ...payload, userId: 1 },
      });
    });
    it('should map an existing active token conflict to a business error', async () => {
      prismaMock.verificationTokens.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Duplicate', {
          code: 'P2002',
          clientVersion: '6',
        }),
      );
      await expect(tokenService.set(payload)).rejects.toThrow(
        ResetTokenAlreadyActiveException,
      );
    });
    it('should retry a transaction deadlock', async () => {
      prismaMock.$transaction.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Deadlock', {
          code: 'P2034',
          clientVersion: '6',
        }),
      );
      prismaMock.verificationTokens.create.mockResolvedValue(
        createVerificationTokenMock(payload),
      );
      await tokenService.set(payload);
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
    });
    it('should stop after three transaction deadlocks', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Deadlock', {
        code: 'P2034',
        clientVersion: '6',
      });
      prismaMock.$transaction.mockRejectedValue(error);
      await expect(tokenService.set(payload)).rejects.toBe(error);
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(3);
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

      prismaMock.verificationTokens.findFirst.mockResolvedValue(
        verificationToken,
      );

      await expect(
        tokenService.assertVerificationTokenIsValid(email, token),
      ).resolves.toBeUndefined();

      expect(prismaMock.verificationTokens.findFirst).toHaveBeenCalledWith({
        where: {
          email,
          code: token.getToken,
          user: { email },
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

  describe('expiration boundary', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    });
    afterEach(() => {
      jest.useRealTimers();
    });
    it.each([-1, 0, 1])(
      'should evaluate expiration %i ms from now consistently',
      async (delta) => {
        prismaMock.verificationTokens.findFirst.mockResolvedValue(
          createVerificationTokenMock({
            expired_at: new Date(Date.now() + delta),
          }),
        );
        const result = tokenService.assertVerificationTokenIsValid(
          'test@test.com',
          TOKEN.add(VALID_TOKEN),
        );
        if (delta < 0)
          await expect(result).rejects.toThrow(TokenExpiredOrInvalidException);
        else await expect(result).resolves.toBeUndefined();
      },
    );
  });
  describe('Prisma failures', () => {
    it('should propagate a token generation query failure', async () => {
      const error = new Error('Count failed');
      prismaMock.verificationTokens.count.mockRejectedValue(error);
      await expect(tokenService.generate()).rejects.toBe(error);
    });
    it('should stop token creation if deleting an expired token fails', async () => {
      const error = new Error('Delete failed');
      prismaMock.verificationTokens.findFirst.mockResolvedValue(
        createVerificationTokenMock({
          expired_at: new Date(Date.now() - 1000),
        }),
      );
      prismaMock.verificationTokens.deleteMany.mockRejectedValue(error);
      await expect(
        tokenService.set({
          email: 'test@test.com',
          code: VALID_TOKEN,
          expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
        }),
      ).rejects.toBe(error);
      expect(prismaMock.verificationTokens.create).not.toHaveBeenCalled();
    });
    it('should propagate a token validation query failure', async () => {
      const error = new Error('Lookup failed');
      prismaMock.verificationTokens.findFirst.mockRejectedValue(error);
      await expect(
        tokenService.assertVerificationTokenIsValid(
          'test@test.com',
          TOKEN.add(VALID_TOKEN),
        ),
      ).rejects.toBe(error);
    });
  });
});
