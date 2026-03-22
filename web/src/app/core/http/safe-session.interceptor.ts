// core/http/interceptors/safe-session.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class SafeSessionInterceptor implements HttpInterceptor {
  private readonly SESSION_PATH = '/auth/session';
  private readonly TIMEOUT_MS = 6000;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isSession = req.url.includes(this.SESSION_PATH);

    return next.handle(req).pipe(
      timeout(this.TIMEOUT_MS),

      // Pas de retry ici. Si tu veux un retry pour les autres endpoints,
      // fais-le dans un autre intercepteur (ou ajoute `retry()` uniquement quand !isSession).

      catchError((err) => {
        if (isSession) {
          // Quoi qu'il arrive (réseau down, 401, HTML, etc.), on renvoie un "invité" sûr
          const guestBody = { data: { loggedIn: false, user: null } };
          return of(new HttpResponse({ status: 200, body: guestBody }));
        }
        return throwError(() => err);
      })
    );
  }
}
