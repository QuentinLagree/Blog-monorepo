import {
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Role } from 'src/commons/roles/role.enum';
import { UserNotHaveAuthorisation } from 'src/modules/user/exceptions/user-not-have-authorization';
import { UserSessionInvalidException } from 'src/modules/user/exceptions/user-session-invalid-expired.exception';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class UserOwnerOrAdminGuard implements CanActivate {
  constructor(private readonly users: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: FastifyRequest = context.switchToHttp().getRequest();

    const sessionUser = request.session['user'];

    if (!sessionUser) {
      throw new UserSessionInvalidException();
    }

    const params = request.params as { id?: string };
    const userIdFromParams = Number(params.id);
    if (!Number.isSafeInteger(userIdFromParams) || userIdFromParams <= 0) {
      throw new BadRequestException(
        "L'identifiant utilisateur doit être un entier positif.",
      );
    }

    const isOwner = sessionUser.id === userIdFromParams;
    const isAdmin =
      !isOwner &&
      sessionUser.role === Role.Admin &&
      (await this.users.show({ id: sessionUser.id })).role === Role.Admin;

    if (!isAdmin && !isOwner) {
      throw new UserNotHaveAuthorisation();
    }

    return true;
  }
}
