import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UserService } from '@src/app/core/services/user.service';
import { PostService } from '@src/app/core/services/post.service';

export const canEditPostGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const userService = inject(UserService);
  const postService = inject(PostService);

  const postId = Number(route.paramMap.get('id'));

  if (!postId) {
    return router.createUrlTree(['/']);
  }

  const user = await firstValueFrom(userService.checkSessionActive());
  const post = await firstValueFrom(postService.getPostWithID(postId));

  console.log(user)
  console.log(post)

  const isOwner = post.data.authorId === user.data.id;
  const isAdmin = user.data.user.role === 'admin';

  console.log(isAdmin)
  console.log(isOwner)
  
  if (isOwner || isAdmin) {
    console.log("Salut je susi admon")
    return true;
  }

  return router.createUrlTree(['/home']);
};