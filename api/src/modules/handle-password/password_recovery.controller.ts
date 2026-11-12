import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VerificationTokens } from '@prisma/client';
import { FastifyRequest } from 'fastify';

import { TransformDataMessageIntoObjectSerialization } from 'src/commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { MailingService } from 'src/commons/mailing/mailing.service';
import { MAIL_QUEUE } from 'src/commons/mailing/bullmq/bullmq.token';
import { TokenService } from 'src/commons/services/token.service';
import { Message } from 'src/commons/types/dto/message/message';
import { TOKEN } from 'src/commons/types/token.types';
import { UserEntity } from 'src/modules/user/entities/user.entities';

import { Inject } from '@nestjs/common';
import { Queue } from 'bullmq';

import { UserService } from '../user/user.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { PasswordNotMatchException } from '../auth/exceptions/password-not-same.exception';
import { ResetEmailDto } from './dto/reset-email.dto';
import { ApiMessageResponse } from 'src/commons/decorators/api-message-response.decorator';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ApiExceptionsResponse } from 'src/commons/decorators/api-exception-response.decorator';
import { TokenInvalidFormat } from './exceptions/token-invalid-format.exception';
import { TokenExpiredOrInvalidException } from './exceptions/token-expired-or-invalid.exception';
import { UserNotFoundException } from '../user/exceptions/user-not-found.exception';
import { FailSendingMailException } from 'src/commons/mailing/exceptions/fail-sending-mail.exception';
import { PasswordRecoveryService } from './password-recovery.service';
import { ResetTokenAlreadyActiveException } from './exceptions/reset-token-already-active.exception';

@ApiTags('Mot de passe')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([UserEntity]))
@Controller('password')
export class PasswordRecoveryController {
  constructor(
    @Inject(MAIL_QUEUE) private readonly __mails_queue: Queue,
    private readonly _user: UserService,
    private readonly _token: TokenService,
    private readonly _mailer: MailingService,
    private readonly _recovery: PasswordRecoveryService,
  ) {}

  @ApiOperation({
    summary: 'Demander la réinitialisation de son mot de passe.',
    description:
      'Demande la réinitialisation de son mot de passe grâce à un email valide associé au compte. Il faut déjà être inscrit pour effectuer cette action.',
  })
  @ApiMessageResponse(RequestResetPasswordDto, {
    description:
      'Succès lors de la récupération de la page avec un token et email valide et associé dans le système.',
    messageExemple:
      'Succès lors du chargement de la page, veuillez entrer votre ancien mot de passe puis votre nouveau mot de passe.',
  })
  @ApiExceptionsResponse([TokenInvalidFormat, TokenExpiredOrInvalidException])
  @Get('reset')
  async confirmResetToken(
    @Query('token') token: string,
    @Query('email') email: string,
  ): Promise<Message<RequestResetPasswordDto>> {
    const tokenId = TOKEN.add(token);

    await this._token.assertVerificationTokenIsValid(email, tokenId);

    return makeMessage(
      '',
      'Succès lors du chargement de la page, veuillez entrer votre ancien mot de passe puis votre nouveau mot de passe.',
      {
        email,
        token: tokenId.getToken,
      },
      {},
      { log: false },
    );
  }

