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
  SerializeOptions,
  Session,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
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
import { UserService } from '../user/user.service';
import { CreatePostDto } from './dto/create.post.dto';
import { UpdatePostDto } from './dto/update.post.dto';
import { ArticleService } from './posts.service';

@ApiTags('Gestion des Publications')
@Controller('posts')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([PostsEntity]))
export class PostController {
  constructor(private readonly _articles: ArticleService,
    private readonly _user: UserService,
    private readonly _slug: SlugService
  ) {}

  @Get()
  @ApiQuery({
    name: 'PaginationDto', type: PaginationDto
  })
  @UseGuards(AuthGuardSession())
  async index(
    @Query() payload: PaginationDto
  ): Promise<Message<Articles[] | null, MetaPaginationDto>> {
    const posts: Articles[] = await this._articles.index(payload);
    const articleLength: number = await this._articles.countByPublishedStatus(true);
    return posts.length == 0
      ? makeMessage(
        'List of all posts is empty.',
        'La liste des publications est vide',
        [],
      )
      : makeMessage<Articles[], MetaPaginationDto>(
        'List of all posts',
        'Liste de toutes les publications',
        posts,
        {
          currentPage: payload.page,
          limit: payload.limit,
          totalArticle: articleLength
        }
      );
  }


  @Get('/published')
  async indexPublished(): Promise<Message<Articles[] | null>> {
      const posts: Articles[] = await this._articles.index({ published: true });
      return posts.length == 0
        ? makeMessage(
          'List of all published posts is empty.',
          'La liste des publications publiées est vide',
          null,
        )
        : makeMessage(
          'List of all published posts',
          'Liste de toutes les publications publiées',
          posts,
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

  @Get('/:id')
  async show(@Param('id', ParseIntPipe) id: number): Promise<Message<Articles>> {
    const article = await this._articles.show({ id });
    return makeMessage(
      `Post found with ID: ${article.id}!`,
      `La publication ${article.id} a bien été trouvé.`,
      article,
    );
  }

  @UseGuards(AuthGuardSession())
  @Post()
  @ApiBody({
    type: CreatePostDto,
  })
  @SerializeOptions({
    ignoreDecorators: true,
  })
  async store(
    @Body() payload: CreatePostDto,
  ): Promise<Message<Articles>> {
    const author = await this._user.show({ id: payload.authorId ?? 0 });
    const created_post = await this._articles.store(payload, author);
    return makeMessage(
      'Post created !',
      "La publication a été créee !",
      created_post,
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