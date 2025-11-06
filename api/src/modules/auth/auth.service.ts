import { Session } from '@fastify/secure-session';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PasswordNotMatchException } from '../../commons/exceptions/PasswordNotMatchException.error';
import { UserAlreadyActiveSession } from '../../commons/exceptions/UserAlreadyActiveSession.error';
import { PasswordNotSameException } from 'src/commons/exceptions/PasswordNotSame.error';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { UserLoginCredentials } from './dto/user-login-credentials.dto';
import { UserSession } from './dto/user-session.dto';
import { PasswordService } from 'src/commons/services/password.service';
import { PEPPER } from 'src/commons/constants/pepper';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
  private readonly _passwordManager: PasswordService) {}

  async login(logginDto: UserLoginCredentials): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: logginDto.email },
      });
      if (!user) throw new NotFoundException();

      let hasSamePassword: boolean = await this.comparePassword(
        logginDto.password,
        user.password,
      );

      if (!hasSamePassword) throw new PasswordNotMatchException();

      return user;
    } catch (error) {
      throw error;
    }
  }

  setUserSession(session: Session, user: UserSession): void {
    if (session.get('user')) {
      throw new UserAlreadyActiveSession();
    }
    session.set('user', user);
    return;
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
    console.log('Same password');
    if (password !== confirm_password) {
      throw new PasswordNotSameException();
    }
  }
}
