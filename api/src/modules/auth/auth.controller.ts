import * as secureSession from '@fastify/secure-session';
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  SerializeOptions,
  Session,
  UseInterceptors,
  UsePipes,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UserDto } from '../user/dto/user.dto';
import { UserEntity } from '../user/entities/user.entities';
import { TransformDataMessageIntoObjectSerialization } from '../../commons/interceptors/transform_data_message_into_object_serialization.interceptor';
import { PasswordNotMatchException } from '../../commons/exceptions/PasswordNotMatchException.error';
import { UserAlreadyActiveSession } from '../../commons/exceptions/UserAlreadyActiveSession.error';
import {
  UserAlreadyExistWithEmail,
  UserAlreadyExistWithPseudo,
} from '../../commons/exceptions/userAlreadyExist.error';
import { makeMessage } from '../../commons/helpers/logger.helper';
import { UserService } from '../user/user.service';
import { SessionType } from 'src/commons/types/session.type';
import { dtoIsValid } from 'src/commons/helpers/dto/dto-validations.helper';
import { AuthService } from './auth.service';
import { UserLoginCredentials } from './dto/user-login-credentials.dto';
import { Message } from 'src/commons/types/message/message';
import { UserSession } from './dto/user-session.dto';

@ApiTags('Authentification')
@Controller('auth')
@UseInterceptors(new TransformDataMessageIntoObjectSerialization([UserEntity]))
@UsePipes(ValidationPipe)
export class AuthController {
  constructor(
    private readonly _auth: AuthService,
    private readonly _user: UserService,
  ) {}

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

  @Get('/logout') // Pas tester (Encore en implémentation)
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
    @Body() loginDto: UserLoginCredentials,
    @Session() session: secureSession.Session,
  ): Promise<Message<UserSession | ValidationError[] | null>> {
    const errors: ValidationError[] = await dtoIsValid(
      loginDto,
      UserLoginCredentials,
    );

    if (errors.length > 0) {
      throw new HttpException(
        makeMessage(
          'User logged failed !',
          'Tous les champs sont requis.',
          errors,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      let user!: User;
      const logged_user = await this._auth.login(loginDto);

      user = logged_user;
      this._auth.setUserSession(session, {
        id: logged_user.id,
        email: logged_user.email,
        role: logged_user.role,
      });

      return makeMessage(
        `User Login Success (${user.id})`,
        'La connection est un succès.',
        {
        id: logged_user.id,
        email: logged_user.email,
        role: logged_user.role,
      },
      );
    } catch (error) {
      switch (true) {
        case error instanceof UserAlreadyActiveSession:
          throw new HttpException(
            makeMessage(
              'User logged failed (already logged)',
              'Vous êtes déjà connecté...',
              null,
            ),
            HttpStatus.CONFLICT,
          );

        case error instanceof NotFoundException ||
          error instanceof PasswordNotMatchException:
          throw new HttpException(
            makeMessage(
              'User logged failed',
              "L'email ou le mot de passe est incorrect",
              null,
            ),
            HttpStatus.UNAUTHORIZED,
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
  @SerializeOptions({
    ignoreDecorators: true,
  })
  @Post('/register')
  async register(@Body() createData: UserDto) {
    const errors: ValidationError[] = await dtoIsValid(createData);

    if (errors.length > 0) {
      throw new HttpException(
        makeMessage(
          'User registred failed !',
          'Tous les champs sont requis.',
          errors,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const created_user = await this._user.create(createData);
      return makeMessage(
        'User register !',
        "L'enregistrement de ton compte s'est déroulé avec succès. Maintenant tu peux te connecter.",
        created_user,
      );
    } catch (error) {
      switch (true) {
        case error instanceof UserAlreadyExistWithEmail:
          throw new HttpException(
            makeMessage(
              'User created failed',
              'Cette email est déjà utiliser, si vous avez déjà un compte, vous pouvez vous connecter.',
              null,
            ),
            HttpStatus.CONFLICT,
          );

        case error instanceof UserAlreadyExistWithPseudo:
          throw new HttpException(
            makeMessage(
              'User created failed',
              "Ce nom d'utilisateur est déjà utilisé.",
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
}
