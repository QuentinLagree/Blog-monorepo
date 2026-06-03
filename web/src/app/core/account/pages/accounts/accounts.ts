import { HttpContext } from "@angular/common/http";
import { Component, inject, resource, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { Message } from "src/app/core/models/message.model";
import { User, UserService } from "src/app/core/services/user.service";
import { SUCCESS_MESSAGE } from "src/app/core/toasts/models/toasts.config";
import { BaseButtonComponent } from "src/app/shared/ui/form/buttons/base-button";
import { PaginatorComponent } from "src/app/shared/ui/paginator/paginator";

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  template: `
  @if (this.loadingPost()) {
        <!-- <ng-paginator [items]="this.users.value() ?? []" itemContainer="USER_CARD"/> -->
    }`,
  imports: [BaseButtonComponent, PaginatorComponent]
})

export class AccountsComponent {
    private _user: UserService = inject(UserService)

    loading = false;
    loadingPost = signal(true);

    reload() { this.users.reload(); }
    
    users = resource<User[], Error>({
    loader: async () => {
        const context: HttpContext = new HttpContext().set(SUCCESS_MESSAGE, false)
      const res: Message<User[]> = await firstValueFrom(this._user.getAllUsers({context}));
      return res.data;
    },
  });
}