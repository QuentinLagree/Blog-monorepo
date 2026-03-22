import { Routes } from '@angular/router';
import { LandingComponent } from './core/landing/landing';
import { landingGuard } from './core/auth/guards/landing.guard';
import { loginGuard } from './core/auth/guards/login.guard';
import { authGuard } from './core/auth/guards/auth.guard';

export const appRoutes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },

  {
    path: 'auth',
    canActivate: [loginGuard],
    loadChildren: () =>
      import('./core/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'post',
    loadChildren: () =>
      import('./core/posts/posts.routes').then((m) => m.postsRoutes),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./core/home/home').then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'post/edit/:id',
    loadComponent: () => import('./core/posts/post-form/post-form').then((m) => m.PostFormComponent),
  },
  { path: 'ui', loadComponent: () => import('./shared/ui/base-ui').then((m) => m.UIComponent)},
  { path: '**', redirectTo: '' },
];
