import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, finalize, map, shareReplay, switchMap } from 'rxjs/operators';
import { HttpRequestService } from '../../shared/services/http-service/get-request';
import { HttpContext } from '@angular/common/http';
import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '../toasts/models/toasts.config';

export interface UserSession { id: number; email: string; role: string; }
export interface SessionType { loggedIn: boolean; user?: UserSession | null; }
type Cached = { data: SessionType; ts: number };

@Injectable({ providedIn: 'root' })
export class SessionService {
  private session$ = new BehaviorSubject<SessionType | null>(null); // null = inconnu
  private inFlight$: Observable<SessionType | null> | null = null;
  private readonly KEY = 'cached_session';
  private readonly TTL_MS = 5 * 60 * 1000;

  private _http = inject(HttpRequestService);

  constructor() {
    try {
      const stored = localStorage.getItem(this.KEY);
      if (stored) {
        const parsed: Cached = JSON.parse(stored);
        if (parsed && parsed.data && Date.now() - parsed.ts < this.TTL_MS) {
          this.session$.next(parsed.data);
        }
      }
    } catch { localStorage.removeItem(this.KEY); }
  }

  setSession(user: UserSession): void {
    const data: SessionType = { loggedIn: true, user };
    // Mémorise l’état connecté
    this.session$.next(data);
    // Persiste (pour reload/onglet)
    console.log(data)
    localStorage.setItem(this.KEY, JSON.stringify({ data, ts: Date.now() }));
  }

  fetchSession(): Observable<SessionType | null> {
    const prev = this.session$.value;
    const current = this.session$.value;
    if (current !== null) return of(current);
    if (this.inFlight$) return this.inFlight$;
    this.inFlight$ = this._http.getData('auth/session', {
      credentials: true,
      context: new HttpContext()
      .set(ERROR_MESSAGE, false)
    }).pipe(
      map((res: any) => {
        const data: SessionType = res?.data ?? { loggedIn: false, user: null };
        this.persist(data);
        this.session$.next(data);
        return data;
      }),
      catchError(() => {
        if (prev) {
        // On conserve l’état précédent en mémoire et on ne touche pas le cache
        this.session$.next(prev);
        return of(prev);
      }
      // Si on n’a AUCUN état précédent, on reste en "inconnu" (null) ou on émet un guest NON persisté
      const unknown: SessionType | null = null;
      this.session$.next(unknown);
      return of(unknown);
    }),
    finalize(() => { this.inFlight$ = null; }),
    shareReplay(1)
    );

    return this.inFlight$;
  }

  getSession(): Observable<SessionType | null> { return this.session$.asObservable(); }

  userId$(): Observable<number | null> {
    return this.session$.pipe(
      switchMap(state => state === null ? this.fetchSession() : of(state)),
      map(state => state?.user?.id ?? null),
      distinctUntilChanged()
    );
  }

  /** Variante "requise" : n’émet que des ids valides (utilisateur connecté). */
  requireUserId$(): Observable<number> {
    return this.userId$().pipe(
      filter((id): id is number => id !== null)
    );
  }

  /** Lecture synchrone (best effort) à partir du cache/BehaviorSubject. */
  getUserIdSync(): number | null {
    const s = this.session$.value;              // peut être null (inconnu) au premier chargement
    return s?.user?.id ?? null;                 // retourne null si pas connecté ou pas encore connu
  }

  getUserRoleSync(): string | null {
    const s = this.session$.value;              // peut être null (inconnu) au premier chargement
    return s?.user?.role ?? null;                 // retourne null si pas connecté ou pas encore connu
  }

  clearSession(): void {
    const guest: SessionType = { loggedIn: false, user: null };
    this.persist(guest);
    this.session$.next(guest);
  }

  invalidateCache(): void {
    this.session$.next(null);
    localStorage.removeItem(this.KEY);
  }

  private persist(data: SessionType) {
    try { localStorage.setItem(this.KEY, JSON.stringify({ data, ts: Date.now() })); }
    catch { /* ignore quota/parsing */ }
  }
}
