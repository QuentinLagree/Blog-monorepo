import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { ToastService } from './toaster.service';
import { TOAST_CONFIG } from './models/toasts.config';

const SUBMIT_METHODS = new Set(['GET', 'POST','PUT','PATCH','DELETE']);

@Injectable({ providedIn: 'root' })
export class FlashInterceptor implements HttpInterceptor {
  constructor(private toast: ToastService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse && SUBMIT_METHODS.has(req.method)) {
          const body = event.body;
          const bodyMsg = body?.message || body?.msg || body?.detail;
          const ok = event.ok && event.status >= 200 && event.status < 300;
          if (ok) this.toast.success(bodyMsg || this.defaultSuccess(req.method));
        }
      }),
      catchError((err: HttpErrorResponse) => {
        const body = err.error;
        const bodyMsg = body?.message || body?.error || body?.detail;
        const msg =  bodyMsg || this.defaultError(err.status);
        this.toast.error(msg)
        return throwError(() => err);
      })
    );
  }

  private defaultSuccess(method: string) {
    switch (method) {
      case 'GET': return 'Récupérer avec succès.'
      case 'POST': return 'Créé avec succès.';
      case 'PUT':
      case 'PATCH': return 'Enregistré avec succès.';
      case 'DELETE': return 'Supprimé avec succès.';
      default: return 'Action réussie.';
    }
  }
  private defaultError(status?: number) {
    if (status === 0) return 'Impossible de joindre le serveur.';
    if (status === 400) return 'Requête invalide.';
    if (status === 401) return 'Authentification requise.';
    if (status === 403) return 'Accès refusé.';
    if (status === 404) return 'Ressource introuvable.';
    if (status && status >= 500) return 'Erreur serveur. Réessaye plus tard.';
    return 'Une erreur est survenue.';
  }
}
