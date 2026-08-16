import * as secureSession from '@fastify/secure-session';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Session,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Post as Article, PostRead } from '@prisma/client';
import { AuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { PostOwnerOrAdminGuard } from 'src/commons/guards/post-owner-or-admin.guard';
import { TransformDataMessageIntoObjectSerialization } from 'src/commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { Message } from 'src/commons/types/dto/message/message';

import { CreatePostDto } from '../../post/dto/create.post.dto';
import { PublishedPostDto } from '../../post/dto/published-post.dto';
import { StatusLikeDto } from '../../post/dto/status-like.dto';
import { PostsEntity } from '../../post/entities/posts.entities';
import { ArticleService } from '../../post/posts.service';
import { StatusReadingDto } from '../dto/status-reading.dto';
import { UpdatePostReadingDto } from '../dto/update-post-reading.dto';
import { UserEntity } from '../entities/user.entities';
import { UserService } from '../user.service';

@ApiTags('Activités utilisateurs')
@Controller('users/posts')
@UseInterceptors(
  new TransformDataMessageIntoObjectSerialization([UserEntity, PostsEntity]),
)
export class UserActivityController {
  constructor(
    private readonly _user: UserService,
    private readonly _posts: ArticleService,
  ) { }

  @UseGuards(AuthGuardSession())
  @Post(':id/add-like')
  async likePost(
    @Param('id', ParseIntPipe) postId: number,
    @Session() session: secureSession.Session,
  ): Promise<Message<StatusLikeDto>> {
    const sessionUser = session.get('user');

    await this._user.addLike({
      user_id: sessionUser.id,
      post_id: postId,
    });

    const status = await this._posts.getLikeStatus(
      sessionUser.id,
      postId,
    );

    return makeMessage(
      `Like post ${postId}`,
      'Le like a été effectué avec succès.',
      status,
    );
  }

  @UseGuards(AuthGuardSession())
  @Delete(':id/unlike')
  async unlikePost(
    @Param('id', ParseIntPipe) postId: number,
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

  @UseGuards(AuthGuardSession())
  @Get(':id/like-status')
  async getLikeStatus(
    @Param('id', ParseIntPipe) postId: number,
    @Session() session: secureSession.Session,
  ): Promise<Message<StatusLikeDto>> {
    const sessionUser = session.get('user');

    const status = await this._posts.getLikeStatus(
      sessionUser.id,
      postId,
    );

    return makeMessage(
      `Post like status ${postId}`,
      "Statut du like de l'article.",
      status,
    );
  }

  @Get('profil/:id/like-count')
  async getProfilLikeCount(
    @Param('id', ParseIntPipe) postId: number
  ) {
    const status = await this._posts.getLikeCount(postId);

    return makeMessage(
      `Public post count status ${postId}`,
      "Nombre de like de l'article.",
      status,
    );
  }



  
  @Get(':postId/reading-status')
  @UseGuards(AuthGuardSession())
  async getReadingStatus(
    @Param('postId', ParseIntPipe)
    postId: number,
    @Session()
    session: secureSession.Session,
  ): Promise<Message<StatusReadingDto>> {
    const sessionUser =
      session.get('user');

    const status =
      await this._posts.getReadingStatus(
        sessionUser.id,
        postId,
      );

    return makeMessage(
      `Reading status for post ${postId}`,
      "Statut de lecture de l'article.",
      status,
    );
  }

  @Patch(':postId/reading-progress')
  @UseGuards(AuthGuardSession())
  @ApiBody({
    type: UpdatePostReadingDto,
  })
  async updateReadingProgress(
    @Param('postId', ParseIntPipe)
    postId: number,

    @Body()
    payload: UpdatePostReadingDto,

    @Session()
    session: secureSession.Session,
  ): Promise<Message<PostRead>> {
    const sessionUser = session.get('user');

    const postRead =
      await this._posts.updateReadingProgress(
        sessionUser.id,
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