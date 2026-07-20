import { Routes } from '@angular/router';
import { resetPasswordGuard } from './guards/token-and-email-verification.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    title: 'Connexion',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginPageComponent),
    data: { type: 'Login', breadcrumb: 'Connexion' },
  },
  {
    path: 'register',
    title: 'Inscription',
    loadComponent: () =>
      import('./pages/register/register').then((m) => m.RegisterPageComponent),
    data: { type: 'Register', breadcrumb: 'Inscription' },
  },
  {
    path: 'forget-password',
    title: 'Mot de passe oublié',
    loadComponent: () =>
      import('./pages/forget-password/forget-password').then((m) => m.ForgetPasswordComponent),
  },
  {
    path: 'reset',
    title: 'Nouveau mot de passe',
    loadComponent: () =>
      import('./pages/new-password/new-password').then((m) => m.NewPasswordComponent),
    canActivate: [resetPasswordGuard],
    data: {
      breadcrumb: 'Modification de mot de passe',
    },
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',       
  },
];
