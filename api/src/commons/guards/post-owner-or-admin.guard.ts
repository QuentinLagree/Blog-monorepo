import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ArticleService } from 'src/modules/post/posts.service';
import { Role } from 'src/commons/roles/role.enum';

@Injectable()
export class PostOwnerOrAdminGuard implements CanActivate {
  constructor(private readonly articlesService: ArticleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: FastifyRequest = context.switchToHttp().getRequest();

    const sessionUser = request.session['user'];
    const postId = Number(request.params['id']);

    if (!sessionUser) {
      throw new UnauthorizedException('Session Invalid/Expired');
    }

    if (!Number.isInteger(postId)) {
      throw new ForbiddenException('Post id invalid');
    }

    const post = await this.articlesService.indexOneWhere({ id: postId });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const isAdmin = sessionUser.role === Role.Admin;
    const isAuthor = post.authorId === sessionUser.id;

    if (!isAdmin && !isAuthor) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de modifier cette publication.",
      );
    }

    return true;
  }
}