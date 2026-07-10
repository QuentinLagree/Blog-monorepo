import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { SessionService } from 'src/app/shared/services/session.service';

export const authGuard: CanActivateFn = (route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  return session.fetchSession().pipe(
    take(1),
    map((s) =>
      s?.loggedIn
        ? true
        : router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } })
    )
  );
};