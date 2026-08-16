import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  SerializeOptions,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/commons/decorators/role.decorator';
import { AuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { UserOwnerOrAdminGuard } from 'src/commons/guards/user-owner-or-admin.guard';
import { Role } from 'src/commons/roles/role.enum';
import { ApiMessageResponse } from 'src/commons/types/dto/message/api-message-response.decorator';
import { Message } from 'src/commons/types/dto/message/message';
import { TransformDataMessageIntoObjectSerialization } from '../../commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { makeMessage } from '../../commons/logger/logger.helper';
import { CreateUserDto } from './dto/create-user.dto';
import { UserUpdateDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entities';
import { userSelectPayload, UserService } from './user.service';

@ApiTags('Utilisateurs')
@Controller('user')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([UserEntity]))
export class UserController {
  constructor(private readonly _user: UserService) {}

  @ApiCookieAuth('session')
  @ApiOperation({
    summary: "Récupérer les utilisateurs",
    description: "Récupère une liste d'utilisateurs. Cette liste peut être vide. L'utilisateur doit être connecté."
  })
  @UseGuards(AuthGuardSession(), RolesGuard)
  @Roles(Role.Admin, Role.User)
  @Get()
  @HttpCode(200)
  async index(): Promise<Message<userSelectPayload[] | null>> {
    const users: userSelectPayload[] = await this._user.index();
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
  }
  @ApiOperation({
    summary: "Récupérer un utilisateur par son identifiant",
    description: "Récupère les informations d'un utilisateur à partir de son identifiant unique."
  })
@ApiParam({
  name: 'id',
  type: Number,
  example: 42,
  description: "Identifiant unique de l'utilisateur",
})
@ApiMessageResponse(UserEntity, {
  description: "Utilisateur récupéré avec succès.",
  messageExemple: "Utilisateur récupérer."
})

@ApiMessageResponse(null, { status: 400, description: "L'identifiant n'est pas valide.", messageExemple: "L'identifiant n'est pas valide." })

@ApiMessageResponse(null, { status: 404, description: "L'utilisateur est introuvable.", messageExemple: "l'utilisateur : 42 n'existe pas." })

@ApiMessageResponse(null, { status: 500, description: "Le serveur ne répond plus.", messageExemple: "Le serveur ne répond plus, réessayer ultérieurement ou contactez un administrateur." })
  @Get('/:id')
  async show(@Param('id', ParseIntPipe) id: number): Promise<Message<userSelectPayload | null>> {
    const user = await this._user.show({ id });
    return makeMessage(
      `User found with ID: ${user.id}!`,
      `L'utilisateur ${user.id} a bien été trouvé.`,
      user,
    );
  }

  @Post()
  @ApiBody({ 
    type: CreateUserDto,
  })
  @SerializeOptions({
    ignoreDecorators: true,
  })
  async store(
    @Body() payload: CreateUserDto,
  ): Promise<Message<userSelectPayload>> {
    const created_user = await this._user.create(payload);
    return makeMessage(
      'User created !',
      "L'utilisateur est bien enregistré !",
      created_user,
    );
  }

  
  @ApiBody({
    type: UserUpdateDto,
  })
  @UseGuards(AuthGuardSession(), UserOwnerOrAdminGuard)
  @Put('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UserUpdateDto,
  ): Promise<Message<userSelectPayload>> {
    let updated_user = await this._user.update(
      { id },
      payload
    );
    return makeMessage(
      'User updated !',
      'La modification de vos informations est bien sauvegardée !',
      updated_user,
    );
  }

  @UseGuards(AuthGuardSession(), RolesGuard)  
  @Roles(Role.Admin)
  @Delete(':id')
  async destroy(@Param('id', ParseIntPipe) id: number): Promise<Message<null>> {
      await this._user.destroy({ id });
      return makeMessage(
        'User deleted !',
        'La suppression de votre compte utilisateur est un succès !',
        null,
      );
  }
}
