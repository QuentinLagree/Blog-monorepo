import { DatePipe } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import {
  Component,
  effect,
  inject,
  resource,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  finalize,
  firstValueFrom,
} from 'rxjs';

import { PostService } from 'src/app/features/posts/data-access/post.service';
import { Post } from 'src/app/features/posts/model/post.model';

import { SUCCESS_MESSAGE } from 'src/app/shared/helpers/toasts/models/toasts.config';
import { SessionService } from 'src/app/shared/services/session.service';
import {
  User,
  UserService,
} from 'src/app/shared/services/user.service';
import { Message } from 'src/app/shared/types/message.type';

import { PostCard } from 'src/app/shared/ui/card/post-card/post-card';
import { BaseButtonComponent } from 'src/app/shared/ui/form/buttons/base-button';
import { DangerButtonComponent } from 'src/app/shared/ui/form/buttons/button-danger/button-danger';
import { SelectValidatorFactory } from 'src/app/shared/ui/form/selects/models/select-validator.factory';
import { SelectComponent } from 'src/app/shared/ui/form/selects/selects';
import { SwitchButtonComponent } from 'src/app/shared/ui/form/switch-button/switch-button';

import {
  UpdateUserPreferences,
  UserPreferences,
  UserPreferencesService,
} from './preferences.service';

type ThemeControlValue =
  | 'Système'
  | 'Clair'
  | 'Sombre';

type FontSizeControlValue =
  | 'Petite'
  | 'Moyenne'
  | 'Grande';

@Component({
  selector: 'app-profil-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    DangerButtonComponent,
    BaseButtonComponent,
    PostCard,
    SelectComponent,
    SwitchButtonComponent,
  ],
  templateUrl: './profil.html',
  styleUrls: ['./profil.scss'],
})
export class ProfilPageComponent {
  private readonly _session =
    inject(SessionService);

  private readonly _user =
    inject(UserService);

  private readonly _post =
    inject(PostService);

  private readonly _preferences =
    inject(UserPreferencesService);

  readonly sessionId =
    this._session.getUserIdSync();

  readonly user: WritableSignal<User | undefined> =
    signal(undefined);

  /*
   * Les signaux loading et loaded proviennent directement
   * du store global de préférences.
   */
  readonly preferencesLoading =
    this._preferences.loading;

  readonly preferencesLoaded =
    this._preferences.loaded;

  readonly preferencesSaving =
    signal(false);

  readonly preferences =
    this._preferences.preferences;

  showDraftsPosts = false;
  showPreferences = false;

  private readonly themeLabels: Record<
    UserPreferences['theme'],
    ThemeControlValue
  > = {
      system: 'Système',
      light: 'Clair',
      dark: 'Sombre',
    };

  private readonly themeValues: Record<
    ThemeControlValue,
    UserPreferences['theme']
  > = {
      Système: 'system',
      Clair: 'light',
      Sombre: 'dark',
    };

  private readonly fontSizeLabels: Record<
    UserPreferences['fontSize'],
    FontSizeControlValue
  > = {
      small: 'Petite',
      medium: 'Moyenne',
      large: 'Grande',
    };

  private readonly fontSizeValues: Record<
    FontSizeControlValue,
    UserPreferences['fontSize']
  > = {
      Petite: 'small',
      Moyenne: 'medium',
      Grande: 'large',
    };

  readonly themeControl =
    new FormControl<ThemeControlValue>(
      'Système',
      {
        nonNullable: true,
        validators: [
          SelectValidatorFactory({
            validate: true,
            required: true,
          }),
        ],
      },
    );

  readonly fontSizeControl =
    new FormControl<FontSizeControlValue>(
      'Moyenne',
      {
        nonNullable: true,
        validators: [
          SelectValidatorFactory({
            validate: true,
            required: true,
          }),
        ],
      },
    );

  readonly reduceAnimationsControl =
    new FormControl(false, {
      nonNullable: true,
    });

  readonly showReadingTimeControl =
    new FormControl(true, {
      nonNullable: true,
    });

  readonly showAuthorDetailsControl =
    new FormControl(true, {
      nonNullable: true,
    });

  readonly hideReadPostsControl =
    new FormControl(false, {
      nonNullable: true,
    });

  readonly notifyOnLikeControl =
    new FormControl(true, {
      nonNullable: true,
    });

  readonly notifyOnContributionControl =
    new FormControl(true, {
      nonNullable: true,
    });

  readonly emailNotificationsControl =
    new FormControl(false, {
      nonNullable: true,
    });

  readonly newsletterControl =
    new FormControl(false, {
      nonNullable: true,
    });

  readonly profileVisibleControl =
    new FormControl(true, {
      nonNullable: true,
    });

  readonly showLikedPostsControl =
    new FormControl(false, {
      nonNullable: true,
    });

