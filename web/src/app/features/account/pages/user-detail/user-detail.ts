import { DatePipe } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import { Component, computed, inject, resource, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseButtonComponent } from '@src/app/shared/ui/form/buttons/base-button';
import { PostCard } from 'src/app/shared/ui/card/post-card/post-card';
import { firstValueFrom } from 'rxjs';

import { SUCCESS_MESSAGE } from 'src/app/shared/helpers/toasts/models/toasts.config';
import { ToastService } from 'src/app/shared/helpers/toasts/toaster.service';

import { PostService } from '../../../posts/data-access/post.service';
import { Post } from '../../../posts/model/post.model';
import { Role, User, UserService } from 'src/app/shared/services/user.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb';
import { UserPreferencesService } from '../profil/preferences.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  templateUrl: './user-detail.html',
  styleUrls: ['./user-detail.scss'],
  imports: [DatePipe, BaseButtonComponent, PostCard],
})
export class UserDetailComponent {
  private readonly _route = inject(ActivatedRoute);
  public readonly _router = inject(Router);
  private readonly _user = inject(UserService);
  private readonly _post = inject(PostService);
  private readonly _toastService = inject(ToastService);
  private _breadCrumb = inject(BreadcrumbService)

  userId = computed(() => this._route.snapshot.params['id']);

  role = Role;
  private readonly _preferences =
    inject(UserPreferencesService);

  readonly showProfil =
    this._preferences.visibleProfil;

  user = resource<User, number>({
    params: () => +this.userId(),

    loader: async ({ params }) => {
      try {
        const context = new HttpContext().set(SUCCESS_MESSAGE, false);

        const res = await firstValueFrom(
          this._user.findUserWithId(params, { context })
        );

        if (!res.data) {
          throw new Error('Utilisateur introuvable.');
        }
        this._breadCrumb.setWithHome([
          {
            label: 'Contributeurs',
            url: '/account/users',
          },
          {
            label: res.data.pseudo,
          },
        ]);

        return res.data;

      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Erreur lors de la récupération de l’utilisateur.';

        this._toastService.error(message, { duration: 5000 });

        throw error instanceof Error
          ? error
          : new Error(message, { cause: error });
      }
    },
  });


  posts = resource<Post[], number>({
    params: () => +this.userId(),

    loader: async ({ params }) => {
      try {
        const context = new HttpContext().set(SUCCESS_MESSAGE, false);

        const res = await firstValueFrom(
          this._post.getAllPostOfUser(params, { context })
        );

        return res.data ?? [];
      } catch {
        return [];
      }
    },
  });

  userInitial(user: User | undefined): string {
    return (
      user?.pseudo?.charAt(0) ||
      user?.prenom?.charAt(0) ||
      user?.email?.charAt(0) ||
      '?'
    ).toUpperCase();
  }

  userDisplayName(user: User | undefined): string {
    if (!user) return 'Utilisateur';

    return (
      user.pseudo ||
      `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() ||
      'Utilisateur'
    );
  }

  goBack(): void {
    this._router.navigate(['/home']);
  }
}