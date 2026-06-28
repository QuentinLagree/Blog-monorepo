import { Session } from '@fastify/secure-session';
declare module '@fastify/secure-session' {
  interface SessionData {
    get(key: 'user'): UserSession | null;
    set(key: 'user', value: UserSession): void;
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PasswordNotMatchException } from '../../commons/exceptions/PasswordNotMatchException.error';
import { UserAlreadyActiveSession } from '../../commons/exceptions/UserAlreadyActiveSession.error';
import { PasswordNotSameException } from 'src/commons/exceptions/PasswordNotSame.error';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { UserLoginCredentials } from './dto/user-login-credentials.dto';
import { UserSession } from './dto/user-session.dto';
import { PasswordService } from 'src/commons/services/argon.service';
import { UserNotFoundException } from '../user/exceptions/user-not-found.exception';
import { EmailOrPasswordNotMatchException } from './exceptions/email-or-password-not-match.exception';
import { userSelect, userSelectPayload } from '../user/user.service';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
  private readonly _passwordManager: PasswordService) {}
  

  async login(logginDto: UserLoginCredentials): Promise<User> {
    
      const user = await this.prisma.user.findUnique({
        where: { email: logginDto.email },
      });
      if (!user) throw new EmailOrPasswordNotMatchException();

      let hasSamePassword: boolean = await this.comparePassword(
        logginDto.password,
        user.password,
      );

      if (!hasSamePassword) throw new EmailOrPasswordNotMatchException();

      return user;
  }

  setUserSession(session: Session, user: UserSession): void {
    if (session.get('user')) {
      throw new UserAlreadyActiveSession();
    }
    session.set('user', user);
  }

  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return await this._passwordManager.verifyPassword(hash, password);
  }

  public async throwAnNotSamePasswordExceptionIfNotSame(
    password: string,
    confirm_password: string,
  ): Promise<void> {
    if (password !== confirm_password) {
      throw new PasswordNotSameException();
    }
  }
}
