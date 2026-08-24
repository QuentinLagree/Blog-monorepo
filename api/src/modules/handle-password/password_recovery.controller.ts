import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Mot de passe')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([UserEntity]))
@Controller('password')
export class PasswordRecoveryController {
  constructor(
    @Inject(MAIL_QUEUE) private readonly __mails_queue: Queue,
    private readonly _user: UserService,
    private readonly _token: TokenService,
    private readonly _mailer: MailingService,
  ) {}

  @ApiOperation({
    summary: "Demander la réinitialisation de son mot de passe.",
    description: "Demande la réinitialisation de son mot de passe grâce à un email valide associé au compte. Il faut déjà être inscrit pour effectuer cette action."
  })
  @ApiMessageResponse(RequestResetPasswordDto, {
    description: "Succès lors de la récupération de la page avec un token et email valide et associé dans le système.",
    messageExemple: "Succès lors du chargement de la page, veuillez entrer votre ancien mot de passe puis votre nouveau mot de passe."
  })
  @ApiExceptionsResponse([
    TokenInvalidFormat,
    TokenExpiredOrInvalidException
  ])
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
    summary: "Modifier le mot de passe de son compte récupérer grâce à l'envoi d'un mail avec un token unique.",
    description: "Demande la réinitialisation de son mot de passe grâce à un email valide associé au compte. Il faut déjà être inscrit pour effectuer cette action."
  })
  @ApiBody({
    description: "Données représentant les informations que l'utilisateur doit fournir pour changer son mot de passe, le token est lui déjà inséré lors de cette opération.",
    type: ResetPasswordDto,
    required: true,
    examples: {
      Default: {
        summary: "Information pour réinitialiser son mot de passe.",
        description: "Données représentant les informations pour réinitialiser son mot de passe.",
        value: {
          email: "johndoe42@gmail.com",
          password: "password",
          confirm_password: "password"
        }
      }
    }
  })
  @ApiMessageResponse(ResetPasswordDto, {
    description: "Réinitialiser son mot de passe grâce aux informations.",
    messageExemple: "La modification de votre mot de passe est un succès, vous pouvez désormais vous connecter.",
    status: 201
  })
  @ApiExceptionsResponse([
    UserNotFoundException,
    PasswordNotMatchException,
  ])
  @HttpCode(201)
  @Post('reset')
async changePassword(
  @Body() payload: ResetPasswordDto,
): Promise<Message<null>> {
  
  if (payload.password !== payload.confirm_password) {
      throw new PasswordNotMatchException();
    }

  await this._user.update(
    { email: payload.email },
    {
      password: payload.confirm_password,
    }
  );

  await this._token.delete(payload.email);

  return makeMessage(
    'updated user password',
    'La modification de votre mot de passe est un succès, vous pouvez désormais vous connecter.',
    null,
  );
}


@ApiOperation({
    summary: "Envoyer un email.",
    description: "Envoie un email de récupération de mot de passe grâce à un email enregistrer dans le système et unb token unique générer pour effectuer le changement de mot de passe."
  })
  @ApiBody({
    description: "Email de l'utilisateur pour effectuer l'envoi de l'email pour réinitialiser son mot de passe.",
    type: ResetEmailDto,
    required: true,
    examples: {
      Default: {
        summary: "Information pour envoyer un email pour réinitialiser son mot de passe.",
        description: "Information (email) pour réinitialiser son mot de passe.",
        value: {
          email: "johndoe42@gmail.com",
        }
      }
    }
  })
  @ApiMessageResponse(ResetPasswordDto, {
    description: "Succès lors de l'envoi de l'email avec un email valide et un email correspondant à un utilisateur enregistré dans le système.",
    messageExemple: "Vous allez recevoir un email sur johndoe42@gmail.com pour réinitialiser votre mot de passe.",
  })
  @ApiExceptionsResponse([
    UserNotFoundException,
    FailSendingMailException
  ])
  @HttpCode(200)
  @Post('forgot')
  async requestPasswordReset(
    @Body() payload: ResetEmailDto,
    @Req() request: FastifyRequest,
  ): Promise<Message<null>> {
    const { email } = payload;

    await this._user.show({ email });

    const generatedToken = await this._token.generate();
    const token = TOKEN.add(generatedToken);

    const verificationToken: VerificationTokens = await this._token.set({
      email,
      code: token.getToken,
      expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
    });

    const origin = request.raw.headers.origin || 'http://localhost:3000';

    const resetUrl = `${origin}/auth/reset?token=${token.getToken}&email=${email}`;

    await this.__mails_queue.add(
      'mail',
      await this._mailer.getOptionRecoveryEmail(verificationToken, resetUrl),
    );

    return makeMessage(
      'Generate token and Send email successful',
      `Vous allez recevoir un email sur ${email} pour réinitialiser votre mot de passe.`,
      null,
    );
  }
}