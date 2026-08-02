  import { Routes } from '@angular/router';

  export const accountRoutes: Routes = [
    {
      path: 'profil',
      title: 'Profile utilisateur',
      loadComponent: () =>
        import('./pages/profil/profil-page/profil-page').then((m) => m.ProfilPageComponent),
    data: {
      breadcrumb: 'Mon profil',
    },
    },
    {
      path: 'users',
      title: "Liste de tous les contributeurs",
      loadComponent: () => import('./pages/accounts/accounts').then(m => m.AccountsComponent),
    data: {
      breadcrumb: 'Contributeurs',
    },
    },
    {
      path: 'users/:id',
      loadComponent: () => import('./pages/user-detail/user-detail').then((m) => m.UserDetailComponent),
    data: {
      breadcrumb: 'Profil contributeur',
      dynamicBreadcrumb: true,
    },
    }
  ];
