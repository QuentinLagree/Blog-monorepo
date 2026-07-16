import { HttpContext } from '@angular/common/http';
import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import {
  finalize,
  Observable,
  of,
  tap,
} from 'rxjs';

import { SUCCESS_MESSAGE } from 'src/app/shared/helpers/toasts/models/toasts.config';
import { HttpRequestService } from 'src/app/shared/services/http-service/get-request';
import { Message } from 'src/app/shared/types/message.type';

export interface UserPreferences {
  theme: 'system' | 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';

  reduceAnimations: boolean;

  showReadingTime: boolean;
  showAuthorDetails: boolean;
  hideReadPosts: boolean;

  notifyOnLike: boolean;
  notifyOnContribution: boolean;
  emailNotifications: boolean;
  newsletter: boolean;

  profileVisible: boolean;
  showLikedPosts: boolean;
  showContributions: boolean;
}

export type UpdateUserPreferences =
  Partial<UserPreferences>;

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  fontSize: 'medium',

  reduceAnimations: false,

  showReadingTime: true,
  showAuthorDetails: true,
  hideReadPosts: false,

  notifyOnLike: true,
  notifyOnContribution: true,
  emailNotifications: false,
  newsletter: false,

  profileVisible: true,
  showLikedPosts: false,
  showContributions: true,
};

@Injectable({
  providedIn: 'root',
})
export class UserPreferencesService {
  private readonly _http = inject(HttpRequestService);

  private readonly _preferences =
  signal<UserPreferences>(
    DEFAULT_PREFERENCES,
  );

readonly preferences =
  this._preferences.asReadonly();
  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);

  readonly loading =
    this._loading.asReadonly();

  readonly loaded =
    this._loaded.asReadonly();

  readonly showReadingTime = computed(
    () =>
      this._preferences().showReadingTime,
  );

  readonly showAuthorDetails = computed(
    () =>
      this._preferences().showAuthorDetails,
  );

  readonly reduceAnimations = computed(
    () =>
      this._preferences().reduceAnimations,
  );

  readonly theme = computed(
    () => this._preferences().theme,
  );

  readonly fontSize = computed(
    () => this._preferences().fontSize,
  );

  loadPreferences(
  force = false,
): Observable<Message<UserPreferences>> {
  if (
    this._loaded() &&
    !force
  ) {
    return of({
      data: this._preferences(),
    } as Message<UserPreferences>);
  }

  this._loading.set(true);

  return this._http
    .getData(
      'users/preferences',
      {
        context: new HttpContext().set(
          SUCCESS_MESSAGE,
          false,
        ),
      },
    )
    .pipe(
      tap(({ data }) => {
        console.log(
          'Préférences reçues :',
          data,
        );

        this._preferences.set(data);
        this._loaded.set(true);
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
}

  updatePreferences(
    payload: UpdateUserPreferences,
  ): Observable<Message<UserPreferences>> {
    return this._http
      .patchData(
        'users/preferences',
        payload,
      )
      .pipe(
        tap(({ data }) => {
          this._preferences.set(data);
          this._loaded.set(true);
        }),
      );
  }

  getPreference<
    K extends keyof UserPreferences,
  >(
    key: K,
  ): UserPreferences[K] {
    return this._preferences()[key];
  }
}