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
  Query,
  Session,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Post as Article } from '@prisma/client';
import { AuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { PostOwnerOrAdminGuard } from 'src/commons/guards/post-owner-or-admin.guard';
import { UserOwnerOrAdminGuard } from 'src/commons/guards/user-owner-or-admin.guard';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { TransformDataMessageIntoObjectSerialization } from 'src/commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { Message } from 'src/commons/types/dto/message/message';

import { CreatePostDto } from '../post/dto/create.post.dto';
import { PublishedPostDto } from '../post/dto/published-post.dto';
import { PostsEntity } from '../post/entities/posts.entities';
import { ArticleService } from '../post/posts.service';
import { UserEntity } from './entities/user.entities';
import { userSelectPayload, UserService } from './user.service';
import { PostAlreadyPublishException } from './exceptions/post-already-publish.exception';
import { LikedPostDto } from './dto/liked-post.dto';
import { PostId } from '../post/dto/post-id.post.dto';
import { StatusLikeDto } from '../post/dto/status-like.dto';

@ApiTags('Gestion des publications en fonction des utilisateurs')
@Controller('users/posts')
@UseInterceptors(
  new TransformDataMessageIntoObjectSerialization([UserEntity, PostsEntity]),
)
export class UserToPostController {
  constructor(
    private readonly _user: UserService,
    private readonly _posts: ArticleService,
  ) {}

  @UseGuards(AuthGuardSession(), UserOwnerOrAdminGuard)
  @Get('drafts/:id')
  async getAllUserDrafts(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Message<Article[] | null>> {
    const user: userSelectPayload = await this._user.show({ id });
    const fullName = `${user.nom} ${user.prenom}`;

    const posts = await this._posts.indexWhere({
      authorId: id,
      published_at: null,
    });

    return posts.length === 0
      ? makeMessage(
          `List of all draft posts of ${fullName} is empty.`,
          `La liste des brouillons de l'utilisateur ${fullName} est vide.`,
          null,
        )
      : makeMessage(
          `List of all draft posts of user ${fullName}`,
          `Liste de tous les brouillons de ${fullName}.`,
          posts,
        );
  }

  @Get(':id')
  async getAllPublishedPostsOfUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Message<Article[] | null>> {
    const user: userSelectPayload = await this._user.show({ id });
    const fullName = `${user.nom} ${user.prenom}`;

    const posts = await this._posts.indexWhere({
      authorId: id,
      published_at: {
        not: null,
      },
    });

    return posts.length === 0
      ? makeMessage(
          `List of all published posts of ${fullName} is empty.`,
          `La liste des publications publiées de l'utilisateur ${fullName} est vide.`,
          null,
        )
      : makeMessage(
          `List of all published posts of user ${fullName}`,
          `Liste de toutes les publications publiées de ${fullName}.`,
          posts,
        );
  }

  @UseGuards(AuthGuardSession())
@ApiBody({
  type: CreatePostDto,
})
@Post()
async createPost(
  @Body() payload: CreatePostDto,
  @Session() session: secureSession.Session,
): Promise<Message<Article>> {
  const sessionUser = session.get('user');

  const author = await this._user.show({
    id: sessionUser.id,
  });

  const createdPost = await this._posts.store(payload, author);

  return makeMessage(
    'Post created success',
    'La publication est créée, allez sur votre compte pour la visualiser.',
    createdPost,
  );
}

  @UseGuards(AuthGuardSession(), PostOwnerOrAdminGuard)
  @ApiBody({
    type: PublishedPostDto,
  })
  @Patch(':id/publish')
  async publishPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: PublishedPostDto,
    @Session() session: secureSession.Session,
  ): Promise<Message<Article>> {
    const post = await this._posts.show({ id });

    if (this._posts.isPublished(post)) {
      throw new PostAlreadyPublishException();
    }

    const updatedPost = await this._posts.update(
      { id },
      payload,
      session.get('user').id,
    );

    return makeMessage(
      'Post published',
      'La publication a été publiée.',
      updatedPost,
    );
  }

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
}