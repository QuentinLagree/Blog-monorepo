import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { SessionService } from 'src/app/shared/services/session.service';

export const redirectCurrentUserProfileGuard: CanActivateFn = (
  route,
) => {
  const router =
    inject(Router);

  const sessionService =
    inject(SessionService);

  const routeUserId =
    route.paramMap.get('id');

  const currentUserId =
    sessionService.getUserIdSync();

  if (!routeUserId) {
    return router.createUrlTree([
      '/home',
    ]);
  }
  if (
    currentUserId === null ||
    currentUserId === undefined
  ) {
    return true;
  }
  if (
    String(routeUserId) ===
    String(currentUserId)
  ) {
    return router.createUrlTree([
      '/account/profil',
    ]);
  }
  return true;
};