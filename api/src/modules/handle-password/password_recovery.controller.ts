import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Req,
  UseInterceptors,
  UsePipes,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { User, VerificationTokens } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import { RESET_PASSWORD_ROUTE } from 'src/commons/constants/routes';
import { TOKEN } from 'src/commons/types/token.types';
import { makeMessage } from 'src/commons/helpers/logger.helper';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { TokenExpiredOrInvalidException } from 'src/commons/exceptions/TokenIsExpired.error';
import { PasswordNotMatchException } from 'src/commons/exceptions/PasswordNotMatchException.error';
import { isFieldsInvalid } from '../../commons/exceptions/isFieldsInvalids.error';
import { UserEntity } from 'src/modules/user/entities/user.entities';
import { TransformDataMessageIntoObjectSerialization } from 'src/commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { FailSendingMail } from 'src/commons/exceptions/failSendingMail.error';
import { TokenService } from 'src/commons/token/token.service';
import { MailService } from 'src/config/mail/mailer.service';
import { Url } from 'src/commons/types/url.types';
import { PasswordNotSameException } from 'src/commons/exceptions/PasswordNotSame.error';
import { UserLoginCredentials } from '../auth/dto/user-login-credentials.dto';
import { UserPasswordFields } from './dto/passwords-fields.dto';
import { UserEmail } from './dto/user-email.dto';
import { checkFieldIsEmpty } from 'src/commons/helpers/dto/checkIfFieldsEmpty.utils';
import { Message } from 'src/commons/types/message/message';

@ApiTags('Gestion du mot de passe')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([UserEntity]))
@Controller('password')
export class PasswordRecoveryController {
  constructor(
    private readonly _auth: AuthService,
    private readonly _user: UserService,
    private readonly _token: TokenService,
    private readonly _mailer: MailService,
  ) {}

  @Get('reset')
  async confirmResetToken(
    @Query('token') token: string,
    @Query('email') email: string,
  ): Promise<Message<{ email: string; token: TOKEN } | null>> {
    if (!TOKEN.hasValid(token)) {
      throw new HttpException(
        makeMessage(
          'Token Invalid Format',
          "Le token de resiliation de votre mot de passe n'est pas dans le bon format.",
          null,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      let token_id: TOKEN = TOKEN.add(token);

      await this._token.assertVerificationTokenIsValid(email, token_id);

      return makeMessage(
        '',
        'Succés lors du chargement de la page, veuillez entrer votre ancien mot de passe et ensuite entrer le nouveau mot de passe.',
        { email, token: token_id },
        { log: false },
      );
    } catch (error) {
      switch (true) {
        case error instanceof TokenExpiredOrInvalidException:
          throw new HttpException(
            makeMessage(
              'Get with token invalid',
              'Le token est expiré ou invalide.',
              null,
            ),
            HttpStatus.UNAUTHORIZED,
          );

        default:
          throw new HttpException(
            makeMessage(
              'Fatal Error',
              "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
              error,
              { level: 'Fatal' },
            ),
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }

  @ApiBody({
    type: UserPasswordFields,
  })
  @Post('reset')
  async changePassword(
    @Body() passwordManagment: UserPasswordFields,
  ): Promise<Message<isFieldsInvalid | null | User>> {
    try {
      await checkFieldIsEmpty(passwordManagment, UserPasswordFields);
      await this._auth.login({
        email: passwordManagment.email,
        password: passwordManagment.old_password,
      });

      await this._auth.throwAnNotSamePasswordExceptionIfNotSame(
        passwordManagment.password,
        passwordManagment.confirm_password,
      );

      const updated_user = await this._user.update(
        { email: passwordManagment.email },
        { password: passwordManagment.confirm_password },
      );
      return makeMessage(
        'updated user password',
        'La modification de votre mot de passe est un succé, vous pouvez désormais vous connectez.',
        updated_user,
      );
    } catch (error) {
      switch (true) {
        case error instanceof isFieldsInvalid:
          throw new HttpException(
            makeMessage(
              'User Password Field Empty (password_reset)',
              'Tous les champs de mot de passe sont requis.',
              error,
            ),
            HttpStatus.BAD_REQUEST,
          );

        case error instanceof PasswordNotSameException:
          throw new HttpException(
            makeMessage(
              '',
              'Les deux mot de passes doivent correspondre.',
              null,
              { log: false },
            ),
            HttpStatus.BAD_REQUEST,
          );

        case error instanceof NotFoundException ||
          error instanceof PasswordNotMatchException:
          throw new HttpException(
            makeMessage(
              'User logged failed',
              "L'email ou le mot de passe est incorrect",
              null,
            ),
            HttpStatus.UNAUTHORIZED,
          );

        default:
          throw new HttpException(
            makeMessage(
              'Fatal Error',
              "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
              error,
              { level: 'Fatal' },
            ),
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }

  @ApiBody({
    type: UserLoginCredentials,
    examples: {
      ApiBody: {
        value: {
          email: 'lagreequentindev21@gmail.com',
        },
      },
    },
  })
  @Post('forgot')
  async requestPasswordReset(
    @Body() emailDto: UserEmail,
    @Req() request: FastifyRequest,
  ): Promise<Message<null | isFieldsInvalid>> {
    try {
      const generated_token = await this._token.generate();

      if (!TOKEN.hasValid(generated_token))
        throw new TokenExpiredOrInvalidException();
      await checkFieldIsEmpty(emailDto, UserEmail);
      const { email } = emailDto;

      const token: TOKEN = TOKEN.add(generated_token);

      let new_verification_email: VerificationTokens = await this._token.set({
        email: email,
        code: token.getToken,
        expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
      });

      let resetUrl = `${request.raw.headers.origin || 'http://localhost:3000'}${RESET_PASSWORD_ROUTE}?token=${token.getToken}&email=${email}`;

      this._mailer.sendEmailToken(new_verification_email, resetUrl);

      return makeMessage(
        'Generate token and Send email successful',
        `Vous allez recevoir sur ${email} pour réinitialiser votre mot de passe.`,
        null,
      );
    } catch (error) {
      switch (true) {
        case error instanceof isFieldsInvalid:
          throw new HttpException(
            makeMessage(
              'User password request failed (reset_password) !',
              "Le champ de l'email est requis.",
              error,
            ),
            HttpStatus.BAD_REQUEST,
          );

        case error instanceof TokenExpiredOrInvalidException:
          throw new HttpException(
            makeMessage(
              'Token Invalid Format',
              "Le token de resiliation de votre mot de passe n'est pas dans le bon format.",
              null,
            ),
            HttpStatus.BAD_REQUEST,
          );

        case error instanceof BadRequestException:
          throw new HttpException(
            makeMessage(
              'User already exist in table VerificationEmail',
              'Vous avez déjà fais une demande contactez un administrateur.',
              null,
            ),
            HttpStatus.CONFLICT,
          );
        case error instanceof FailSendingMail:
          throw new HttpException(
            makeMessage(
              'Error: send email failed',
              "Une erreur est survenue lors de l'envoie de l'email pour votre demande.",
              null,
            ),
            HttpStatus.INTERNAL_SERVER_ERROR,
          );

        default:
          throw new HttpException(
            makeMessage(
              'Fatal Error',
              "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
              error,
              { level: 'Fatal' },
            ),
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }
}
