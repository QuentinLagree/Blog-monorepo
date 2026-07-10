import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, take } from 'rxjs';
import { SessionService } from 'src/app/shared/services/session.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  return session.fetchSession().pipe(
    take(1),
    map((s) => (s?.loggedIn ? true : router.createUrlTree(['/login'])))
  );
};