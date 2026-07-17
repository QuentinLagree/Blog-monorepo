  import { Routes } from '@angular/router';

  export const accountRoutes: Routes = [
    {
      path: 'profil',
      title: 'Profile utilisateur',
      loadComponent: () =>
        import('./pages/profil/profil').then((m) => m.ProfilPageComponent),
    },
    {
      path: 'users',
      title: "Liste de tous les utilisateurs",
      loadComponent: () => import('./pages/accounts/accounts').then(m => m.AccountsComponent)   
    },
    {
      path: 'users/:id',
      loadComponent: () => import('./pages/user-detail/user-detail').then((m) => m.UserDetailComponent)
    }
  ];
