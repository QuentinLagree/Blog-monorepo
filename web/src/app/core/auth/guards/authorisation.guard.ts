import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UserService } from '@src/app/core/services/user.service';
import { PostService } from '@src/app/core/services/post.service';
import { HttpContext } from '@angular/common/http';
import { SUCCESS_MESSAGE } from '../../toasts/models/toasts.config';

export const canEditPostGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const userService = inject(UserService);
  const postService = inject(PostService);
  const context = new HttpContext().set(SUCCESS_MESSAGE, false)

  const postId = Number(route.paramMap.get('id'));

  if (!postId) {
    return router.createUrlTree(['/']);
  }

  const user = await firstValueFrom(userService.checkSessionActive({context}));
  const post = await firstValueFrom(postService.getPostWithID(postId, {context}));


  const isOwner = post.data.authorId === user.data.id;
  const isAdmin = user.data.user.role === 'admin';

  if (isOwner || isAdmin) {
    return true;
  }

  return router.createUrlTree(['/home']);
};