import { HttpContext } from '@angular/common/http';
import {
  Component,
  effect,
  inject,
  signal,
  WritableSignal
} from '@angular/core';
import {
  ReactiveFormsModule
} from '@angular/forms';
import {
  firstValueFrom
} from 'rxjs';


import { SUCCESS_MESSAGE } from 'src/app/shared/helpers/toasts/models/toasts.config';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SessionService } from 'src/app/shared/services/session.service';
import {
  User,
  UserService,
} from 'src/app/shared/services/user.service';
import { Message } from 'src/app/shared/types/message.type';

import { ProfilHeaderSectionComponent } from "../components/profil-header-section";
import { ProfilDangerZoneSectionComponent } from "../profil-danger-zone/profil-danger-zone";
import { ProfilHeaderComponent } from "../profil-header/profil-header";
import { ProfilPostsComponent } from '../profil-posts/profil-posts';
import { ProfilPreferencesComponent } from "../profil-preferences/profil-preferences";


@Component({
  selector: 'app-profil-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ProfilHeaderComponent,
    ProfilPostsComponent,
    ProfilHeaderSectionComponent,
    ProfilPreferencesComponent,
    ProfilDangerZoneSectionComponent
  ],
  templateUrl: './profil-page.html',
  styleUrls: ['./profil-page.scss'],
})
export class ProfilPageComponent {
  private readonly _user =
    inject(UserService)

  private readonly _session =
    inject(SessionService);


  user: WritableSignal<User | undefined> =
    signal(undefined)

  private readonly _breadCrumb =
    inject(BreadcrumbService);


  readonly sessionId =
    this._session.getUserIdSync();

 

  constructor() {
    this._breadCrumb.setWithHome([
      {
        label: 'Mon compte',
      },
    ]);
    void this.loadUser();
  }

  private async loadUser(): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    const context = new HttpContext().set(SUCCESS_MESSAGE, false)

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



}