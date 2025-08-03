import { Injectable } from "@angular/core";
import { BehaviorSubject, catchError, map, Observable, of } from "rxjs";
import { Message } from "../models/message.model";
import { HttpRequestService } from "../../shared/services/http-service/get_request.service";

export type UserSession = {
    id: number
    email: string
    role: string
}


type SessionType = {
    loggedIn: boolean,
    user: UserSession
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private session$ = new BehaviorSubject<SessionType | null>(null);
  private readonly KEY = 'cached_session';

  constructor(private _http: HttpRequestService) {
    const stored = localStorage.getItem(this.KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      this.session$.next(parsed);
    }
  }

  fetchSession(): Observable<SessionType | null> {
    // Évite les requêtes si déjà chargée
    if (this.session$.value !== null) {
        return of(this.session$.value);
    }

    return this._http.getData('auth/session', true).pipe(
      map(res => {
        localStorage.setItem(this.KEY, JSON.stringify(res.data)); // ⬅️ cache navigateur
        this.session$.next(res.data); // ⬅️ cache mémoire
        return res.data;
      }),
      catchError(err => {
        this.clearSession();
        return of(null);
      })
    );
  }

  getSession(): Observable<SessionType | null> {
    return this.session$.asObservable();
  }

  clearSession(): void {
    console.log('[clearSession] Clearing key:', this.KEY);
    this.session$.next(null);
    localStorage.removeItem(this.KEY);
  }
}