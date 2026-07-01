import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Role } from 'src/commons/roles/role.enum';

@Injectable()
export class UserOwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: FastifyRequest = context.switchToHttp().getRequest();

    const sessionUser = request.session['user'];

    if (!sessionUser) {
      throw new UnauthorizedException('Session Invalid/Expired');
    }

    const params = request.params as { id?: string };
    const userIdFromParams = Number(params.id);

    if (!Number.isInteger(userIdFromParams)) {
      throw new ForbiddenException('Invalid user id');
    }

    const isAdmin = sessionUser.role === Role.Admin;
    const isOwner = sessionUser.id === userIdFromParams;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation d'accéder à cette ressource.",
      );
    }

    return true;
  }
}