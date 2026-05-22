  import { Routes } from '@angular/router';

  export const accountRoutes: Routes = [
    {
      path: 'profil',
      title: 'Profile utilisateur',
      loadComponent: () =>
        import('./pages/profil/profil').then((m) => m.ProfilPageComponent),
    },
  ];
