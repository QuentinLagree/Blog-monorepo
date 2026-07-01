import * as secureSession from '@fastify/secure-session';
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  SerializeOptions,
  Session,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { Message } from 'src/commons/types/dto/message/message';
import { SessionType } from 'src/commons/types/session.type';
import { makeMessage } from '../../commons/logger/logger.helper';
import { TransformDataMessageIntoObjectSerialization } from '../../commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { UserDto } from '../user/dto/user.dto';
import { UserEntity } from '../user/entities/user.entities';
import { userSelectPayload, UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { UserLoginCredentials } from './dto/user-login-credentials.dto';
import { UserSession } from './dto/user-session.dto';

@ApiTags('Authentification')
@Controller('auth')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([UserEntity]))
@UsePipes(ValidationPipe)
export class AuthController {
  constructor(
    private readonly _auth: AuthService,
    private readonly _user: UserService,
  ) { }

  @Get('/session') // Pas tester (encore en implémentation)
  async status(
    @Session() session: secureSession.Session,
  ): Promise<Message<SessionType>> {
    const user = session.get('user');

    if (user) {
      return makeMessage('', 'La session est bien active.', {
        loggedIn: true,
        user,
      });
    } else {
      throw new HttpException(
        makeMessage('', 'Aucune session active', { loggedIn: false }),
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @UseGuards(AuthGuardSession())
  @Post('/logout') // Pas tester (Encore en implémentation)
  async logout(@Session() session: secureSession.Session) {
    session.delete();
    return makeMessage(
      '',
      "La déconnection de ton compte s'est éffectué avec succée",
      null,
    );
  }

  @Post('/login')
  async login(
    @Body() payload: UserLoginCredentials,
    @Session() session: secureSession.Session,
  ): Promise<Message<UserSession>> {
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
  
  @SerializeOptions({
    ignoreDecorators: true,
  })
  @Post('/register')
  async register(@Body() payload: UserDto): Promise<Message<userSelectPayload>> {
      return makeMessage(
        'User register !',
        "L'enregistrement de ton compte s'est déroulé avec succès. Maintenant tu peux te connecter.",
        await this._user.create(payload),
      );
  }
}
