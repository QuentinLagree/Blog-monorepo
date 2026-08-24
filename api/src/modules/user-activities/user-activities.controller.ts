import * as secureSession from '@fastify/secure-session';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Session,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { Message } from 'src/commons/types/dto/message/message';
import { StatusReadingDto } from './dto/status-reading.dto';
import { UpdatePostReadingDto } from './dto/update-post-reading.dto';
import { StatusLikeDto } from '../post/dto/status-like.dto';
import { PostsEntity } from '../post/entities/posts.entities';
import { ArticleService } from '../post/posts.service';
import { UserEntity } from '../user/entities/user.entities';
import { UserService } from '../user/user.service';
import { PostRead } from '@prisma/client';
import { ApiMessageResponse } from 'src/commons/decorators/api-message-response.decorator';
import { ApiExceptionsResponse } from 'src/commons/decorators/api-exception-response.decorator';
import { CurrentUser } from '../me/decorators/current.decorator';
import { UserSession } from 'src/commons/types/session-user.type';
import { UserNotHaveAuthorisation } from '../user/exceptions/user-not-have-authorization';
import { PostDoesntLikeOrUnlikeAlready } from '../user/exceptions/post-doesnt-like-unlike-already.exception';
import { PostDoesntLikeOrUnlikeByAuthor } from '../user/exceptions/post-doesnt-like-unlike-same-author.exception';
import { PostNotFoundException } from '../post/exceptions/post-not-found.exception';

@UseGuards(AuthGuardSession())
@ApiCookieAuth('session')
@ApiTags('Activités utilisateurs')
@Controller('users/posts')
export class UserActivityController {
  constructor(
    private readonly _user: UserService,
    private readonly _posts: ArticleService,
  ) { }

  @ApiOperation({
    summary: 'Ajout d\'un like sur un article.',
    description: "L'utilisateur a ajouté un like sur un article. Il faut être connecté et également l'article ne doit pas appartenir à l'utilisateur connecté pour effectué cette action."
  })
  @ApiMessageResponse(StatusLikeDto, {
    description: "Le like a été ajouté avec succès. Si l'utilisateur est bien connecté.",
    messageExemple: "Le like a été effectué avec succès.",
    status: 201
  })
  @ApiParam({
    name: 'postId',
    description: "L'identifiant unique de l'article.",
    required: true,
    type: "number"
  })
  @ApiExceptionsResponse([
    PostDoesntLikeOrUnlikeAlready,
    PostDoesntLikeOrUnlikeByAuthor,
    UserNotHaveAuthorisation,
  ])
  @HttpCode(201)
  @Post(':postId/add-like')
  async likePost(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: UserSession
  ): Promise<Message<StatusLikeDto>> {
    await this._user.addLike({
      user_id: user.id,
      post_id: postId,
    });

    const status = await this._posts.getLikeStatus(
      user.id,
      postId,
    );

    return makeMessage(
      `Like post ${postId}`,
      'Le like a été effectué avec succès.',
      status,
    );
  }

