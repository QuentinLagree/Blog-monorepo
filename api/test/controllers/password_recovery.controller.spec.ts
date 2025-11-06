import { TestingModule, Test } from '@nestjs/testing';
import { PasswordRecoveryController } from './password_recovery.controller';
import { AuthService } from '../auth/auth.service';
import { createAuthServiceMock } from '../../usecases/mocks/services/auth/create.auth.service.mocks';
import { createUserServiceMock } from '../../usecases/mocks/services/auth/create.user.service.mocks';
import { UserService } from '../user/user.service';
import { MailService } from 'src/config/mail/mailer.service';
import { createMailerServiceMock } from '../../usecases/mocks/services/auth/create_mailer.service.mocks';
import { TokenService } from 'src/commons/token/token.service';
import { createTokenServiceMock } from '../../usecases/mocks/services/auth/create_token.service.mocks';
import {
  createVerificatioEmailParamSetTokenMock,
  createVerificationEmailMock,
  MockToken,
} from '../../usecases/mocks/create_verificationemail.mocks';
import { TOKEN } from 'src/commons/types/token.types';
import { TokenExpiredOrInvalidException } from 'src/commons/exceptions/TokenIsExpired.error';
import * as emptyFieldsModule from 'src/usecases/utils/checkIfFieldsEmpty.utils';
import {
  createFieldsPasswordManagerDto,
  createUserMock,
  createWrongFieldsPasswordManagerDto,
} from '../../usecases/mocks/create.user.mocks';
import { makeMessage, Message } from 'src/commons/helpers/logger.helper';
import { isFieldsInvalid } from 'src/commons/exceptions/isFieldsInvalids.error';
import { ValidationError } from 'class-validator';
import { UserEmail } from 'src/modules/handle-password/dto/user-email.dto';
import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PasswordNotMatchException } from 'src/commons/exceptions/PasswordNotMatchException.error';
import { FastifyRequest } from 'fastify';
import { RESET_PASSWORD_ROUTE } from 'src/commons/constants/routes';
import { FailSendingMail } from 'src/commons/exceptions/failSendingMail.error';
import { expectHttpExceptionWithMessage } from 'test/helpers/HTTPExceptionErrorHandleTest.utils';
import { PasswordNotSameException } from 'src/commons/exceptions/PasswordNotSame.error';
import { UserPasswordFields } from './dto/passwords-fields.dto';

const FATAL_ERROR = 'Database Down';

let hasValidTokenMock: jest.SpyInstance;

