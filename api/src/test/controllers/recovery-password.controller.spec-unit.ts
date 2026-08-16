import { AuthService } from 'src/modules/auth/auth.service';
import { UserService } from 'src/modules/user/user.service';
import { TokenService } from 'src/commons/services/token.service';
import { MailingService } from 'src/commons/mailing/mailing.service';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { TOKEN } from 'src/commons/types/token.types';
import { PasswordNotMatchException } from 'src/modules/auth/exceptions/password-not-same.exception';
import { PasswordRecoveryController } from 'src/modules/handle-password/password_recovery.controller';
import { ResetPasswordDto } from 'src/modules/handle-password/dto/reset-password.dto';
import { ResetEmailDto } from 'src/modules/handle-password/dto/reset-email.dto';

describe('PasswordRecoveryController', () => {
  let passwordRecoveryController: PasswordRecoveryController;

  const VALID_TOKEN = '1234567890abcdef1234567890abcdef';
  const ANOTHER_VALID_TOKEN = 'abcdefabcdefabcdefabcdefabcdefab';


  const mailsQueueMock = {
    add: jest.fn(),
  };

  const authServiceMock = {};

  const userServiceMock = {
    show: jest.fn(),
    update: jest.fn(),
  };

  const tokenServiceMock = {
    assertVerificationTokenIsValid: jest.fn(),
    generate: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

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
    jest.clearAllMocks();

    passwordRecoveryController = new PasswordRecoveryController(
      mailsQueueMock as any,
      userServiceMock as unknown as UserService,
      tokenServiceMock as unknown as TokenService,
      mailingServiceMock as unknown as MailingService,
    );
  });

  describe('confirmResetToken', () => {
    it('should confirm reset token and return email with token', async () => {
      const email = 'test@test.com';
      const rawToken = VALID_TOKEN;
      const tokenId = TOKEN.add(rawToken);

      tokenServiceMock.assertVerificationTokenIsValid.mockResolvedValue(undefined);

      const response = await passwordRecoveryController.confirmResetToken(
        rawToken,
        email,
      );

      expect(tokenServiceMock.assertVerificationTokenIsValid).toHaveBeenCalledWith(
        email,
        tokenId,
      );

      expect(response).toEqual(
        makeMessage(
          '',
          'Succès lors du chargement de la page, veuillez entrer votre ancien mot de passe puis votre nouveau mot de passe.',
          {
            email,
            token: tokenId,
          },
          { log: false },
        ),
      );
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

      expect(tokenServiceMock.assertVerificationTokenIsValid).toHaveBeenCalledWith(
        email,
        tokenId,
      );
    });
  });

  describe('changePassword', () => {
    it('should update user password if token is valid and passwords match', async () => {
      const payload = {
        email: 'test@test.com',
        token: VALID_TOKEN,
        password: 'new-password',
        confirm_password: 'new-password',
      } as ResetPasswordDto;

      const tokenId = TOKEN.add(payload.token);
      const updatedUser = createUserMock({
        email: payload.email,
      });

      tokenServiceMock.assertVerificationTokenIsValid.mockResolvedValue(undefined);
      userServiceMock.update.mockResolvedValue(updatedUser);
      tokenServiceMock.delete.mockResolvedValue(undefined);

      const response = await passwordRecoveryController.changePassword(payload);

      expect(tokenServiceMock.assertVerificationTokenIsValid).toHaveBeenCalledWith(
        payload.email,
        tokenId,
      );

      expect(userServiceMock.update).toHaveBeenCalledWith(
        { email: payload.email },
        {
          password: payload.confirm_password,
        },
      );

      expect(tokenServiceMock.delete).toHaveBeenCalledWith(payload.email);

      expect(response).toEqual(
        makeMessage(
          'updated user password',
          'La modification de votre mot de passe est un succès, vous pouvez désormais vous connecter.',
          updatedUser,
        ),
      );
    });

    it('should throw PasswordNotMatchException if passwords do not match', async () => {
      const payload = {
        email: 'test@test.com',
        token: VALID_TOKEN,
        password: 'new-password',
        confirm_password: 'different-password',
      } as ResetPasswordDto;

      const tokenId = TOKEN.add(payload.token);

      tokenServiceMock.assertVerificationTokenIsValid.mockResolvedValue(undefined);

      await expect(
        passwordRecoveryController.changePassword(payload),
      ).rejects.toThrow(PasswordNotMatchException);

      expect(tokenServiceMock.assertVerificationTokenIsValid).toHaveBeenCalledWith(
        payload.email,
        tokenId,
      );

      expect(userServiceMock.update).not.toHaveBeenCalled();
      expect(tokenServiceMock.delete).not.toHaveBeenCalled();
    });

    it('should throw an error if token is not valid', async () => {
      const payload = {
        email: 'test@test.com',
        token: ANOTHER_VALID_TOKEN ,
        password: 'new-password',
        confirm_password: 'new-password',
      } as ResetPasswordDto;

      const tokenId = TOKEN.add(payload.token);
      const error = new Error('Invalid token');

      tokenServiceMock.assertVerificationTokenIsValid.mockRejectedValue(error);

      await expect(
        passwordRecoveryController.changePassword(payload),
      ).rejects.toThrow(error);

      expect(tokenServiceMock.assertVerificationTokenIsValid).toHaveBeenCalledWith(
        payload.email,
        tokenId,
      );

      expect(userServiceMock.update).not.toHaveBeenCalled();
      expect(tokenServiceMock.delete).not.toHaveBeenCalled();
    });

    it('should throw an error if user password update fails', async () => {
      const payload = {
        email: 'test@test.com',
        token: VALID_TOKEN,
        password: 'new-password',
        confirm_password: 'new-password',
      } as ResetPasswordDto;

      const tokenId = TOKEN.add(payload.token);
      const error = new Error('Update failed');

      tokenServiceMock.assertVerificationTokenIsValid.mockResolvedValue(undefined);
      userServiceMock.update.mockRejectedValue(error);

      await expect(
        passwordRecoveryController.changePassword(payload),
      ).rejects.toThrow(error);

      expect(tokenServiceMock.assertVerificationTokenIsValid).toHaveBeenCalledWith(
        payload.email,
        tokenId,
      );

      expect(userServiceMock.update).toHaveBeenCalledWith(
        { email: payload.email },
        {
          password: payload.confirm_password,
        },
      );

      expect(tokenServiceMock.delete).not.toHaveBeenCalled();
    });
  });

  describe('requestPasswordReset', () => {
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

      const expectedResetUrl = `${requestMock.raw.headers.origin}/auth/reset?token=${token.getToken}&email=${payload.email}`;

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
        mailOptions,
      );

      expect(response).toEqual(
        makeMessage(
          'Generate token and Send email successful',
          `Vous allez recevoir un email sur ${payload.email} pour réinitialiser votre mot de passe.`,
          null,
        ),
      );
    });

    it('should use localhost origin if request origin is missing', async () => {
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

      const expectedResetUrl = `http://localhost:3000/auth/reset?token=${token.getToken}&email=${payload.email}`;

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
        mailOptions,
      );
    });
  });
});