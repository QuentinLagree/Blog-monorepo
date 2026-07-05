// roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { UserService } from 'src/modules/user/user.service';
import { ROLES_KEY } from '../decorators/role.decorator';
import { UserNotHaveAuthorisation } from 'src/modules/user/exceptions/user-not-have-authorisation.exception';
import { UnauthorizedSessionInactive } from 'src/modules/auth/exceptions/unautorisation-session-inactive.exception';
import { UserNotFoundException } from 'src/modules/user/exceptions/user-not-found.exception';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request: FastifyRequest = context.switchToHttp().getRequest();

    const sessionUser = request.session['user'];

    if (!sessionUser) {
      throw new UnauthorizedSessionInactive();
    }

    const dbUser = await this.usersService.show({id: sessionUser.id});

    if (!dbUser) {
      throw new UserNotFoundException(sessionUser.id);
    }

    if (!requiredRoles.includes(dbUser.role)) {
      throw new UserNotHaveAuthorisation();
    }

    return true;
  }
}