import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  SerializeOptions,
  UseInterceptors,
  ValidationError,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UserEntity } from './entities/user.entities';
import { TransformDataMessageIntoObjectSerialization } from '../../commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { ID } from '../../commons/types/id.types';
import { makeMessage } from '../../commons/helpers/logger.helper';
import { UserService } from './user.service';
import { UserAlreadyExistWithEmail } from '../../commons/exceptions/userAlreadyExist.error';
import { dtoIsValid } from 'src/commons/helpers/dto/dto-validations.helper';
import { UserUpdateDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { Message } from 'src/commons/types/message/message';

@ApiTags('Gestion des utilisateurs')
@Controller('user')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([UserEntity]))
export class UserController {
  constructor(private readonly _user: UserService) {}

  @Get()
  @HttpCode(200)
  async index(): Promise<Message<User[] | null>> {
    try {
      const users: User[] = await this._user.index();
      return users.length == 0
        ? makeMessage(
            'List of all users is empty.',
            'La liste des utilisateurs est vide',
            null,
          )
        : makeMessage(
            'List of all users',
            'Liste de tous les utilisateurs',
            users,
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
  async show(@Param('id') id: number): Promise<Message<User | null>> {
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
      const user = await this._user.show({ id: type_id.value() });
      return makeMessage(
        `User found with ID: ${user.id}!`,
        `L'utilisateur ${user.id} a bien été trouvé.`,
        user,
      );
    } catch (error) {
      switch (true) {
        case error instanceof NotFoundException:
          throw new HttpException(
            makeMessage(
              `User Not Found with id ${type_id.value()}`,
              `L'utilisateur ${type_id.value()} n'a pas été trouvé.`,
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
    type: UserDto,
  })
  @SerializeOptions({
    ignoreDecorators: true,
  })
  async store(
    @Body() createData: UserDto,
  ): Promise<Message<User | null | ValidationError[]>> {
    const errors: ValidationError[] = await dtoIsValid(createData);

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
      const created_user = await this._user.create(createData);
      return makeMessage(
        'User created !',
        "L'utilisateur est bien enregistré !",
        created_user,
      );
    } catch (error) {
      switch (true) {
        case error instanceof UserAlreadyExistWithEmail:
          throw new HttpException(
            makeMessage(
              'User created failed',
              'Ce compte existe déjà, connectez-vous.',
              null,
            ),
            HttpStatus.CONFLICT,
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

  @ApiBody({
    type: UserUpdateDto,
  })
  @Put('/:id')
  async update(
    @Param('id') id: number,
    @Body() updateData: UserUpdateDto,
  ): Promise<Message<User | null | ValidationError[]>> {
    const errors: ValidationError[] = await dtoIsValid(
      updateData,
      UserUpdateDto,
    );

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
      let updated_user = await this._user.update(
        { id: id_type.value() },
        updateData,
      );
      return makeMessage(
        'User updated !',
        'La modification de vos informations est bien sauvegardé !',
        updated_user,
      );
    } catch (error) {
      switch (true) {
        case error instanceof NotFoundException:
          throw new HttpException(
            makeMessage('User updated failed', `Ce compte n'existe pas.`, null),
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
      await this._user.destroy({ id: id_type.value() });
      return makeMessage(
        'User deleted !',
        'La suppression de votre compte utilisateur est un succée !',
        null,
      );
    } catch (error) {
      switch (true) {
        case error instanceof NotFoundException:
          throw new HttpException(
            makeMessage('User deleted failed', `Ce compte n'existe pas.`, null),
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