  @ApiOperation({
    summary: 'Réinitialiser le mot de passe avec le token reçu par email.',
    description:
      "Vérifie le format du token, son association à l'email et son expiration avant de modifier le mot de passe. Les deux mots de passe doivent correspondre. Le token est supprimé après la modification.",
  })
  @ApiBody({
    description:
      'Email du compte, token reçu dans le lien de récupération, nouveau mot de passe et confirmation. Le token doit être transmis dans le corps de cette requête.',
    type: ResetPasswordDto,
    required: true,
    examples: {
      Default: {
        summary: 'Information pour réinitialiser son mot de passe.',
        description:
          'Données représentant les informations pour réinitialiser son mot de passe.',
        value: {
          email: 'johndoe42@gmail.com',
          token: '1234567890abcdef1234567890abcdef',
          password: 'password',
          confirm_password: 'password',
        },
      },
    },
  })
  @ApiMessageResponse(null, {
    description: 'Réinitialiser son mot de passe grâce aux informations.',
    messageExemple:
      'La modification de votre mot de passe est un succès, vous pouvez désormais vous connecter.',
    status: 201,
  })
  @ApiExceptionsResponse(
    [
      UserNotFoundException,
      PasswordNotMatchException,
      TokenInvalidFormat,
      TokenExpiredOrInvalidException,
    ],
    { isPublic: true, dto: ResetPasswordDto },
  )
  @HttpCode(201)
  @Post('reset')
  async changePassword(
    @Body() payload: ResetPasswordDto,
  ): Promise<Message<null>> {
    if (payload.password !== payload.confirm_password) {
      throw new PasswordNotMatchException();
    }

    const token = TOKEN.add(payload.token);

    await this._recovery.reset(payload.email, token, payload.confirm_password);

    return makeMessage(
      'updated user password',
      'La modification de votre mot de passe est un succès, vous pouvez désormais vous connecter.',
      null,
    );
  }

  @ApiOperation({
    summary: 'Envoyer un email.',
    description:
      'Envoie un email de récupération de mot de passe grâce à un email enregistrer dans le système et unb token unique générer pour effectuer le changement de mot de passe.',
  })
  @ApiBody({
    description:
      "Email de l'utilisateur pour effectuer l'envoi de l'email pour réinitialiser son mot de passe.",
    type: ResetEmailDto,
    required: true,
    examples: {
      Default: {
        summary:
          'Information pour envoyer un email pour réinitialiser son mot de passe.',
        description: 'Information (email) pour réinitialiser son mot de passe.',
        value: {
          email: 'johndoe42@gmail.com',
        },
      },
    },
  })
  @ApiMessageResponse(null, {
    description:
      "Succès lors de l'envoi de l'email avec un email valide et un email correspondant à un utilisateur enregistré dans le système.",
    messageExemple:
      'Si un compte correspond à cette adresse, un email de récupération sera envoyé.',
  })
  @ApiExceptionsResponse([UserNotFoundException, FailSendingMailException])
  @HttpCode(200)
  @Post('forgot')
  async requestPasswordReset(
    @Body() payload: ResetEmailDto,
    @Req() _request: FastifyRequest,
  ): Promise<Message<null>> {
    const { email } = payload;

    const accepted = () =>
      makeMessage(
        'Password recovery request accepted',
        'Si un compte correspond à cette adresse, un email de récupération sera envoyé.',
        null,
      );
    try {
      await this._user.show({ email });
    } catch (error) {
      if (error instanceof UserNotFoundException) return accepted();
      throw error;
    }

    const generatedToken = await this._token.generate();
    const token = TOKEN.add(generatedToken);

    let verificationToken: VerificationTokens;
    try {
      verificationToken = await this._token.set({
        email,
        code: token.getToken,
        expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
      });
    } catch (error) {
      if (error instanceof ResetTokenAlreadyActiveException) return accepted();
      throw error;
    }

    const resetUrl = new URL(
      '/auth/reset',
      process.env['FRONTEND_URL'] ?? 'http://localhost:4200',
    );
    resetUrl.searchParams.set('token', token.getToken);
    resetUrl.searchParams.set('email', email);

    try {
      await this.__mails_queue.add(
        'mail',
        {
          ...(await this._mailer.getOptionRecoveryEmail(
            verificationToken,
            resetUrl.toString(),
          )),
          recovery: { email, code: token.getToken },
        },
        { jobId: `recovery-${verificationToken.id}` },
      );
    } catch (error) {
      await this._token.deleteMatching(email, token);
      throw error;
    }

    return accepted();
  }
}
