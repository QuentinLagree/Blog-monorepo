import { Session } from '@fastify/secure-session';
declare module '@fastify/secure-session' {
  interface SessionData {
    get(key: 'user'): UserSession | null;
    set(key: 'user', value: UserSession): void;
  }
}
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { UserLoginCredentials } from './dto/user-login-credentials.dto';
import { PasswordService } from 'src/commons/services/argon.service';
import { EmailOrPasswordNotMatchException } from './exceptions/email-or-password-not-match.exception';
import { UserAlreadySessionActive } from './exceptions/user-already-session-active.exception';
import { PasswordNotMatchException } from './exceptions/password-not-same.exception';
import { UserSession } from 'src/commons/types/session-user.type';

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
      throw new UserAlreadySessionActive();
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
    
  }
}
