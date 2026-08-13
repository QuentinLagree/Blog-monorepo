import { Component, inject, input, InputSignal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SessionService, UserSession } from 'src/app/shared/services/session.service';
import { UserService } from 'src/app/shared/services/user.service';
import { BaseButtonComponent } from "src/app/shared/ui/form/buttons/base-button";
import { ConfirmModalComponent } from "src/app/shared/helpers/modal/confirm-modal/confirm-modal";

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
  standalone: true,
  imports: [BaseButtonComponent, RouterLink, ConfirmModalComponent]
})
export class HeaderComponent {

  constructor () {}
  private _user: UserService = inject(UserService);
  protected _session: SessionService = inject(SessionService);
  protected _router: Router = inject(Router);
  protected _breadCrumb: BreadcrumbService = inject(BreadcrumbService)
  
  title: InputSignal<string> = input.required<string>();
  user: UserSession | undefined;

  modalOpen = false;
  loading = false;

  openModal(): void {
    this.modalOpen = true;
  }

  logout() {
        this.loading = true;
        setTimeout(() => {
        this._user
        .logout()
        .pipe(
            finalize(() => {
                this.loading = false
            })
        ).subscribe(() => {
            this.modalOpen = false;
            this._session.clearSession();
            this._router.navigate([''])
        })
        }, 2000)
    }
}
