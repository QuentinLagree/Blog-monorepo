import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { PostsEntity } from 'src/modules/post/entities/posts.entities';
import { TransformDataMessageIntoObjectSerialization } from 'src/commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { makeMessage } from 'src/commons/helpers/logger.helper';
import { ArticleService } from './posts.service';
import { ID } from 'src/commons/types/id.types';
import { Message } from 'src/commons/types/dto/message/message';
import { CreatePostDto } from './dto/create-post.dto';
import { ValidationError } from 'class-validator';
import { dtoIsValid } from 'src/commons/helpers/dto/dto-validations.helper';
import { UserService } from '../user/user.service';
import { SlugService } from 'src/commons/services/slug.service';
import { Post as Articles } from '@prisma/client';
import { NumberNotCorrectFormat } from 'src/commons/exceptions/NumberNotCorrectFormat.error';

@ApiTags('Gestion des Publications')
@Controller('posts')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([PostsEntity]))
export class PostController {
  constructor(private readonly _articles: ArticleService,
    private readonly _user: UserService,
    private readonly _slug: SlugService
  ) {}

  @Get()
  async index(): Promise<Message<Articles[] | null>> {
    try {
      const posts: Articles[] = await this._articles.index();
      return posts.length == 0
        ? makeMessage(
            'List of all posts is empty.',
            'La liste des publications est vide',
            null,
          )
        : makeMessage(
            'List of all posts',
            'Liste de toutes les publications',
            posts,
          );
    } catch (error) {
      switch (true) {
        default:
          throw new HttpException(
            makeMessage(
              'Fatal Error',
              "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
              error,
              { level: 'Fatal' },
            ),
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }

  @Get('/published')
  async indexPublished(): Promise<Message<Articles[] | null>> {
    try {
      const posts: Articles[] = await this._articles.index(true);
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
    } catch (error) {
      switch (true) {
        default:
          throw new HttpException(
            makeMessage(
              'Fatal Error',
              "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
              error,
              { level: 'Fatal' },
            ),
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }

  @Get('/:id')
  async show(@Param('id') id: number): Promise<Message<Articles | null>> {
    if (!ID.hasValid(id))
      throw new HttpException(
        makeMessage(
          `Error Param ID : '${id}' is invalid.`,
          "L'id doit être un nombre entier.",
          null,
        ),
        HttpStatus.BAD_REQUEST,
      );

    let type_id = ID.add(id);
    try {
      const user = await this._articles.show({ id: type_id.value() });
      return makeMessage(
        `Post found with ID: ${user.id}!`,
        `La publication ${user.id} a bien été trouvé.`,
        user,
      );
    } catch (error) {
      switch (true) {
        case error instanceof NotFoundException:
          throw new HttpException(
            makeMessage(
              `Posts Not Found with id ${type_id.value()}`,
              `La publication ${type_id.value()} n'a pas été trouvé.`,
              null,
            ),
            HttpStatus.NOT_FOUND,
          );

        default:
          throw new HttpException(
            makeMessage(
              'Fatal Error',
              "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
              error,
              { level: 'Fatal' },
            ),
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }

  @Post()
    // @Roles(Role.Admin)
    @ApiBody({
      type: CreatePostDto,
    })
    @SerializeOptions({
      ignoreDecorators: true,
    })
    async store(
      @Body() createData: CreatePostDto,
    ): Promise<Message<Articles | null | ValidationError[]>> {
      const errors: ValidationError[] = await dtoIsValid(createData, CreatePostDto);
  
      if (errors.length > 0) {
        throw new HttpException(
          makeMessage(
            'Post created failed !',
            'Les données sont incorrectes !',
            errors,
          ),
          HttpStatus.BAD_REQUEST,
        );
      }
  
      try {
        const author = await this._user.show({ id: createData.authorId });
        const created_post = await this._articles.store(createData, author);
        return makeMessage(
          'Post created !',
          "La publication a été publié !",
          created_post,
        );
      } catch (error) {
        switch (true) {
          case error instanceof NotFoundException:
          throw new HttpException(
            makeMessage(
              `User Not Found with id ${createData.authorId}`,
              `L'utilisateur ${createData.authorId} n'existe pas.`,
              null,
            ),
            HttpStatus.NOT_FOUND,
          );
          default:
            throw new HttpException(
              makeMessage(
                'Fatal Error',
                "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
                error,
                { level: 'Fatal' },
              ),
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
      }
    }

  @Delete(':id')
  async destroy(@Param('id') id: number): Promise<Message<null>> {
    if (!ID.hasValid(id))
      throw new HttpException(
        makeMessage(
          `Error Param ID : '${id}' is invalid.`,
          "L'id doit être un nombre entier.",
          null,
        ),
        HttpStatus.BAD_REQUEST,
      );

    let id_type: ID = ID.add(id);

    try {
      await this._articles.destroy({ id: id_type.value() });
      return makeMessage(
        'Post deleted !',
        'La suppression de votre publication est un succée !',
        null,
      );
    } catch (error) {
      switch (true) {
        case error instanceof NotFoundException:
          throw new HttpException(
            makeMessage(
              'Post deleted failed',
              `Cette publication n'existe pas.`,
              null,
            ),
            HttpStatus.NOT_FOUND,
          );

        default:
          throw new HttpException(
            makeMessage(
              'Fatal Error',
              "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
              error,
              { level: 'Fatal' },
            ),
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }

  @Get("/slug")
  async slugTest() {
    let article: Articles | null = await this._articles.indexOneWhere({ id: 2});
    if (!article) return null;
    return this._slug.generateSlugFromArticleTitle(article.title, article.id);
  }

  @Get("/slug/:slug_title")
  async slugTestWithID(@Param('slug_title') slug: string): Promise<Message<Articles | null>> {
    if (!this._slug.isValidateSlug(slug))
      throw new HttpException(
        makeMessage(
          `Error Param slug : '${slug}' is invalid.`,
          `Le paramètre : '${slug}' n'est pas valide.`,
          null,
        ),
        HttpStatus.BAD_REQUEST,
      );

      try {
        const article = await this._slug.getPostWithSlug(slug);
        return makeMessage(
        'Post found !',
        'Article trouvé !',
        article,
      );
      } catch (error) {
        switch (true) {
        case error instanceof NotFoundException:
          throw new HttpException(
            makeMessage(
              'Post not found!',
              `Aucun article correspond...`,
              null,
            ),
            HttpStatus.NOT_FOUND,
          );
        
          case error instanceof NumberNotCorrectFormat:
            throw new HttpException(
            makeMessage(
              'Param invalid!',
              `Aucun article correspond...`,
              null,
            ),
            HttpStatus.BAD_REQUEST,
          );

        default:
          throw new HttpException(
            makeMessage(
              'Fatal Error',
              "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
              error,
              { level: 'Fatal' },
            ),
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }
}
  