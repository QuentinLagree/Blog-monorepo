import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SessionService } from 'src/app/core/services/session.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private _sessionService: SessionService = inject(SessionService);
  private _router: Router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this._sessionService.fetchSession().pipe(
      map((session) => {
        if (session?.loggedIn) {
          return true;
        } else {
          return this._router.createUrlTree(['auth/login']);
        }
      }),
      catchError(() => of(this._router.createUrlTree(['auth/login'])))
    );
  }
}