  readonly showContributionsControl =
    new FormControl(true, {
      nonNullable: true,
    });

  readonly preferencesForm = new FormGroup({
    theme: this.themeControl,
    fontSize: this.fontSizeControl,

    reduceAnimations:
      this.reduceAnimationsControl,

    showReadingTime:
      this.showReadingTimeControl,

    showAuthorDetails:
      this.showAuthorDetailsControl,

    hideReadPosts:
      this.hideReadPostsControl,

    notifyOnLike:
      this.notifyOnLikeControl,

    notifyOnContribution:
      this.notifyOnContributionControl,

    emailNotifications:
      this.emailNotificationsControl,

    newsletter:
      this.newsletterControl,

    profileVisible:
      this.profileVisibleControl,

    showLikedPosts:
      this.showLikedPostsControl,

    showContributions:
      this.showContributionsControl,
  });

  readonly drafts = resource<Post[], Error>({
    loader: async (): Promise<Post[]> => {
      if (!this.sessionId) {
        return [];
      }

      const context =
        this.createSilentContext();

      const response: Message<Post[]> =
        await firstValueFrom(
          this._post.getDraftsPostsOfUser(
            this.sessionId,
            {
              context,
            },
          ),
        );

      return response.data;
    },
  });

  constructor() {
  effect(() => {
    if (!this._preferences.loaded()) {
      return;
    }

    const preferences =
      this._preferences.preferences();

    this.fillPreferencesForm(preferences);
  });

  void this.loadUser();
  this.loadPreferences();
}

  private async loadUser(): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    const context =
      this.createSilentContext();

    const response: Message<User> =
      await firstValueFrom(
        this._user.findUserWithId(
          this.sessionId,
          {
            context,
          },
        ),
      );

    this.user.set(response.data);
  }
  
loadPreferences(): void {
  if (
    !this.sessionId ||
    this._preferences.loading()
  ) {
    return;
  }

  this._preferences
    .loadPreferences(true)
    .subscribe({
      next: ({ data }) => {
        console.log(
          'Préférences reçues dans le profil :',
          data,
        );

        this.fillPreferencesForm(data);
      },

      error: (error) => {
        console.error(
          'Impossible de charger les préférences.',
          error,
        );
      },
    });
}

  savePreferences(
    cta = false,
  ): void {
    if (
      this.preferencesForm.invalid ||
      this.preferencesSaving()
    ) {
      this.preferencesForm.markAllAsTouched();
      return;
    }

    const values =
      this.preferencesForm.getRawValue();

    const payload: UpdateUserPreferences = {
      theme:
        this.themeValues[values.theme],

      fontSize:
        this.fontSizeValues[
        values.fontSize
        ],

      reduceAnimations:
        values.reduceAnimations,

      showReadingTime:
        values.showReadingTime,

      showAuthorDetails:
        values.showAuthorDetails,

      hideReadPosts:
        values.hideReadPosts,

      notifyOnLike:
        values.notifyOnLike,

      notifyOnContribution:
        values.notifyOnContribution,

      emailNotifications:
        values.emailNotifications,

      newsletter:
        values.newsletter,

      profileVisible:
        values.profileVisible,

      showLikedPosts:
        values.showLikedPosts,

      showContributions:
        values.showContributions,
    };

    this.preferencesSaving.set(true);

    this._preferences
      .updatePreferences(
        payload,
      )
      .pipe(
        finalize(() => {
          this.preferencesSaving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.preferencesForm.markAsPristine();
          this.preferencesForm.markAsUntouched();
        },
      });
  }

  private fillPreferencesForm(
    preferences: UserPreferences,
  ): void {
    this.preferencesForm.patchValue(
      {
        theme:
          this.themeLabels[
          preferences.theme
          ],

        fontSize:
          this.fontSizeLabels[
          preferences.fontSize
          ],

        reduceAnimations:
          preferences.reduceAnimations,

        showReadingTime:
          preferences.showReadingTime,

        showAuthorDetails:
          preferences.showAuthorDetails,

        hideReadPosts:
          preferences.hideReadPosts,

        notifyOnLike:
          preferences.notifyOnLike,

        notifyOnContribution:
          preferences.notifyOnContribution,

        emailNotifications:
          preferences.emailNotifications,

        newsletter:
          preferences.newsletter,

        profileVisible:
          preferences.profileVisible,

        showLikedPosts:
          preferences.showLikedPosts,

        showContributions:
          preferences.showContributions,
      },
      {
        emitEvent: false,
      },
    );

    this.preferencesForm.markAsPristine();
    this.preferencesForm.markAsUntouched();
  }

  private createSilentContext(): HttpContext {
    return new HttpContext().set(
      SUCCESS_MESSAGE,
      false,
    );
  }
}