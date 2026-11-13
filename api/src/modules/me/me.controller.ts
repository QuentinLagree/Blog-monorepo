import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Session,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Session as SecureSession } from '@fastify/secure-session';
import { createAuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { Message } from 'src/commons/types/dto/message/message';
import type { UserSession } from 'src/commons/types/session-user.type';
import { SessionType } from 'src/commons/types/session.type';
import { ApiExceptionsResponse } from 'src/commons/decorators/api-exception-response.decorator';
import { ApiMessageResponse } from 'src/commons/decorators/api-message-response.decorator';
import { UnauthorizedSessionInactive } from '../auth/exceptions/unautorisation-session-inactive.exception';
import { PostSummaryDto } from '../post/dto/post-summary.dto';
import { ArticleService } from '../post/posts.service';
import { UserService } from '../user/user.service';
import { UserUpdateDto } from '../user/dto/update-user.dto';
import { UserNotFoundException } from '../user/exceptions/user-not-found.exception';
import { CurrentUser } from './decorators/current.decorator';
import { MyProfileDto } from './dto/my-profile.dto';

@ApiTags('Mon compte')
@Controller('me')
export class MeController {
  constructor(
    private readonly _user: UserService,
    private readonly _articles: ArticleService,
  ) {}

  @ApiOperation({ summary: 'Consulter la session courante.' })
  @ApiCookieAuth()
  @ApiExceptionsResponse([UnauthorizedSessionInactive])
  @UseGuards(createAuthGuardSession())
  @Get()
  async status(
    @CurrentUser() user: UserSession,
  ): Promise<Message<SessionType>> {
    return makeMessage('', 'La session est bien active.', {
      loggedIn: true,
      user: { id: user.id, email: user.email, role: user.role },
    });
  }

  @ApiOperation({ summary: 'Consulter mon profil privé.' })
  @ApiCookieAuth()
  @ApiMessageResponse(MyProfileDto, { messageExemple: 'Votre profil.' })
  @ApiExceptionsResponse([UnauthorizedSessionInactive, UserNotFoundException])
  @UseGuards(createAuthGuardSession())
  @Get('profile')
  async profile(
    @CurrentUser() user: UserSession,
  ): Promise<Message<MyProfileDto>> {
    return makeMessage(
      'Current profile',
      'Votre profil.',
      await this._user.profile(user.id),
    );
  }

  @ApiOperation({
    summary: 'Modifier mon profil.',
    description:
      'Le rôle et les ressources associées ne sont pas modifiables. Un changement de mot de passe déconnecte la session courante.',
  })
  @ApiCookieAuth()
  @ApiMessageResponse(MyProfileDto, {
    messageExemple: 'Votre profil a été modifié.',
  })
  @ApiExceptionsResponse([UnauthorizedSessionInactive, UserNotFoundException], {
    dto: UserUpdateDto,
  })
  @UseGuards(createAuthGuardSession())
  @Patch('profile')
  async update(
    @CurrentUser() user: UserSession,
    @Body() payload: UserUpdateDto,
    @Session() session: SecureSession,
  ): Promise<Message<MyProfileDto>> {
    const { nom, prenom, pseudo, email, password } = payload;
    await this._user.update(
      { id: user.id },
      { nom, prenom, pseudo, email, password },
    );
    const profile = await this._user.profile(user.id);
    if (password !== undefined) {
      session.set('user', null);
      session.delete();
    } else if (email !== undefined) {
      session.set('user', { ...user, email: profile.email });
    }
    return makeMessage(
      'Current profile updated',
      'Votre profil a été modifié.',
      profile,
    );
  }

  @ApiOperation({
    summary: 'Supprimer mon compte.',
    description:
      'Supprime le compte et les données associées selon les relations de la base, puis ferme la session.',
  })
  @ApiCookieAuth()
  @ApiExceptionsResponse([UnauthorizedSessionInactive, UserNotFoundException])
  @UseGuards(createAuthGuardSession())
  @HttpCode(204)
  @Delete()
  async destroy(
    @CurrentUser() user: UserSession,
    @Session() session: SecureSession,
  ): Promise<void> {
    await this._user.destroy({ id: user.id });
    session.set('user', null);
    session.delete();
  }

  @ApiOperation({ summary: 'Consulter mes articles, brouillons compris.' })
  @ApiCookieAuth()
  @ApiMessageResponse(PostSummaryDto, {
    isArray: true,
    messageExemple: 'Liste de vos publications.',
  })
  @ApiExceptionsResponse([UnauthorizedSessionInactive])
  @UseGuards(createAuthGuardSession())
  @Get('posts')
  async index(
    @CurrentUser() user: UserSession,
  ): Promise<Message<PostSummaryDto[]>> {
    const posts = await this._articles.indexWhere({ authorId: user.id });
    return makeMessage(
      'Current user posts',
      posts.length === 0
        ? 'La liste de vos publications est vide.'
        : 'Liste de vos publications.',
      posts,
    );
  }
}
