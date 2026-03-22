import { AppComponent } from './app/app';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { appRoutes } from './app/app.routes';
import { authRoutes } from './app/core/auth/auth.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { inject, SecurityContext } from '@angular/core';
import { FlashInterceptor } from './app/core/toasts/toaster.interceptors';
import { TOAST_CONFIG, DEFAULT_TOAST_CONFIG } from './app/core/toasts/models/toasts.config';
import { CLIPBOARD_OPTIONS, ClipboardButtonComponent, MARKED_OPTIONS, provideMarkdown, SANITIZE } from 'ngx-markdown';
import { markedOptionsFactory } from './app/shared/helpers/markdown/markdown.factory';

import '../prism';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      [...appRoutes, ...authRoutes],
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled'
      })
    ),
    provideMarkdown({
      markedOptions: {
        provide: MARKED_OPTIONS,
        useFactory: markedOptionsFactory
      },
      sanitize: {
    provide: SANITIZE,
    useValue: SecurityContext.NONE,
  },
}),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([
        (req, next) => inject(FlashInterceptor).intercept(req, {handle: next}),
      ])
    ),
    { provide: TOAST_CONFIG, useValue: DEFAULT_TOAST_CONFIG },
  ]
});
