import { DatePipe } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import { Component, computed, inject, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { BaseButtonComponent } from '@src/app/shared/ui/form/buttons/base-button';
import { SUCCESS_MESSAGE } from 'src/app/shared/helpers/toasts/models/toasts.config';
import { ToastService } from 'src/app/shared/helpers/toasts/toaster.service';
import { User, UserService } from 'src/app/shared/services/user.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';


@Component({
  selector: 'app-users',
  standalone: true,
  templateUrl: './accounts.html',
  styleUrls: ['./accounts.scss'],
  imports: [DatePipe, BaseButtonComponent],
})
export class AccountsComponent {
  private readonly _user = inject(UserService);
  private readonly _toastService = inject(ToastService);
  public readonly _router = inject(Router);
  public readonly _breadCrumb = inject(BreadcrumbService);

  search = signal('');

  constructor () {
    this._breadCrumb.setWithHome([{
      label: 'Contributeurs',
      url: '/accounts'
    }])
  }

  users = resource<User[], void>({
    loader: async () => {
      try {
        const context = new HttpContext().set(SUCCESS_MESSAGE, false);

        const res = await firstValueFrom(
          this._user.getAllUsers({ context })
        );

        return res.data ?? [];
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Erreur lors de la récupération des contributeurs.';

        this._toastService.error(message, { duration: 5000 });

        return [];
      }
    },
  });

  filteredUsers = computed(() => {
    const users = this.users.value() ?? [];
    const search = this.search().trim().toLowerCase();

    if (!search) return users;

    return users.filter((user) => {
      const pseudo = user.pseudo?.toLowerCase() ?? '';
      const email = user.email?.toLowerCase() ?? '';

      /**
       * Si ton modèle utilise nom/prenom au lieu de lastname/firstname,
       * remplace ici par user.nom et user.prenom.
       */
      const firstname = user.prenom?.toLowerCase() ?? '';
      const lastname = user.nom?.toLowerCase() ?? '';

      return (
        pseudo.includes(search) ||
        email.includes(search) ||
        firstname.includes(search) ||
        lastname.includes(search)
      );
    });
  });

  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.search.set(input.value);
  }

  userInitial(user: User): string {
    return (
      user.pseudo?.charAt(0) ||
      user.prenom?.charAt(0) ||
      user.email?.charAt(0) ||
      '?'
    ).toUpperCase();
  }

  userDisplayName(user: User): string {
    return (
      user.pseudo ||
      `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() ||
      'Utilisateur'
    );
  }

  goToUser(userId: string): void {
    this._router.navigate(['/account/users', userId]);
  }

  goBack(): void {
    this._router.navigate(['/home']);
  }

  reload(): void {
    this.users.reload();
  }
}