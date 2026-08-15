import {
  Component,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, RouterLink } from '@angular/router';

import { SessionService } from './shared/services/session.service';
import { UserPreferencesService } from './features/account/pages/profil/preferences.service';
import { ContextMenuComponent } from "./shared/ui/context-menu/context-menu";
import { HeaderComponent } from "./core/layouts/header/header";
import { ToastContainerComponent } from "./shared/ui/toast/toast";
import { environment } from 'src/environments/environment';
import { BreadcrumbComponent } from "./core/layouts/breadcrumb/breadcrumb";
import { BaseButtonComponent } from "./shared/ui/form/buttons/base-button";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ContextMenuComponent,
    HeaderComponent,
    ToastContainerComponent,
    BreadcrumbComponent,
    BaseButtonComponent,
    RouterLinkWithHref,
    RouterLink
],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent implements OnInit {
  private readonly _session =
    inject(SessionService);

  private readonly _preferences =
    inject(UserPreferencesService);

  readonly prod: boolean = environment.production;


  constructor () {
      this._preferences.loadGlobalPreferences();
  }
  
  ngOnInit(): void {
    const userId =
      this._session.getUserIdSync();

    if (!userId) {
      this._preferences.loadGlobalPreferences(true)
      return;
    }

    this._preferences
      .loadPreferences()
      .subscribe({
        next: () => {
          this._preferences.loadGlobalPreferences();
        }
      });
  }
}