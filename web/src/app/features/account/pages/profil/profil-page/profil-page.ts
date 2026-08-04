import { DatePipe } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  resource,
  signal,
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

import { ConfirmModalComponent } from 'src/app/shared/helpers/modal/confirm-modal/confirm-modal';
import { SUCCESS_MESSAGE } from 'src/app/shared/helpers/toasts/models/toasts.config';
import { ToastService } from 'src/app/shared/helpers/toasts/toaster.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb';
import { SessionService } from 'src/app/shared/services/session.service';
import {
  User,
  UserService,
} from 'src/app/shared/services/user.service';
import { Message } from 'src/app/shared/types/message.type';

import { BaseButtonComponent } from 'src/app/shared/ui/form/buttons/base-button';
import { DangerButtonComponent } from 'src/app/shared/ui/form/buttons/button-danger/button-danger';
import { ProfilHeaderComponent } from "../profil-header/profil-header";
import { ProfilPostsComponent } from '../profil-posts/profil-posts';
import { ProfilHeaderSectionComponent } from "../components/profil-header-section";
import { ProfilPreferencesComponent } from "../profil-preferences/profil-preferences";
import { ProfilDangerZoneSectionComponent } from "../profil-danger-zone/profil-danger-zone";
import { UserPreferencesService } from '../preferences.service';


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