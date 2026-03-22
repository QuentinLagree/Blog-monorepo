import { Routes } from '@angular/router';

export const postsRoutes: Routes = [
  {
    path: 'add',
    title: 'Ajouter un article',
    loadComponent: () =>
      import('./post-form/post-form').then((m) => m.PostFormComponent),
  },
  {
    path: 'add',
    title: 'Editeur markdown plein écran',
    loadComponent: () => import('./post-form/post-form').then((module) => module.PostFormComponent),
    data: {
        markdown: true
    }
  }
];
