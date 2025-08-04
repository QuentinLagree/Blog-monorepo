import { Routes } from "@angular/router";

export const appRoutes: Routes = [
    {path: '', redirectTo: '/auth/login', pathMatch: 'full'},
    {path: 'ui', 
    loadComponent: () => import('./shared/ui/base-ui').then(m => m.UIComponent) }
];
