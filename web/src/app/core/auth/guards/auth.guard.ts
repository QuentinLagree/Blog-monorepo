import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { SessionService } from 'src/app/core/services/session.service';

export const authGuard: CanActivateFn = (route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  // Utilise fetchSession() pour charger (depuis cache mémoire/localStorage ou API)
  return session.fetchSession().pipe(
    take(1),
    map((s) =>
      s?.loggedIn
        ? true
        : router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } })
    )
  );
};