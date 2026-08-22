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
import { ApiBasicAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiParam, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
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
import { PostSummaryDto } from './dto/post-summary.dto';
import { Articles } from './dto/posts.dto';
import { PostDetailDto } from './dto/post-detail.dto';
import { CurrentUser } from '../me/decorators/current.decorator';
import { UserSession } from 'src/commons/types/session-user.type';
import { ApiMessageResponse } from 'src/commons/decorators/api-message-response.decorator';
import { ApiExceptionsResponse } from 'src/commons/decorators/api-exception-response.decorator';

@ApiTags('Publications')
@Controller('posts')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([PostsEntity]))
export class PostController {
  constructor(private readonly _articles: ArticleService,
    private readonly _user: UserService,
    private readonly _slug: SlugService
  ) { }

  @Get()
  @ApiOperation({
    summary: "Récupère la liste paginée des publications.",
    description: "Récupère la liste paginée des publications. Le paramètre reading permet, pour un utilisateur connecté, de masquer les publications déjà lues. Il est ignoré pour les utilisateurs non authentifiés."
  })
  @ApiMessageResponse(PostSummaryDto, {
    isArray: true,
    messageExemple: "Liste de toute les publications",
    description: "Récupère tous les articles avec pagination.",
    meta: MetaPaginationDto,
    status: 200
  })
  @ApiExceptionsResponse([], { properties_validator: true })
async index(
  @Query() payload: PaginationDto,
  @CurrentUser() user: UserSession
): Promise<Message<PostSummaryDto[], MetaPaginationDto>> {

  const [posts, meta] = await this._articles.index(
    payload,
    user?.id,
  );

  return posts.length === 0
    ? makeMessage<PostSummaryDto[], MetaPaginationDto>(
        'List of all posts is empty.',
        'La liste des publications est vide',
        [],
        meta
      )
    : makeMessage<PostSummaryDto[], MetaPaginationDto>(
        'List of all posts',
        'Liste de toutes les publications',
        posts,
        meta,
      );
}

  @Get(':id')
  async show(@Param('id', ParseIntPipe) id: number): Promise<Message<PostDetailDto>> {
    const article = await this._articles.show({ id });
    return makeMessage(
      `Post found with ID: ${article.id}!`,
      `La publication ${article.id} a bien été trouvé.`,
      article,
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
  ): Promise<Message<PostSummaryDto>> {
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
  ): Promise<Message<PostSummaryDto>> {
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
  async slugTestWithID(@Param('slug_title') slug: string): Promise<Message<PostDetailDto>> {
    const article = await this._slug.getPostWithSlug(slug);
    return makeMessage(
      'Post found !',
      'Article trouvé !',
      article,
    );
  }


  @UseGuards(AuthGuardSession(), PostOwnerOrAdminGuard)
  @Patch('/:id')
  async updatePost(@Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePostDto,
    @CurrentUser() user: UserSession): Promise<Message<PostSummaryDto>> {
    const updated_post = await this._articles.update({ id }, payload, user.id);
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