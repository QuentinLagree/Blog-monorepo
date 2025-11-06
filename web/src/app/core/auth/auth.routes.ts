import { Routes } from '@angular/router';

const pathRoot = 'auth/';

export const authRoutes: Routes = [
  {
    path: pathRoot + 'login',
    title: 'Connection',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPageComponent),
    data: { type: 'Login' }
  },
  {
    path: pathRoot + 'register',
    title: 'Inscription',
    loadComponent: () => import('./pages/register/register').then((m) => m.RegisterPageComponent),
    data: { type: 'Register' }
  }
];
