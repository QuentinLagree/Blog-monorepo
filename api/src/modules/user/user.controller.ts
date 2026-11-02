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
import { ApiExceptionsResponse } from 'src/commons/decorators/api-exception-response.decorator';
import { ApiMessageResponse } from 'src/commons/decorators/api-message-response.decorator';
import { Roles } from 'src/commons/decorators/role.decorator';
import { createAuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { UserOwnerOrAdminGuard } from 'src/commons/guards/user-owner-or-admin.guard';
import { Role } from 'src/commons/roles/role.enum';
import { Message } from 'src/commons/types/dto/message/message';
import { TransformDataMessageIntoObjectSerialization } from '../../commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { makeMessage } from '../../commons/logger/logger.helper';
import { PostSummaryDto } from '../post/dto/post-summary.dto';
import { PostNotFoundException } from '../post/exceptions/post-not-found.exception';
import { ArticleService } from '../post/posts.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PublicUserDto } from './dto/public-user.dto';
import { UserUpdateDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entities';
import { UserAlreadyExistException } from './exceptions/user-already-exist.exception';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { UserNotHaveAuthorisation } from './exceptions/user-not-have-authorization';
import { userSelectPayload, UserService } from './user.service';

@ApiTags('Utilisateurs')
@Controller('users')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([UserEntity]))
export class UserController {
  constructor(private readonly _user: UserService, private readonly _article: ArticleService) { }

  @ApiCookieAuth()
  @ApiOperation({
    summary: "Récupérer les utilisateurs",
    description: "Récupère une liste d'utilisateurs. Cette liste peut être vide. L'utilisateur doit être connecté."
  })
  @ApiMessageResponse(PublicUserDto, {
    description: "Renvoie la liste de tous les utilisateurs avec leurs informations publiques.",
    messageExemple: "Liste de tous les utilisateurs.",
    isArray: true
  })
  @ApiExceptionsResponse([UserNotHaveAuthorisation], {
    isPublic: true
  })
  @UseGuards(createAuthGuardSession(), RolesGuard)
  @Roles(Role.Admin, Role.User)
  @Get()
  @HttpCode(200)
  async index(): Promise<Message<PublicUserDto[]>> {
    const users: PublicUserDto[] = await this._user.index();
    return users.length === 0
      ? makeMessage(
        'List of all users is empty.',
        'La liste des utilisateurs est vide',
        [],
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
  @ApiMessageResponse(PublicUserDto, {
    description: "Utilisateur récupéré avec succès.",
    messageExemple: "L'utilisateur 42 a bien été trouvé."
  })
  @ApiExceptionsResponse([
    UserNotFoundException,
    PostNotFoundException
  ], {
    isPublic: true
  })
  @HttpCode(200)
  @Get('/:id')
  async show(@Param('id', ParseIntPipe) id: number): Promise<Message<PublicUserDto>> {
    const user = await this._user.show({ id });
    return makeMessage(
      `User found with ID: ${user.id}!`,
      `L'utilisateur ${user.id} a bien été trouvé.`,
      user,
    );
  }

  @ApiOperation({
    summary: "Créer un nouvel utilisateur.",
    description: "Créé un nouvel utilisateur avec ses informations personnelles."
  })
  @ApiMessageResponse(PublicUserDto, {
    status: 201,
    description: "Utilisateur créé avec succès.",
    messageExemple: "L'utilisateur est bien enregistré !"
  })
  @ApiExceptionsResponse([
    UserAlreadyExistException,
  ], {
    dto: CreateUserDto,
  })
  @Post()
  @HttpCode(201)
  @ApiBody({
    type: CreateUserDto,
    examples: {
      "Quentin": {
        summary: "Exemple de création d'utilisateur",
        value: {
          nom: "Lagree",
          prenom: "Quentin",
          pseudo: "QLagree",
          email: "lagreequentindev21@gmail.com",
          password: "password1234"
        }
      },
    }
  })
  @SerializeOptions({
    ignoreDecorators: true,
  })
  async store(
    @Body() payload: CreateUserDto,
  ): Promise<Message<PublicUserDto>> {
    const createdUser = await this._user.create(payload);
    return makeMessage(
      'User created !',
      "L'utilisateur est bien enregistré !",
      createdUser,
    );
  }


  @ApiCookieAuth()
  @ApiOperation({
    summary: "Modifier un utilisateur par son identifiant.",
    description: "Modifie les informations d’un utilisateur à partir de son identifiant unique. Cette opération est réservée à l’utilisateur concerné ou à un administrateur."
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 42,
    description: "Identifiant unique de l'utilisateur",
  })
  @ApiBody({
    type: UserUpdateDto,
    examples: {
      "email": {
        summary: "Exemple de modification d'utilisateur pour l'email",
        value: {
          email: "nouvelemail@gmail.com",
        }
      },
      "pseudo": {
        summary: "Exemple de modification d'utilisateur pour le pseudo",
        description: "Le pseudo doit être unique.",
        value: {
          pseudo: "nouveau_pseudo",
        }
      },
    }
  })
  @ApiMessageResponse(PublicUserDto, {
    description: "Utilisateur modifié avec succès.",
    messageExemple: "La modification de vos informations est bien sauvegardée !"
  })
  @ApiExceptionsResponse([
    UserNotHaveAuthorisation,
    UserNotFoundException,
  ], { dto: UserUpdateDto })
  @UseGuards(createAuthGuardSession(), UserOwnerOrAdminGuard)
  @Put('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UserUpdateDto,
  ): Promise<Message<PublicUserDto>> {
    let updatedUser = await this._user.update(
      { id },
      payload
    );
    return makeMessage(
      'User updated !',
      'La modification de vos informations est bien sauvegardée !',
      updatedUser,
    );
  }

  @ApiCookieAuth()
  @ApiOperation({
    summary: "Supprimer un utilisateur par son identifiant.",
    description: "Supprime toutes les informations d’un utilisateur à partir de son identifiant unique. Cette opération est réservée à un administrateur uniquement."
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 42,
    description: "Identifiant unique de l'utilisateur",
  })
  @ApiMessageResponse(null, {
    description: "Utilisateur supprimé avec succès.",
    messageExemple: "La suppression de votre compte utilisateur est un succès !",
    status: 204
  })
  @ApiExceptionsResponse([
    UserNotHaveAuthorisation,
    UserNotFoundException
  ])
  @UseGuards(createAuthGuardSession(), RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(204)
  @Delete(':id')
  async destroy(@Param('id', ParseIntPipe) id: number): Promise<Message<null>> {
    await this._user.destroy({ id });
    return makeMessage(
      'User deleted !',
      'La suppression de votre compte utilisateur est un succès !',
      null,
    );
  }

@ApiCookieAuth()
  @ApiOperation({
    summary: "Récupérer tous les brouillons d'un utilisateur par son identifiant.",
    description: "Récupère tous les brouillon d'un utilisateur. Il faut être connecter pour effectué cette action."
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 42,
    description: "Identifiant unique de l'utilisateur",
  })
  @ApiMessageResponse(PostSummaryDto, {
    description: "Afficher la liste de tous les brouillons de l'utilisateur johndoe42.",
    messageExemple: "Liste de tous les brouillon de johndoe42.",
    isArray: true,
  })
  @ApiExceptionsResponse([
    UserNotFoundException
  ])
  @HttpCode(200)
  @UseGuards(createAuthGuardSession())
  @Get('/:id/drafts')
  async getAllDraftsOfUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Message<PostSummaryDto[]>> {
    const user: userSelectPayload = await this._user.show({ id });

    const drafts: PostSummaryDto[] = await this._article.indexWhere({
      authorId: id,
      published_at: null,
    });
    return drafts.length === 0
      ? makeMessage(
        `List of all draft posts of ${user.pseudo} is empty.`,
        `La liste des brouillons de l'utilisateur ${user.pseudo} est vide.`,
        [],
      )
      : makeMessage(
        `List of all draft posts of user ${user.pseudo}`,
        `Liste de tous les brouillons de ${user.pseudo}.`,
        drafts,
      );
  }

  @UseGuards(createAuthGuardSession(), RolesGuard)
  @Roles(Role.Admin)
  @ApiCookieAuth()
  @ApiOperation({
    summary: "Récupérer toutes les publications d'un utilisateur par son identifiant.",
    description: "Récupère toutes les publications d'un utilisateur. Il faut avoir le rôle d'administrateur."
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 42,
    description: "Identifiant unique de l'utilisateur.",
  })
  @ApiMessageResponse(PostSummaryDto, {
    description: "Afficher la liste de tous les brouillons de l'utilisateur johndoe42.",
    messageExemple: "Liste de tous les brouillon de johndoe42.",
    isArray: true,
  })
  @ApiExceptionsResponse([
    UserNotHaveAuthorisation,
    UserNotFoundException
  ])
  @HttpCode(200)
  @Get('/:id/posts')
  async getAllPostsOfUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Message<PostSummaryDto[]>> {
    const user: userSelectPayload = await this._user.show({ id });

    const drafts: PostSummaryDto[] = await this._article.indexWhere({
      authorId: id,
    });
    return drafts.length === 0
      ? makeMessage(
        `List of all posts of ${user.pseudo} is empty.`,
        `La liste des publications de l'utilisateur ${user.pseudo} est vide.`,
        [],
      )
      : makeMessage(
        `List of all posts of user ${user.pseudo}`,
        `Liste de toute les publications de ${user.pseudo}.`,
        drafts,
      );
  }
}
