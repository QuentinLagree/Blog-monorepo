import { Routes } from '@angular/router';
import { loginGuard } from './core/auth/guards/login.guard';
import { authGuard } from './core/auth/guards/auth.guard';
import { LandingComponent } from './core/layouts/landing/landing';

export const appRoutes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },

  {
    path: 'account',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/account/account.routes').then((m) => m.accountRoutes),
  },

  {
    path: 'auth',
    canActivate: [loginGuard],
    loadChildren: () =>
      import('./core/auth/auth.routes').then((m) => m.authRoutes),
    data: {
      breadcrumb: 'Authentification'
    }
  },
  {
    path: 'post',
    loadChildren: () =>
      import('./features/posts/posts.routes').then((m) => m.postsRoutes),
    data: {
      breadcrumb: 'Articles'
    }
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home').then((m) => m.HomeComponent),
    data: {
      breadcrumb: 'Accueil'
    },
    canActivate: [authGuard],
  },
  { path: 'ui', loadComponent: () => import('./shared/ui/base-ui').then((m) => m.UIComponent),
    data: {
      breadcrumb: 'UI Elements'
    }
   },
  { path: '**', redirectTo: '' },
];
