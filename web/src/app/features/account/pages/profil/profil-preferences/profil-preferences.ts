import { Component, DestroyRef, effect, inject, input, InputSignal, signal, WritableSignal } from "@angular/core";
import { UpdateUserPreferences, UserPreferences, UserPreferencesService } from "../preferences.service";
import { SwitchButtonComponent } from "src/app/shared/ui/form/switch-button/switch-button";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { SelectValidatorFactory } from "src/app/shared/ui/form/selects/models/select-validator.factory";
import { User, UserService } from "src/app/shared/services/user.service";
import { debounceTime, distinctUntilChanged, filter, finalize, firstValueFrom } from "rxjs";
import { SelectComponent } from "src/app/shared/ui/form/selects/selects";
import { BaseButtonComponent } from "src/app/shared/ui/form/buttons/base-button";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HttpContext } from "@angular/common/http";
import { ToastService } from "src/app/shared/helpers/toasts/toaster.service";

type ThemeControlValue =
    | 'Système'
    | 'Clair'
    | 'Sombre'
    | 'Crème';

type FontSizeControlValue =
    | 'Petite'
    | 'Moyenne'
    | 'Grande';

const SAVE_DELAY = 1000;

@Component({
    selector: 'app-profil-preferences',
    standalone: true,
    imports: [
        SwitchButtonComponent,
        SelectComponent,
        ReactiveFormsModule,
        BaseButtonComponent
    ],
    templateUrl: './profil-preferences.html',
    styleUrls: ['./profil-preferences.scss', '../profil-collapse.scss']
})

export class ProfilPreferencesComponent {
    sessionId: InputSignal<number> = input.required()

    private readonly destroyRef = inject(DestroyRef);
    private readonly _toast = inject(ToastService)

    readonly _preferences =
        inject(UserPreferencesService);

    readonly preferencesLoading =
        this._preferences.loading;

    readonly preferencesLoaded =
        this._preferences.loaded;

    readonly preferencesSaving =
        signal(false);

    readonly preferences =
        this._preferences.preferences;



    readonly user: InputSignal<User | undefined> =
        input.required();



    showPreferences = false;

    readonly themeLabels: Record<
        UserPreferences['theme'],
        ThemeControlValue
    > = {
            system: 'Système',
            cream: 'Crème',
            light: 'Clair',
            dark: 'Sombre',
        };

    private readonly themeValues: Record<
        ThemeControlValue,
        UserPreferences['theme']
    > = {
            "Système": 'system',
            "Crème": 'cream',
            "Clair": 'light',
            "Sombre": 'dark',
        };

    readonly fontSizeLabels: Record<
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
            "Petite": 'small',
            "Moyenne": 'medium',
            "Grande": 'large',
        };

    readonly themeControl =
        new FormControl<ThemeControlValue>(
            "Système",
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

    constructor() {
        this.initAutoSave()
        effect(() => {
            if (!this._preferences.loaded()) {
                return;
            }

            const preferences =
                this._preferences.preferences();

            this.fillPreferencesForm(preferences);
        });
        this.loadPreferences();
    }


    private initAutoSave(): void {
        this.preferencesForm.valueChanges
            .pipe(
                debounceTime(SAVE_DELAY),

                filter(() => this.preferencesForm.valid),

                distinctUntilChanged(
                    (previous, current) =>
                        JSON.stringify(previous) === JSON.stringify(current),
                ),

                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => {
                this._toast.success("Les préférences ont été sauvegarder !", {
                    duration: 1000
                })
                this.savePreferences();
            });
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

    savePreferences(): void {
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
                this.themeValues[this.capitalizeFirstLetter(values.theme) as ThemeControlValue],

            fontSize:
                this.fontSizeValues[this.capitalizeFirstLetter(values.fontSize) as FontSizeControlValue],

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
            .updatePreferences(payload)
            .pipe(
                finalize(() => {
                    this.preferencesSaving.set(false);
                }),
            )
            .subscribe({
                next: () => {
                    this._preferences.loadGlobalPreferences()
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
                    this.themeLabels[preferences.theme],

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

    private capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

}