describe('PasswordRecoveryController Tests', () => {
  let controller: PasswordRecoveryController;
  let _user: { [K in keyof UserService]: jest.Mock };
  let _auth: { [K in keyof AuthService]: jest.Mock };
  let _mailer: { [K in keyof MailService]: jest.Mock };
  let _token: { [K in keyof TokenService]: jest.Mock };

  beforeEach(async () => {
    _user = createUserServiceMock();
    _auth = createAuthServiceMock();
    _mailer = createMailerServiceMock();
    _token = createTokenServiceMock();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [PasswordRecoveryController],
      providers: [
        { provide: TokenService, useValue: _token },
        { provide: MailService, useValue: _mailer },
        { provide: UserService, useValue: _user },
        { provide: AuthService, useValue: _auth },
      ],
    }).compile();

    controller = app.get<PasswordRecoveryController>(
      PasswordRecoveryController,
    );
  });

  describe('PasswordRecoveryController - providers are defined', () => {
    it('controller should be defined ', () => {
      expect(controller).toBeDefined();
    });

    it('UserService should be defined ', () => {
      expect(_user).toBeDefined();
    });

    it('TokenService should be defined ', () => {
      expect(_token).toBeDefined();
    });
    it('AuthService should be defined ', () => {
      expect(_auth).toBeDefined();
    });

    it('MailerService should be defined ', () => {
      expect(_mailer).toBeDefined();
    });
  });

  describe('PasswordRecoveryController - confirmResetToken', () => {
    beforeEach(() => {
      _token.assertVerificationTokenIsValid.mockReset();
      hasValidTokenMock = jest.spyOn(TOKEN, 'hasValid');
      hasValidTokenMock.mockReset();
      hasValidTokenMock.mockReturnValue(true);
    });
    afterEach(() => jest.restoreAllMocks());
    it('Should return a success message', async () => {
      const { code, email } = createVerificationEmailMock();

      _token.assertVerificationTokenIsValid.mockResolvedValue(undefined);

      const result = controller.confirmResetToken(code, email);

      await expect(result).resolves.toEqual({
        message:
          'Succés lors du chargement de la page, veuillez entrer votre ancien mot de passe et ensuite entrer le nouveau mot de passe.',
        data: { email, token: TOKEN.add(code) },
      });
      expect(_token.assertVerificationTokenIsValid).toHaveBeenCalledTimes(1);
      await expect(_token.assertVerificationTokenIsValid()).resolves.toBe(
        undefined,
      );
      expect(_token.assertVerificationTokenIsValid).toHaveBeenCalledWith(
        email,
        TOKEN.add(code),
      );
    });

    it('Should return a error when token is undefined', async () => {
      const { code, email } = createVerificationEmailMock();

      let hasValid = hasValidTokenMock.mockReturnValue(false);

      await expectHttpExceptionWithMessage(
        () => controller.confirmResetToken(code, email),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          'Token Invalid Format',
          "Le token de resiliation de votre mot de passe n'est pas dans le bon format.",
          null,
        ),
      );
      expect(hasValid).toHaveBeenCalledTimes(1);
      expect(hasValid).toHaveBeenCalledWith(code);
      expect(hasValid).toHaveLastReturnedWith(false);
      expect(code).toHaveLength(32);
    });

    it('Should return a error when token is invalid', async () => {
      const { code, email } = createVerificationEmailMock();

      const modifyToken = code + '1515';

      let hasValid = hasValidTokenMock.mockReturnValue(false);

      await expectHttpExceptionWithMessage(
        () => controller.confirmResetToken(modifyToken, email),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          'Token Invalid Format',
          "Le token de resiliation de votre mot de passe n'est pas dans le bon format.",
          null,
        ),
      );
      expect(hasValid).toHaveBeenCalledTimes(1);
      expect(hasValid).toHaveBeenCalledWith(modifyToken);
      expect(hasValid).toHaveLastReturnedWith(false);
      expect(modifyToken).not.toHaveLength(32);
    });

    it('Should return a error when token is expired', async () => {
      const { code, email } = createVerificationEmailMock({
        expired_at: new Date(Date.now() - 1000 * 60 * 60),
      });

      _token.assertVerificationTokenIsValid.mockRejectedValue(
        new TokenExpiredOrInvalidException(),
      );

      await expectHttpExceptionWithMessage(
        () => controller.confirmResetToken(code, email),
        HttpStatus.UNAUTHORIZED,
        makeMessage(
          'Get with token invalid',
          'Le token est expiré ou invalide.',
          null,
        ),
      );
      expect(_token.assertVerificationTokenIsValid).toHaveBeenCalledTimes(1);
      await expect(_token.assertVerificationTokenIsValid()).rejects.toThrow(
        TokenExpiredOrInvalidException,
      );
      expect(_token.assertVerificationTokenIsValid).toHaveBeenCalledWith(
        email,
        TOKEN.add(code),
      );
    });

    it('Should return a fatal error when error unexcepted crash', async () => {
      const { code, email } = createVerificationEmailMock();

      const error = new Error(FATAL_ERROR);

      _token.assertVerificationTokenIsValid.mockRejectedValueOnce(error);

      await expectHttpExceptionWithMessage(
        () => controller.confirmResetToken(code, email),
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

  describe('PasswordRecoveryController - changePassword()', () => {
    let checkIfFieldsEmpty: jest.SpyInstance = jest.spyOn(
      emptyFieldsModule,
      'checkFieldIsEmpty',
    );

    beforeEach(() => {
      checkIfFieldsEmpty = jest.spyOn(emptyFieldsModule, 'checkFieldIsEmpty');
      checkIfFieldsEmpty.mockReset();
      checkIfFieldsEmpty.mockResolvedValue(undefined);
      _auth.login.mockReset();
      _user.update.mockReset();
    });
    afterEach(() => jest.restoreAllMocks());

    it('Should return a success message to update password with new record of user', async () => {
      const passwordsManager = createFieldsPasswordManagerDto();
      const currentUser = createUserMock();

      const newUser = createUserMock({
        password: 'newpassword',
      });

      _auth.login.mockResolvedValue(currentUser);
      _user.update.mockResolvedValue(newUser);

      const result: Promise<Message> =
        controller.changePassword(passwordsManager);
      await expect(result).resolves.toEqual({
        message:
          'La modification de votre mot de passe est un succé, vous pouvez désormais vous connectez.',
        data: newUser,
      });
      expect(_auth.login).toHaveBeenCalledTimes(1);
      await expect(_auth.login()).resolves.toBe(currentUser);
      expect(_auth.login).toHaveBeenCalledWith({
        email: passwordsManager.email,
        password: passwordsManager.old_password,
      });

      expect(_user.update).toHaveBeenCalledTimes(1);
      await expect(_user.update()).resolves.toBe(newUser);
      expect(_user.update).toHaveBeenCalledWith(
        { email: passwordsManager.email },
        { password: passwordsManager.confirm_password },
      );
    });

    it('Should return an error when fields are empty', async () => {
      const passwordsManager = createFieldsPasswordManagerDto({
        password: '',
      });

      // Mock checkFieldIsEmpty pour ce test uniquement
      const errors = [new ValidationError(), new ValidationError()];

      checkIfFieldsEmpty.mockRejectedValue(new isFieldsInvalid(errors));

      await expectHttpExceptionWithMessage(
        () => controller.changePassword(passwordsManager),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          'User Password Field Empty (password_reset)',
          'Tous les champs de mot de passe sont requis.',
          expect.any(isFieldsInvalid),
        ),
      );
      expect(checkIfFieldsEmpty).toHaveBeenCalledTimes(1);
      await expect(checkIfFieldsEmpty).rejects.toThrow(isFieldsInvalid);
      expect(checkIfFieldsEmpty).toHaveBeenCalledWith(
        passwordsManager,
        UserPasswordFields,
      );
    });

    it('Should return an error when user is not found', async () => {
      const passwordsManager = createWrongFieldsPasswordManagerDto();

      _auth.login.mockRejectedValue(new NotFoundException());

      await expectHttpExceptionWithMessage(
        () => controller.changePassword(passwordsManager),
        HttpStatus.UNAUTHORIZED,
        makeMessage(
          'User logged failed',
          "L'email ou le mot de passe est incorrect",
          null,
        ),
      );
      expect(_auth.login).toHaveBeenCalledTimes(1);
      await expect(_auth.login()).rejects.toThrow(NotFoundException);
      expect(_auth.login).toHaveBeenCalledWith({
        email: passwordsManager.email,
        password: passwordsManager.old_password,
      });
    });

    it('Should return an error when password not match with hash password', async () => {
      const passwordsManager = createWrongFieldsPasswordManagerDto();

      _auth.login.mockRejectedValue(new PasswordNotMatchException());

      await expectHttpExceptionWithMessage(
        () => controller.changePassword(passwordsManager),
        HttpStatus.UNAUTHORIZED,
        makeMessage(
          'User logged failed',
          "L'email ou le mot de passe est incorrect",
          null,
        ),
      );
      expect(_auth.login).toHaveBeenCalledTimes(1);
      await expect(_auth.login()).rejects.toThrow(PasswordNotMatchException);
      expect(_auth.login).toHaveBeenCalledWith({
        email: passwordsManager.email,
        password: passwordsManager.old_password,
      });
    });

    it('Should return an error when passwords not same', async () => {
      const passwordsManager = createWrongFieldsPasswordManagerDto({
        confirm_password: 'notsamepassword',
      });

      const user = createUserMock();
      _auth.login.mockResolvedValue(user);
      _auth.throwAnNotSamePasswordExceptionIfNotSame.mockRejectedValue(
        new PasswordNotSameException(),
      );

      await expectHttpExceptionWithMessage(
        () => controller.changePassword(passwordsManager),
        HttpStatus.BAD_REQUEST,
        makeMessage('', 'Les deux mot de passes doivent correspondre.', null, {
          log: false,
        }),
      );
      expect(_auth.login).toHaveBeenCalledTimes(1);
      await expect(_auth.login()).resolves.toEqual(user);
      expect(_auth.login).toHaveBeenCalledWith({
        email: passwordsManager.email,
        password: passwordsManager.old_password,
      });
    });

    it('Should return an error when unexpected crash', async () => {
      const passwordsManager = createFieldsPasswordManagerDto();

      const error = new Error(FATAL_ERROR);
      _auth.login.mockRejectedValue(error);

      await expectHttpExceptionWithMessage(
        () => controller.changePassword(passwordsManager),
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

  describe('PasswordRecoveryController - requestPasswordReset()', () => {
    let checkIfFieldsEmpty: jest.SpyInstance = jest.spyOn(
      emptyFieldsModule,
      'checkFieldIsEmpty',
    );
    let tokenIsValid: jest.SpyInstance = jest.spyOn(TOKEN, 'hasValid');
    const request = { raw: { headers: { origin: 'http://localhost:3000' } } };

    beforeEach(() => {
      checkIfFieldsEmpty = jest.spyOn(emptyFieldsModule, 'checkFieldIsEmpty');
      checkIfFieldsEmpty.mockReset();
      checkIfFieldsEmpty.mockResolvedValue(undefined);

      tokenIsValid = jest.spyOn(TOKEN, 'hasValid');
      tokenIsValid.mockReset();
      tokenIsValid.mockResolvedValue(true);

      _token.set.mockReset();
      _mailer.sendEmailToken.mockReset();
      _token.generate.mockReset();

      _token.generate.mockResolvedValue(MockToken);
    });
    afterEach(() => jest.restoreAllMocks());

    it('Should send email successfuly and return a success message for that', async () => {
      const { email } = createUserMock();

      const resetUrl = `${request.raw.headers.origin || 'http://localhost:3000'}${RESET_PASSWORD_ROUTE}?token=${MockToken}&email=${email}`;

      const fixedDate = new Date('2024-01-01T00:00:00.000Z');
      const verifEmail = createVerificationEmailMock({
        expired_at: fixedDate,
      });

      _token.generate.mockResolvedValue(MockToken);
      _token.set.mockResolvedValue(verifEmail);
      _mailer.sendEmailToken.mockResolvedValue(undefined);

      const result = controller.requestPasswordReset(
        { email },
        request as FastifyRequest,
      );

      await expect(result).resolves.toEqual({
        message: `Vous allez recevoir sur ${email} pour réinitialiser votre mot de passe.`,
        data: null,
      });

      expect(_token.generate).toHaveBeenCalledTimes(1);
      expect(_token.set).toHaveBeenCalledTimes(1);
      expect(_mailer.sendEmailToken).toHaveBeenCalledTimes(1);
      await expect(_token.generate()).resolves.toBe(MockToken);
      expect(_token.generate).toHaveBeenCalledWith();

      await expect(_token.set()).resolves.toBe(verifEmail);
      expect(_mailer.sendEmailToken).toHaveBeenCalledWith(
        expect.objectContaining({
          code: MockToken,
          expired_at: fixedDate,
        }),
        resetUrl,
      );
      expect(_token.set).toHaveBeenCalledWith(
        createVerificatioEmailParamSetTokenMock({
          code: MockToken,
          expired_at: expect.any(Date),
        }),
      );

      await expect(_mailer.sendEmailToken()).resolves.toBe(undefined);
    });
    it('Sould return a error when fields are empty', async () => {
      const { email } = createUserMock();

      const error = [new ValidationError(), new ValidationError()];

      checkIfFieldsEmpty.mockRejectedValue(new isFieldsInvalid(error));

      await expectHttpExceptionWithMessage(
        () =>
          controller.requestPasswordReset({ email }, request as FastifyRequest),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          'User password request failed (reset_password) !',
          "Le champ de l'email est requis.",
          expect.any(isFieldsInvalid),
        ),
      );
      expect(checkIfFieldsEmpty).toHaveBeenCalledTimes(1);
      await expect(checkIfFieldsEmpty).rejects.toThrow(isFieldsInvalid);
      expect(checkIfFieldsEmpty).toHaveBeenCalledWith({ email }, UserEmail);
    });

    it('Should return a error when token is invalid', async () => {
      const { code, email } = createVerificationEmailMock();

      let hasValid = tokenIsValid.mockReturnValue(false);

      await expectHttpExceptionWithMessage(
        () =>
          controller.requestPasswordReset({ email }, request as FastifyRequest),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          'Token Invalid Format',
          "Le token de resiliation de votre mot de passe n'est pas dans le bon format.",
          null,
        ),
      );

      _token.generate.mockResolvedValue(undefined);

      expect(hasValid).toHaveBeenCalledTimes(1);
      expect(hasValid).toHaveBeenCalledWith(code);
      expect(hasValid).toHaveLastReturnedWith(false);
      expect(code).toHaveLength(32);
    });

    it('Should a error message when user post again so the request are already send', async () => {
      let verifEmail = createVerificationEmailMock();
      _token.generate.mockResolvedValue(MockToken);
      _token.set.mockRejectedValue(new BadRequestException());

      await expectHttpExceptionWithMessage(
        () =>
          controller.requestPasswordReset(
            { email: verifEmail.email },
            request as FastifyRequest,
          ),
        HttpStatus.CONFLICT,
        makeMessage(
          'User already exist in table VerificationEmail',
          'Vous avez déjà fais une demande contactez un administrateur.',
          null,
        ),
      );
      expect(_token.generate).toHaveBeenCalledTimes(1);
      expect(_token.set).toHaveBeenCalledTimes(1);
      await expect(_token.generate()).resolves.toEqual(MockToken);
      expect(_token.generate).toHaveBeenCalledWith();

      await expect(_token.set()).rejects.toThrow(BadRequestException);
      expect(_token.set).toHaveBeenCalledWith(
        createVerificatioEmailParamSetTokenMock({
          code: MockToken,
          expired_at: expect.any(Date),
        }),
      );
    });

    it('Should a error message when send mail fail', async () => {
      let verifEmail = createVerificationEmailMock();

      _token.set.mockResolvedValue(verifEmail);
      _mailer.sendEmailToken.mockImplementationOnce(() => {
        throw new FailSendingMail();
      });

      await expectHttpExceptionWithMessage(
        () =>
          controller.requestPasswordReset(
            {
              email: verifEmail.email,
            },
            request as FastifyRequest,
          ),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Error: send email failed',
          "Une erreur est survenue lors de l'envoie de l'email pour votre demande.",
          null,
        ),
      );
    });

    it('Should a error when error unexpected crash return', async () => {
      let verifEmail = createVerificationEmailMock();

      _token.set.mockResolvedValue(verifEmail);
      const error = new Error(FATAL_ERROR);
      _mailer.sendEmailToken.mockImplementationOnce(() => {
        throw error;
      });

      await expectHttpExceptionWithMessage(
        () =>
          controller.requestPasswordReset(
            {
              email: verifEmail.email,
            },
            request as FastifyRequest,
          ),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Fatal Error',
          "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
          error,
          { level: 'Fatal' },
        ),
      );
      expect(_token.set).toHaveBeenCalledTimes(1);
      expect(_mailer.sendEmailToken).toHaveBeenCalledTimes(1);

      await expect(_token.set()).resolves.toEqual(verifEmail);
      expect(_token.set).toHaveBeenCalledWith(
        createVerificatioEmailParamSetTokenMock({
          code: MockToken,
          expired_at: expect.any(Date),
        }),
      );
    });
  });
});
