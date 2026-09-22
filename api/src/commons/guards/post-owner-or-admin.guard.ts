import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ArticleService } from 'src/modules/post/posts.service';
import { Role } from 'src/commons/roles/role.enum';
import { UserNotHaveAuthorisation } from 'src/modules/user/exceptions/user-not-have-authorization';
import { PostNotFoundException } from 'src/modules/post/exceptions/post-not-found.exception';
import { UserSessionInvalidException } from 'src/modules/user/exceptions/user-session-invalid-expired.exception';

@Injectable()
export class PostOwnerOrAdminGuard implements CanActivate {
  constructor(private readonly articlesService: ArticleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: FastifyRequest = context.switchToHttp().getRequest();

    const sessionUser = request.session['user'];
    const postId = Number(request.params['id']);

    if (!sessionUser) {
      throw new UserSessionInvalidException();
    }

    const post = await this.articlesService.indexOneWhere({ id: postId });

    if (!post) {
      throw new PostNotFoundException(postId)
    }

    const isAdmin = sessionUser.role === Role.Admin;
    const isAuthor = post.authorId === sessionUser.id;

    if (!isAdmin && !isAuthor) {
      throw new UserNotHaveAuthorisation()
    }

    return true;
  }
}