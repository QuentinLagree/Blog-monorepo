import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Role } from 'src/commons/roles/role.enum';
import { UserNotHaveAuthorisation } from 'src/modules/user/exceptions/user-not-have-authorization';
import { UserSessionInvalidException } from 'src/modules/user/exceptions/user-session-invalid-expired.exception';

@Injectable()
export class UserOwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: FastifyRequest = context.switchToHttp().getRequest();

    const sessionUser = request.session['user'];

    if (!sessionUser) {
      throw new UserSessionInvalidException();
    }

    const params = request.params as { id?: string };
    const userIdFromParams = Number(params.id);

    const isAdmin = sessionUser.role === Role.Admin;
    const isOwner = sessionUser.id === userIdFromParams;

    if (!isAdmin && !isOwner) {
      throw new UserNotHaveAuthorisation()
    }

    return true;
  }
}