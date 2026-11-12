import { PasswordRecoveryService } from 'src/modules/handle-password/password-recovery.service';
import { UserService } from 'src/modules/user/user.service';
import { TokenService } from 'src/commons/services/token.service';
import { MailingService } from 'src/commons/mailing/mailing.service';
import { TOKEN } from 'src/commons/types/token.types';
import { PasswordNotMatchException } from 'src/modules/auth/exceptions/password-not-same.exception';
import { PasswordRecoveryController } from 'src/modules/handle-password/password_recovery.controller';
import { ResetPasswordDto } from 'src/modules/handle-password/dto/reset-password.dto';
import { ResetEmailDto } from 'src/modules/handle-password/dto/reset-email.dto';
import { TokenInvalidFormat } from 'src/modules/handle-password/exceptions/token-invalid-format.exception';
import { TokenExpiredOrInvalidException } from 'src/modules/handle-password/exceptions/token-expired-or-invalid.exception';
import { UserNotFoundException } from 'src/modules/user/exceptions/user-not-found.exception';
import { ResetTokenAlreadyActiveException } from 'src/modules/handle-password/exceptions/reset-token-already-active.exception';

describe('PasswordRecoveryController', () => {
  let passwordRecoveryController: PasswordRecoveryController;

  const VALID_TOKEN = '1234567890abcdef1234567890abcdef';
  const ANOTHER_VALID_TOKEN = 'abcdefabcdefabcdefabcdefabcdefab';

  const mailsQueueMock = {
    add: jest.fn(),
  };

  const userServiceMock = {
    show: jest.fn(),
    update: jest.fn(),
  };

  const tokenServiceMock = {
    assertVerificationTokenIsValid: jest.fn(),
    generate: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deleteMatching: jest.fn(),
  };

  const recoveryMock = { reset: jest.fn() };
  const mailingServiceMock = {
    getOptionRecoveryEmail: jest.fn(),
  };

  const createUserMock = (override = {}) => ({
    id: 1,
    email: 'test@test.com',
    nom: 'Doe',
    prenom: 'John',
    password: 'hashed-password',
    ...override,
  });

  const createVerificationTokenMock = (override = {}) => ({
    id: 1,
    email: 'test@test.com',
    code: 'reset-token',
    expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
    created_at: new Date(),
    updated_at: new Date(),
    ...override,
  });

  beforeEach(() => {
    jest.resetAllMocks();

    passwordRecoveryController = new PasswordRecoveryController(
      mailsQueueMock as any,
      userServiceMock as unknown as UserService,
      tokenServiceMock as unknown as TokenService,
      mailingServiceMock as unknown as MailingService,
      recoveryMock as unknown as PasswordRecoveryService,
    );
  });

  describe('confirmResetToken', () => {
    it('should confirm reset token and return email with token', async () => {
      const email = 'test@test.com';
      const rawToken = VALID_TOKEN;
      const tokenId = TOKEN.add(rawToken);

      tokenServiceMock.assertVerificationTokenIsValid.mockResolvedValue(
        undefined,
      );

      const response = await passwordRecoveryController.confirmResetToken(
        rawToken,
        email,
      );

      expect(
        tokenServiceMock.assertVerificationTokenIsValid,
      ).toHaveBeenCalledWith(email, tokenId);

      expect(response).toEqual({
        message:
          'Succès lors du chargement de la page, veuillez entrer votre ancien mot de passe puis votre nouveau mot de passe.',
        data: {
          email,
          token: tokenId.getToken,
        },
        meta: {},
      });
    });

    it('should throw an error if token is not valid', async () => {
      const email = 'test@test.com';
      const rawToken = ANOTHER_VALID_TOKEN;
      const tokenId = TOKEN.add(rawToken);
      const error = new Error('Invalid token');

      tokenServiceMock.assertVerificationTokenIsValid.mockRejectedValue(error);

      await expect(
        passwordRecoveryController.confirmResetToken(rawToken, email),
      ).rejects.toThrow(error);

      expect(
        tokenServiceMock.assertVerificationTokenIsValid,
      ).toHaveBeenCalledWith(email, tokenId);
    });
  });

  describe('changePassword', () => {
    const payload: ResetPasswordDto = {
      email: 'test@test.com',
      token: VALID_TOKEN,
      password: 'new-password',
      confirm_password: 'new-password',
    };
    it('should delegate the atomic reset with the supplied token', async () => {
      recoveryMock.reset.mockResolvedValue(undefined);
      const response = await passwordRecoveryController.changePassword(payload);
      expect(recoveryMock.reset).toHaveBeenCalledWith(
        payload.email,
        TOKEN.add(payload.token),
        payload.password,
      );
      expect(response.data).toBeNull();
    });
    it('should reject different passwords before consuming a token', async () => {
      await expect(
        passwordRecoveryController.changePassword({
          ...payload,
          confirm_password: 'different',
        }),
      ).rejects.toThrow(PasswordNotMatchException);
      expect(recoveryMock.reset).not.toHaveBeenCalled();
    });
    it('should reject malformed tokens before the transaction', async () => {
      await expect(
        passwordRecoveryController.changePassword({
          ...payload,
          token: 'invalid',
        }),
      ).rejects.toThrow(TokenInvalidFormat);
      expect(recoveryMock.reset).not.toHaveBeenCalled();
    });
    it('should propagate a failed atomic reset', async () => {
      const error = new TokenExpiredOrInvalidException();
      recoveryMock.reset.mockRejectedValue(error);
      await expect(
        passwordRecoveryController.changePassword(payload),
      ).rejects.toBe(error);
    });
  });

  describe('requestPasswordReset', () => {
    it('should return the same response for a missing account and an active token', async () => {
      userServiceMock.show.mockRejectedValueOnce(
        new UserNotFoundException('unknown@test.com'),
      );
      const missing = await passwordRecoveryController.requestPasswordReset(
        { email: 'unknown@test.com' },
        {} as any,
      );
      userServiceMock.show.mockResolvedValueOnce(createUserMock());
      tokenServiceMock.generate.mockResolvedValueOnce(VALID_TOKEN);
      tokenServiceMock.set.mockRejectedValueOnce(
        new ResetTokenAlreadyActiveException(),
      );
      const active = await passwordRecoveryController.requestPasswordReset(
        { email: 'test@test.com' },
        {} as any,
      );
      expect(missing).toEqual(active);
      expect(mailsQueueMock.add).not.toHaveBeenCalled();
    });
    it('should generate token, save verification token and add recovery email to queue', async () => {
      const payload = {
        email: 'test@test.com',
      } as ResetEmailDto;

      const requestMock = {
        raw: {
          headers: {
            origin: 'http://localhost:3000',
          },
        },
      };

      const user = createUserMock({
        email: payload.email,
      });

      const generatedToken = ANOTHER_VALID_TOKEN;
      const token = TOKEN.add(generatedToken);

      const verificationToken = createVerificationTokenMock({
        email: payload.email,
        code: token.getToken,
      });

      const mailOptions = {
        to: payload.email,
        subject: 'Reset password',
        html: '<p>Reset password</p>',
      };

      userServiceMock.show.mockResolvedValue(user);
      tokenServiceMock.generate.mockResolvedValue(generatedToken);
      tokenServiceMock.set.mockResolvedValue(verificationToken);
      mailingServiceMock.getOptionRecoveryEmail.mockResolvedValue(mailOptions);
      mailsQueueMock.add.mockResolvedValue(undefined);

      const response = await passwordRecoveryController.requestPasswordReset(
        payload,
        requestMock as any,
      );

      const expectedResetUrl = `http://localhost:4200/auth/reset?token=${token.getToken}&email=${encodeURIComponent(payload.email)}`;

      expect(userServiceMock.show).toHaveBeenCalledWith({
        email: payload.email,
      });

      expect(tokenServiceMock.generate).toHaveBeenCalledTimes(1);

      expect(tokenServiceMock.set).toHaveBeenCalledWith(
        expect.objectContaining({
          email: payload.email,
          code: token.getToken,
        }),
      );

      expect(tokenServiceMock.set).toHaveBeenCalledWith(
        expect.objectContaining({
          expired_at: expect.any(Date),
        }),
      );

      expect(mailingServiceMock.getOptionRecoveryEmail).toHaveBeenCalledWith(
        verificationToken,
        expectedResetUrl,
      );

      expect(mailsQueueMock.add).toHaveBeenCalledWith(
        'mail',
        {
          ...mailOptions,
          recovery: { email: payload.email, code: token.getToken },
        },
        { jobId: `recovery-${verificationToken.id}` },
      );

      expect(response).toEqual({
        message: expect.stringContaining('Si un compte correspond'),
        data: null,
        meta: undefined,
      });
    });

    it('should use the configured frontend independently of request origin', async () => {
      const payload = {
        email: 'test@test.com',
      } as ResetEmailDto;

      const requestMock = {
        raw: {
          headers: {},
        },
      };

      const user = createUserMock({
        email: payload.email,
      });

      const generatedToken = VALID_TOKEN;
      const token = TOKEN.add(generatedToken);

      const verificationToken = createVerificationTokenMock({
        email: payload.email,
        code: token.getToken,
      });

      const mailOptions = {
        to: payload.email,
        subject: 'Reset password',
        html: '<p>Reset password</p>',
      };

      userServiceMock.show.mockResolvedValue(user);
      tokenServiceMock.generate.mockResolvedValue(generatedToken);
      tokenServiceMock.set.mockResolvedValue(verificationToken);
      mailingServiceMock.getOptionRecoveryEmail.mockResolvedValue(mailOptions);
      mailsQueueMock.add.mockResolvedValue(undefined);

      await passwordRecoveryController.requestPasswordReset(
        payload,
        requestMock as any,
      );

      const expectedResetUrl = `http://localhost:4200/auth/reset?token=${token.getToken}&email=${encodeURIComponent(payload.email)}`;

      expect(mailingServiceMock.getOptionRecoveryEmail).toHaveBeenCalledWith(
        verificationToken,
        expectedResetUrl,
      );
    });

    it('should throw an error if user email does not exist', async () => {
      const payload = {
        email: 'unknown@test.com',
      } as ResetEmailDto;

      const requestMock = {
        raw: {
          headers: {
            origin: 'http://localhost:3000',
          },
        },
      };

      const error = new Error('User not found');

      userServiceMock.show.mockRejectedValue(error);

      await expect(
        passwordRecoveryController.requestPasswordReset(
          payload,
          requestMock as any,
        ),
      ).rejects.toThrow(error);

      expect(userServiceMock.show).toHaveBeenCalledWith({
        email: payload.email,
      });

      expect(tokenServiceMock.generate).not.toHaveBeenCalled();
      expect(tokenServiceMock.set).not.toHaveBeenCalled();
      expect(mailingServiceMock.getOptionRecoveryEmail).not.toHaveBeenCalled();
      expect(mailsQueueMock.add).not.toHaveBeenCalled();
    });

    it('should throw an error if queue add fails', async () => {
      const payload = {
        email: 'test@test.com',
      } as ResetEmailDto;

      const requestMock = {
        raw: {
          headers: {
            origin: 'http://localhost:3000',
          },
        },
      };

      const user = createUserMock({
        email: payload.email,
      });

      const generatedToken = VALID_TOKEN;
      const token = TOKEN.add(generatedToken);

      const verificationToken = createVerificationTokenMock({
        email: payload.email,
        code: token.getToken,
      });

      const mailOptions = {
        to: payload.email,
        subject: 'Reset password',
        html: '<p>Reset password</p>',
      };

      const error = new Error('Queue failed');

      userServiceMock.show.mockResolvedValue(user);
      tokenServiceMock.generate.mockResolvedValue(generatedToken);
      tokenServiceMock.set.mockResolvedValue(verificationToken);
      mailingServiceMock.getOptionRecoveryEmail.mockResolvedValue(mailOptions);
      mailsQueueMock.add.mockRejectedValue(error);

      await expect(
        passwordRecoveryController.requestPasswordReset(
          payload,
          requestMock as any,
        ),
      ).rejects.toThrow(error);

      expect(userServiceMock.show).toHaveBeenCalledWith({
        email: payload.email,
      });

      expect(tokenServiceMock.generate).toHaveBeenCalledTimes(1);

      expect(tokenServiceMock.set).toHaveBeenCalledWith(
        expect.objectContaining({
          email: payload.email,
          code: token.getToken,
        }),
      );

      expect(mailsQueueMock.add).toHaveBeenCalledWith(
        'mail',
        {
          ...mailOptions,
          recovery: { email: payload.email, code: token.getToken },
        },
        { jobId: `recovery-${verificationToken.id}` },
      );
    });
  });
});