  @ApiOperation({
    summary: "Supprimer un like d'un article.",
    description: "L'utilisateur a supprimé un like sur un article. Il faut être connecté et également l'article ne doit pas appartenir à l'utilisateur connecté pour effectué cette action."
  })
  @ApiMessageResponse(StatusLikeDto, {
    description: "Le like a été supprimé avec succès. Si l'utilisateur est bien connecté.",
    messageExemple: "Le like a été supprimé avec succès.",
    status: 201
  })
  @ApiParam({
    name: 'postId',
    description: "L'identifiant unique de l'article.",
    required: true,
    type: "number"
  })
  @ApiExceptionsResponse([
    PostDoesntLikeOrUnlikeAlready,
    PostDoesntLikeOrUnlikeByAuthor,
    UserNotHaveAuthorisation,
  ])
  @HttpCode(201)
  @Delete(':postId/unlike')
  async unlikePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Session() session: secureSession.Session,
  ): Promise<Message<StatusLikeDto>> {
    const sessionUser = session.get('user');

    await this._user.unlikePost({
      user_id: sessionUser.id,
      post_id: postId,
    });

    const status = await this._posts.getLikeStatus(
      sessionUser.id,
      postId,
    );

    return makeMessage(
      `Unlike post ${postId}`,
      'Le like a été supprimé avec succès.',
      status,
    );
  }

  @ApiOperation({
    summary: 'Récupérer le status du like',
    description: "Récupère le status de like d'un article grâce à son id unique. Il faut être connecté."
  })
  @ApiMessageResponse(StatusLikeDto, {
    description: "Données représentant le status du like d'une publication. Si l'utilisateur connecté à liker l'article (liked?) et le nombre de likes total de l'article.",
    messageExemple: "Statut du like de l'article."
  })
  @ApiParam({
    name: 'postId',
    description: "L'identifiant unique de l'article.",
    required: true,
    type: "number"
  })
  @ApiExceptionsResponse([
    UserNotHaveAuthorisation,
  ])
  @Get(':postId/like-status')
  async getLikeStatus(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: UserSession,
  ): Promise<Message<StatusLikeDto>> {
    const status = await this._posts.getLikeStatus(
      user.id,
      postId,
    );

    return makeMessage(
      `Get like status ${postId}`,
      "Statut du like de l'article.",
      status,
    );
  }

  @ApiOperation({
    summary: "Récupérer la progression de lecture d'un article grâce à l'id unique de celui-ci.",
    description: "Récupère la progression de lecture d'un article avec son identifiant unique. Il faut être connecté pour effectuer cette action."
  })
  @ApiMessageResponse(StatusReadingDto, {
    description: "La progression a été trouvé.",
    messageExemple: "Statut de lecture de l'article."
  })
  @ApiExceptionsResponse([
    UserNotHaveAuthorisation,
    PostNotFoundException
  ])
  @ApiParam({
    name: 'postId',
    description: "L'identifiant unique de l'article.",
    required: true,
    type: "number"
  })
  @Get(':postId/reading-status')
  async getReadingStatus(
    @Param('postId', ParseIntPipe)
    postId: number,
    @CurrentUser() user: UserSession
  ): Promise<Message<StatusReadingDto>> {
    const status =
      await this._posts.getReadingStatus(
        user.id,
        postId,
      );

    return makeMessage(
      `Reading status for post ${postId}`,
      "Statut de lecture de l'article.",
      status,
    );
  }


  @ApiOperation({
    summary: "Modifier la progression de lecture d'un article grâce à l'id unique de celui-ci.",
    description: "Modifie la progression de lecture d'un article avec son identifiant unique. Il faut être connecté pour effectuer cette action."
  })
  @ApiBody({
    type: UpdatePostReadingDto,
    description: "Le format de la progression à saisir.",
    examples: {
      default: {
        summary: "Valeur intermédiaire",
        description: "Progression intermédiaire",
        value: {
          progress: 55
        }
      },
      hight: {
        summary: "Valeur élevée",
        description: "Forte progression",
        value: {
          progress: 98
        }
      },
      low: {
        summary: "Valeur faible",
        description: "Faible progression",
        value: {
          progress: 8
        }
      }
    },
  })
  @ApiMessageResponse(StatusReadingDto, {
    description: "La progression a été sauvegardé.",
    messageExemple: "La progression de lecture a été mise à jour."
  })
  @ApiExceptionsResponse([
    UserNotHaveAuthorisation,
    PostNotFoundException
  ])
  @ApiParam({
    name: 'postId',
    description: "L'identifiant unique de l'article.",
    required: true,
    type: "number"
  })

  @Patch(':postId/reading-progress')
  async updateReadingProgress(
    @Param('postId', ParseIntPipe)
    postId: number,

    @Body()
    payload: UpdatePostReadingDto,

    @CurrentUser() user: UserSession
  ): Promise<Message<PostRead>> {

    const postRead =
      await this._posts.updateReadingProgress(
        user.id,
        postId,
        payload.progress,
      );

    return makeMessage(
      `Reading progress updated for post ${postId}`,
      'La progression de lecture a été mise à jour.',
      postRead,
    );
  }
}