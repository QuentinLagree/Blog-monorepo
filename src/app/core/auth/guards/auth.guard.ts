import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SessionService } from 'src/app/core/services/session.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private sessionService: SessionService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.sessionService.fetchSession().pipe(
      map(session => {
        if (session?.loggedIn) {
          return true;
        } else {
          return this.router.createUrlTree(['/login']); // Redirige si non connecté
        }
      }),
      catchError(() => of(this.router.createUrlTree(['/login'])))
    );
  }
}
