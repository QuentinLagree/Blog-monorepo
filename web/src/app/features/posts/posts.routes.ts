import { Routes } from '@angular/router';
import { canEditPostGuard } from 'src/app/core/auth/guards/authorisation.guard';

export const postsRoutes: Routes = [
  {
    path: 'add',
    title: 'Ajouter un article',
    loadComponent: () =>
      import('./pages/post-form/post-form').then((m) => m.PostFormComponent),
    data: {
      breadcrumb: "Créer un article"
    }
  },
  {
    path: 'detail/:title',
    loadComponent: () => import('./pages/post-detail/post-detail').then((module) => module.PostDetailComponent),
    data: {
      breadcrumb: 'Article',
      dynamicBreadcrumb: true,
    },
  },
  {
    canActivate: [canEditPostGuard],
    path: 'edit/:id',
    loadComponent: () => import('./pages/post-edit/post.edit.component').then((module) => module.PostEditComponent),
    data: {
      breadcrumb: 'Modifier un article',
      dynamicBreadcrumb: true,
    },
  }
  
];
