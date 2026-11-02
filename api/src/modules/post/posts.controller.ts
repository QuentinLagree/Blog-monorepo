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
  Query,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiExceptionsResponse } from 'src/commons/decorators/api-exception-response.decorator';
import { ApiMessageResponse } from 'src/commons/decorators/api-message-response.decorator';
import { createAuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { PostOwnerOrAdminGuard } from 'src/commons/guards/post-owner-or-admin.guard';
import { TransformDataMessageIntoObjectSerialization } from 'src/commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { SlugService } from 'src/commons/services/slug.service';
import { Message } from 'src/commons/types/dto/message/message';
import { UserSession } from 'src/commons/types/session-user.type';
import { PostsEntity } from 'src/modules/post/entities/posts.entities';
import { CurrentUser } from '../me/decorators/current.decorator';
import { MetaPaginationDto } from '../pagination/meta.pagination.dto';
import { PaginationDto } from '../pagination/pagination.dto';
import { PostAlreadyPublishException } from '../user/exceptions/post-already-publish.exception';
import { UserNotFoundException } from '../user/exceptions/user-not-found.exception';
import { UserNotHaveAuthorisation } from '../user/exceptions/user-not-have-authorization';
import { UserService } from '../user/user.service';
import { CreatePostDto } from './dto/create.post.dto';
import { PostSummaryDto } from './dto/post-summary.dto';
import { PublishedPostDto } from './dto/published-post.dto';
import { UpdatePostDto } from './dto/update.post.dto';
import { PostNotFoundWithSlugException } from './exceptions/post-not-found-with-slug.exception';
import { PostNotFoundException } from './exceptions/post-not-found.exception';
import { SlugInvalidFormat } from './exceptions/slug-invalid-format.exception';
import { ArticleService } from './posts.service';

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
    summary: "Récupère la liste paginée des articles.",
    description: "Récupère la liste paginée des articles. Le paramètre reading permet, pour un utilisateur connecté, de masquer les articles déjà lues. Il est ignoré pour les utilisateurs non authentifiés."
  })
  @ApiMessageResponse(PostSummaryDto, {
    isArray: true,
    messageExemple: "Liste de tous les articles",
    description: "Récupère tous les articles avec pagination.",
    meta: MetaPaginationDto,
  })
  @ApiExceptionsResponse([], { isPublic: true })
  @HttpCode(200)
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
        'Liste de tous les articles.',
        posts,
        meta,
      );
  }

  @ApiOperation({
    summary: "Récupère un article avec son identifiant",
    description: "Récupère un article avec son identifiant unique."
  })
  @ApiMessageResponse(PostSummaryDto, {
    description: "Récupère l'article avec son identifiant. Retourne un article avec des informations essentielles.",
    messageExemple: "L'article 42 a bien été trouvé.",
  })
  @ApiExceptionsResponse([
    PostNotFoundException,
  ])
  @ApiParam({
    name: "id",
    description: "Identifiant unique de la publication",
    example: 42,
    type: Number
  })
  @HttpCode(200)
  @Get(':id')
  async show(@Param('id', ParseIntPipe) id: number): Promise<Message<PostSummaryDto>> {
    const article = await this._articles.show({ id });
    return makeMessage(
      `Post found with ID: ${article.id}!`,
      `L'article ${article.id} a bien été trouvé.`,
      article,
    );
  }

  @ApiCookieAuth()
  @ApiOperation({
    summary: "Créer un article",
    description: "Créé un article grâce au données. Cette article n'est pas encore publié. Il faut être connecté pour effectuer la création d'un article."
  })
  @ApiMessageResponse(PostSummaryDto, {
    description: "Message de succès lors de la création de l'article.",
    messageExemple: "La publication est créée, allez sur la page d'accueil ou votre compte pour la visualiser."
  })
  @ApiExceptionsResponse([
    UserNotFoundException,
  ])
  @UseGuards(createAuthGuardSession())
  @ApiBody({
    type: CreatePostDto,
  })
  @Post()
  async createPost(
    @Body() payload: CreatePostDto,
    @CurrentUser() user: UserSession,
  ): Promise<Message<PostSummaryDto>> {

    const author = await this._user.show({
      id: user.id,
    });

    const createdPost = await this._articles.store(payload, author);

    return makeMessage(
      'Post created success',
      'La publication est créée, allez sur la page d\'accueil ou votre compte pour la visualiser.',
      createdPost,
    );
  }

  @ApiCookieAuth()
  @ApiOperation({
    summary: "Publier un article",
    description: "Publie un article déjà créer. Il faut être connecté pour publié un article."
  })
  @ApiMessageResponse(PostSummaryDto, {
    description: "Succès lors de la publication de l'article.",
    messageExemple: "La publication a été publiée."
  })
  @ApiExceptionsResponse([
    UserNotFoundException,
    PostNotFoundException,
    PostAlreadyPublishException,
    UserNotHaveAuthorisation
  ])
  @UseGuards(createAuthGuardSession(), PostOwnerOrAdminGuard)
  @ApiBody({
    type: PublishedPostDto,
  })
  @ApiParam({
    name: "id",
    description: "Identifiant unique de la publication",
    example: 42,
    type: Number
  })
  @HttpCode(201)
  @Patch(':id/publish')
  async publishPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: PublishedPostDto,
    @CurrentUser() user: UserSession,
  ): Promise<Message<PostSummaryDto>> {
    const post = await this._articles.show({ id });

    if (this._articles.isPublished(post)) {
      throw new PostAlreadyPublishException();
    }

    const updatedPost = await this._articles.update(
      { id },
      payload,
      user.id,
    );

    return makeMessage(
      'Post published',
      'La publication a été publiée.',
      updatedPost,
    );
  }

  @ApiOperation({
    summary: "Récupérer un article avec le slug.",
    description: "Récupère un article grâce à son slug, il faut que ce slug soit valide."
  })
  @ApiMessageResponse(PostSummaryDto, {
    description: "Succès lorsque l'article est trouvé grâce au slug.",
    messageExemple: "Article trouvé !"
  })
  @ApiExceptionsResponse([
    SlugInvalidFormat,
    PostNotFoundWithSlugException,
    PostNotFoundException
  ])
  @ApiParam({
    name: "slug_title",
    description: "Identifiant créer à partir du titre et de l'id de l'article.",
    example: "valid-slug-2",
    type: "string"
  })
  @HttpCode(200)
  @Get("/slug/:slug_title")
  async slugTestWithID(@Param('slug_title') slug: string): Promise<Message<PostSummaryDto>> {
    const article = await this._slug.getPostWithSlug(slug);
    return makeMessage(
      'Post found !',
      'Article trouvé !',
      article,
    );
  }


  @ApiOperation({
    summary: "Modifier un article.",
    description: "modifie un article grâce à son id, il faut être connecté. Également être l'auteur de l'article ou un administrateur."
  })
  @ApiParam({
    name: "id",
    description: "Identifiant unique de la publication",
    example: 42,
    type: Number
  })
  @ApiMessageResponse(PostSummaryDto, {
    description: "Message de succès lors de la modification de l'article.",
    messageExemple: "La publication a été modifiée !"
  })
  @ApiExceptionsResponse([
    UserNotFoundException,
    UserNotHaveAuthorisation,
    PostNotFoundException,
  ])
  @UseGuards(createAuthGuardSession(), PostOwnerOrAdminGuard)
  @HttpCode(200)
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

  @ApiCookieAuth()
  @ApiOperation({
    summary: "Supprimer un article.",
    description: "Supprime un article avec son identifiant unique. Seul l'auteur de l'article ou un administrateur peut effectuer cette action."
  })
  @ApiMessageResponse(null, {
    description: "Succès lors de la suppression.",
    messageExemple: "La suppression de votre publication est un succès !",
    status: 204
  })
  @ApiExceptionsResponse([
    PostNotFoundException,
  ])
  @UseGuards(createAuthGuardSession(), PostOwnerOrAdminGuard)
  @HttpCode(204)
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