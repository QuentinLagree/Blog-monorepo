import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
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

import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { UserEmail } from './dto/user-email.dto';
import { UserPasswordFields } from './dto/passwords-fields.dto';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { PasswordNotMatchException } from '../auth/exceptions/password-not-same.exception';

@ApiTags('Gestion du mot de passe')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([UserEntity]))
@Controller('password')
export class PasswordRecoveryController {
  constructor(
    @Inject(MAIL_QUEUE) private readonly __mails_queue: Queue,
    private readonly _auth: AuthService,
    private readonly _user: UserService,
    private readonly _token: TokenService,
    private readonly _mailer: MailingService,
  ) {}

  @Get('reset')
  async confirmResetToken(
    @Query('token') token: string,
    @Query('email') email: string,
  ): Promise<Message<{ email: string; token: TOKEN }>> {
    const tokenId = TOKEN.add(token);

    await this._token.assertVerificationTokenIsValid(email, tokenId);

    return makeMessage(
      '',
      'Succès lors du chargement de la page, veuillez entrer votre ancien mot de passe puis votre nouveau mot de passe.',
      {
        email,
        token: tokenId,
      },
      { log: false },
    );
  }

  @Post('reset')
async changePassword(
  @Body() payload: UserPasswordFields,
): Promise<Message<unknown>> {
  
  const tokenId = TOKEN.add(payload.token);

  await this._token.assertVerificationTokenIsValid(payload.email, tokenId);

  if (payload.password !== payload.confirm_password) {
      throw new PasswordNotMatchException();
    }

  const updatedUser = await this._user.update(
    { email: payload.email },
    {
      password: payload.confirm_password,
    }
  );

  await this._token.delete(payload.email);

  return makeMessage(
    'updated user password',
    'La modification de votre mot de passe est un succès, vous pouvez désormais vous connecter.',
    updatedUser,
  );
}

  @ApiBody({
    type: UserEmail,
  })
  @Post('/forgot')
  async requestPasswordReset(
    @Body() payload: UserEmail,
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