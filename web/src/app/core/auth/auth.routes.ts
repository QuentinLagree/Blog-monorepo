  import { Routes } from '@angular/router';

  export const authRoutes: Routes = [
    {
      path: 'login',
      title: 'Connexion',
      loadComponent: () =>
        import('./pages/login/login').then((m) => m.LoginPageComponent),
      data: { type: 'Login' },
    },
    {
      path: 'register',
      title: 'Inscription',
      loadComponent: () =>
        import('./pages/register/register').then((m) => m.RegisterPageComponent),
      data: { type: 'Register' },
    },
    {
      path: '',
      pathMatch: 'full',
      redirectTo: 'login',        // redirection relative à /auth
    },
    // La wildcard interne n'est pas nécessaire; laisse la wildcard globale de l'app gérer.
  ];
