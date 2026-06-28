import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';


export const resetPasswordGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const _auth = inject(AuthService);

  const email = route.queryParamMap.get('email');
  const token = route.queryParamMap.get('token');

  if (!email || !token) {
    return router.createUrlTree(['/']);
  }

  try {
    await firstValueFrom(_auth.checkResetToken({email, token}));

    return true;
  } catch {
    return router.createUrlTree(['/']);
  }
};