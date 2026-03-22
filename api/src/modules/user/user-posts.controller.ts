import {
  Controller,
  UseInterceptors,
  Get,
  Param,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Post as Articles, User } from '@prisma/client';
import { ValidationError } from 'class-validator';
import { dtoIsValid } from 'src/commons/helpers/dto/dto-validations.helper';
import { makeMessage } from 'src/commons/helpers/logger.helper';
import { TransformDataMessageIntoObjectSerialization } from 'src/commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { ID } from 'src/commons/types/id.types';
import { CreatePostDto } from '../post/dto/create-post.dto';
import { PostsEntity } from '../post/entities/posts.entities';
import { ArticleService } from '../post/posts.service';
import { UserEntity } from './entities/user.entities';
import { UserService } from './user.service';
import { Message } from 'src/commons/types/dto/message/message';
import { Posts } from '../post/dto/posts.dto';

@ApiTags('Gestion des Publications en fonction des utilisateurs')
@Controller('users/posts')
@UseInterceptors(
  new TransformDataMessageIntoObjectSerialization([UserEntity, PostsEntity]),
)
export class userToPostController {
  constructor(
    private readonly _user: UserService,
    private readonly _posts: ArticleService,
  ) {}

  @Get(':id')
  async getAllPostOfUser(
    @Param('id') id: number,
  ): Promise<Message<Articles[] | null>> {
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
      let user: User = await this._user.show({ id: type_id.value() });
      let allName: string = `${user.nom} ${user.prenom}`;

      const rawPosts = await this._posts.indexWhere({
        authorId: type_id.value(),
      });
      const posts: Articles[] = rawPosts.map(post => ({
        ...post,
        author: user,
      }));

      return posts.length == 0
        ? makeMessage(
            `List of all published posts of ${allName} is empty.`,
            `La liste des publications publiées de l'utilisateur ${allName} est vide`,
            null,
          )
        : makeMessage(
            `List of all published posts of user ${allName}`,
            `Liste de toutes les publications publiées de ${allName}`,
            posts,
          );
    } catch (error) {
      switch (true) {
        case error instanceof NotFoundException:
          throw new HttpException(
            makeMessage(
              'User Not Exist',
              `L'utilisateur ${id} n'existe pas.`,
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
  async publishedPost(
    @Body() createdPost: CreatePostDto,
  ): Promise<Message<Articles | ValidationError[] | null>> {
    const errors: ValidationError[] = await dtoIsValid(createdPost);

    if (errors.length > 0) {
      throw new HttpException(
        makeMessage(
          'User created failed !',
          'Les données sont incorrectes !',
          errors,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      let author: User = await this._user.show({ id: createdPost.authorId });
      let storedPost = await this._posts.store(createdPost, author);
      const postWithAuthor: Articles = {
        ...storedPost,
        authorId: author.id,
      };
      return makeMessage(
        'Post created success',
        `La publication est créer, aller sur votre compte pour la visualiser.`,
        postWithAuthor,
      );
    } catch (error) {
      switch (true) {
        case error instanceof NotFoundException:
          throw new HttpException(
            makeMessage(
              'Post created failed',
              `Ce compte n'existe pas. La création de la publication a été interrompue`,
              null,
            ),
            HttpStatus.NOT_FOUND,
          );

        case error instanceof BadRequestException:
          throw new HttpException(
            makeMessage(
              'Post created failed',
              `Une erreur lors de la création de votre publication s'est produite, si cela recommence, contactez un administrateur.`,
              null,
            ),
            HttpStatus.INTERNAL_SERVER_ERROR,
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
  @Get("/drafts/:id")
  async getAllUserDraft (@Param("id") id:number): Promise<Message<Articles[] | null>> {
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
      let user: User = await this._user.show({ id: type_id.value() });
      let allName: string = `${user.nom} ${user.prenom}`;

      const rawPosts = await this._posts.indexWhere({
        authorId: type_id.value(),
        published_at: null
      });
      const posts: Articles[] = rawPosts.map(post => ({
        ...post,
        author: user,
      }));

      return posts.length == 0
        ? makeMessage(
            `List of all drafts posts of ${allName} is empty.`,
            `La liste des brouillons de l'utilisateur ${allName} est vide`,
            null,
          )
        : makeMessage(
            `List of all drafts posts of user ${allName}`,
            `Liste de tous les brouillons de ${allName}`,
            posts,
          );
    } catch (error) {
      switch (true) {
        case error instanceof NotFoundException:
          throw new HttpException(
            makeMessage(
              'User Not Exist',
              `L'utilisateur ${id} n'existe pas.`,
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
}
