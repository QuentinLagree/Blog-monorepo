import * as secureSession from '@fastify/secure-session';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  Session,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ApiBasicAuth, ApiBody, ApiCookieAuth, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Post as Articles } from '@prisma/client';
import { AuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { PostOwnerOrAdminGuard } from 'src/commons/guards/post-owner-or-admin.guard';
import { TransformDataMessageIntoObjectSerialization } from 'src/commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { SlugService } from 'src/commons/services/slug.service';
import { Message } from 'src/commons/types/dto/message/message';
import { PostsEntity } from 'src/modules/post/entities/posts.entities';
import { MetaPaginationDto } from '../pagination/meta.pagination.dto';
import { PaginationDto } from '../pagination/pagination.dto';
import { userSelectPayload, UserService } from '../user/user.service';
import { CreatePostDto } from './dto/create.post.dto';
import { UpdatePostDto } from './dto/update.post.dto';
import { ArticleService } from './posts.service';
import { UserOwnerOrAdminGuard } from 'src/commons/guards/user-owner-or-admin.guard';
import { PublishedPostDto } from './dto/published-post.dto';
import { PostAlreadyPublishException } from '../user/exceptions/post-already-publish.exception';

@ApiTags('Publications')
@Controller('posts')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([PostsEntity]))
export class PostController {
  constructor(private readonly _articles: ArticleService,
    private readonly _user: UserService,
    private readonly _slug: SlugService
  ) { }

  @Get()
@ApiCookieAuth()
async index(
  @Query() payload: PaginationDto,
  @Session() session: secureSession.Session,
): Promise<Message<Articles[], MetaPaginationDto>> {
  const user = session.get('user');

  const [posts, meta] = await this._articles.index(
    payload,
    user?.id,
  );

  return posts.length === 0
    ? makeMessage<Articles[], MetaPaginationDto>(
        'List of all posts is empty.',
        'La liste des publications est vide',
        [],
        meta
      )
    : makeMessage<Articles[], MetaPaginationDto>(
        'List of all posts',
        'Liste de toutes les publications',
        posts,
        meta,
      );
}

  @UseGuards(AuthGuardSession(), UserOwnerOrAdminGuard)
  
  @ApiProperty({

  })
  @Get('drafts/:id')
  async getAllUserDrafts(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Message<Articles[] | null>> {
    const user: userSelectPayload = await this._user.show({ id });
    const fullName = `${user.nom} ${user.prenom}`;

    const posts = await this._articles.indexWhere({
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
  async getAllPostsOfUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Message<Articles[] | null>> {
    const user: userSelectPayload = await this._user.show({ id });
    const fullName = `${user.nom} ${user.prenom}`;

    const posts = await this._articles.indexWhere({
      authorId: id,
    });

    return posts.length === 0
      ? makeMessage(
        `List of all posts of ${fullName} is empty.`,
        `La liste des publications de l'utilisateur ${fullName} est vide.`,
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
  ): Promise<Message<Articles>> {
    const sessionUser = session.get('user');

    const author = await this._user.show({
      id: sessionUser.id,
    });

    const createdPost = await this._articles.store(payload, author);

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
  ): Promise<Message<Articles>> {
    const post = await this._articles.show({ id });

    if (this._articles.isPublished(post)) {
      throw new PostAlreadyPublishException();
    }

    const updatedPost = await this._articles.update(
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


  @Get("/slug/:slug_title")
  async slugTestWithID(@Param('slug_title') slug: string): Promise<Message<Articles>> {
    const article = await this._slug.getPostWithSlug(slug);
    return makeMessage(
      'Post found !',
      'Article trouvé !',
      article,
    );
  }

  @Get('/post/:id')
  async show(@Param('id', ParseIntPipe) id: number): Promise<Message<Articles>> {
    const article = await this._articles.show({ id });
    return makeMessage(
      `Post found with ID: ${article.id}!`,
      `La publication ${article.id} a bien été trouvé.`,
      article,
    );
  }


  @UseGuards(AuthGuardSession(), PostOwnerOrAdminGuard)
  @Patch('/:id')
  async updatePost(@Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePostDto,
    @Session() session: secureSession.Session): Promise<Message<Articles>> {
    const updated_post = await this._articles.update({ id }, payload, session.get('user').id);
    return makeMessage(
      'Post updated !',
      "La publication a été modifiée !",
      updated_post,
    );
  }

  @UseGuards(AuthGuardSession(), PostOwnerOrAdminGuard)
  @Delete(':id')
  async destroy(@Param('id', ParseIntPipe) id: number): Promise<Message<null>> {
    await this._articles.destroy({ id });
    return makeMessage(
      'Post deleted !',
      'La suppression de votre publication est un succès !',
      null,
    );
  }
}