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
import { Post as Posts } from '@prisma/client';
import { PostsEntity } from 'src/modules/post/entities/posts.entities';
import { TransformDataMessageIntoObjectSerialization } from 'src/commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { makeMessage } from 'src/commons/helpers/logger.helper';
import { PostsService } from './posts.service';
import { ID } from 'src/commons/types/id.types';
import { Message } from 'src/commons/types/message/message';
import { CreatePostDto } from './dto/create-post.dto';
import { ValidationError } from 'class-validator';
import { dtoIsValid } from 'src/commons/helpers/dto/dto-validations.helper';
import { UserService } from '../user/user.service';

@ApiTags('Gestion des Publications')
@Controller('posts')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([PostsEntity]))
export class PostController {
  constructor(private readonly _posts: PostsService,
    private readonly _user: UserService
  ) {}

  @Get()
  async index(): Promise<Message<Posts[] | null>> {
    try {
      const posts: Posts[] = await this._posts.index();
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
  async indexPublished(): Promise<Message<Posts[] | null>> {
    try {
      const posts: Posts[] = await this._posts.index(true);
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
  async show(@Param('id') id: number): Promise<Message<Posts | null>> {
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
      const user = await this._posts.show({ id: type_id.value() });
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
    ): Promise<Message<Posts | null | ValidationError[]>> {
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
        const created_post = await this._posts.store(createData, author);
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
      await this._posts.destroy({ id: id_type.value() });
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
}
