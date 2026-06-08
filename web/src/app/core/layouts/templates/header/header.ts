import { Component, inject, input, InputSignal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SessionService, UserSession } from 'src/app/core/services/session.service';
import { UserService } from 'src/app/core/services/user.service';
import { BaseButtonComponent } from "src/app/shared/ui/form/buttons/base-button";

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  standalone: true,
  imports: [BaseButtonComponent]
})
export class HeaderComponent {

  constructor () {}
  private _user: UserService = inject(UserService);
  protected _session: SessionService = inject(SessionService);
  protected _router: Router = inject(Router)
  
  title: InputSignal<string> = input.required<string>();
  loading = false;
  user: UserSession | undefined;
  
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
            this._session.clearSession();
            this._router.navigate([''])
        })
        }, 2000)
    }
}
