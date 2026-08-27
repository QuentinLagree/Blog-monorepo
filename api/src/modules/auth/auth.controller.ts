import * as secureSession from '@fastify/secure-session';
import {
  Body,
  Controller,
  Post,
  SerializeOptions,
  Session,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiExceptionsResponse } from 'src/commons/decorators/api-exception-response.decorator';
import { ApiMessageResponse } from 'src/commons/decorators/api-message-response.decorator';
import { AuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { Message } from 'src/commons/types/dto/message/message';
import { TransformDataMessageIntoObjectSerialization } from '../../commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { makeMessage } from '../../commons/logger/logger.helper';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { PublicUserDto } from '../user/dto/public-user.dto';
import { UserEntity } from '../user/entities/user.entities';
import { UserAlreadyExistException } from '../user/exceptions/user-already-exist.exception';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { UserLoginCredentials } from './dto/user-login-credentials.dto';
import { UserSessionDto } from './dto/user-session.dto';
import { EmailOrPasswordNotMatchException } from './exceptions/email-or-password-not-match.exception';
import { UnauthorizedSessionInactive } from './exceptions/unautorisation-session-inactive.exception';
import { UserHaveAlreadyActiveSessionException } from './exceptions/user-have-already-active-session.exception';

@ApiTags('Authentification')
@Controller('auth')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([UserEntity]))
export class AuthController {
  constructor(
    private readonly _auth: AuthService,
    private readonly _user: UserService,
  ) { }

  @ApiCookieAuth()
  @ApiOperation({
    summary: "Déconnection d'un utilisateur.",
    description: "Déconnecte-toi de ton compte. Il faut être connecté pour effectuer cette action."
  })
  @ApiMessageResponse(null, {
    description: "Effectue la déconnection du compte utilisateur.",
    messageExemple: "La déconnection de ton compte s'est effectué avec succès"
  })
  @ApiExceptionsResponse([
    UnauthorizedSessionInactive
  ], { properties_validator: false })
  @UseGuards(AuthGuardSession())
  @Post('/logout')
  async logout(@Session() session: secureSession.Session) {
    session.delete();
    return makeMessage(
      '',
      "La déconnection de ton compte s'est effectué avec succès",
      null,
    );
  }

  @ApiOperation({
    summary: "Connection d'un utilisateur.",
    description: "Connecte-toi à ton compte avec tes identifiants."
  })
  @ApiMessageResponse(UserSessionDto,
    {
      description: "Succès lors de la connection.",
      messageExemple: "La connection est un succès."
    }
  )
  @ApiExceptionsResponse([
    EmailOrPasswordNotMatchException,
    UserHaveAlreadyActiveSessionException,
  ])
  @ApiBody({
    type: UserLoginCredentials,
    description: "Le format de donnée pour la connection d'un utilisateur",
    examples: {
      default: {
        summary: "Données de connection d'exemple pour un utilisateur",
        description: "Données représentant les informations de connection d'un utilisateur",
        value: { email: "johndoe42@gmail.com", password: "Salut1234!"}
      },
      test: {
        summary: "Données de connection d'exemple pour un utilisateur autre",
        description: "Données représentant les informations de connection d'un utilisateur",
        value: { email: "johndoe42@gmail.com", password: "Salut1234!"}
      }
    }
  })
  @Post('/login')
  async login(
    @Body() payload: UserLoginCredentials,
    @Session() session: secureSession.Session,
  ): Promise<Message<UserSessionDto>> {
    const logged_user = await this._auth.login(payload);

    this._auth.setUserSession(session, {
      id: logged_user.id,
      email: logged_user.email,
      role: logged_user.role,
    });

    return makeMessage(
      `User Login Success (${logged_user.id})`,
      'La connection est un succès.',
      {
        id: logged_user.id,
        email: logged_user.email,
        role: logged_user.role,
      },
    );
  }

  @ApiOperation({
    summary: "Enregistrement d'un utilisateur.",
    description: "Inscris-toi avec tes informations."
  })
  @ApiMessageResponse(PublicUserDto,
    {
      description: "Succès lors de l'enregistrement.",
      messageExemple: "L'enregistrement est un succès."
    }
  )
  @ApiExceptionsResponse([
    UserAlreadyExistException,
  ])
  @SerializeOptions({
    ignoreDecorators: true,
  })
  @Post('/register')
  async register(@Body() payload: CreateUserDto): Promise<Message<PublicUserDto>> {
      return makeMessage(
      'User register !',
      "L'enregistrement de ton compte s'est déroulé avec succès. Maintenant tu peux te connecter.",
      await this._user.create(payload),
    );
  }
}
