import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, take } from 'rxjs';
import { SessionService } from '../../services/session.service';

export const loginGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  return session.fetchSession().pipe(
    take(1),
    map((s) => (s?.loggedIn ? router.createUrlTree(['/home']) : true))
  );
};